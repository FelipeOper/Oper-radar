"""Materializa fatos observados a partir de anúncios e snapshots diários.

O padrão é simulação. ``--aplicar`` grava eventos idempotentes. Nenhum evento
recebe o nome "venda": uma saída do portal é somente ``saida_detectada``.
"""
import argparse
import json
import os
import sys
from datetime import date, datetime, timedelta

import mysql.connector


REGRA_VERSAO = "v1"


def configuracao(args):
    valores = {
        "host": args.db_host,
        "user": args.db_user,
        "password": args.db_pass,
        "database": args.db_name,
        "charset": "utf8mb4",
    }
    faltando = [nome for nome, valor in {
        "OPER_RADAR_DB_USER/--db-user": valores["user"],
        "OPER_RADAR_DB_PASS/--db-pass": valores["password"],
        "OPER_RADAR_DB_NAME/--db-name": valores["database"],
    }.items() if not valor]
    if faltando:
        raise ValueError("credenciais ausentes: " + ", ".join(faltando))
    return valores


def tipo_transicao(anterior, novo):
    anterior = str(anterior or "")
    novo = str(novo or "")
    removidos = {"removido_candidato", "removido_confirmado"}
    if anterior == "ativo" and novo == "removido_candidato":
        return "ausencia_detectada"
    if novo == "removido_confirmado" and anterior != "removido_confirmado":
        return "saida_detectada"
    if anterior in removidos and novo == "ativo":
        return "reaparecimento"
    return "mudanca_status"


def contagem_snapshot(cur, dia):
    cur.execute("SELECT COUNT(*) FROM anuncio_snapshot WHERE dia=%s", (dia,))
    return int(cur.fetchone()[0])


def coleta_eventos(cur, dia, proporcao_minima=0.80, incluir_primeira_observacao=True):
    anterior = dia - timedelta(days=1)
    eventos = []

    if incluir_primeira_observacao:
        cur.execute("""
            SELECT a.id, a.primeira_vez_visto
            FROM anuncio a
            LEFT JOIN anuncio_evento e
              ON e.anuncio_id=a.id
             AND e.tipo_evento='primeira_observacao'
             AND e.regra_versao=%s
            WHERE a.primeira_vez_visto IS NOT NULL
              AND DATE(a.primeira_vez_visto) <= %s
              AND e.id IS NULL
        """, (REGRA_VERSAO, dia))
        for anuncio_id, primeira_vez in cur.fetchall():
            ocorrido = primeira_vez if isinstance(primeira_vez, datetime) else datetime.combine(primeira_vez, datetime.min.time())
            eventos.append({
                "anuncio_id": int(anuncio_id),
                "tipo_evento": "primeira_observacao",
                "ocorrido_em": ocorrido,
                "dia_referencia": ocorrido.date(),
                "origem": "anuncio.primeira_vez_visto",
                "evidencia": {"campo": "primeira_vez_visto"},
            })

    atual_total = contagem_snapshot(cur, dia)
    anterior_total = contagem_snapshot(cur, anterior)
    saude = {
        "dia": dia,
        "dia_anterior": anterior,
        "snapshot_atual": atual_total,
        "snapshot_anterior": anterior_total,
        "transicoes_habilitadas": False,
        "motivo_bloqueio": None,
    }
    if atual_total == 0 or anterior_total == 0:
        saude["motivo_bloqueio"] = "snapshot ausente em um dos dias"
        return eventos, saude
    if atual_total / anterior_total < proporcao_minima:
        saude["motivo_bloqueio"] = "volume atual abaixo do limite de seguranca"
        return eventos, saude

    saude["transicoes_habilitadas"] = True
    cur.execute("""
        SELECT atual.anuncio_id,
               anterior.preco_do_dia, atual.preco_do_dia,
               anterior.status_do_dia, atual.status_do_dia
        FROM anuncio_snapshot atual
        JOIN anuncio_snapshot anterior ON anterior.anuncio_id=atual.anuncio_id
        WHERE atual.dia=%s AND anterior.dia=%s
          AND (
            NOT (anterior.preco_do_dia <=> atual.preco_do_dia)
            OR anterior.status_do_dia <> atual.status_do_dia
          )
    """, (dia, anterior))
    for anuncio_id, preco_anterior, preco_novo, status_anterior, status_novo in cur.fetchall():
        if preco_anterior is not None and preco_novo is not None and preco_anterior != preco_novo:
            eventos.append({
                "anuncio_id": int(anuncio_id),
                "tipo_evento": "mudanca_preco",
                "ocorrido_em": datetime.combine(dia, datetime.min.time()),
                "dia_referencia": dia,
                "valor_anterior_decimal": preco_anterior,
                "valor_novo_decimal": preco_novo,
                "origem": "anuncio_snapshot",
                "evidencia": {"snapshot_anterior": str(anterior), "snapshot_atual": str(dia)},
            })
        if status_anterior != status_novo:
            eventos.append({
                "anuncio_id": int(anuncio_id),
                "tipo_evento": tipo_transicao(status_anterior, status_novo),
                "ocorrido_em": datetime.combine(dia, datetime.min.time()),
                "dia_referencia": dia,
                "status_anterior": status_anterior,
                "status_novo": status_novo,
                "origem": "anuncio_snapshot",
                "evidencia": {"snapshot_anterior": str(anterior), "snapshot_atual": str(dia)},
            })
    return eventos, saude


