#!/usr/bin/env python3
"""Importa uma referencia FIPE CSV para o cache local, sem acessar a API.

O catalogo completo de caminhoes e atualizado, mas os precos gravados sao apenas os
necessarios para os anuncios ativos que possuem match automatico seguro.
"""
import argparse
import csv
import os
import re
from decimal import Decimal
from pathlib import Path

COLUNAS = {
    "Type", "Brand Code", "Brand Value", "Model Code", "Model Value",
    "Year Code", "Fipe Code", "Price", "Month",
}


def preco_decimal(texto):
    limpo = re.sub(r"[^\d,]", "", texto or "")
    if not limpo:
        return None
    return Decimal(limpo.replace(".", "").replace(",", "."))


def codigo_pelo_nome(caminho):
    numeros = re.findall(r"\d+", Path(caminho).stem)
    return int(numeros[-1]) if numeros else None


def ler_caminhoes(caminho):
    with open(caminho, encoding="utf-8-sig", newline="") as arquivo:
        leitor = csv.DictReader(arquivo)
        ausentes = COLUNAS - set(leitor.fieldnames or [])
        if ausentes:
            raise ValueError("CSV sem colunas obrigatorias: " + ", ".join(sorted(ausentes)))
        linhas = [linha for linha in leitor if linha["Type"].strip().upper() == "TRUCK"]
    if not linhas:
        raise ValueError("CSV nao contem linhas Type=TRUCK")
    meses = {linha["Month"].strip() for linha in linhas}
    if len(meses) != 1:
        raise ValueError("CSV mistura referencias mensais: " + ", ".join(sorted(meses)))
    return linhas, meses.pop()


def atualiza_catalogo(conn, linhas):
    modelos = sorted({
        (linha["Brand Value"].strip().upper(), int(linha["Brand Code"]),
         linha["Model Value"].strip(), int(linha["Model Code"]))
        for linha in linhas
    }, key=lambda item: (item[1], item[3]))
    cur = conn.cursor()
    cur.executemany("""
        INSERT INTO fipe_modelo
            (marca_fipe, marca_fipe_id, modelo_fipe, modelo_fipe_id)
        VALUES (%s,%s,%s,%s)
        ON DUPLICATE KEY UPDATE
            marca_fipe=VALUES(marca_fipe), modelo_fipe=VALUES(modelo_fipe)
    """, modelos)
    cur.close()
    return len(modelos)


