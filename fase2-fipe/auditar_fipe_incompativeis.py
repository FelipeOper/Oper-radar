"""Reabre vinculos FIPE automaticos que violam as regras atuais.

O modo padrao e somente leitura. Com --aplicar, o vinculo anterior permanece visivel ate
o fipe_sync local reprocessar o anuncio; vinculos manuais nunca sao alterados.
"""
import argparse
import os

import mysql.connector

from fipe_sync import avalia, texto_anuncio


def encontra_incompativeis(conn):
    cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT a.id, a.titulo, a.url, a.marca, a.modelo, a.tracao,
               a.ano_inicial, a.ano_final, fm.modelo_fipe
        FROM anuncio a
        JOIN fipe_preco fp ON fp.id = a.fipe_preco_id
        JOIN fipe_modelo fm ON fm.id = fp.fipe_modelo_id
        WHERE a.status='ativo'
          AND COALESCE(a.fipe_vinculo_origem, 'automatico') <> 'manual'
        ORDER BY a.id
    """)
    anuncios = cur.fetchall()
    cur.close()
    resultado = []
    for anuncio in anuncios:
        score, motivo = avalia(texto_anuncio(anuncio), anuncio["modelo_fipe"])
        if score == 0:
            resultado.append((anuncio, motivo))
    return resultado


def executa(conn, aplicar=False):
    incompativeis = encontra_incompativeis(conn)
    for anuncio, motivo in incompativeis:
        print(f"#{anuncio['id']} {anuncio['titulo']} -> {anuncio['modelo_fipe']} [{motivo}]")
    if aplicar and incompativeis:
        cur = conn.cursor()
        for anuncio, motivo in incompativeis:
            cur.execute("""
                UPDATE anuncio
                SET fipe_match_status='reprocessar_regra_familia',
                    fipe_match_status_automatico='reprocessar_regra_familia',
                    fipe_match_motivo=%s,
                    fipe_match_motivo_automatico=%s,
                    fipe_ultima_tentativa=NULL
                WHERE id=%s
                  AND COALESCE(fipe_vinculo_origem, 'automatico') <> 'manual'
            """, (motivo[:160], motivo[:160], anuncio["id"]))
        conn.commit()
        cur.close()
    modo = "reabertos" if aplicar else "encontrados (dry-run)"
    print(f"FIPE: {len(incompativeis)} vinculos automaticos incompativeis {modo}.")
    return len(incompativeis)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--aplicar", action="store_true")
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
    conexao = mysql.connector.connect(
        host=args.db_host, user=args.db_user, password=args.db_pass,
        database=args.db_name, charset="utf8mb4",
    )
    try:
        executa(conexao, aplicar=args.aplicar)
    finally:
        conexao.close()
