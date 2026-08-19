"""Prepara a trilha de eventos observados sem alterar dados no modo padrão.

Use ``--aplicar`` somente após backup e revisão da simulação. A migração é
idempotente e mantém as colunas antigas para compatibilidade.
"""
import argparse
import os
import sys

import mysql.connector


TABELA_EVENTOS = """
    CREATE TABLE IF NOT EXISTS anuncio_evento (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        anuncio_id INT NOT NULL,
        tipo_evento VARCHAR(40) NOT NULL,
        ocorrido_em DATETIME NOT NULL,
        dia_referencia DATE NOT NULL,
        valor_anterior_decimal DECIMAL(12,2),
        valor_novo_decimal DECIMAL(12,2),
        status_anterior VARCHAR(30),
        status_novo VARCHAR(30),
        evidencia TEXT,
        origem VARCHAR(30) NOT NULL DEFAULT 'snapshot_diario',
        regra_versao VARCHAR(20) NOT NULL DEFAULT 'v1',
        criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_evento_regra
            (anuncio_id, tipo_evento, dia_referencia, regra_versao),
        KEY idx_evento_dia_tipo (dia_referencia, tipo_evento),
        KEY idx_evento_anuncio (anuncio_id, ocorrido_em),
        CONSTRAINT fk_evento_anuncio
            FOREIGN KEY (anuncio_id) REFERENCES anuncio(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
"""

COLUNAS_SEMANTICAS = {
    "anuncio_snapshot": {
        "dias_observados": "SMALLINT NULL",
    },
    "consolidacao_mensal": {
        "saidas_detectadas": "INT NOT NULL DEFAULT 0",
        "idade_media_observada_dias": "DECIMAL(6,1) NULL",
        "taxa_saida_observada": "DECIMAL(6,3) NULL",
    },
}


def configuracao(args):
    valores = {
        "host": args.db_host,
        "user": args.db_user,
        "password": args.db_pass,
        "database": args.db_name,
        "charset": "utf8mb4",
    }
    faltando = [
        nome for nome, valor in {
            "OPER_RADAR_DB_USER/--db-user": valores["user"],
            "OPER_RADAR_DB_PASS/--db-pass": valores["password"],
            "OPER_RADAR_DB_NAME/--db-name": valores["database"],
        }.items() if not valor
    ]
    if faltando:
        raise ValueError("credenciais ausentes: " + ", ".join(faltando))
    return valores


def tabela_existe(cur, tabela):
    cur.execute("""
        SELECT COUNT(*) FROM information_schema.TABLES
        WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=%s
    """, (tabela,))
    return int(cur.fetchone()[0]) > 0


def colunas(cur, tabela):
    cur.execute("""
        SELECT COLUMN_NAME FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=%s
    """, (tabela,))
    return {linha[0] for linha in cur.fetchall()}


def executar(conn, aplicar=False):
    cur = conn.cursor()
    try:
        evento_existe = tabela_existe(cur, "anuncio_evento")
        print(f"anuncio_evento: {'existente' if evento_existe else 'a criar'}")

        alteracoes = []
        for tabela, esperadas in COLUNAS_SEMANTICAS.items():
            if not tabela_existe(cur, tabela):
                print(f"{tabela}: ausente; execute primeiro migrar_series.py --aplicar")
                continue
            atuais = colunas(cur, tabela)
            for nome, definicao in esperadas.items():
                estado = "existente" if nome in atuais else "a adicionar"
                print(f"{tabela}.{nome}: {estado}")
                if nome not in atuais:
                    alteracoes.append((tabela, nome, definicao))

        if not aplicar:
            print("Simulacao concluida. Nenhuma alteracao foi feita.")
            return

        cur.execute(TABELA_EVENTOS)
        for tabela, nome, definicao in alteracoes:
            cur.execute(f"ALTER TABLE `{tabela}` ADD COLUMN `{nome}` {definicao}")

        if tabela_existe(cur, "anuncio_snapshot") and "dias_observados" in colunas(cur, "anuncio_snapshot"):
            cur.execute("""
                UPDATE anuncio_snapshot
                SET dias_observados=dias_no_ar
                WHERE dias_observados IS NULL AND dias_no_ar IS NOT NULL
            """)

        esperadas_evento = {
            "id", "anuncio_id", "tipo_evento", "ocorrido_em", "dia_referencia",
            "evidencia", "origem", "regra_versao", "criado_em",
        }
        faltando = esperadas_evento - colunas(cur, "anuncio_evento")
        if faltando:
            raise RuntimeError("anuncio_evento incompleta: " + ", ".join(sorted(faltando)))
        conn.commit()
        print("Eventos observados: banco preparado com sucesso.")
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--aplicar", action="store_true")
    ap.add_argument("--db-host", default=os.getenv("OPER_RADAR_DB_HOST", "localhost"))
    ap.add_argument("--db-user", default=os.getenv("OPER_RADAR_DB_USER"))
    ap.add_argument("--db-pass", default=os.getenv("OPER_RADAR_DB_PASS"))
    ap.add_argument("--db-name", default=os.getenv("OPER_RADAR_DB_NAME"))
    args = ap.parse_args()
    try:
        config = configuracao(args)
    except ValueError as erro:
        ap.error(str(erro))
    conn = mysql.connector.connect(**config)
    try:
        executar(conn, args.aplicar)
    except Exception as erro:
        print(f"Falha ao preparar eventos: {erro}", file=sys.stderr)
        return 1
    finally:
        conn.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
