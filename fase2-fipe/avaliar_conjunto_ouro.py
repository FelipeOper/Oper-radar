"""Replay SOMENTE LEITURA do motor atual contra o conjunto-ouro.

Uso (na VPS): python avaliar_conjunto_ouro.py ouro.csv
CSV: anuncio_id, fipe_modelo_id_esperado (colunas extras sao ignoradas)
"""
import csv
import os
import sys
from collections import Counter


def compara(esperado_modelo_id, resultado):
    cands, _info = resultado
    if not cands or len(cands) != 1:
        return "omitiu"
    return "acerto" if int(cands[0]["id"]) == int(esperado_modelo_id) else "erro"


def resumo(c):
    vinculou = c.get("acerto", 0) + c.get("erro", 0)
    total = vinculou + c.get("omitiu", 0)
    return {
        "precisao": (c.get("acerto", 0) / vinculou) if vinculou else 0.0,
        "cobertura": (c.get("acerto", 0) / total) if total else 0.0,
        "total": total,
    }


if __name__ == "__main__":
    import mysql.connector
    from fipe_sync import _com_evidencia_do_detalhe, escolhe
    colunas = "id, titulo, url, marca, modelo, tracao, ano_inicial, ano_final"
    if os.getenv("FIPE_USA_DETALHE", "0") == "1":
        colunas += ", descricao, opcionais, carroceria"
    conn = mysql.connector.connect(
        host=os.getenv("OPER_RADAR_DB_HOST", "localhost"), user=os.environ["OPER_RADAR_DB_USER"],
        password=os.environ["OPER_RADAR_DB_PASS"], database=os.environ["OPER_RADAR_DB_NAME"], charset="utf8mb4")
    contagens, erros = Counter(), []
    with open(sys.argv[1], newline="", encoding="utf-8") as f:
        for linha in csv.DictReader(f):
            cur = conn.cursor(dictionary=True)
            cur.execute(f"SELECT {colunas} FROM anuncio WHERE id=%s", (linha["anuncio_id"],))
            anuncio = cur.fetchone()
            cur.close()
            if not anuncio:
                continue
            res = compara(linha["fipe_modelo_id_esperado"], escolhe(conn, _com_evidencia_do_detalhe(anuncio)))
            contagens[res] += 1
            if res == "erro":
                erros.append((anuncio["id"], anuncio["titulo"]))
    conn.close()
    print(dict(contagens), resumo(contagens))
    for erro in erros[:50]:
        print("ERRO", erro)
