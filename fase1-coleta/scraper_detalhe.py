"""
OPER RADAR — Fase 1, extensão
Visita a página INDIVIDUAL de cada anúncio de caminhão (uma vez por anúncio) para coletar
Cor, Modelo, Carroceria, Tração, Quilometragem, Opcionais e Descrição — dados que só existem
lá, não na página de listagem lida por scraper_hostgator.py.

A mesma fila (`detalhe_coletado_em IS NULL`) serve tanto o backfill dos anúncios já existentes
quanto o fluxo contínuo dos anúncios novos: não há distinção de "modo" no código, só de volume
de lote e frequência de execução (ver crontab-hostgator-detalhe.example).

"0 detalhes salvos" sozinho NÃO significa fila drenada — pode ser fila vazia de verdade, mas
também erro de parser, bloqueio/rate-limit (403/429) ou mudança no HTML do portal. Por isso o
resultado final sempre reporta `pendentes_encontrados` separado de `ok`, e cada tipo de falha
tem contador próprio (ver `roda_lote`).

Uso: python scraper_detalhe.py --lote 200 --pausa-requisicoes 4.0
"""
import argparse
import os
import time
from typing import Optional

import requests

from scraper_hostgator import cria_sessao, conecta_mysql
from parser_detalhe import (
    parse_detalhe, contem_marcador_de_bloqueio, pagina_sem_campos_esperados,
    pagina_vendida,
)

PAUSA_ENTRE_REQUISICOES = 4.0
MAX_ERROS_SEGUIDOS = 5
STATUS_HTTP_BLOQUEIO = (403, 429)

SESSAO = cria_sessao()


def busca_pendentes(conn, lote: int, priorizar_status: Optional[str] = None) -> list[dict]:
    cur = conn.cursor(dictionary=True)
    condicao_prioritaria = "detalhe_status = %s OR" if priorizar_status else ""
    ordem_prioritaria = "(detalhe_status = %s) DESC," if priorizar_status else ""
    sql = f"""
        SELECT id, url FROM anuncio
        WHERE detalhe_coletado_em IS NULL
          AND tipo = 'Caminhao'
          AND status = 'ativo'
          AND (
              {condicao_prioritaria}
              detalhe_ultima_tentativa IS NULL
              -- Backoff progressivo (1, 2, 4, 8... dias, teto 14): cada falha nova dobra a
              -- espera, em vez de um intervalo fixo — erros persistentes esfriam sozinhos
              -- sem precisar de outra fila ou coluna de estado.
              OR (detalhe_status IN ('erro_rede', 'erro_http', 'pagina_inesperada')
                  AND detalhe_ultima_tentativa <= DATE_SUB(NOW(), INTERVAL
                      LEAST(POW(2, GREATEST(detalhe_tentativas - 1, 0)), 14) DAY))
              -- Bloqueio confirmado começa mais cauteloso (3, 6, 12, 24 dias, teto 30).
              OR (detalhe_status = 'bloqueio_confirmado'
                  AND detalhe_ultima_tentativa <= DATE_SUB(NOW(), INTERVAL
                      LEAST(POW(2, GREATEST(detalhe_tentativas - 1, 0)) * 3, 30) DAY))
          )
        ORDER BY {ordem_prioritaria} detalhe_ultima_tentativa IS NULL DESC, id
        LIMIT %s
    """
    params = (priorizar_status, priorizar_status, lote) if priorizar_status else (lote,)
    cur.execute(sql, params)
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


def marca_indisponivel(conn, anuncio_id: int, detalhe_status: str) -> None:
    """Fecha o detalhe e retira do ativo quando o próprio portal confirma indisponibilidade."""
    cur = conn.cursor()
    cur.execute("""
        UPDATE anuncio SET
            detalhe_status = %s,
            detalhe_ultima_tentativa = NOW(),
            detalhe_coletado_em = NOW(),
            detalhe_tentativas = detalhe_tentativas + 1,
            status = 'removido_confirmado',
            misses_consecutivos = GREATEST(misses_consecutivos, 2),
            data_remocao = COALESCE(data_remocao, NOW())
        WHERE id = %s
    """, (detalhe_status, anuncio_id))
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


