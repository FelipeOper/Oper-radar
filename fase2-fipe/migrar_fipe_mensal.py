"""Migra de forma idempotente o cache FIPE para controlar a referencia mensal."""
import argparse
import os

import mysql.connector


def existe_coluna(conn, tabela, coluna):
    cur = conn.cursor()
    cur.execute("""
        SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=%s AND COLUMN_NAME=%s
    """, (tabela, coluna))
    existe = cur.fetchone()[0] > 0
    cur.close()
    return existe


def existe_indice(conn, tabela, indice):
    cur = conn.cursor()
    cur.execute("""
        SELECT COUNT(*) FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=%s AND INDEX_NAME=%s
    """, (tabela, indice))
    existe = cur.fetchone()[0] > 0
    cur.close()
    return existe


def migrar(conn):
    if not existe_coluna(conn, "fipe_preco", "referencia_codigo"):
        cur = conn.cursor()
        cur.execute("ALTER TABLE fipe_preco ADD COLUMN referencia_codigo INT NULL AFTER mes_referencia")
        cur.close()
        print("Coluna referencia_codigo: criada")
    else:
        print("Coluna referencia_codigo: ja existe")

    if not existe_indice(conn, "fipe_preco", "idx_fipe_preco_referencia"):
        cur = conn.cursor()
        cur.execute("CREATE INDEX idx_fipe_preco_referencia ON fipe_preco (referencia_codigo, atualizado_em)")
        cur.close()
        print("Indice idx_fipe_preco_referencia: criado")
    else:
        print("Indice idx_fipe_preco_referencia: ja existe")
    conn.commit()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--db-host", default=os.getenv("OPER_RADAR_DB_HOST", "localhost"))
    ap.add_argument("--db-user", default=os.getenv("OPER_RADAR_DB_USER"))
    ap.add_argument("--db-pass", default=os.getenv("OPER_RADAR_DB_PASS"))
    ap.add_argument("--db-name", default=os.getenv("OPER_RADAR_DB_NAME"))
    args = ap.parse_args()
    if not all((args.db_user, args.db_pass, args.db_name)):
        ap.error("credenciais OPER_RADAR_DB_* ausentes")

    conn = mysql.connector.connect(
        host=args.db_host, user=args.db_user, password=args.db_pass,
        database=args.db_name, charset="utf8mb4",
    )
    try:
        migrar(conn)
        print("Migracao FIPE mensal: OK")
    finally:
        conn.close()
