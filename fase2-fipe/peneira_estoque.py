"""Peneira do estoque (meu_estoque): itens sem FIPE reusam assinatura ja resolvida, nunca decidem sozinhos.

Uso (cron, a cada 30 min, depois do job local): python peneira_estoque.py
"""
import os
import re


def item_como_anuncio(item):
    anos = [int(x) for x in re.findall(r"\b(19\d{2}|20\d{2})\b", str(item.get("ano") or ""))]
    return {
        "id": item["id"], "titulo": item.get("titulo") or "", "url": item.get("url_anuncio") or "",
        "marca": item.get("marca") or "", "modelo": item.get("modelo") or "", "tracao": "",
        "ano_inicial": anos[0] if anos else None, "ano_final": anos[-1] if anos else None,
    }


def processa_estoque(conn, lote=200):
    from vinculo_por_assinatura import resolve_por_assinatura

    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT id, titulo, marca, modelo, ano, url_anuncio FROM meu_estoque "
                "WHERE fipe_preco_id IS NULL AND status <> 'vendido' ORDER BY id DESC LIMIT %s", (lote,))
    itens = cur.fetchall()
    cur.close()
    resultado = {"avaliados": len(itens), "vinculados": 0, "pendentes": 0}
    for item in itens:
        r = resolve_por_assinatura(conn, item_como_anuncio(item))
        if r:
            gravar = conn.cursor()
            gravar.execute("UPDATE meu_estoque SET fipe_preco_id=%s WHERE id=%s AND fipe_preco_id IS NULL",
                           (r.fipe_preco_id, item["id"]))
            conn.commit()
            gravar.close()
            resultado["vinculados"] += 1
        else:
            resultado["pendentes"] += 1
    return resultado


if __name__ == "__main__":
    import mysql.connector
    os.environ["FIPE_ASSINATURA"] = "1"
    conn = mysql.connector.connect(
        host=os.getenv("OPER_RADAR_DB_HOST", "localhost"), user=os.environ["OPER_RADAR_DB_USER"],
        password=os.environ["OPER_RADAR_DB_PASS"], database=os.environ["OPER_RADAR_DB_NAME"], charset="utf8mb4")
    try:
        print(processa_estoque(conn))
    finally:
        conn.close()
