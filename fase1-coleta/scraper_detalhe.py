"""
OPER RADAR — Fase 1, extensão
Visita a página INDIVIDUAL de cada anúncio de caminhão (uma vez por anúncio) para coletar
Cor, Modelo, Carroceria, Tração, Quilometragem, Opcionais e Descrição — dados que só existem
lá, não na página de listagem lida por scraper_hostgator.py.

A mesma fila (`detalhe_coletado_em IS NULL`) serve tanto o backfill dos anúncios já existentes
quanto o fluxo contínuo dos anúncios novos: não há distinção de "modo" no código, só de volume
de lote e frequência de execução (ver crontab-hostgator-detalhe.example).

Uso: python scraper_detalhe.py --lote 200 --pausa-requisicoes 4.0
"""
import argparse
import os
import time

import requests

from scraper_hostgator import cria_sessao, conecta_mysql
from parser_detalhe import parse_detalhe, parece_bloqueio_ou_pagina_invalida

PAUSA_ENTRE_REQUISICOES = 4.0
MAX_ERROS_SEGUIDOS = 5

SESSAO = cria_sessao()


def busca_pendentes(conn, lote: int) -> list[dict]:
    cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT id, url FROM anuncio
        WHERE detalhe_coletado_em IS NULL
          AND tipo = 'Caminhao'
          AND (
              detalhe_ultima_tentativa IS NULL
              OR (status = 'ativo' AND detalhe_status = 'erro'
                  AND detalhe_ultima_tentativa <= DATE_SUB(NOW(), INTERVAL 1 DAY))
          )
        ORDER BY detalhe_ultima_tentativa IS NULL DESC, id
        LIMIT %s
    """, (lote,))
    rows = cur.fetchall()
    cur.close()
    return rows


def registra_tentativa(conn, anuncio_id: int, status: str) -> None:
    cur = conn.cursor()
    cur.execute("""
        UPDATE anuncio SET
            detalhe_status = %s,
            detalhe_ultima_tentativa = NOW(),
            detalhe_tentativas = detalhe_tentativas + 1
        WHERE id = %s
    """, (status, anuncio_id))
    conn.commit()
    cur.close()


def marca_removido(conn, anuncio_id: int) -> None:
    cur = conn.cursor()
    cur.execute("""
        UPDATE anuncio SET
            detalhe_status = 'removido',
            detalhe_ultima_tentativa = NOW(),
            detalhe_coletado_em = NOW(),
            detalhe_tentativas = detalhe_tentativas + 1
        WHERE id = %s
    """, (anuncio_id,))
    conn.commit()
    cur.close()


def salva_detalhe(conn, anuncio_id: int, campos: dict) -> None:
    cur = conn.cursor()
    cur.execute("""
        UPDATE anuncio SET
            modelo = COALESCE(%s, modelo),
            cor = COALESCE(%s, cor),
            carroceria = COALESCE(%s, carroceria),
            tracao = COALESCE(%s, tracao),
            opcionais = COALESCE(%s, opcionais),
            descricao = COALESCE(%s, descricao),
            km_ou_horas = COALESCE(%s, km_ou_horas),
            detalhe_status = 'ok',
            detalhe_ultima_tentativa = NOW(),
            detalhe_coletado_em = NOW(),
            detalhe_tentativas = detalhe_tentativas + 1
        WHERE id = %s
    """, (campos["modelo"], campos["cor"], campos["carroceria"], campos["tracao"],
          campos["opcionais_json"], campos["descricao"], campos["km_ou_horas"], anuncio_id))
    conn.commit()
    cur.close()


def roda_lote(conn, lote: int, pausa: float) -> dict:
    pendentes = busca_pendentes(conn, lote)
    ok = erros = removidos = 0
    erros_seguidos = 0
    abortado = False

    for i, item in enumerate(pendentes):
        try:
            resp = SESSAO.get(item["url"], timeout=30)
        except requests.RequestException as e:
            print(f"  ! erro de rede no anuncio {item['id']}: {e}")
            registra_tentativa(conn, item["id"], "erro")
            erros += 1
            erros_seguidos += 1
        else:
            if resp.status_code == 404:
                marca_removido(conn, item["id"])
                removidos += 1
                erros_seguidos = 0
            elif not resp.ok:
                print(f"  ! HTTP {resp.status_code} no anuncio {item['id']}")
                registra_tentativa(conn, item["id"], "erro")
                erros += 1
                erros_seguidos += 1
            else:
                campos = parse_detalhe(resp.text)
                if parece_bloqueio_ou_pagina_invalida(resp.text, campos["campos_encontrados"]):
                    print(f"  ! pagina suspeita (bloqueio/challenge?) no anuncio {item['id']}")
                    registra_tentativa(conn, item["id"], "erro")
                    erros += 1
                    erros_seguidos += 1
                else:
                    salva_detalhe(conn, item["id"], campos)
                    ok += 1
                    erros_seguidos = 0

        if erros_seguidos >= MAX_ERROS_SEGUIDOS:
            print(f"ABORTANDO: {erros_seguidos} erros seguidos — suspeita de bloqueio pelo portal.")
            abortado = True
            break

        if i < len(pendentes) - 1:
            time.sleep(pausa)

    return {"ok": ok, "erros": erros, "removidos": removidos, "abortado": abortado}


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--lote", type=int, default=200, help="quantos anuncios processar nesta chamada")
    ap.add_argument("--pausa-requisicoes", type=float,
                     default=float(os.getenv("OPER_RADAR_PAUSA_DETALHE", PAUSA_ENTRE_REQUISICOES)))
    ap.add_argument("--db-host", default=os.getenv("OPER_RADAR_DB_HOST", "localhost"))
    ap.add_argument("--db-user", default=os.getenv("OPER_RADAR_DB_USER"), help="usuário MySQL (ou OPER_RADAR_DB_USER)")
    ap.add_argument("--db-pass", default=os.getenv("OPER_RADAR_DB_PASS"), help="senha MySQL (ou OPER_RADAR_DB_PASS)")
    ap.add_argument("--db-name", default=os.getenv("OPER_RADAR_DB_NAME"), help="banco MySQL (ou OPER_RADAR_DB_NAME)")
    args = ap.parse_args()

    faltando = [nome for nome, valor in {
        "OPER_RADAR_DB_USER/--db-user": args.db_user,
        "OPER_RADAR_DB_PASS/--db-pass": args.db_pass,
        "OPER_RADAR_DB_NAME/--db-name": args.db_name,
    }.items() if not valor]
    if faltando:
        ap.error("credenciais ausentes: " + ", ".join(faltando))
    if args.lote <= 0:
        ap.error("--lote deve ser positivo")
    if args.pausa_requisicoes < 0:
        ap.error("--pausa-requisicoes deve ser zero ou positivo")

    conn = conecta_mysql(args.db_host, args.db_user, args.db_pass, args.db_name)
    try:
        resultado = roda_lote(conn, args.lote, args.pausa_requisicoes)
    finally:
        conn.close()

    print(f"{resultado['ok']} detalhes salvos, {resultado['erros']} erros, "
          f"{resultado['removidos']} removidos (404).")
    if resultado["abortado"]:
        raise SystemExit(2)
