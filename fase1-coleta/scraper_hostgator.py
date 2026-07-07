"""
OPER RADAR — Fase 1, versão para HostGator Plano M (hospedagem compartilhada cPanel)

Duas adaptações em relação ao scraper.py genérico (pensado para VPS/Postgres):

1. MySQL em vez de Postgres (mysql-connector-python) — hospedagem compartilhada cPanel
   normalmente só oferece MySQL/MariaDB.
2. Pausa entre cada requisição (PAUSA_ENTRE_REQUISICOES) — o Plano M tem limite de 25% de
   uso de CPU por períodos >= 90 segundos; varrer 954 revendas em sequência rápida
   estouraria esse limite. Rodar mais devagar também é mais gentil com o próprio portal.

Uso: python scraper_hostgator.py --janela 07h --uf PR
"""
import argparse
import re
import time
from datetime import datetime, timezone

import requests
import mysql.connector

from parser import parse_listings, hash_pagina
from diff_logic import processa_diff, EstadoAnuncio

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
LOJA_URL_RE = re.compile(r"https://www\.caminhoesecarretas\.com\.br/[^/]+/[a-z]{2}/loja/[^/\s\"]+/veiculo/\d+")

# Pausa entre cada fetch de revenda. Em hospedagem compartilhada, mais importante do que
# velocidade é não estourar o limite de CPU (25% por >=90s) nem sobrecarregar o portal.
# 2 segundos x 954 revendas = ~32 minutos por ciclo, tranquilo para rodar 2x/dia.
PAUSA_ENTRE_REQUISICOES = 2.0


def discover_revenda_urls(uf: str) -> list[str]:
    resp = requests.get(f"https://www.caminhoesecarretas.com.br/revendas.aspx?uf={uf}", headers=HEADERS, timeout=20)
    resp.raise_for_status()
    return sorted(set(LOJA_URL_RE.findall(resp.text)))


def fetch_revenda_page(url: str) -> str:
    resp = requests.get(url, headers=HEADERS, timeout=20)
    resp.raise_for_status()
    return resp.text


def conecta_mysql(host: str, user: str, senha: str, database: str):
    """No cPanel da HostGator: Banco de Dados MySQL -> criar banco e usuário -> anotar
    host (geralmente 'localhost'), nome do banco e usuário costumam vir prefixados com o
    nome da conta cPanel, ex: seuusuario_oper_radar."""
    return mysql.connector.connect(host=host, user=user, password=senha, database=database, charset="utf8mb4")


def get_or_create_revenda(conn, nome: str, cidade: str, uf: str, url_perfil: str) -> int:
    cur = conn.cursor()
    cur.execute("SELECT id FROM revenda WHERE url_perfil = %s", (url_perfil,))
    row = cur.fetchone()
    if row:
        cur.close()
        return row[0]
    cur.execute(
        "INSERT INTO revenda (nome, cidade, uf, url_perfil) VALUES (%s,%s,%s,%s)",
        (nome, cidade, uf, url_perfil),
    )
    conn.commit()
    novo_id = cur.lastrowid
    cur.close()
    return novo_id


def carrega_estado_atual(conn, revenda_id: int) -> dict[int, EstadoAnuncio]:
    estado = {}
    cur = conn.cursor(dictionary=True)
    cur.execute(
        "SELECT anuncio_portal_id, status, misses_consecutivos, primeira_vez_visto, "
        "ultima_vez_ativo, data_remocao FROM anuncio WHERE revenda_id = %s", (revenda_id,)
    )
    for row in cur.fetchall():
        estado[row["anuncio_portal_id"]] = EstadoAnuncio(
            anuncio_portal_id=row["anuncio_portal_id"], status=row["status"],
            misses_consecutivos=row["misses_consecutivos"], primeira_vez_visto=row["primeira_vez_visto"],
            ultima_vez_ativo=row["ultima_vez_ativo"], data_remocao=row["data_remocao"],
        )
    cur.close()
    return estado


