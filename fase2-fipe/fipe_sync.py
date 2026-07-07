"""
OPER RADAR — Fase 2: sincronização com a tabela FIPE
Fonte: API pública https://fipe.parallelum.com.br/api/v2 (suporta 'trucks').

Estratégia (limite gratuito: 500 req/dia; com token gratuito: 1000/dia):
  1. Busca as marcas de caminhão da FIPE (1 requisição, cacheada no banco);
  2. Olha os ANÚNCIOS REAIS coletados e prioriza os modelos mais frequentes;
  3. Para cada anúncio sem match: encontra o modelo FIPE mais parecido (matching por
     tokens), busca o preço só do ano daquele anúncio, grava o vínculo.
  Tudo é cacheado em fipe_modelo/fipe_preco — as rodadas seguintes não repetem chamadas.

Uso (no terminal do cPanel, dentro de ~/Oper-radar/fase2-fipe):
  python3 fipe_sync.py --db-user=... --db-pass='...' --db-name=... [--max-req=400] [--token=SEU_TOKEN]

Agendável no cron 1x/dia (fora dos horários do scraper), ex: 0 13 * * *
"""
import argparse
import re
import time
import unicodedata

import requests
import mysql.connector

BASE = "https://fipe.parallelum.com.br/api/v2"
PAUSA = 1.0  # segundos entre requisições — gentileza com a API gratuita

# Marca do portal -> nome aproximado na FIPE (casos onde os nomes diferem)
MAPA_MARCA = {
    "VW": "VOLKSWAGEN", "VOLKSWAGEN": "VOLKSWAGEN", "MERCEDES BENZ": "MERCEDES-BENZ",
    "GM": "GM - CHEVROLET",
}

contador_req = 0
max_req = 400
headers_api = {}


def api_get(path):
    global contador_req
    if contador_req >= max_req:
        raise RuntimeError(f"Limite de {max_req} requisições da rodada atingido — rode de novo amanhã, continua de onde parou.")
    contador_req += 1
    r = requests.get(f"{BASE}{path}", headers=headers_api, timeout=20)
    r.raise_for_status()
    time.sleep(PAUSA)
    return r.json()


def normaliza(s):
    s = unicodedata.normalize("NFD", s or "").encode("ascii", "ignore").decode()
    return re.sub(r"[^A-Z0-9 ]", " ", s.upper())


def tokens(s):
    return set(t for t in normaliza(s).split() if len(t) >= 2)


def score_match(titulo_anuncio, modelo_fipe):
    """Score simples e explicável: proporção de tokens do modelo FIPE presentes no título,
    com peso dobrado para números (530, 480, 6X4...), que são o que realmente diferencia modelos."""
    t_anuncio = tokens(titulo_anuncio)
    t_modelo = tokens(modelo_fipe)
    if not t_modelo:
        return 0.0
    pontos = peso_total = 0.0
    for tok in t_modelo:
        peso = 2.0 if any(c.isdigit() for c in tok) else 1.0
        peso_total += peso
        if tok in t_anuncio:
            pontos += peso
    return pontos / peso_total


def garante_marcas(conn):
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT COUNT(*) AS n FROM fipe_modelo")
    tem = cur.fetchone()["n"] > 0
    cur.close()
    if tem:
        return
    print("Buscando marcas de caminhões na FIPE…")
    marcas = api_get("/trucks/brands")
    cur = conn.cursor()
    for m in marcas:
        print(f"  marca FIPE: {m['name']} (id {m['code']}) — buscando modelos…")
        modelos = api_get(f"/trucks/brands/{m['code']}/models")
        for mod in modelos:
            cur.execute(
                "INSERT IGNORE INTO fipe_modelo (marca_fipe, marca_fipe_id, modelo_fipe, modelo_fipe_id) VALUES (%s,%s,%s,%s)",
                (m["name"].upper(), int(m["code"]), mod["name"], int(mod["code"])),
            )
        conn.commit()
    cur.close()


