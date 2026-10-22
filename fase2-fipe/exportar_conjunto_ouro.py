"""Exporta (somente leitura) os vinculos manuais e uma amostra de 'alto' para auditoria humana.

Uso: python exportar_conjunto_ouro.py ouro.csv
"""
import csv
import os
import sys

SQL_MANUAL = """
SELECT a.id AS anuncio_id, a.titulo, a.marca, a.ano_final, fp.fipe_modelo_id AS fipe_modelo_id_esperado,
       'manual' AS origem, '' AS auditor_ok
FROM anuncio a JOIN fipe_preco fp ON fp.id = a.fipe_preco_id
WHERE a.status='ativo' AND a.fipe_vinculo_origem='manual'
"""
SQL_ALTO = """
SELECT a.id AS anuncio_id, a.titulo, a.marca, a.ano_final, fp.fipe_modelo_id AS fipe_modelo_id_esperado,
       'alto_amostra' AS origem, '' AS auditor_ok
FROM anuncio a JOIN fipe_preco fp ON fp.id = a.fipe_preco_id
WHERE a.status='ativo' AND a.fipe_match_confianca='alto' AND COALESCE(a.fipe_vinculo_origem,'automatico')='automatico'
ORDER BY RAND(42) LIMIT 150
"""

if __name__ == "__main__":
    import mysql.connector
    conn = mysql.connector.connect(
        host=os.getenv("OPER_RADAR_DB_HOST", "localhost"), user=os.environ["OPER_RADAR_DB_USER"],
        password=os.environ["OPER_RADAR_DB_PASS"], database=os.environ["OPER_RADAR_DB_NAME"], charset="utf8mb4")
    cur = conn.cursor(dictionary=True)
    with open(sys.argv[1], "w", newline="", encoding="utf-8") as f:
        saida = csv.writer(f)
        cabecalho = False
        for sql in (SQL_MANUAL, SQL_ALTO):
            cur.execute(sql)
            for linha in cur.fetchall():
                if not cabecalho:
                    saida.writerow(linha.keys())
                    cabecalho = True
                saida.writerow(linha.values())
    cur.close()
    conn.close()
