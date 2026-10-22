"""Leva vinculos manuais (curadoria) para a tabela de assinaturas, sem duplicar a regra em PHP.

Uso (cron, a cada 30 min, com flock): python sincroniza_curadoria.py
"""
import os


def precisa_sincronizar(anuncio):
    if anuncio.get("fipe_vinculo_origem") != "manual" or not anuncio.get("fipe_preco_id"):
        return False
    if not anuncio.get("fipe_assinatura_id"):
        return True
    return anuncio.get("assinatura_fipe_preco_id") != anuncio["fipe_preco_id"]


if __name__ == "__main__":
    import mysql.connector
    from vinculo_por_assinatura import grava_assinatura
    conn = mysql.connector.connect(
        host=os.getenv("OPER_RADAR_DB_HOST", "localhost"), user=os.environ["OPER_RADAR_DB_USER"],
        password=os.environ["OPER_RADAR_DB_PASS"], database=os.environ["OPER_RADAR_DB_NAME"], charset="utf8mb4")
    cur = conn.cursor(dictionary=True)
    cur.execute("""SELECT a.id, a.titulo, a.url, a.marca, a.modelo, a.tracao, a.ano_inicial, a.ano_final,
                          a.fipe_preco_id, a.fipe_vinculo_origem, a.fipe_assinatura_id,
                          s.fipe_preco_id AS assinatura_fipe_preco_id
                   FROM anuncio a LEFT JOIN fipe_assinatura s ON s.id = a.fipe_assinatura_id
                   WHERE a.fipe_vinculo_origem='manual' AND a.fipe_preco_id IS NOT NULL""")
    feitos = 0
    for a in cur.fetchall():
        if precisa_sincronizar(a):
            aid = grava_assinatura(conn, a, a["fipe_preco_id"], origem="manual")
            if aid:
                gravar = conn.cursor()
                gravar.execute("UPDATE anuncio SET fipe_assinatura_id=%s WHERE id=%s", (aid, a["id"]))
                conn.commit()
                gravar.close()
                feitos += 1
    cur.close()
    print({"sincronizados": feitos})
    conn.close()