def anuncios_pendentes(conn, limite=200):
    """Anúncios de caminhão ativos sem vínculo FIPE, dos modelos mais frequentes primeiro."""
    cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT a.id, a.titulo, a.marca, a.ano_inicial
        FROM anuncio a
        WHERE a.fipe_preco_id IS NULL AND a.tipo = 'Caminhao' AND a.marca IS NOT NULL
          AND a.ano_inicial IS NOT NULL AND a.status = 'ativo'
        ORDER BY a.marca, a.titulo
        LIMIT %s
    """, (limite,))
    rows = cur.fetchall()
    cur.close()
    return rows


def modelos_da_marca(conn, marca_portal):
    alvo = MAPA_MARCA.get(normaliza(marca_portal).strip(), normaliza(marca_portal).strip())
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM fipe_modelo WHERE marca_fipe LIKE %s", (f"%{alvo}%",))
    rows = cur.fetchall()
    cur.close()
    return rows


def busca_ou_cria_preco(conn, modelo_row, ano):
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM fipe_preco WHERE fipe_modelo_id=%s AND ano_codigo LIKE %s",
                (modelo_row["id"], f"{ano}-%"))
    existente = cur.fetchone()
    if existente:
        cur.close()
        return existente["id"]

    anos = api_get(f"/trucks/brands/{modelo_row['marca_fipe_id']}/models/{modelo_row['modelo_fipe_id']}/years")
    ano_alvo = next((a for a in anos if a["code"].startswith(str(ano))), None)
    if not ano_alvo:
        cur.close()
        return None

    dados = api_get(f"/trucks/brands/{modelo_row['marca_fipe_id']}/models/{modelo_row['modelo_fipe_id']}/years/{ano_alvo['code']}")
    preco_txt = dados.get("price", "")
    preco = float(re.sub(r"[^\d,]", "", preco_txt).replace(".", "").replace(",", ".")) if preco_txt else None

    cur2 = conn.cursor()
    cur2.execute(
        "INSERT INTO fipe_preco (fipe_modelo_id, ano_codigo, codigo_fipe, preco, mes_referencia) VALUES (%s,%s,%s,%s,%s) "
        "ON DUPLICATE KEY UPDATE preco=VALUES(preco), mes_referencia=VALUES(mes_referencia), atualizado_em=NOW()",
        (modelo_row["id"], ano_alvo["code"], dados.get("codeFipe"), preco, dados.get("referenceMonth")),
    )
    conn.commit()
    novo_id = cur2.lastrowid
    cur2.close()
    cur.close()
    return novo_id


def roda(conn):
    garante_marcas(conn)
    pendentes = anuncios_pendentes(conn)
    print(f"{len(pendentes)} anúncios de caminhão sem vínculo FIPE — processando (limite {max_req} req)…")
    vinculados = 0
    for a in pendentes:
        try:
            candidatos = modelos_da_marca(conn, a["marca"])
            if not candidatos:
                continue
            melhor = max(candidatos, key=lambda c: score_match(a["titulo"], c["modelo_fipe"]))
            s = score_match(a["titulo"], melhor["modelo_fipe"])
            if s < 0.5:
                continue  # match fraco demais — melhor sem FIPE do que FIPE errada
            preco_id = busca_ou_cria_preco(conn, melhor, a["ano_inicial"])
            if not preco_id:
                continue
            confianca = "alto" if s >= 0.75 else "medio"
            cur = conn.cursor()
            cur.execute("UPDATE anuncio SET fipe_preco_id=%s, fipe_match_confianca=%s WHERE id=%s",
                        (preco_id, confianca, a["id"]))
            conn.commit()
            cur.close()
            vinculados += 1
            print(f"  ✓ [{confianca}] {a['titulo'][:50]} -> {melhor['modelo_fipe'][:50]}")
        except RuntimeError as e:
            print(f"\n{e}")
            break
        except requests.RequestException as e:
            print(f"  ! erro de rede em '{a['titulo'][:40]}': {e}")
            continue
    print(f"\n{vinculados} anúncios vinculados nesta rodada · {contador_req} requisições usadas.")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--db-host", default="localhost")
    ap.add_argument("--db-user", required=True)
    ap.add_argument("--db-pass", required=True)
    ap.add_argument("--db-name", required=True)
    ap.add_argument("--max-req", type=int, default=400, help="teto de requisições da rodada (limite público: 500/dia)")
    ap.add_argument("--token", default=None, help="token gratuito do fipe.online (opcional, sobe o limite pra 1000/dia)")
    args = ap.parse_args()

    max_req = args.max_req
    if args.token:
        headers_api["X-Subscription-Token"] = args.token

    conn = mysql.connector.connect(host=args.db_host, user=args.db_user,
                                   password=args.db_pass, database=args.db_name, charset="utf8mb4")
    try:
        roda(conn)
    finally:
        conn.close()
