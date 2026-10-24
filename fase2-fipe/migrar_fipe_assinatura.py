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


def existe_coluna(conn, tabela, coluna):
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM information_schema.COLUMNS "
                "WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=%s AND COLUMN_NAME=%s", (tabela, coluna))
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


TABELA_ASSINATURA = """
CREATE TABLE fipe_assinatura (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    hash_assinatura     CHAR(40) NOT NULL,
    marca               VARCHAR(40) NOT NULL,
    familia             VARCHAR(40) NOT NULL,
    numero              VARCHAR(16) NOT NULL,
    ano_modelo          SMALLINT NOT NULL,
    dims_discriminantes VARCHAR(80) NOT NULL,
    valores             VARCHAR(200) NOT NULL,
    fipe_preco_id       INT NOT NULL,
    origem              VARCHAR(12) NOT NULL,
    status              VARCHAR(12) NOT NULL DEFAULT 'ativa',
    evidencias          INT NOT NULL DEFAULT 1,
    criado_em           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_assinatura_hash (hash_assinatura),
    KEY idx_assinatura_preco (fipe_preco_id),
    CONSTRAINT fk_assinatura_preco FOREIGN KEY (fipe_preco_id) REFERENCES fipe_preco(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
"""

TABELA_AUDITORIA = """
CREATE TABLE fipe_auditoria (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    anuncio_id    INT NOT NULL,
    fipe_preco_id INT NOT NULL,
    veredito      VARCHAR(10) NOT NULL,
    observacao    VARCHAR(300) NULL,
    usuario_id    INT NULL,
    criado_em     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_auditoria (anuncio_id, fipe_preco_id),
    KEY idx_auditoria_preco (fipe_preco_id, veredito),
    CONSTRAINT fk_auditoria_anuncio FOREIGN KEY (anuncio_id) REFERENCES anuncio(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
"""

COLUNAS_ANUNCIO = (
    ("fipe_assinatura_id", "INT NULL"),
    ("fipe_regra_versao", "SMALLINT NOT NULL DEFAULT 0"),
    ("conjunto", "TINYINT NULL"),
    ("conjunto_origem", "VARCHAR(12) NULL"),
)


def migrar(conn):
    if not existe_tabela(conn, "fipe_modelo_atributo"):
        cur = conn.cursor()
        cur.execute(TABELA_ATRIBUTO)
        cur.close()
        print("Tabela fipe_modelo_atributo: criada")
    else:
        print("Tabela fipe_modelo_atributo: ja existe")

    if not existe_tabela(conn, "fipe_assinatura"):
        cur = conn.cursor()
        cur.execute(TABELA_ASSINATURA)
        cur.close()
        print("Tabela fipe_assinatura: criada")
    else:
        print("Tabela fipe_assinatura: ja existe")

    if not existe_tabela(conn, "fipe_auditoria"):
        cur = conn.cursor()
        cur.execute(TABELA_AUDITORIA)
        cur.close()
        print("Tabela fipe_auditoria: criada")
    else:
        print("Tabela fipe_auditoria: ja existe")

    for nome, definicao in COLUNAS_ANUNCIO:
        if not existe_coluna(conn, "anuncio", nome):
            cur = conn.cursor()
            cur.execute(f"ALTER TABLE anuncio ADD COLUMN {nome} {definicao}")
            cur.close()
            print(f"Coluna anuncio.{nome}: criada")
        else:
            print(f"Coluna anuncio.{nome}: ja existe")
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
