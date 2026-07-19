"""
OPER RADAR — Fase 2: sincronizacao com a tabela FIPE
Fonte: https://fipe.parallelum.com.br/api/v2 (endpoint 'trucks').

Estrategia incremental: nao baixa a FIPE inteira. Olha os anuncios reais do banco
e busca preco so dos modelos/anos que existem na coleta, cacheando tudo.

Uso normal:
  set -a; . /root/.oper-radar.env; set +a
  python3 fipe_sync.py --max-req=400

Diagnostico (NAO gasta requisicao, so mostra os scores do matching):
  python3 fipe_sync.py --debug
"""
import argparse
import os
import re
import time
import unicodedata

import requests
import mysql.connector

BASE = "https://fipe.parallelum.com.br/api/v2"
PAUSA = 1.0

# Marca como vem do portal -> como aparece na FIPE (quando os nomes diferem)
MAPA_MARCA = {
    "VW": "VOLKSWAGEN", "VOLKSWAGEN": "VOLKSWAGEN",
    "MB": "MERCEDES-BENZ", "MERCEDES BENZ": "MERCEDES-BENZ", "MERCEDES": "MERCEDES-BENZ",
    "GM": "CHEVROLET",
}

contador_req = 0
max_req = 400
headers_api = {}


def api_get(path):
    global contador_req
    if contador_req >= max_req:
        raise RuntimeError(f"Limite de {max_req} requisicoes atingido — rode de novo depois, continua de onde parou.")
    contador_req += 1
    r = requests.get(f"{BASE}{path}", headers=headers_api, timeout=20)
    if r.status_code == 429:
        raise RuntimeError("A API FIPE atingiu o limite de requisicoes. A fila continua na proxima rodada.")
    if r.status_code in (401, 403):
        raise RuntimeError(f"A API FIPE recusou a autenticacao (HTTP {r.status_code}).")
    r.raise_for_status()
    time.sleep(PAUSA)
    return r.json()


# Tokens de marca e ruido que nao servem pra identificar modelo
MARCAS_RUIDO = {"MB", "VW", "GM", "MERCEDES", "BENZ", "SCANIA", "VOLVO", "DAF", "IVECO",
                "FORD", "AGRALE", "VOLKSWAGEN", "CHEVROLET", "MARCOPOLO", "SAAB"}
# Palavras da FIPE que descrevem acabamento/combustivel, nao a linha do caminhao.
# Comparadas por PREFIXO porque a FIPE abrevia: "Dies.", "Stre.", "High.", "Constel."
RUIDO_RAIZES = ("DIESEL", "STREAMLINE", "HIGHLINE", "TOPLINE", "ELETRICO",
                "EIXOS", "CABINE", "LEITO", "TURBO", "NORMAL", "AUTOMATICO")


def normaliza(s: str) -> str:
    s = unicodedata.normalize("NFD", s or "").encode("ascii", "ignore").decode().upper()
    s = re.sub(r"(?<=\d)[.,-](?=\d)", "", s)      # "11.180" e "11-180" viram "11180"
    return re.sub(r"[^A-Z0-9]+", " ", s)


def numero_modelo(s: str):
    """O numero que identifica o modelo (440, 2430, 11180), ignorando anos."""
    for n in re.findall(r"\d{3,5}", normaliza(s)):
        if not 1900 <= int(n) <= 2100:
            return n
    return None


def serie(s: str):
    """Letra(s) de serie coladas ao numero: 'R440' -> 'R'; 'G-440' -> 'G'.
    Marca nao conta como serie: 'MB 2430' -> None."""
    for pref, num in re.findall(r"\b([A-Z]{1,2})[ ]?(\d{3,5})\b", normaliza(s)):
        if pref not in MARCAS_RUIDO and not 1900 <= int(num) <= 2100:
            return pref
    return None


def eh_ruido(token: str) -> bool:
    """True se o token e marca ou descreve acabamento/combustivel. Compara por prefixo:
    'DIES' e 'DIESE' sao inicio de 'DIESEL'; 'STRE'/'STREAM' de 'STREAMLINE'."""
    if token in MARCAS_RUIDO:
        return True
    return any(raiz.startswith(token) for raiz in RUIDO_RAIZES)


