"""Simulador SOMENTE LEITURA: quantos anuncios sem vinculo ganhariam FIPE com cada alavanca, antes de ligar flag nenhum.

Para uma amostra dos sem vinculo (elegiveis, nao manuais) roda o motor atual (base) e o motor com a evidencia do
detalhe (FIPE_USA_DETALHE), e conta tambem quantos ambiguos so tem variantes de preco quase igual (FIPE_PROVISORIO).
Nao grava nada. Uso: python simula_ganho.py [--amostra 600] [--semente 42]
"""
import argparse
import os
from collections import Counter, defaultdict
from contextlib import contextmanager

from evidencia_detalhe import aumenta_com_detalhe
from fipe_sync import (_preco_fipe, ano_modelo, busca_preco_cache, eixo_do_anuncio, eixos_todos, emissao_no_texto,
                       emissao_preferida, escolhe, melhores_candidatos, provisorio_de_ambiguidade)
from monitoria import faixa_estreita

LIMITE_CANDIDATOS = 8
SQL_AMOSTRA = """
SELECT id, titulo, url, marca, modelo, tracao, ano_inicial, ano_final, descricao, opcionais, carroceria,
       fipe_match_motivo
FROM anuncio
WHERE tipo = 'Caminhao' AND status = 'ativo' AND fipe_preco_id IS NULL
  AND COALESCE(fipe_vinculo_origem, 'automatico') <> 'manual'
  AND marca IS NOT NULL AND COALESCE(ano_final, ano_inicial) IS NOT NULL
ORDER BY RAND(%s) LIMIT %s
"""


@contextmanager
def flag_ambiente(nome, valor):
    """Liga/desliga uma flag so durante a simulacao, sem tocar no ambiente de quem chamou."""
    anterior = os.environ.get(nome)
    os.environ[nome] = valor
    try:
        yield
    finally:
        if anterior is None:
            os.environ.pop(nome, None)
        else:
            os.environ[nome] = anterior


def flag_cabine(valor):
    return flag_ambiente("FIPE_CABINE_MARCAS", valor)


def avalia_anuncio(conn, anuncio, codigo_referencia, provisorio_ambiguo=False):
    """Mesma decisao do processa_anuncios (cache local, sem API), sem gravar."""
    ano = ano_modelo(anuncio)
    if ano is None:
        return {"resultado": "rejeitado", "motivo": "sem ano"}
    concorrentes = []
    candidatos, info = escolhe(conn, anuncio, concorrentes)
    if not candidatos and provisorio_ambiguo and concorrentes:
        achado = provisorio_de_ambiguidade(conn, info, concorrentes,
                                           lambda c: busca_preco_cache(conn, c, ano, codigo_referencia))
        if achado:
            return {"resultado": "vincula", "confianca": "provisorio", "preco_id": achado[0],
                    "modelo": f"{info} -> {achado[1]} FIPEs em faixa estreita"}
    if not candidatos:
        return {"resultado": "rejeitado", "motivo": info}
    if len(candidatos) > LIMITE_CANDIDATOS:
        return {"resultado": "rejeitado", "motivo": f"ambiguo {len(candidatos)} candidatos antes do filtro por ano"}
    validos = []
    for candidato in candidatos:
        preco_id = busca_preco_cache(conn, candidato, ano, codigo_referencia)
        if preco_id:
            validos.append((candidato, preco_id))
    if not validos:
        return {"resultado": "sem_preco_no_ano"}
    if len(validos) > 1:
        return {"resultado": "multiplo", "preco_ids": [pid for _, pid in validos],
                "modelos": [c["modelo_fipe"] for c, _ in validos]}
    candidato, preco_id = validos[0]
    return {"resultado": "vincula", "confianca": info, "preco_id": preco_id, "modelo": candidato["modelo_fipe"]}


def classifica_ganho(base, depois):
    vinculava, vincula = base["resultado"] == "vincula", depois["resultado"] == "vincula"
    if vinculava and vincula:
        return "igual" if base["preco_id"] == depois["preco_id"] else "muda_vinculo"
    if vinculava:
        return "perde_vinculo"
    if vincula:
        return "ganha_alto" if depois["confianca"] == "alto" else "ganha_medio"
    return "continua"