def grava_eventos(cur, eventos):
    inseridos = 0
    sql = """
        INSERT IGNORE INTO anuncio_evento (
            anuncio_id, tipo_evento, ocorrido_em, dia_referencia,
            valor_anterior_decimal, valor_novo_decimal,
            status_anterior, status_novo, evidencia, origem, regra_versao
        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """
    for evento in eventos:
        cur.execute(sql, (
            evento["anuncio_id"], evento["tipo_evento"], evento["ocorrido_em"],
            evento["dia_referencia"], evento.get("valor_anterior_decimal"),
            evento.get("valor_novo_decimal"), evento.get("status_anterior"),
            evento.get("status_novo"), json.dumps(evento.get("evidencia", {}), ensure_ascii=False),
            evento["origem"], REGRA_VERSAO,
        ))
        inseridos += max(0, int(cur.rowcount))
    return inseridos


def executar(conn, dia, aplicar=False, proporcao_minima=0.80, incluir_primeira_observacao=True):
    cur = conn.cursor()
    try:
        eventos, saude = coleta_eventos(cur, dia, proporcao_minima, incluir_primeira_observacao)
        grupos = {}
        for evento in eventos:
            grupos[evento["tipo_evento"]] = grupos.get(evento["tipo_evento"], 0) + 1
        print(f"Saude dos snapshots: {saude}")
        print("Eventos candidatos: " + (", ".join(f"{k}={v}" for k, v in sorted(grupos.items())) or "nenhum"))
        if not aplicar:
            print("Simulacao concluida. Nenhum evento foi gravado.")
            return 0
        inseridos = grava_eventos(cur, eventos)
        conn.commit()
        print(f"Eventos gravados: {inseridos}; repetidos ignorados: {len(eventos) - inseridos}.")
        return inseridos
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()


def dias_processamento(dia=None, inicio=None, fim=None):
    if dia is not None and (inicio is not None or fim is not None):
        raise ValueError("use --dia ou o intervalo --inicio/--fim, não ambos")
    if inicio is None and fim is None:
        return [dia or date.today()]
    if inicio is None or fim is None:
        raise ValueError("--inicio e --fim devem ser informados juntos")
    if fim < inicio:
        raise ValueError("--fim não pode ser anterior a --inicio")
    quantidade = (fim - inicio).days + 1
    if quantidade > 366:
        raise ValueError("o intervalo máximo é de 366 dias")
    return [inicio + timedelta(days=deslocamento) for deslocamento in range(quantidade)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--aplicar", action="store_true")
    ap.add_argument("--dia", type=date.fromisoformat)
    ap.add_argument("--inicio", type=date.fromisoformat)
    ap.add_argument("--fim", type=date.fromisoformat)
    ap.add_argument("--proporcao-minima", type=float, default=0.80)
    ap.add_argument("--db-host", default=os.getenv("OPER_RADAR_DB_HOST", "localhost"))
    ap.add_argument("--db-user", default=os.getenv("OPER_RADAR_DB_USER"))
    ap.add_argument("--db-pass", default=os.getenv("OPER_RADAR_DB_PASS"))
    ap.add_argument("--db-name", default=os.getenv("OPER_RADAR_DB_NAME"))
    args = ap.parse_args()
    if not 0 < args.proporcao_minima <= 1:
        ap.error("--proporcao-minima deve estar entre 0 e 1")
    try:
        config = configuracao(args)
    except ValueError as erro:
        ap.error(str(erro))
    try:
        dias = dias_processamento(args.dia, args.inicio, args.fim)
    except ValueError as erro:
        ap.error(str(erro))
    conn = mysql.connector.connect(**config)
    try:
        total = 0
        for posicao, dia_atual in enumerate(dias):
            print(f"\n=== Eventos de {dia_atual} ===")
            total += executar(
                conn, dia_atual, args.aplicar, args.proporcao_minima,
                incluir_primeira_observacao=(args.aplicar or posicao == 0),
            )
        if len(dias) > 1:
            print(f"Intervalo concluído: {len(dias)} dias; eventos gravados: {total}.")
    except Exception as erro:
        print(f"Falha ao materializar eventos: {erro}", file=sys.stderr)
        return 1
    finally:
        conn.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
