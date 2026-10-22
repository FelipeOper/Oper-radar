"""Migra de forma idempotente as tabelas do vinculo por assinatura (padrao de migrar_fipe_mensal.py)."""
import argparse
import os

import mysql.connector


def existe_tabela(conn, tabela):
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM information_schema.TABLES "
                "WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=%s", (tabela,))
    existe = cur.fetchone()[0] > 0
    cur.close()
    return existe


TABELA_ATRIBUTO = """
CREATE TABLE fipe_modelo_atributo (
    fipe_modelo_id INT NOT NULL PRIMARY KEY,
    marca_fipe     VARCHAR(80) NOT NULL,
    familia        VARCHAR(40) NULL,
    numero         VARCHAR(16) NULL,
    serie          VARCHAR(8)  NULL,
    geracao        VARCHAR(12) NULL,
    eixo           VARCHAR(4)  NULL,
    emissao        VARCHAR(2)  NULL,
    cabine         VARCHAR(24) NULL,
    cambio         VARCHAR(24) NULL,
    KEY idx_fma_grupo (marca_fipe, familia, numero),
    CONSTRAINT fk_fma_modelo FOREIGN KEY (fipe_modelo_id) REFERENCES fipe_modelo(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
"""


def migrar(conn):
    if not existe_tabela(conn, "fipe_modelo_atributo"):
        cur = conn.cursor()
        cur.execute(TABELA_ATRIBUTO)
        cur.close()
        print("Tabela fipe_modelo_atributo: criada")
    else:
        print("Tabela fipe_modelo_atributo: ja existe")
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
    conn = mysql.connector.connect(host=args.db_host, user=args.db_user, password=args.db_pass,
                                   database=args.db_name, charset="utf8mb4")
    try:
        migrar(conn)
        print("Migracao FIPE assinatura: OK")
    finally:
        conn.close()