def resume(categorias):
    contagem = Counter(categorias)
    total = len(categorias)
    ganho = contagem["ganha_alto"] + contagem["ganha_medio"]
    return {"total": total, "ganho": ganho, "ganho_pct": round(100.0 * ganho / total, 1) if total else 0.0,
            "por_categoria": dict(contagem)}


def provisorio(conn, resultado):
    if resultado["resultado"] != "multiplo":
        return None
    precos = [_preco_fipe(conn, pid) for pid in resultado["preco_ids"]]
    return {"precos": precos, "modelos": resultado["modelos"]} if faixa_estreita(precos) else None


def faixa_da_ambiguidade(conn, anuncio, codigo_referencia):
    """ESTIMATIVA: precos no ano dos candidatos de topo que o motor ainda considerava, para ver se a duvida custa pouco.

    Reaproxima o conjunto que o motor tinha na mao: candidatos de score proximo ao topo, com o mesmo eixo (ou sem
    eixo no nome) e a mesma emissao. Devolve (precos, modelos) ou None quando nao ha pelo menos dois precos.
    """
    ano = ano_modelo(anuncio)
    if ano is None:
        return None
    candidatos = [v for v in melhores_candidatos(conn, anuncio, quantos=12) if v[0] >= 0.5]
    if not candidatos:
        return None
    topo = candidatos[0][0]
    candidatos = [v for v in candidatos if v[0] >= topo - 0.05]
    eixo, _ = eixo_do_anuncio(anuncio)
    if eixo:
        candidatos = [v for v in candidatos if not eixos_todos(v[2]["modelo_fipe"]) or eixo in eixos_todos(v[2]["modelo_fipe"])]
    emissao, _ = emissao_preferida(anuncio)
    if emissao:
        candidatos = [v for v in candidatos if emissao_no_texto(v[2]["modelo_fipe"]) in (emissao, None)]
    precos, modelos = [], []
    for _, _, c in candidatos[:8]:
        preco_id = busca_preco_cache(conn, c, ano, codigo_referencia)
        if preco_id:
            precos.append(_preco_fipe(conn, preco_id))
            modelos.append(c["modelo_fipe"])
    return (precos, modelos) if len(precos) >= 2 else None


def balde_de_faixa(precos):
    validos = [float(p) for p in precos if p and float(p) > 0]
    if len(validos) < 2:
        return "sem precos"
    folga = (max(validos) - min(validos)) / min(validos)
    return "ate 5%" if folga <= 0.05 else "5% a 10%" if folga <= 0.10 else "acima de 10%"


