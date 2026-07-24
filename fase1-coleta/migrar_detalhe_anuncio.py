"""
OPER RADAR — Fase 1, extensão
Migração IDEMPOTENTE do schema para a coleta de detalhe do anúncio: pode ser executada
quantas vezes for preciso — cada ADD COLUMN/CREATE INDEX só roda se ainda não existir.
Mesmo espírito de fase4-acesso/migrar_curadoria_anuncio.php, em Python porque esta pasta não
tem tooling PHP. Substitui o antigo migracao_detalhe_anuncio_mysql.sql (que era ALTER TABLE
avulso, sem checagem — falharia com "Duplicate column name" numa segunda execução).

Uso: python migrar_detalhe_anuncio.py --db-host=... --db-user=... --db-pass=... --db-name=...
(ou variáveis de ambiente OPER_RADAR_DB_HOST/USER/PASS/NAME)
"""
import argparse
import os

from scraper_hostgator import conecta_mysql

COLUNAS = {
    "carroceria": "VARCHAR(60) NULL AFTER cor",
    "tracao": "VARCHAR(30) NULL AFTER carroceria",
    "opcionais": "TEXT NULL AFTER tracao",
    "descricao": "TEXT NULL AFTER opcionais",
    "detalhe_status": "VARCHAR(20) NULL AFTER descricao",
    "detalhe_ultima_tentativa": "DATETIME NULL AFTER detalhe_status",
    "detalhe_tentativas": "SMALLINT NOT NULL DEFAULT 0 AFTER detalhe_ultima_tentativa",
    "detalhe_coletado_em": "DATETIME NULL AFTER detalhe_tentativas",
}

INDICE_NOME = "idx_anuncio_detalhe_fila"
INDICE_DEFINICAO = "(detalhe_coletado_em, detalhe_ultima_tentativa, status)"


def coluna_existe(conn, coluna: str) -> bool:
    cur = conn.cursor()
    cur.execute("SHOW COLUMNS FROM anuncio LIKE %s", (coluna,))
    existe = cur.fetchone() is not None
    cur.close()
    return existe


def indice_existe(conn, nome_indice: str) -> bool:
    cur = conn.cursor()
    cur.execute("SHOW INDEX FROM anuncio WHERE Key_name = %s", (nome_indice,))
    existe = cur.fetchone() is not None
    cur.close()
    return existe


def migrar(conn) -> None:
    for coluna, definicao in COLUNAS.items():
        if coluna_existe(conn, coluna):
            print(f"coluna {coluna}: OK (ja existe)")
            continue
        cur = conn.cursor()
        cur.execute(f"ALTER TABLE anuncio ADD COLUMN {coluna} {definicao}")
        conn.commit()
        cur.close()
        print(f"coluna {coluna}: criada")

    if indice_existe(conn, INDICE_NOME):
        print(f"indice {INDICE_NOME}: OK (ja existe)")
    else:
        cur = conn.cursor()
        cur.execute(f"CREATE INDEX {INDICE_NOME} ON anuncio {INDICE_DEFINICAO}")
        conn.commit()
        cur.close()
        print(f"indice {INDICE_NOME}: criado")

    print("Migracao de detalhe do anuncio: banco preparado.")


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

    conn = conecta_mysql(args.db_host, args.db_user, args.db_pass, args.db_name)
    try:
        migrar(conn)
    finally:
        conn.close()
