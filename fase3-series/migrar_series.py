"""
Prepara de forma idempotente as tabelas da Fase 3.

Por segurança, o modo padrão apenas inspeciona e mostra o que seria criado.
Use --aplicar somente depois de confirmar backup e janela de implantação.
"""
import argparse
import os
import sys

import mysql.connector


TABELAS = {
    "anuncio_snapshot": """
        CREATE TABLE IF NOT EXISTS anuncio_snapshot (
            id INT AUTO_INCREMENT PRIMARY KEY,
            anuncio_id INT NOT NULL,
            dia DATE NOT NULL,
            preco_do_dia DECIMAL(12,2),
            status_do_dia VARCHAR(20) NOT NULL,
            dias_no_ar SMALLINT,
            UNIQUE KEY uq_snapshot (anuncio_id, dia),
            KEY idx_snapshot_dia (dia),
            CONSTRAINT fk_snap_anuncio
                FOREIGN KEY (anuncio_id) REFERENCES anuncio(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """,
    "mudanca_preco": """
        CREATE TABLE IF NOT EXISTS mudanca_preco (
            id INT AUTO_INCREMENT PRIMARY KEY,
            anuncio_id INT NOT NULL,
            detectada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            preco_anterior DECIMAL(12,2) NOT NULL,
            preco_novo DECIMAL(12,2) NOT NULL,
            variacao_pct DECIMAL(6,2) NOT NULL,
            dias_ate_mudanca SMALLINT,
            KEY idx_mp_data (detectada_em),
            KEY idx_mp_anuncio (anuncio_id),
            CONSTRAINT fk_mp_anuncio
                FOREIGN KEY (anuncio_id) REFERENCES anuncio(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """,
    "consolidacao_mensal": """
        CREATE TABLE IF NOT EXISTS consolidacao_mensal (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ano_mes CHAR(7) NOT NULL,
            tipo VARCHAR(60),
            marca VARCHAR(80),
            uf CHAR(2),
            anuncios_ativos_media DECIMAL(8,1),
            vendas_confirmadas INT NOT NULL DEFAULT 0,
            aging_medio_dias DECIMAL(6,1),
            preco_medio DECIMAL(12,2),
            preco_mediana DECIMAL(12,2),
            taxa_giro DECIMAL(6,3),
            atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_consol (ano_mes, tipo, marca, uf)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """,
}

COLUNAS_ESPERADAS = {
    "anuncio_snapshot": {
        "id", "anuncio_id", "dia", "preco_do_dia", "status_do_dia", "dias_no_ar",
    },
    "mudanca_preco": {
        "id", "anuncio_id", "detectada_em", "preco_anterior", "preco_novo",
        "variacao_pct", "dias_ate_mudanca",
    },
    "consolidacao_mensal": {
        "id", "ano_mes", "tipo", "marca", "uf", "anuncios_ativos_media",
        "vendas_confirmadas", "aging_medio_dias", "preco_medio", "preco_mediana",
        "taxa_giro", "atualizado_em",
    },
}

INDICES_ESPERADOS = {
    "anuncio_snapshot": {"PRIMARY", "uq_snapshot", "idx_snapshot_dia"},
    "mudanca_preco": {"PRIMARY", "idx_mp_data", "idx_mp_anuncio"},
    "consolidacao_mensal": {"PRIMARY", "uq_consol"},
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


def tabelas_existentes(cur):
    cur.execute("""
        SELECT TABLE_NAME
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME IN (%s, %s, %s)
    """, tuple(TABELAS))
    return {linha[0] for linha in cur.fetchall()}


def valida_estrutura(cur, tabela):
    cur.execute("""
        SELECT COLUMN_NAME
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s
    """, (tabela,))
    colunas = {linha[0] for linha in cur.fetchall()}
    faltando = COLUNAS_ESPERADAS[tabela] - colunas
    if faltando:
        raise RuntimeError(
            f"{tabela}: estrutura parcial; colunas ausentes: {', '.join(sorted(faltando))}"
        )

    cur.execute("""
        SELECT DISTINCT INDEX_NAME
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s
    """, (tabela,))
    indices = {linha[0] for linha in cur.fetchall()}
    faltando = INDICES_ESPERADOS[tabela] - indices
    if faltando:
        raise RuntimeError(
            f"{tabela}: estrutura parcial; indices ausentes: {', '.join(sorted(faltando))}"
        )


def executar(conn, aplicar):
    cur = conn.cursor()
    try:
        existentes = tabelas_existentes(cur)
        for tabela in TABELAS:
            estado = "existente" if tabela in existentes else "a criar"
            print(f"{tabela}: {estado}")

        if not aplicar:
            print("Simulacao concluida. Nenhuma alteracao foi feita.")
            return

        for tabela, sql in TABELAS.items():
            cur.execute(sql)
            valida_estrutura(cur, tabela)
            print(f"{tabela}: estrutura validada")
        conn.commit()
        print("Fase 3: banco preparado com sucesso.")
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
        print(f"Falha ao preparar Fase 3: {erro}", file=sys.stderr)
        return 1
    finally:
        conn.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