def palavras_chave(s: str) -> set:
    """Palavras que identificam a LINHA comercial ('Atego', 'Worker', 'Delivery').
    Pode vir vazio — varios nomes FIPE sao so numero + eixo ('R-440 A 4x2 2p (diesel)')."""
    return {t for t in normaliza(s).split()
            if t.isalpha() and len(t) >= 4 and not eh_ruido(t)}


def mesma_linha(a: set, b: set) -> bool:
    """Conjuntos vazios nunca conflitam. 'WORK' e 'WORKER' sao a mesma linha
    (a FIPE abrevia); 'ATEGO' e 'ATRON' nao."""
    if not a or not b:
        return True
    return any(x.startswith(y) or y.startswith(x) for x in a for y in b)


def eixos(s: str):
    """Configuracao de eixos: '4X2', '6X4', '8X2'... Diferencia caminhoes de preco distinto."""
    m = re.search(r"\b(\d)\s?X\s?(\d)\b", normaliza(s))
    return f"{m.group(1)}X{m.group(2)}" if m else None


def avalia(titulo: str, modelo_fipe: str):
    """Devolve (score, motivo). Regra: o numero do modelo TEM que bater; se ambos
    tem letra de serie, elas TEM que ser iguais (senao 'R440' casaria com 'G-440',
    que e outro caminhao e outro preco)."""
    n_t, n_f = numero_modelo(titulo), numero_modelo(modelo_fipe)
    if not n_t or not n_f or n_t != n_f:
        return 0.0, "numero difere"
    s_t, s_f = serie(titulo), serie(modelo_fipe)
    if s_t and s_f and s_t != s_f:
        return 0.0, f"serie {s_t}!={s_f}"
    if s_t and s_f:
        return 0.95, "numero+serie"
    return 0.60, "so numero"


def garante_marcas(conn):
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT COUNT(*) AS n FROM fipe_modelo")
    n = cur.fetchone()["n"]
    cur.close()
    if n > 0:
        print(f"Catalogo FIPE ja em cache: {n} modelos.")
        return
    print("Catalogo FIPE vazio — baixando marcas e modelos de caminhao...")
    marcas = api_get("/trucks/brands")
    cur = conn.cursor()
    for m in marcas:
        print(f"  {m['name']} (id {m['code']})...")
        for mod in api_get(f"/trucks/brands/{m['code']}/models"):
            cur.execute(
                "INSERT IGNORE INTO fipe_modelo (marca_fipe, marca_fipe_id, modelo_fipe, modelo_fipe_id) VALUES (%s,%s,%s,%s)",
                (m["name"].upper(), int(m["code"]), mod["name"], int(mod["code"])),
            )
        conn.commit()
    cur.close()