def roda(conn, amostra, semente):
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT MAX(referencia_codigo) AS codigo FROM fipe_preco")
    codigo = cur.fetchone()["codigo"]
    cur.execute(SQL_AMOSTRA, (semente, amostra))
    anuncios = cur.fetchall()
    cur.close()

    detalhe, provisorios, ambos, cabine, eixo_flex, prov_amb = [], [], [], [], [], []
    exemplos_prov_amb, ganho_prov_amb_marca = [], Counter()
    exemplos_cabine, restante_motivos = [], Counter()
    exemplos_eixo = []
    faixas = defaultdict(Counter)
    exemplos_faixa = []
    exemplos_motivo = defaultdict(list)
    por_marca, por_motivo, exemplos_ganho, exemplos_prov = Counter(), Counter(), [], []
    for a in anuncios:
        with flag_cabine("0"):
            base = avalia_anuncio(conn, a, codigo)
            com = avalia_anuncio(conn, aumenta_com_detalhe(a), codigo)
        with flag_cabine("1"):
            com_cabine = avalia_anuncio(conn, aumenta_com_detalhe(a), codigo)
        with flag_cabine("1"), flag_ambiente("FIPE_EIXO_FLEX", "1"):
            com_eixo = avalia_anuncio(conn, aumenta_com_detalhe(a), codigo)
        if com_eixo["resultado"] != "vincula":
            chave_motivo = (com_eixo.get("motivo") or (
                f"multiplo: {len(com_eixo['modelos'])} FIPEs com preco no ano" if com_eixo["resultado"] == "multiplo"
                else com_eixo["resultado"]))[:55]
            restante_motivos[chave_motivo] += 1
            if len(exemplos_motivo[chave_motivo]) < 3:
                try:
                    proximos = com_eixo.get("modelos") or [
                        c["modelo_fipe"] for _, _, c in melhores_candidatos(conn, a, quantos=3)]
                except Exception:
                    proximos = []
                exemplos_motivo[chave_motivo].append((a["titulo"][:70], a.get("tracao"), proximos))
        if (com_eixo.get("motivo") or "").startswith("ambiguo"):
            tipo = com_eixo["motivo"].split(" (")[0].split(":")[0][:28]
            est = faixa_da_ambiguidade(conn, a, codigo)
            balde = balde_de_faixa(est[0]) if est else "sem precos"
            faixas[tipo][balde] += 1
            if est and balde == "ate 5%" and len(exemplos_faixa) < 10:
                exemplos_faixa.append((a["titulo"][:55], [round(x) for x in est[0]], est[1]))
        with flag_cabine("1"), flag_ambiente("FIPE_EIXO_FLEX", "1"):
            com_prov = avalia_anuncio(conn, aumenta_com_detalhe(a), codigo, provisorio_ambiguo=True)
        cat_prov = classifica_ganho(base, com_prov)
        prov_amb.append(cat_prov)
        if cat_prov.startswith("ganha") and com_prov["confianca"] == "provisorio":
            ganho_prov_amb_marca[a["marca"]] += 1
            if len(exemplos_prov_amb) < 12:
                exemplos_prov_amb.append((a["titulo"][:55], com_prov["modelo"]))
        cat_eixo = classifica_ganho(base, com_eixo)
        eixo_flex.append(cat_eixo)
        if cat_eixo.startswith("ganha") and len(exemplos_eixo) < 12:
            exemplos_eixo.append((a["titulo"][:60], a.get("tracao"), com_eixo["modelo"], com_eixo["confianca"]))
        cat_cabine = classifica_ganho(base, com_cabine)
        cabine.append(cat_cabine)
        if cat_cabine != "continua" and cat_cabine != "igual" and len(exemplos_cabine) < 12:
            exemplos_cabine.append((a["titulo"][:60], cat_cabine, com_cabine.get("modelo") or base.get("modelo"),
                                    com_cabine.get("motivo")))
        categoria = classifica_ganho(base, com)
        detalhe.append(categoria)
        prov = provisorio(conn, base)
        provisorios.append("ganha_provisorio" if prov else "continua")
        ambos.append("ganha_alto" if categoria.startswith("ganha") or prov else "continua")
        if categoria.startswith("ganha"):
            por_marca[a["marca"]] += 1
            por_motivo[(a.get("fipe_match_motivo") or "(sem motivo)")[:60]] += 1
            if len(exemplos_ganho) < 12:
                exemplos_ganho.append((a["titulo"][:60], com["modelo"], com["confianca"]))
        if prov and len(exemplos_prov) < 8:
            exemplos_prov.append((a["titulo"][:60], prov["modelos"], [round(p) for p in prov["precos"]]))
    return {"amostra": len(anuncios), "detalhe": resume(detalhe), "provisorio": resume(
        ["ganha_alto" if p == "ganha_provisorio" else "continua" for p in provisorios]),
        "combinado": resume(ambos), "cabine": resume(cabine), "eixo_flex": resume(eixo_flex), "exemplos_eixo": exemplos_eixo, "prov_amb": resume(prov_amb), "exemplos_prov_amb": exemplos_prov_amb, "prov_amb_marca": ganho_prov_amb_marca, "faixas": faixas, "exemplos_faixa": exemplos_faixa, "exemplos_cabine": exemplos_cabine, "restante_motivos": restante_motivos, "exemplos_motivo": exemplos_motivo,
        "por_marca": por_marca, "por_motivo": por_motivo,
        "exemplos_ganho": exemplos_ganho, "exemplos_prov": exemplos_prov}


