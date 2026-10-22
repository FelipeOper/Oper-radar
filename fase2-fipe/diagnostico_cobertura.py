"""Diagnostico SOMENTE LEITURA da cobertura FIPE x anuncios ativos.

Uso: python diagnostico_cobertura.py [--saida relatorio.md]
Credenciais pelo ambiente (OPER_RADAR_DB_*), como os demais jobs.
"""
import argparse
import os
from collections import Counter
from pathlib import Path

CAUSAS = (
    "vinculado_alto", "vinculado_medio", "vinculado_manual", "vinculado_provisorio",
    "fora_escopo_tipo", "sem_marca", "sem_ano", "nunca_processado", "erro_api",
    "ano_ausente_no_cache", "ambiguo_eixo", "ambiguo_emissao", "ambiguo_cabine",
    "ambiguo_cambio", "ambiguo_linha_serie", "ambiguo_outros", "sem_candidato", "outros",
)
RECUPERAVEIS = {"nunca_processado", "ano_ausente_no_cache", "ambiguo_eixo", "ambiguo_emissao",
                "ambiguo_cabine", "ambiguo_cambio", "ambiguo_outros", "erro_api"}


def classifica_causa(linha):
    if linha.get("fipe_preco_id"):
        if linha.get("fipe_vinculo_origem") == "manual":
            return "vinculado_manual"
        confianca = linha.get("fipe_match_confianca")
        if confianca == "provisorio":
            return "vinculado_provisorio"
        return "vinculado_alto" if confianca == "alto" else "vinculado_medio"
    if (linha.get("tipo") or "").strip().lower() != "caminhao":
        return "fora_escopo_tipo"
    if not linha.get("marca"):
        return "sem_marca"
    if linha.get("ano_final") is None and linha.get("ano_inicial") is None:
        return "sem_ano"
    status = linha.get("fipe_match_status")
    motivo = (linha.get("fipe_match_motivo") or "").lower()
    if status is None:
        return "nunca_processado"
    if status == "erro_api":
        return "erro_api"
    if status == "sem_ano":
        return "ano_ausente_no_cache"
    if "eixo" in motivo:
        return "ambiguo_eixo"
    if "emissao" in motivo:
        return "ambiguo_emissao"
    if "cabine" in motivo:
        return "ambiguo_cabine"
    if "cambio" in motivo:
        return "ambiguo_cambio"
    if "serie" in motivo or "linha" in motivo or "geracao" in motivo:
        return "ambiguo_linha_serie"
    if status == "ambiguo":
        return "ambiguo_outros"
    if status == "sem_match":
        return "sem_candidato"
    return "outros"


def _pct(n, total):
    return f"{(100.0 * n / total):.1f}%".replace(".", ",") if total else "0,0%"


def relatorio_markdown(total, por_causa, por_marca, motivos, com_detalhe_nao_vinculados):
    linhas = ["# Diagnóstico de cobertura FIPE × anúncios ativos", "",
              f"Anúncios ativos analisados: **{total}**", "",
              "## Por causa", "", "| Causa | Anúncios | % do total | Recuperável |", "|---|---:|---:|:--:|"]
    for causa in CAUSAS:
        n = por_causa.get(causa, 0)
        if n:
            linhas.append(f"| {causa} | {n} | {_pct(n, total)} | {'sim' if causa in RECUPERAVEIS else ''} |")
    recup = sum(por_causa.get(c, 0) for c in RECUPERAVEIS)
    linhas += ["", f"Perdas recuperáveis: **{recup}** ({_pct(recup, total)}).",
               f"Não vinculados que já têm descrição de detalhe (evidência hoje ignorada): **{com_detalhe_nao_vinculados}**.",
               "", "## Marcas com mais anúncios sem vínculo", "", "| Marca | Sem vínculo | Vinculados |", "|---|---:|---:|"]
    for marca, sem, vinc in por_marca:
        linhas.append(f"| {marca} | {sem} | {vinc} |")
    linhas += ["", "## Motivos mais frequentes do motor", "", "| Motivo | Anúncios |", "|---|---:|"]
    for motivo, n in motivos:
        linhas.append(f"| {motivo} | {n} |")
    return "\n".join(linhas) + "\n"


SQL = """
SELECT tipo, marca, ano_inicial, ano_final, fipe_preco_id, fipe_vinculo_origem,
       fipe_match_confianca, fipe_match_status, fipe_match_motivo,
       (descricao IS NOT NULL AND descricao <> '') AS tem_descricao
FROM anuncio WHERE status = 'ativo'
"""


def coleta(conn):
    cur = conn.cursor(dictionary=True)
    cur.execute(SQL)
    total = 0
    por_causa, motivos = Counter(), Counter()
    marcas = {}
    com_detalhe = 0
    for linha in cur.fetchall():
        total += 1
        causa = classifica_causa(linha)
        por_causa[causa] += 1
        marca = linha.get("marca") or "(sem marca)"
        vinc, sem = marcas.get(marca, (0, 0))
        if causa.startswith("vinculado"):
            vinc += 1
        elif causa != "fora_escopo_tipo":
            sem += 1
            if linha.get("tem_descricao"):
                com_detalhe += 1
            if linha.get("fipe_match_motivo"):
                motivos[linha["fipe_match_motivo"]] += 1
        marcas[marca] = (vinc, sem)
    cur.close()
    ranking = sorted(((m, s, v) for m, (v, s) in marcas.items() if s), key=lambda x: -x[1])[:15]
    return total, dict(por_causa), ranking, motivos.most_common(30), com_detalhe


if __name__ == "__main__":
    import mysql.connector
    ap = argparse.ArgumentParser()
    ap.add_argument("--saida")
    ap.add_argument("--db-host", default=os.getenv("OPER_RADAR_DB_HOST", "localhost"))
    ap.add_argument("--db-user", default=os.getenv("OPER_RADAR_DB_USER"))
    ap.add_argument("--db-pass", default=os.getenv("OPER_RADAR_DB_PASS"))
    ap.add_argument("--db-name", default=os.getenv("OPER_RADAR_DB_NAME"))
    args = ap.parse_args()
    if not all((args.db_user, args.db_pass, args.db_name)):
        ap.error("credenciais OPER_RADAR_DB_* ausentes")
    conn = mysql.connector.connect(host=args.db_host, user=args.db_user, password=args.db_pass,
                                   database=args.db_name, charset="utf8mb4")
    try:
        md = relatorio_markdown(*coleta(conn))
    finally:
        conn.close()
    if args.saida:
        Path(args.saida).write_text(md, encoding="utf-8")
    print(md)
