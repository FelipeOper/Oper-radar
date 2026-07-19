"""
OPER RADAR — Fase 3: snapshot diário
Materializa o estado da tabela `anuncio` em `anuncio_snapshot` (uma linha por anúncio × dia)
e detecta mudanças de preço vs. dia anterior.

Rodar 1×/dia após o último ciclo do scraper. Sugestão de cron (23h):
  0 23 * * * set -a; . /home1/pro93061/.oper-radar.env; set +a; cd /home1/pro93061/agenciaoper.com.br/oper-radar/fase3-series && python3 snapshot_diario.py >> snapshot.log 2>&1
"""
import argparse
import os
from datetime import date, timedelta
import mysql.connector


def roda(conn):
    hoje = date.today()
    ontem = hoje - timedelta(days=1)
    cur = conn.cursor()

    # 1) Materializa snapshot do dia
    cur.execute("""
        INSERT INTO anuncio_snapshot (anuncio_id, dia, preco_do_dia, status_do_dia, dias_no_ar)
        SELECT id, %s, preco, status, DATEDIFF(%s, primeira_vez_visto)
        FROM anuncio
        ON DUPLICATE KEY UPDATE
            preco_do_dia = VALUES(preco_do_dia),
            status_do_dia = VALUES(status_do_dia),
            dias_no_ar = VALUES(dias_no_ar)
    """, (hoje, hoje))
    print(f"Snapshot de {hoje}: {cur.rowcount} linhas materializadas.")

    # 2) Detecta mudanças de preço (mesmo anúncio, preço diferente vs. ontem)
    cur.execute("""
        INSERT INTO mudanca_preco (anuncio_id, preco_anterior, preco_novo, variacao_pct, dias_ate_mudanca)
        SELECT h.anuncio_id, h.preco_do_dia, s.preco_do_dia,
               ROUND((s.preco_do_dia - h.preco_do_dia) / h.preco_do_dia * 100, 2),
               s.dias_no_ar
        FROM anuncio_snapshot h
        JOIN anuncio_snapshot s ON s.anuncio_id = h.anuncio_id AND s.dia = %s
        WHERE h.dia = %s
          AND h.preco_do_dia IS NOT NULL AND s.preco_do_dia IS NOT NULL
          AND h.preco_do_dia <> s.preco_do_dia
          AND NOT EXISTS (
              SELECT 1 FROM mudanca_preco mp
              WHERE mp.anuncio_id = h.anuncio_id
                AND DATE(mp.detectada_em) = %s
          )
    """, (hoje, ontem, hoje))
    print(f"Mudanças de preço detectadas hoje: {cur.rowcount}.")

    conn.commit()
    cur.close()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--db-host", default=os.getenv("OPER_RADAR_DB_HOST", "localhost"))
    ap.add_argument("--db-user", default=os.getenv("OPER_RADAR_DB_USER"))
    ap.add_argument("--db-pass", default=os.getenv("OPER_RADAR_DB_PASS"))
    ap.add_argument("--db-name", default=os.getenv("OPER_RADAR_DB_NAME"))
    args = ap.parse_args()

    faltando = [nome for nome, valor in {
        "OPER_RADAR_DB_USER/--db-user": args.db_user,
        "OPER_RADAR_DB_PASS/--db-pass": args.db_pass,
        "OPER_RADAR_DB_NAME/--db-name": args.db_name,
    }.items() if not valor]
    if faltando:
        ap.error("credenciais ausentes: " + ", ".join(faltando))

    conn = mysql.connector.connect(host=args.db_host, user=args.db_user,
                                   password=args.db_pass, database=args.db_name, charset="utf8mb4")
    try:
        roda(conn)
    finally:
        conn.close()
