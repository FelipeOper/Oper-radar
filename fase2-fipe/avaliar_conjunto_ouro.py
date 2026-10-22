"""Replay SOMENTE LEITURA do motor atual contra o conjunto-ouro.

Uso (na VPS):
  python avaliar_conjunto_ouro.py ouro.csv          # ouro vindo de planilha
  python avaliar_conjunto_ouro.py --do-sistema      # ouro vindo da auditoria feita na tela

CSV: anuncio_id, fipe_modelo_id_esperado (colunas extras sao ignoradas)
"""
import argparse
import csv
import os
from collections import Counter

SQL_OURO_DO_SISTEMA = """
SELECT au.anuncio_id, fp.fipe_modelo_id AS fipe_modelo_id_esperado
FROM fipe_auditoria au
JOIN anuncio a ON a.id = au.anuncio_id AND a.fipe_preco_id = au.fipe_preco_id
JOIN fipe_preco fp ON fp.id = au.fipe_preco_id
WHERE au.veredito = 'correto'
UNION
SELECT a.id, fp.fipe_modelo_id
FROM anuncio a JOIN fipe_preco fp ON fp.id = a.fipe_preco_id
WHERE a.status = 'ativo' AND a.fipe_vinculo_origem = 'manual'
"""

SQL_PRECISAO_AUDITADA = """
SELECT a.fipe_match_confianca AS confianca,
       SUM(au.veredito = 'correto') AS corretos,
       SUM(au.veredito = 'errado') AS errados
FROM fipe_auditoria au
JOIN anuncio a ON a.id = au.anuncio_id AND a.fipe_preco_id = au.fipe_preco_id
GROUP BY a.fipe_match_confianca
"""


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


def precisao_por_confianca(linhas):
    """Precisao dos vinculos ATUAIS, medida pelos vereditos humanos (correto / errado)."""
    saida = {}
    for linha in linhas:
        chave = linha.get("confianca") or "sem_confianca"
        corretos, errados = int(linha.get("corretos") or 0), int(linha.get("errados") or 0)
        julgados = corretos + errados
        saida[chave] = {
            "corretos": corretos, "errados": errados, "julgados": julgados,
            "precisao": (corretos / julgados) if julgados else None,
        }
    return saida


def linhas_do_csv(caminho):
    with open(caminho, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def linhas_do_sistema(conn):
    cur = conn.cursor(dictionary=True)
    cur.execute(SQL_OURO_DO_SISTEMA)
    linhas = cur.fetchall()
    cur.close()
    return linhas


def parse_args(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("csv", nargs="?", help="ouro.csv (omitir com --do-sistema)")
    ap.add_argument("--do-sistema", action="store_true", help="usa a auditoria feita na tela como ouro")
    args = ap.parse_args(argv)
    if not args.do_sistema and not args.csv:
        ap.error("informe o ouro.csv ou use --do-sistema")
    return args


if __name__ == "__main__":
    import mysql.connector
    from fipe_sync import _com_evidencia_do_detalhe, escolhe

    args = parse_args()
    colunas = "id, titulo, url, marca, modelo, tracao, ano_inicial, ano_final"
    if os.getenv("FIPE_USA_DETALHE", "0") == "1":
        colunas += ", descricao, opcionais, carroceria"
    conn = mysql.connector.connect(
        host=os.getenv("OPER_RADAR_DB_HOST", "localhost"), user=os.environ["OPER_RADAR_DB_USER"],
        password=os.environ["OPER_RADAR_DB_PASS"], database=os.environ["OPER_RADAR_DB_NAME"], charset="utf8mb4")
    if args.do_sistema:
        cur = conn.cursor(dictionary=True)
        cur.execute(SQL_PRECISAO_AUDITADA)
        print("Precisao dos vinculos atuais (vereditos da tela):", precisao_por_confianca(cur.fetchall()))
        cur.close()
        ouro = linhas_do_sistema(conn)
    else:
        ouro = linhas_do_csv(args.csv)

    contagens, erros = Counter(), []
    for linha in ouro:
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
