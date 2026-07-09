"""
OPER RADAR — Fase 2: sincronizacao com a tabela FIPE
Fonte: https://fipe.parallelum.com.br/api/v2 (endpoint 'trucks').

Estrategia incremental: nao baixa a FIPE inteira. Olha os anuncios reais do banco
e busca preco so dos modelos/anos que existem na coleta, cacheando tudo.

Uso normal:
  python3 fipe_sync.py --db-user=... --db-pass='...' --db-name=... --max-req=400

Diagnostico (NAO gasta requisicao, so mostra os scores do matching):
  python3 fipe_sync.py --db-user=... --db-pass='...' --db-name=... --debug
"""
import argparse
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
    r.raise_for_status()
    time.sleep(PAUSA)
    return r.json()


# Tokens de marca e ruido que nao servem pra identificar modelo
MARCAS_RUIDO = {"MB", "VW", "GM", "MERCEDES", "BENZ", "SCANIA", "VOLVO", "DAF", "IVECO",
                "FORD", "AGRALE", "VOLKSWAGEN", "CHEVROLET", "MARCOPOLO", "SAAB"}
PALAVRAS_RUIDO = {"DIESEL", "EIXOS", "PLUS", "TURBO"}


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


def linha_comercial(s: str):
    """Nome da linha: 'Atego 2430' -> 'ATEGO'. Usado pra detectar ambiguidade."""
    for t in normaliza(s).split():
        if t.isalpha() and len(t) >= 4 and t not in MARCAS_RUIDO and t not in PALAVRAS_RUIDO:
            return t
    return None


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
        ORDER BY id LIMIT %s
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
    preco_txt = dados.get("price", "")
    preco = float(re.sub(r"[^\d,]", "", preco_txt).replace(".", "").replace(",", ".")) if preco_txt else None

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


def melhores_candidatos(conn, anuncio, quantos=3):
    cands = modelos_da_marca(conn, anuncio["marca"])
    pontuados = []
    for c in cands:
        score, motivo = avalia(anuncio["titulo"], c["modelo_fipe"])
        pontuados.append((score, motivo, c))
    pontuados.sort(key=lambda x: (-x[0], len(x[2]["modelo_fipe"])))
    return pontuados[:quantos]


def escolhe(conn, anuncio):
    """Devolve (modelo, confianca) ou (None, motivo_da_recusa)."""
    validos = [(s, m, c) for s, m, c in melhores_candidatos(conn, anuncio, quantos=50) if s >= 0.5]
    if not validos:
        return None, "sem match"
    linhas = {linha_comercial(c["modelo_fipe"]) for _, _, c in validos}
    if len(linhas) > 1:
        # Ex: 'MB 1719' casa com Atego 1719 E Atron 1719 — modelos e precos diferentes.
        # Preco errado e pior que preco nenhum: nao vincula.
        return None, "ambiguo (" + "/".join(sorted(x or "?" for x in linhas)) + ")"
    score, _, melhor = validos[0]
    return melhor, ("alto" if score >= 0.95 else "medio")


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
    contagem = {"vincula": 0, "sem match": 0, "ambiguo": 0}
    for a in pendentes:
        modelo, info = escolhe(conn, a)
        if modelo:
            contagem["vincula"] += 1
            print(f"  OK  [{info:5}] {a['titulo'][:34]:34} -> {modelo['modelo_fipe'][:42]}")
        else:
            chave = "ambiguo" if info.startswith("ambiguo") else "sem match"
            contagem[chave] += 1
            print(f"  --  [{info[:28]:28}] {a['titulo'][:34]}")
            for s, motivo, c in melhores_candidatos(conn, a, quantos=2):
                print(f"          {s:.2f} {motivo:16} {c['modelo_fipe'][:40]}")
    print(f"\nResumo da amostra: {contagem['vincula']} vinculariam · "
          f"{contagem['sem match']} sem match · {contagem['ambiguo']} ambiguos (nao vinculam de proposito)")


def roda(conn):
    garante_marcas(conn)
    pendentes = anuncios_pendentes(conn, 200)
    print(f"{len(pendentes)} anuncios de caminhao sem vinculo FIPE — processando (limite {max_req} req)...")
    vinculados = sem_match = ambiguos = sem_ano = 0

    for a in pendentes:
        try:
            modelo, info = escolhe(conn, a)
            if not modelo:
                if info.startswith("ambiguo"):
                    ambiguos += 1
                else:
                    sem_match += 1
                continue
            preco_id = busca_ou_cria_preco(conn, modelo, a["ano_inicial"])
            if not preco_id:
                sem_ano += 1
                continue
            cur = conn.cursor()
            cur.execute("UPDATE anuncio SET fipe_preco_id=%s, fipe_match_confianca=%s WHERE id=%s",
                        (preco_id, info, a["id"]))
            conn.commit()
            cur.close()
            vinculados += 1
            print(f"  [{info}] {a['titulo'][:40]:40} -> {modelo['modelo_fipe'][:38]}")
        except RuntimeError as e:
            print(f"\n{e}")
            break
        except requests.RequestException as e:
            print(f"  ! erro de rede em '{a['titulo'][:34]}': {e}")
            continue

    print(f"\n{vinculados} vinculados · {sem_match} sem match · {ambiguos} ambiguos (pulados de proposito) "
          f"· {sem_ano} sem o ano na FIPE")
    print(f"{contador_req} requisicoes usadas nesta rodada.")
    if vinculados == 0:
        print("\nRode com --debug pra ver os scores sem gastar cota.")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--db-host", default="localhost")
    ap.add_argument("--db-user", required=True)
    ap.add_argument("--db-pass", required=True)
    ap.add_argument("--db-name", required=True)
    ap.add_argument("--max-req", type=int, default=400)
    ap.add_argument("--token", default=None, help="token gratuito do fipe.online (sobe o limite diario)")
    ap.add_argument("--debug", action="store_true", help="so mostra os scores do matching, sem chamar a API")
    args = ap.parse_args()

    max_req = args.max_req
    if args.token:
        headers_api["X-Subscription-Token"] = args.token

    conn = mysql.connector.connect(host=args.db_host, user=args.db_user, password=args.db_pass,
                                   database=args.db_name, charset="utf8mb4")
    try:
        roda_debug(conn) if args.debug else roda(conn)
    finally:
        conn.close()