def salva_estado(conn, revenda_id: int, novo_estado: dict, anuncios_por_id: dict):
    cur = conn.cursor()
    for anuncio_id, estado in novo_estado.items():
        anuncio = anuncios_por_id.get(anuncio_id)
        # MySQL usa "ON DUPLICATE KEY UPDATE" em vez do "ON CONFLICT ... DO UPDATE" do Postgres.
        cur.execute("""
            INSERT INTO anuncio (anuncio_portal_id, revenda_id, url, titulo, tipo, marca,
                ano_inicial, ano_final, preco, preco_texto_bruto,
                primeira_vez_visto, ultima_vez_ativo, status, misses_consecutivos, data_remocao)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON DUPLICATE KEY UPDATE
                ultima_vez_ativo = VALUES(ultima_vez_ativo),
                status = VALUES(status),
                misses_consecutivos = VALUES(misses_consecutivos),
                data_remocao = VALUES(data_remocao),
                preco = COALESCE(VALUES(preco), preco)
        """, (
            anuncio_id, revenda_id,
            anuncio.url if anuncio else None, anuncio.titulo if anuncio else str(anuncio_id),
            anuncio.tipo if anuncio else None, anuncio.marca if anuncio else None,
            anuncio.ano_inicial if anuncio else None, anuncio.ano_final if anuncio else None,
            anuncio.preco if anuncio else None, anuncio.preco_texto_bruto if anuncio else None,
            estado.primeira_vez_visto, estado.ultima_vez_ativo, estado.status,
            estado.misses_consecutivos, estado.data_remocao,
        ))
    conn.commit()
    cur.close()


def registra_execucao(conn, revenda_id, janela, qtd_ativos, hash_pag, sucesso, erro=None):
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO execucao_coleta (revenda_id, janela, qtd_anuncios_ativos, hash_pagina, sucesso, erro_mensagem)
        VALUES (%s,%s,%s,%s,%s,%s)
    """, (revenda_id, janela, qtd_ativos, hash_pag, sucesso, erro))
    conn.commit()
    cur.close()


def roda_ciclo(conn, uf: str, janela: str):
    urls = discover_revenda_urls(uf)
    print(f"[{uf}] {len(urls)} revendas encontradas — pausa de {PAUSA_ENTRE_REQUISICOES}s entre cada uma")

    for i, url in enumerate(urls):
        try:
            html = fetch_revenda_page(url)
        except requests.RequestException as e:
            registra_execucao(conn, None, janela, 0, "", sucesso=False, erro=str(e))
            time.sleep(PAUSA_ENTRE_REQUISICOES)
            continue

        h = hash_pagina(html)
        nome_revenda = url.split("/loja/")[1].split("/")[0].replace("%20", " ").replace("-", " ").title()
        cidade = url.split("/")[3].replace("-", " ").title()
        revenda_id = get_or_create_revenda(conn, nome_revenda, cidade, uf.upper(), url)

        anuncios = parse_listings(html)
        anuncios_por_id = {a.anuncio_portal_id: a for a in anuncios}
        ids_ativos = set(anuncios_por_id.keys())

        estado_anterior = carrega_estado_atual(conn, revenda_id)
        agora = datetime.now(timezone.utc)
        novo_estado = processa_diff(estado_anterior, ids_ativos, agora)
        salva_estado(conn, revenda_id, novo_estado, anuncios_por_id)

        registra_execucao(conn, revenda_id, janela, len(ids_ativos), h, sucesso=True)
        print(f"  [{i+1}/{len(urls)}] {nome_revenda}: {len(ids_ativos)} anúncios ativos")

        if i < len(urls) - 1:
            time.sleep(PAUSA_ENTRE_REQUISICOES)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--janela", choices=["07h", "19h"], required=True)
    ap.add_argument("--uf", default="PR")
    ap.add_argument("--db-host", default="localhost")
    ap.add_argument("--db-user", required=True, help="usuário MySQL criado no cPanel, ex: seuusuario_oper")
    ap.add_argument("--db-pass", required=True)
    ap.add_argument("--db-name", required=True, help="banco criado no cPanel, ex: seuusuario_oper_radar")
    args = ap.parse_args()

    conn = conecta_mysql(args.db_host, args.db_user, args.db_pass, args.db_name)
    try:
        roda_ciclo(conn, args.uf, args.janela)
    finally:
        conn.close()
