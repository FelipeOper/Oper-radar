#!/usr/bin/env python3
"""Reabre com seguranca a auditoria FIPE afetada por ano-modelo e Euro 5/6."""
import argparse
import os

import mysql.connector


def conecta():
    return mysql.connector.connect(
        host=os.getenv("OPER_RADAR_DB_HOST", "localhost"),
        user=os.environ["OPER_RADAR_DB_USER"],
        password=os.environ["OPER_RADAR_DB_PASS"],
        database=os.environ["OPER_RADAR_DB_NAME"],
        charset="utf8mb4",
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--aplicar", action="store_true", help="confirma a marcacao no banco")
    args = parser.parse_args()
    conn = conecta()
    cur = conn.cursor(dictionary=True)
    filtro = """
        status='ativo' AND tipo='Caminhao' AND ano_inicial>=2012
        AND COALESCE(fipe_vinculo_origem, 'automatico') <> 'manual'
    """
    cur.execute(f"""
        SELECT COUNT(*) AS total,
               SUM(fipe_preco_id IS NOT NULL) AS vinculados,
               SUM(ano_final IS NOT NULL AND ano_final<>ano_inicial) AS anos_diferentes
        FROM anuncio WHERE {filtro}
    """)
    resumo = cur.fetchone()
    print(
        f"Elegiveis: {resumo['total']} · com vinculo atual: {resumo['vinculados'] or 0} "
        f"· fabricacao/modelo diferentes: {resumo['anos_diferentes'] or 0}"
    )
    if not args.aplicar:
        print("Simulacao concluida. Rode novamente com --aplicar para abrir a reauditoria.")
        cur.close()
        conn.close()
        return

    cur.execute(f"""
        UPDATE anuncio
        SET fipe_match_status = CASE
                WHEN fipe_preco_id IS NOT NULL THEN 'reprocessar_ano_modelo'
                ELSE fipe_match_status
            END,
            fipe_match_motivo = CASE
                WHEN fipe_preco_id IS NOT NULL THEN 'Reauditoria: fabricacao, modelo e emissoes'
                ELSE fipe_match_motivo
            END,
            fipe_ultima_tentativa = NULL
        WHERE {filtro}
    """)
    alterados = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()
    print(f"Reauditoria aberta: {alterados} anuncios. Vinculos manuais foram preservados.")


if __name__ == "__main__":
    main()