def imprime(r):
    print(f"Amostra: {r['amostra']} anuncios sem vinculo (elegiveis, nao manuais)\n")
    for nome, chave in (("A) evidencia do detalhe (FIPE_USA_DETALHE)", "detalhe"),
                        ("B) vinculo provisorio por faixa de preco (FIPE_PROVISORIO)", "provisorio"),
                        ("C) detalhe + cabine por marca (FIPE_USA_DETALHE + FIPE_CABINE_MARCAS)", "cabine"),
                        ("D) detalhe + cabine + eixo flexivel (FIPE_EIXO_FLEX)", "eixo_flex"),
                        ("E) D + provisorio de ambiguidade (FIPE_PROVISORIO estendido)", "prov_amb"),
                        ("A + B combinados", "combinado")):
        s = r[chave]
        print(f"{nome}: ganharia {s['ganho']} de {s['total']} ({s['ganho_pct']}%)")
        riscos = {k: v for k, v in s["por_categoria"].items() if k in ("muda_vinculo", "perde_vinculo")}
        if riscos:
            print(f"   ATENCAO, mudaria vinculos que ja existiam: {riscos}")
    print("\nGanho de A por marca:", dict(r["por_marca"].most_common(8)))
    print("Motivo anterior de quem ganha com A:")
    for motivo, n in r["por_motivo"].most_common(8):
        print(f"   {n:>4}  {motivo}")
    print("\nExemplos que A vincularia (titulo -> modelo FIPE, confianca):")
    for titulo, modelo, confianca in r["exemplos_ganho"]:
        print(f"   {titulo} -> {modelo} [{confianca}]")
    print("\nO que ainda trava depois de detalhe + cabine + eixo flexivel (motivo, anuncios):")
    for motivo, n in r["restante_motivos"].most_common(15):
        print(f"   {n:>4}  {motivo}")
        for titulo, tracao, proximos in r["exemplos_motivo"].get(motivo, []):
            print(f"          ex: {titulo} | tracao={tracao} | FIPE proxima: {proximos}")
    print("\nE por marca:", dict(r["prov_amb_marca"].most_common(8)))
    for titulo, o_que in r["exemplos_prov_amb"]:
        print(f"      E provisorio: {titulo} | {o_que}")
    print("\nAmbiguos: quanto custa a duvida? (ESTIMATIVA pelo preco das FIPEs que ainda concorrem)")
    for tipo, baldes in sorted(r["faixas"].items(), key=lambda kv: -sum(kv[1].values())):
        print(f"   {tipo:<28} {dict(baldes)}")
    for titulo, precos, modelos in r["exemplos_faixa"]:
        print(f"      ate 5%: {titulo} | {precos} | {modelos}")
    print("\nC mexe nestes (titulo, efeito, modelo FIPE):")
    for titulo, efeito, modelo, motivo in r["exemplos_cabine"]:
        print(f"   {titulo} | {efeito} | {modelo or motivo}")
    print("\nD vincularia (titulo, tracao, modelo FIPE, confianca):")
    for titulo, tracao, modelo, confianca in r["exemplos_eixo"]:
        print(f"   {titulo} | {tracao} | {modelo} [{confianca}]")
    print("\nExemplos de provisorio B (titulo, variantes, precos FIPE):")
    for titulo, modelos, precos in r["exemplos_prov"]:
        print(f"   {titulo} | {modelos} | {precos}")


if __name__ == "__main__":
    import mysql.connector
    ap = argparse.ArgumentParser()
    ap.add_argument("--amostra", type=int, default=600)
    ap.add_argument("--semente", type=int, default=42)
    args = ap.parse_args()
    conn = mysql.connector.connect(
        host=os.getenv("OPER_RADAR_DB_HOST", "localhost"), user=os.environ["OPER_RADAR_DB_USER"],
        password=os.environ["OPER_RADAR_DB_PASS"], database=os.environ["OPER_RADAR_DB_NAME"], charset="utf8mb4")
    try:
        imprime(roda(conn, args.amostra, args.semente))
    finally:
        conn.close()