def anuncios_pendentes(conn, limite):
    cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT id, titulo, marca, ano_inicial FROM anuncio
        WHERE fipe_preco_id IS NULL AND tipo = 'Caminhao' AND marca IS NOT NULL
          AND ano_inicial IS NOT NULL AND status = 'ativo'
          AND (
              fipe_ultima_tentativa IS NULL
              OR (fipe_match_status = 'erro_api'
                  AND fipe_ultima_tentativa <= DATE_SUB(NOW(), INTERVAL 1 DAY))
              OR (fipe_match_status IN ('sem_match', 'ambiguo', 'sem_ano')
                  AND fipe_ultima_tentativa <= DATE_SUB(NOW(), INTERVAL 30 DAY))
          )
        ORDER BY fipe_ultima_tentativa IS NULL DESC, fipe_ultima_tentativa ASC, id
        LIMIT %s
    """, (limite,))
    rows = cur.fetchall()
    cur.close()
    return rows


def modelos_da_marca(conn, marca_portal):
    chave = " ".join(normaliza(marca_portal).split())
    alvo = MAPA_MARCA.get(chave, chave)
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM fipe_modelo WHERE marca_fipe LIKE %s", (f"%{alvo}%",))
    rows = cur.fetchall()
    cur.close()
    if not rows and " " in alvo:  # tenta so a primeira palavra (ex: "MERCEDES")
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM fipe_modelo WHERE marca_fipe LIKE %s", (f"%{alvo.split()[0]}%",))
        rows = cur.fetchall()
        cur.close()
    return rows


def busca_ou_cria_preco(conn, modelo, ano):
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT id FROM fipe_preco WHERE fipe_modelo_id=%s AND ano_codigo LIKE %s",
                (modelo["id"], f"{ano}-%"))
    achou = cur.fetchone()
    cur.close()
    if achou:
        return achou["id"]

    anos = api_get(f"/trucks/brands/{modelo['marca_fipe_id']}/models/{modelo['modelo_fipe_id']}/years")
    ano_alvo = next((a for a in anos if a["code"].startswith(str(ano))), None)
    if not ano_alvo:
        return None

    dados = api_get(f"/trucks/brands/{modelo['marca_fipe_id']}/models/{modelo['modelo_fipe_id']}/years/{ano_alvo['code']}")
    preco = parse_preco(dados.get("price", ""))

    cur = conn.cursor()
    cur.execute(
        "INSERT INTO fipe_preco (fipe_modelo_id, ano_codigo, codigo_fipe, preco, mes_referencia) VALUES (%s,%s,%s,%s,%s) "
        "ON DUPLICATE KEY UPDATE preco=VALUES(preco), mes_referencia=VALUES(mes_referencia), atualizado_em=NOW()",
        (modelo["id"], ano_alvo["code"], dados.get("codeFipe"), preco, dados.get("referenceMonth")),
    )
    conn.commit()
    novo = cur.lastrowid
    cur.close()
    return novo


def parse_preco(preco_txt):
    """Converte 'R$ 123.456,78' para decimal aceito pelo MySQL."""
    return (float(re.sub(r"[^\d,]", "", preco_txt).replace(".", "").replace(",", "."))
            if preco_txt else None)


def atualiza_precos_vencidos(conn, limite):
    """Atualiza aos poucos precos cujo mes de referencia ja ficou para tras."""
    if limite <= 0:
        return 0
    cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT fp.id, fp.ano_codigo, fm.marca_fipe_id, fm.modelo_fipe_id
        FROM fipe_preco fp
        JOIN fipe_modelo fm ON fm.id = fp.fipe_modelo_id
        WHERE fp.atualizado_em < DATE_FORMAT(NOW(), '%Y-%m-01')
        ORDER BY fp.atualizado_em, fp.id
        LIMIT %s
    """, (limite,))
    vencidos = cur.fetchall()
    cur.close()
    atualizados = 0
    for item in vencidos:
        try:
            dados = api_get(
                f"/trucks/brands/{item['marca_fipe_id']}/models/"
                f"{item['modelo_fipe_id']}/years/{item['ano_codigo']}"
            )
            cur = conn.cursor()
            cur.execute("""
                UPDATE fipe_preco
                SET codigo_fipe=%s, preco=%s, mes_referencia=%s, atualizado_em=NOW()
                WHERE id=%s
            """, (dados.get("codeFipe"), parse_preco(dados.get("price", "")),
                  dados.get("referenceMonth"), item["id"]))
            conn.commit()
            cur.close()
            atualizados += 1
        except RuntimeError:
            raise
        except requests.RequestException as e:
            print(f"  ! erro ao atualizar preco FIPE {item['id']}: {e}")
    if vencidos:
        print(f"Precos FIPE vencidos: {len(vencidos)} encontrados, {atualizados} atualizados.")
    return atualizados


def registra_resultado(conn, anuncio_id, status, motivo, preco_id=None, confianca=None):
    cur = conn.cursor()
    cur.execute("""
        UPDATE anuncio
        SET fipe_preco_id=%s,
            fipe_match_confianca=%s,
            fipe_match_status=%s,
            fipe_match_motivo=%s,
            fipe_ultima_tentativa=NOW(),
            fipe_tentativas=fipe_tentativas+1
        WHERE id=%s
    """, (preco_id, confianca, status, motivo[:160], anuncio_id))
    conn.commit()
    cur.close()


