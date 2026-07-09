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


def normaliza(s: str) -> str:
    s = unicodedata.normalize("NFD", s or "").encode("ascii", "ignore").decode().upper()
    s = re.sub(r"(?<=\d)[.,](?=\d)", "", s)      # "11.180" -> "11180"
    return re.sub(r"[^A-Z0-9]+", " ", s)


def tokens(s: str) -> set:
    """Tokens do texto, quebrando tambem transicoes letra<->digito.
    'R540' vira {'R540','540'}; 'A6X4' vira {'A6X4','6','4'}... isso e o que
    permite casar 'SCANIA R540' com o modelo FIPE 'R 540 A6X4'."""
    out = set()
    for bruto in normaliza(s).split():
        if len(bruto) >= 2:
            out.add(bruto)
        for parte in re.findall(r"\d+|[A-Z]+", bruto):
            if len(parte) >= 2:
                out.add(parte)
    return out


def numeros(s: str) -> set:
    """Numeros de 2+ digitos, ignorando o que parece ano (1900-2100)."""
    return {n for n in re.findall(r"\d{2,}", normaliza(s)) if not 1900 <= int(n) <= 2100}


def score_match(titulo: str, modelo_fipe: str):
    """Devolve (score_final, score_base). O score_base ignora o reforco numerico
    e e o que decide a confianca — reforco numerico sozinho nao vira 'alto'."""
    t_anuncio, t_modelo = tokens(titulo), tokens(modelo_fipe)
    if not t_modelo:
        return 0.0, 0.0
    pontos = peso_total = 0.0
    for tok in t_modelo:
        peso = 2.0 if any(c.isdigit() for c in tok) else 1.0
        peso_total += peso
        if tok in t_anuncio:
            pontos += peso
    base = pontos / peso_total

    # Reforco: o numero do modelo (2651, 530, 11180) e o identificador mais forte.
    n_anuncio, n_modelo = numeros(titulo), numeros(modelo_fipe)
    final = base
    if n_modelo and (n_modelo & n_anuncio):
        final = max(base, 0.55 + 0.45 * (len(n_modelo & n_anuncio) / len(n_modelo)))
    return final, base


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
    if not cands:
        return []
    pontuados = []
    for c in cands:
        final, base = score_match(anuncio["titulo"], c["modelo_fipe"])
        pontuados.append((final, base, c))
    pontuados.sort(key=lambda x: x[0], reverse=True)
    return pontuados[:quantos]


def roda_debug(conn):
    print("MODO DIAGNOSTICO — nenhuma requisicao sera feita.\n")
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT COUNT(*) n FROM fipe_modelo")
    print(f"Modelos FIPE em cache: {cur.fetchone()['n']}")
    cur.execute("SELECT marca_fipe, COUNT(*) n FROM fipe_modelo GROUP BY marca_fipe ORDER BY n DESC LIMIT 10")
    print("Marcas no cache:", ", ".join(f"{r['marca_fipe']}({r['n']})" for r in cur.fetchall()) or "NENHUMA")
    cur.close()

    pendentes = anuncios_pendentes(conn, 15)
    print(f"\nTestando o matching nos {len(pendentes)} primeiros anuncios pendentes:\n")
    for a in pendentes:
        top = melhores_candidatos(conn, a)
        print(f"  {a['titulo'][:44]:44} (marca no portal: {a['marca']})")
        if not top:
            print("    ! nenhum modelo FIPE encontrado para essa marca\n")
            continue
        for final, base, c in top:
            marcador = "OK " if final >= 0.5 else "   "
            conf = "alto" if base >= 0.75 else "medio"
            print(f"    {marcador}score {final:.2f} (base {base:.2f}, {conf})  {c['modelo_fipe'][:46]}")
        print()


def roda(conn):
    garante_marcas(conn)
    pendentes = anuncios_pendentes(conn, 200)
    print(f"{len(pendentes)} anuncios de caminhao sem vinculo FIPE — processando (limite {max_req} req)...")
    vinculados = sem_candidato = score_baixo = 0

    for a in pendentes:
        try:
            top = melhores_candidatos(conn, a, quantos=2)
            if not top:
                sem_candidato += 1
                continue
            final, base, melhor = top[0]
            if final < 0.5:
                score_baixo += 1
                continue
            # Ambiguidade: se o 2o candidato empata, a confianca cai
            ambiguo = len(top) > 1 and abs(top[1][0] - final) < 0.05
            preco_id = busca_ou_cria_preco(conn, melhor, a["ano_inicial"])
            if not preco_id:
                continue
            confianca = "alto" if (base >= 0.75 and not ambiguo) else "medio"
            cur = conn.cursor()
            cur.execute("UPDATE anuncio SET fipe_preco_id=%s, fipe_match_confianca=%s WHERE id=%s",
                        (preco_id, confianca, a["id"]))
            conn.commit()
            cur.close()
            vinculados += 1
            print(f"  [{confianca}] {a['titulo'][:44]:44} -> {melhor['modelo_fipe'][:40]}")
        except RuntimeError as e:
            print(f"\n{e}")
            break
        except requests.RequestException as e:
            print(f"  ! erro de rede em '{a['titulo'][:38]}': {e}")
            continue

    print(f"\n{vinculados} vinculados · {sem_candidato} sem modelo da marca · {score_baixo} com match fraco (<0.50)")
    print(f"{contador_req} requisicoes usadas nesta rodada.")
    if vinculados == 0 and score_baixo > 0:
        print("\nDica: rode com --debug para ver os scores e entender por que nao casou.")


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
