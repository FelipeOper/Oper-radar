"""
OPER RADAR — Fase 1
Orquestrador principal. Pensado para rodar 2x/dia via cron (07h e 19h).

Uso: python scraper.py --janela 07h
"""
import argparse
import hashlib
import re
import sys
from datetime import datetime, timezone

import requests
import psycopg2
from psycopg2.extras import RealDictCursor

from parser import parse_listings, hash_pagina
from diff_logic import processa_diff, EstadoAnuncio

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
BASE_URL = "https://www.caminhoesecarretas.com.br"
# Os links no HTML real são RELATIVOS (sem domínio, sem barra inicial) — confirmado via
# curl+grep direto no servidor de produção.
LOJA_URL_RE = re.compile(r'href="([a-z0-9-]+/[a-z]{2}/loja/[a-z0-9-]+/veiculo/\d+)"')


def discover_revenda_urls(uf: str) -> list[str]:
    """Varre revendas.aspx?uf=XX e devolve as URLs REAIS de perfil de cada revenda.
    Isso substitui qualquer URL "adivinhada" por slug — usa só o que o portal realmente linka."""
    resp = requests.get(f"https://www.caminhoesecarretas.com.br/revendas.aspx?uf={uf}", headers=HEADERS, timeout=20)
    resp.raise_for_status()
    caminhos = sorted(set(LOJA_URL_RE.findall(resp.text)))
    return [f"{BASE_URL}/{caminho}" for caminho in caminhos]


def fetch_revenda_page(url: str) -> str:
    resp = requests.get(url, headers=HEADERS, timeout=20)
    resp.raise_for_status()
    return resp.text


def get_or_create_revenda(conn, nome: str, cidade: str, uf: str, url_perfil: str) -> int:
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM revenda WHERE url_perfil = %s", (url_perfil,))
        row = cur.fetchone()
        if row:
            return row[0]
        cur.execute(
            "INSERT INTO revenda (nome, cidade, uf, url_perfil) VALUES (%s,%s,%s,%s) RETURNING id",
            (nome, cidade, uf, url_perfil),
        )
        return cur.fetchone()[0]


def carrega_estado_atual(conn, revenda_id: int) -> dict[int, EstadoAnuncio]:
    estado = {}
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
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
    return estado


def salva_estado(conn, revenda_id: int, novo_estado: dict, anuncios_por_id: dict):
    with conn.cursor() as cur:
        for anuncio_id, estado in novo_estado.items():
            anuncio = anuncios_por_id.get(anuncio_id)
            if anuncio is not None:
                # Anúncio visto nesta coleta (novo ou continuando ativo) — grava tudo.
                cur.execute("""
                    INSERT INTO anuncio (anuncio_portal_id, revenda_id, url, titulo, tipo, marca,
                        ano_inicial, ano_final, km_ou_horas, preco, preco_texto_bruto,
                        primeira_vez_visto, ultima_vez_ativo, status, misses_consecutivos, data_remocao)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    ON CONFLICT (revenda_id, anuncio_portal_id) DO UPDATE SET
                        ultima_vez_ativo = EXCLUDED.ultima_vez_ativo,
                        status = EXCLUDED.status,
                        misses_consecutivos = EXCLUDED.misses_consecutivos,
                        data_remocao = EXCLUDED.data_remocao,
                        ano_inicial = COALESCE(EXCLUDED.ano_inicial, anuncio.ano_inicial),
                        ano_final = COALESCE(EXCLUDED.ano_final, anuncio.ano_final),
                        km_ou_horas = COALESCE(NULLIF(EXCLUDED.km_ou_horas, ''), anuncio.km_ou_horas),
                        preco = COALESCE(EXCLUDED.preco, anuncio.preco)
                """, (
                    anuncio_id, revenda_id,
                    anuncio.url, anuncio.titulo, anuncio.tipo, anuncio.marca,
                    anuncio.ano_inicial, anuncio.ano_final, anuncio.km_ou_horas,
                    anuncio.preco, anuncio.preco_texto_bruto,
                    estado.primeira_vez_visto, estado.ultima_vez_ativo, estado.status,
                    estado.misses_consecutivos, estado.data_remocao,
                ))
            else:
                # Anúncio que já existia e sumiu desta coleta — só atualiza o status.
                cur.execute("""
                    UPDATE anuncio SET
                        ultima_vez_ativo = %s, status = %s, misses_consecutivos = %s, data_remocao = %s
                    WHERE revenda_id = %s AND anuncio_portal_id = %s
                """, (
                    estado.ultima_vez_ativo, estado.status, estado.misses_consecutivos,
                    estado.data_remocao, revenda_id, anuncio_id,
                ))
    conn.commit()


def roda_ciclo(conn, uf: str, janela: str):
    urls = discover_revenda_urls(uf)
    print(f"[{uf}] {len(urls)} revendas encontradas")

    for url in urls:
        try:
            html = fetch_revenda_page(url)
        except requests.RequestException as e:
            registra_execucao(conn, None, janela, 0, "", sucesso=False, erro=str(e))
            continue

        h = hash_pagina(html)
        # (a lógica de "pular se hash igual" fica no caller, comparando com a última
        #  execucao_coleta dessa revenda antes de chamar fetch_revenda_page — aqui já
        #  buscamos, então logamos o hash normalmente)

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
        print(f"  {nome_revenda}: {len(ids_ativos)} anúncios ativos")


def registra_execucao(conn, revenda_id, janela, qtd_ativos, hash_pag, sucesso, erro=None):
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO execucao_coleta (revenda_id, janela, qtd_anuncios_ativos, hash_pagina, sucesso, erro_mensagem)
            VALUES (%s,%s,%s,%s,%s,%s)
        """, (revenda_id, janela, qtd_ativos, hash_pag, sucesso, erro))
    conn.commit()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--janela", choices=["07h", "19h"], required=True)
    ap.add_argument("--uf", default="PR")
    ap.add_argument("--dsn", default="dbname=oper_radar user=oper_radar")
    args = ap.parse_args()

    conn = psycopg2.connect(args.dsn)
    try:
        roda_ciclo(conn, args.uf, args.janela)
    finally:
        conn.close()