def melhores_candidatos(conn, anuncio, quantos=3):
    cands = modelos_da_marca(conn, anuncio["marca"])
    pontuados = []
    for c in cands:
        score, motivo = avalia(anuncio["titulo"], c["modelo_fipe"])
        pontuados.append((score, motivo, c))
    pontuados.sort(key=lambda x: (-x[0], len(x[2]["modelo_fipe"])))
    return pontuados[:quantos]


def escolhe(conn, anuncio):
    """Devolve (candidatos, confianca) ou (None, motivo).

    Regras, nesta ordem:
      1. Se o titulo informa o eixo ('R440 6X4'), filtra por ele.
      2. Linhas comerciais em conflito (Atego x Atron) -> nao vincula.
         Conjunto vazio nunca conflita: 'R-440 A 4x2 (diesel)' nao declara linha.
      3. Eixos explicitos em conflito (6x2 x 8x2) -> tenta o nome base da FIPE,
         aquele que nao declara eixo ('11-180 Delivery 2p'), que e o modelo padrao.
         Se nao houver base, ai sim nao vincula.
    """
    validos = [(s, m, c) for s, m, c in melhores_candidatos(conn, anuncio, quantos=100) if s >= 0.5]
    if not validos:
        return None, "sem match"

    eixo_titulo = eixos(anuncio["titulo"])
    if eixo_titulo:
        filtrados = [v for v in validos if eixos(v[2]["modelo_fipe"]) in (eixo_titulo, None)]
        if filtrados:
            validos = filtrados

    # 2) linhas conflitantes: dois conjuntos nao-vazios e sem interseccao
    chaves = [palavras_chave(c["modelo_fipe"]) for _, _, c in validos]
    nao_vazias = [k for k in chaves if k]
    for i_ in range(len(nao_vazias)):
        for j_ in range(i_ + 1, len(nao_vazias)):
            if not mesma_linha(nao_vazias[i_], nao_vazias[j_]):
                conflito = "/".join(sorted(nao_vazias[i_] | nao_vazias[j_]))[:26]
                return None, f"ambiguo linha ({conflito})"

    # 3) eixos conflitantes: prefere o nome base (sem eixo declarado)
    eixos_expl = {e for e in (eixos(c["modelo_fipe"]) for _, _, c in validos) if e}
    if len(eixos_expl) > 1:
        base = [v for v in validos if eixos(v[2]["modelo_fipe"]) is None]
        if not base:
            return None, "ambiguo eixo (" + "/".join(sorted(eixos_expl))[:22] + ")"
        validos = base

    confianca = "alto" if validos[0][0] >= 0.95 else "medio"
    return [c for _, _, c in validos], confianca


def roda_debug(conn):
    print("MODO DIAGNOSTICO — nenhuma requisicao sera feita.\n")
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT COUNT(*) n FROM fipe_modelo")
    print(f"Modelos FIPE em cache: {cur.fetchone()['n']}")
    cur.execute("SELECT marca_fipe, COUNT(*) n FROM fipe_modelo GROUP BY marca_fipe ORDER BY n DESC LIMIT 10")
    print("Marcas no cache:", ", ".join(f"{r['marca_fipe']}({r['n']})" for r in cur.fetchall()) or "NENHUMA")
    cur.close()

    pendentes = anuncios_pendentes(conn, 20)
    print(f"\nMatching nos {len(pendentes)} primeiros anuncios pendentes:\n")
    cont = {"vincula": 0, "sem match": 0, "ambiguo": 0}
    for a in pendentes:
        cands, info = escolhe(conn, a)
        if cands:
            cont["vincula"] += 1
            extra = f" (+{len(cands)-1} variantes, o ano decide)" if len(cands) > 1 else ""
            print(f"  OK  [{info:5}] {a['titulo'][:32]:32} -> {cands[0]['modelo_fipe'][:38]}{extra}")
        else:
            cont["ambiguo" if info.startswith("ambiguo") else "sem match"] += 1
            print(f"  --  [{info[:34]:34}] {a['titulo'][:30]}")
            for s, motivo, c in melhores_candidatos(conn, a, quantos=2):
                print(f"          {s:.2f} {motivo:14} {c['modelo_fipe'][:38]}")
    print(f"\nResumo: {cont['vincula']} vinculariam · {cont['sem match']} sem match · "
          f"{cont['ambiguo']} ambiguos (nao vinculam de proposito)")


