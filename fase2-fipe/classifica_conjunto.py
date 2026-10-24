"""Preenche anuncio.conjunto (1 = cavalo + carreta vendidos juntos) pelos sinais do titulo e da URL.

Por padrao so toca anuncios ainda sem decisao. Com --reclassificar refaz os automaticos (quando a
regra de conjunto.py mudar). Decisao MANUAL (feita na tela de auditoria) nunca e alterada aqui.

Uso (cron, a cada 30 min, com flock): python classifica_conjunto.py [--reclassificar] [--lote 2000]
"""
import argparse
import os

from conjunto import detecta_conjunto

SQL_ALVOS = {
    "novos": """SELECT id, titulo, url FROM anuncio
                WHERE tipo = 'Caminhao' AND status = 'ativo' AND conjunto IS NULL
                ORDER BY id LIMIT %s""",
    "automaticos": """SELECT id, titulo, url FROM anuncio
                WHERE tipo = 'Caminhao' AND status = 'ativo'
                  AND (conjunto_origem IS NULL OR conjunto_origem <> 'manual')
                ORDER BY id LIMIT %s""",
}


def planeja_atualizacoes(linhas):
    return [(linha["id"], 1 if detecta_conjunto(linha.get("titulo"), linha.get("url")) else 0) for linha in linhas]


def roda(conn, lote=2000, reclassificar=False):
    cur = conn.cursor(dictionary=True)
    cur.execute(SQL_ALVOS["automaticos" if reclassificar else "novos"], (lote,))
    linhas = cur.fetchall()
    cur.close()
    atualizacoes = planeja_atualizacoes(linhas)
    gravar = conn.cursor()
    for anuncio_id, valor in atualizacoes:
        gravar.execute(
            "UPDATE anuncio SET conjunto = %s, conjunto_origem = 'automatico' "
            "WHERE id = %s AND (conjunto_origem IS NULL OR conjunto_origem <> 'manual')",
            (valor, anuncio_id))
    conn.commit()
    gravar.close()
    return {"avaliados": len(atualizacoes), "conjuntos": sum(v for _, v in atualizacoes)}


if __name__ == "__main__":
    import mysql.connector
    ap = argparse.ArgumentParser()
    ap.add_argument("--reclassificar", action="store_true")
    ap.add_argument("--lote", type=int, default=2000)
    args = ap.parse_args()
    conn = mysql.connector.connect(
        host=os.getenv("OPER_RADAR_DB_HOST", "localhost"), user=os.environ["OPER_RADAR_DB_USER"],
        password=os.environ["OPER_RADAR_DB_PASS"], database=os.environ["OPER_RADAR_DB_NAME"], charset="utf8mb4")
    try:
        print(roda(conn, args.lote, args.reclassificar))
    finally:
        conn.close()