def combinacoes_necessarias(conn):
    from fipe_sync import escolhe

    cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT id, titulo, marca, ano_inicial
        FROM anuncio
        WHERE status='ativo' AND tipo='Caminhao'
          AND marca IS NOT NULL AND ano_inicial IS NOT NULL
        ORDER BY id
    """)
    anuncios = cur.fetchall()
    cur.close()

    necessarias = set()
    sem_match_seguro = 0
    for anuncio in anuncios:
        candidatos, _ = escolhe(conn, anuncio)
        if not candidatos:
            sem_match_seguro += 1
            continue
        for candidato in candidatos[:3]:
            necessarias.add((
                int(candidato["marca_fipe_id"]),
                int(candidato["modelo_fipe_id"]),
                int(anuncio["ano_inicial"]),
            ))
    return necessarias, len(anuncios), sem_match_seguro


def ids_modelos(conn):
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT id, marca_fipe_id, modelo_fipe_id FROM fipe_modelo")
    resultado = {
        (int(item["marca_fipe_id"]), int(item["modelo_fipe_id"])): int(item["id"])
        for item in cur.fetchall()
    }
    cur.close()
    return resultado


def seleciona_precos(linhas, necessarias, mapa_ids, referencia_codigo,
                     todos_os_precos=False):
    selecionados = []
    encontradas = set()
    for linha in linhas:
        ano_codigo = linha["Year Code"].strip()
        try:
            ano = int(ano_codigo.split("-", 1)[0])
            chave = (int(linha["Brand Code"]), int(linha["Model Code"]), ano)
        except (TypeError, ValueError):
            continue
        if not todos_os_precos and chave not in necessarias:
            continue
        modelo_id = mapa_ids.get(chave[:2])
        if not modelo_id:
            continue
        selecionados.append((
            modelo_id, ano_codigo, linha["Fipe Code"].strip(),
            preco_decimal(linha["Price"]), linha["Month"].strip(), referencia_codigo,
        ))
        encontradas.add(chave)
    return selecionados, encontradas


def importar(conn, linhas, mes, referencia_codigo, todos_os_precos=False):
    total_modelos = atualiza_catalogo(conn, linhas)
    necessarias, total_anuncios, sem_match = combinacoes_necessarias(conn)
    precos, encontradas = seleciona_precos(
        linhas, necessarias, ids_modelos(conn), referencia_codigo, todos_os_precos
    )

    cur = conn.cursor()
    cur.executemany("""
        INSERT INTO fipe_preco
            (fipe_modelo_id, ano_codigo, codigo_fipe, preco, mes_referencia,
             referencia_codigo)
        VALUES (%s,%s,%s,%s,%s,%s)
        ON DUPLICATE KEY UPDATE
            codigo_fipe=VALUES(codigo_fipe), preco=VALUES(preco),
            mes_referencia=VALUES(mes_referencia),
            referencia_codigo=VALUES(referencia_codigo), atualizado_em=NOW()
    """, precos)
    cur.execute("""
        UPDATE anuncio
        SET fipe_ultima_tentativa=NULL
        WHERE status='ativo' AND tipo='Caminhao' AND fipe_preco_id IS NULL
          AND fipe_match_status IN ('sem_ano', 'erro_api')
    """)
    reabertos = cur.rowcount
    cur.close()
    conn.commit()

    print(f"Referencia: {mes} (codigo {referencia_codigo})")
    print(f"Catalogo de caminhoes: {total_modelos} modelos")
    print(f"Anuncios ativos analisados: {total_anuncios}")
    print(f"Combinacoes requeridas: {len(necessarias)}")
    print(f"Precos importados/atualizados: {len(precos)}")
    if todos_os_precos:
        print("Carga de precos: catalogo completo de caminhoes")
    else:
        print(f"Combinacoes sem preco no CSV: {len(necessarias - encontradas)}")
    print(f"Anuncios sem match automatico seguro: {sem_match}")
    print(f"Tentativas reabertas apos a carga: {reabertos}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("csv", help="arquivo tabela-fipe-CODIGO.csv")
    ap.add_argument("--referencia-codigo", type=int,
                    help="codigo da referencia; por padrao e lido do nome do arquivo")
    ap.add_argument("--validar", action="store_true", help="valida o CSV sem acessar o banco")
    ap.add_argument("--todos-os-precos", action="store_true",
                    help="importa todos os precos de caminhoes para consulta interna")
    ap.add_argument("--db-host", default=os.getenv("OPER_RADAR_DB_HOST", "localhost"))
    ap.add_argument("--db-user", default=os.getenv("OPER_RADAR_DB_USER"))
    ap.add_argument("--db-pass", default=os.getenv("OPER_RADAR_DB_PASS"))
    ap.add_argument("--db-name", default=os.getenv("OPER_RADAR_DB_NAME"))
    args = ap.parse_args()

    codigo = args.referencia_codigo or codigo_pelo_nome(args.csv)
    if codigo is None:
        ap.error("informe --referencia-codigo ou use o codigo no nome do CSV")
    linhas_csv, mes_csv = ler_caminhoes(args.csv)
    print(f"CSV valido: {len(linhas_csv)} precos de caminhao, referencia {mes_csv} ({codigo})")
    if args.validar:
        raise SystemExit(0)
    if not all((args.db_user, args.db_pass, args.db_name)):
        ap.error("credenciais OPER_RADAR_DB_* ausentes")

    import mysql.connector

    conexao = mysql.connector.connect(
        host=args.db_host, user=args.db_user, password=args.db_pass,
        database=args.db_name, charset="utf8mb4",
    )
    try:
        importar(conexao, linhas_csv, mes_csv, codigo, args.todos_os_precos)
    except Exception:
        conexao.rollback()
        raise
    finally:
        conexao.close()