def roda(conn, lote=200, max_refresh=100):
    garante_marcas(conn)
    try:
        atualiza_precos_vencidos(conn, max_refresh)
    except RuntimeError as e:
        print(f"\n{e}")
        print(f"{contador_req} requisicoes usadas nesta rodada.")
        return

    pendentes = anuncios_pendentes(conn, lote)
    print(f"{len(pendentes)} anuncios de caminhao sem vinculo FIPE — processando (limite {max_req} req)...")
    vinculados = sem_match = ambiguos = sem_ano = 0

    for a in pendentes:
        try:
            cands, info = escolhe(conn, a)
            if not cands:
                if info.startswith("ambiguo"):
                    ambiguos += 1
                    registra_resultado(conn, a["id"], "ambiguo", info)
                else:
                    sem_match += 1
                    registra_resultado(conn, a["id"], "sem_match", info)
                continue

            # Variantes com a mesma assinatura (E5/E6): a primeira que tiver o ano do anuncio vence
            preco_id = escolhido = None
            for c in cands[:3]:
                preco_id = busca_ou_cria_preco(conn, c, a["ano_inicial"])
                if preco_id:
                    escolhido = c
                    break
            if not preco_id:
                sem_ano += 1
                registra_resultado(conn, a["id"], "sem_ano", f"ano {a['ano_inicial']} ausente nos candidatos FIPE")
                continue

            registra_resultado(
                conn, a["id"], "vinculado",
                f"{escolhido['marca_fipe']} | {escolhido['modelo_fipe']}",
                preco_id=preco_id, confianca=info,
            )
            vinculados += 1
            print(f"  [{info}] {a['titulo'][:38]:38} -> {escolhido['modelo_fipe'][:36]}")
        except RuntimeError as e:
            print(f"\n{e}")
            break
        except requests.RequestException as e:
            print(f"  ! erro de rede em '{a['titulo'][:32]}': {e}")
            registra_resultado(conn, a["id"], "erro_api", str(e))
            continue

    print(f"\n{vinculados} vinculados · {sem_match} sem match · {ambiguos} ambiguos (pulados de proposito) "
          f"· {sem_ano} sem o ano na FIPE")
    print(f"{contador_req} requisicoes usadas nesta rodada.")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--db-host", default=os.getenv("OPER_RADAR_DB_HOST", "localhost"))
    ap.add_argument("--db-user", default=os.getenv("OPER_RADAR_DB_USER"))
    ap.add_argument("--db-pass", default=os.getenv("OPER_RADAR_DB_PASS"))
    ap.add_argument("--db-name", default=os.getenv("OPER_RADAR_DB_NAME"))
    ap.add_argument("--max-req", type=int, default=400)
    ap.add_argument("--lote", type=int, default=200, help="quantos anuncios examinar por rodada")
    ap.add_argument("--max-refresh", type=int, default=100, help="quantos precos mensais atualizar por rodada")
    ap.add_argument("--token", default=os.getenv("FIPE_API_TOKEN"), help="token opcional da API FIPE")
    ap.add_argument("--debug", action="store_true", help="so mostra os scores do matching, sem chamar a API")
    args = ap.parse_args()

    faltando = [nome for nome, valor in {
        "OPER_RADAR_DB_USER/--db-user": args.db_user,
        "OPER_RADAR_DB_PASS/--db-pass": args.db_pass,
        "OPER_RADAR_DB_NAME/--db-name": args.db_name,
    }.items() if not valor]
    if faltando:
        ap.error("credenciais ausentes: " + ", ".join(faltando))

    max_req = args.max_req
    if args.token:
        headers_api["X-Subscription-Token"] = args.token

    conn = mysql.connector.connect(host=args.db_host, user=args.db_user, password=args.db_pass,
                                   database=args.db_name, charset="utf8mb4")
    try:
        roda_debug(conn) if args.debug else roda(conn, lote=args.lote, max_refresh=args.max_refresh)
    finally:
        conn.close()