def roda_lote(conn, lote: int, pausa: float, priorizar_status: Optional[str] = None) -> dict:
    pendentes = busca_pendentes(conn, lote, priorizar_status=priorizar_status)
    contagem = {"ok": 0, "removidos": 0, "erro_rede": 0, "erro_http": 0,
                "vendidos_portal": 0, "bloqueio_confirmado": 0, "pagina_inesperada": 0}
    erros_seguidos = 0
    abortado = False
    motivo_abortado = None

    for i, item in enumerate(pendentes):
        try:
            resp = SESSAO.get(item["url"], timeout=30)
        except requests.RequestException as e:
            print(f"  ! erro de rede no anuncio {item['id']}: {e}")
            registra_tentativa(conn, item["id"], "erro_rede")
            contagem["erro_rede"] += 1
            erros_seguidos += 1
        else:
            if resp.status_code == 404:
                marca_indisponivel(conn, item["id"], "removido_404")
                contagem["removidos"] += 1
                erros_seguidos = 0
            elif resp.status_code in STATUS_HTTP_BLOQUEIO:
                print(f"  ! HTTP {resp.status_code} no anuncio {item['id']} — "
                      f"sinal explicito de bloqueio/rate-limit, abortando imediatamente.")
                registra_tentativa(conn, item["id"], "bloqueio_confirmado")
                contagem["bloqueio_confirmado"] += 1
                abortado = True
                motivo_abortado = f"HTTP {resp.status_code} (bloqueio/rate-limit explicito do portal)"
                break
            elif not resp.ok:
                print(f"  ! HTTP {resp.status_code} no anuncio {item['id']}")
                registra_tentativa(conn, item["id"], "erro_http")
                contagem["erro_http"] += 1
                erros_seguidos += 1
            else:
                if pagina_vendida(resp.text):
                    print(f"  - anuncio {item['id']} marcado pelo portal como vendido.")
                    marca_indisponivel(conn, item["id"], "vendido_portal")
                    contagem["vendidos_portal"] += 1
                    erros_seguidos = 0
                elif contem_marcador_de_bloqueio(resp.text):
                    print(f"  ! bloqueio confirmado (marcador textual) no anuncio {item['id']} — "
                          f"abortando imediatamente.")
                    registra_tentativa(conn, item["id"], "bloqueio_confirmado")
                    contagem["bloqueio_confirmado"] += 1
                    abortado = True
                    motivo_abortado = "marcador textual de bloqueio/challenge encontrado na pagina"
                    break
                else:
                    campos = parse_detalhe(resp.text)
                    if pagina_sem_campos_esperados(resp.text, campos["campos_encontrados"]):
                        print(f"  ! pagina inesperada no anuncio {item['id']} — sem os campos "
                              f"esperados; pode ser bloqueio sem marcador OU o portal mudou o HTML.")
                        registra_tentativa(conn, item["id"], "pagina_inesperada")
                        contagem["pagina_inesperada"] += 1
                        erros_seguidos += 1
                    else:
                        salva_detalhe(conn, item["id"], campos)
                        contagem["ok"] += 1
                        erros_seguidos = 0

        if erros_seguidos >= MAX_ERROS_SEGUIDOS:
            print(f"ABORTANDO: {erros_seguidos} erros seguidos — suspeita de bloqueio pelo portal "
                  f"ou mudanca estrutural no HTML.")
            abortado = True
            motivo_abortado = f"{erros_seguidos} erros seguidos"
            break

        if i < len(pendentes) - 1:
            time.sleep(pausa)

    return {
        "pendentes_encontrados": len(pendentes),
        **contagem,
        "abortado": abortado,
        "motivo_abortado": motivo_abortado,
    }


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--lote", type=int, default=200, help="quantos anuncios processar nesta chamada")
    ap.add_argument("--pausa-requisicoes", type=float,
                     default=float(os.getenv("OPER_RADAR_PAUSA_DETALHE", PAUSA_ENTRE_REQUISICOES)))
    ap.add_argument("--priorizar-status", choices=("pagina_inesperada",),
                    help="reprocessa primeiro falhas desse status, ignorando o backoff uma vez")
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
        r = roda_lote(conn, args.lote, args.pausa_requisicoes, args.priorizar_status)
    finally:
        conn.close()

    if r["pendentes_encontrados"] == 0:
        print("FILA VAZIA: nenhum anuncio pendente encontrado (backfill drenado ou nada novo ainda).")
    else:
        print(f"{r['pendentes_encontrados']} pendentes encontrados — "
              f"{r['ok']} salvos, {r['removidos']} removidos (404), "
              f"{r['vendidos_portal']} vendidos informados pelo portal, "
              f"{r['erro_rede']} erro de rede, {r['erro_http']} erro HTTP, "
              f"{r['bloqueio_confirmado']} bloqueio confirmado, "
              f"{r['pagina_inesperada']} pagina inesperada.")

    if r["abortado"]:
        print(f"ABORTADO: {r['motivo_abortado']}")
        raise SystemExit(2)
