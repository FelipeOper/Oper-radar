"""Backfill seguro da taxonomia DAF e reabertura do matching FIPE.

Sem --aplicar, apenas informa quantos registros seriam alterados. Vinculos manuais
nunca entram na selecao e o vinculo automatico anterior e preservado ate o novo
processamento terminar.
"""
import argparse
import os
import sys
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import urlparse

import mysql.connector

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "fase1-coleta"))
from parser import _extrai_anos, _extrai_modelo_e_tracao_da_url  # noqa: E402
from fipe_sync import escolhe  # noqa: E402


def dados_derivados(anuncio: dict) -> dict:
    caminho = urlparse(anuncio.get("url") or "").path
    modelo, tracao = _extrai_modelo_e_tracao_da_url(caminho, anuncio.get("marca"))
    ano_inicial, ano_final = _extrai_anos(anuncio.get("titulo") or "")
    return {
        "modelo": anuncio.get("modelo") or modelo,
        "tracao": anuncio.get("tracao") or tracao,
        "ano_inicial": ano_inicial or anuncio.get("ano_inicial"),
        "ano_final": ano_final or anuncio.get("ano_final"),
    }


def conecta(args):
    return mysql.connector.connect(
        host=args.db_host,
        user=args.db_user,
        password=args.db_pass,
        database=args.db_name,
        charset="utf8mb4",
    )


def executa(conn, aplicar=False, max_exemplos=2):
    cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT id, titulo, url, marca, modelo, tracao, ano_inicial, ano_final
        FROM anuncio
        WHERE status='ativo'
          AND UPPER(marca)='DAF'
          AND COALESCE(fipe_vinculo_origem, 'automatico') <> 'manual'
        ORDER BY id
    """)
    anuncios = cur.fetchall()
    cur.close()

    alteracoes = 0
    modelo_preenchido = tracao_preenchida = anos_corrigidos = 0
    diagnostico = Counter()
    exemplos = defaultdict(list)
    if aplicar:
        cur = conn.cursor()

    for anuncio in anuncios:
        dados = dados_derivados(anuncio)
        candidatos, motivo = escolhe(conn, {**anuncio, **dados})
        if candidatos:
            chave = "candidato unico" if len(candidatos) == 1 else f"{len(candidatos)} candidatos"
        else:
            chave = motivo
        diagnostico[chave] += 1
        if len(exemplos[chave]) < max_exemplos:
            nomes = [c["modelo_fipe"] for c in candidatos] if candidatos else []
            exemplos[chave].append({
                "id": anuncio["id"],
                "titulo": anuncio["titulo"],
                "modelo": dados["modelo"],
                "tracao": dados["tracao"],
                "anos": f"{dados['ano_inicial']}/{dados['ano_final']}",
                "candidatos": nomes,
            })
        if not anuncio.get("modelo") and dados["modelo"]:
            modelo_preenchido += 1
        if not anuncio.get("tracao") and dados["tracao"]:
            tracao_preenchida += 1
        if (dados["ano_inicial"], dados["ano_final"]) != (
            anuncio.get("ano_inicial"), anuncio.get("ano_final")
        ):
            anos_corrigidos += 1
        alteracoes += 1

        if aplicar:
            cur.execute("""
                UPDATE anuncio
                SET modelo=%s,
                    tracao=%s,
                    ano_inicial=%s,
                    ano_final=%s,
                    fipe_match_status='reprocessar_dados_brutos',
                    fipe_match_status_automatico='reprocessar_dados_brutos',
                    fipe_ultima_tentativa=NULL
                WHERE id=%s
                  AND COALESCE(fipe_vinculo_origem, 'automatico') <> 'manual'
            """, (
                dados["modelo"], dados["tracao"], dados["ano_inicial"],
                dados["ano_final"], anuncio["id"],
            ))

    if aplicar:
        conn.commit()
        cur.close()

    modo = "aplicados" if aplicar else "previstos"
    print(
        f"DAF: {alteracoes} registros {modo} | "
        f"modelo a preencher: {modelo_preenchido} | "
        f"tracao a preencher: {tracao_preenchida} | "
        f"anos a corrigir: {anos_corrigidos}"
    )
    print("Previa do matching (nenhum vinculo FIPE gravado por este diagnostico):")
    for chave, quantidade in diagnostico.most_common():
        print(f"  {quantidade:4}  {chave}")
    if max_exemplos > 0:
        print("Exemplos por grupo:")
        for chave, _ in diagnostico.most_common():
            print(f"\n[{chave}]")
            for exemplo in exemplos[chave]:
                print(
                    f"  #{exemplo['id']} {exemplo['titulo']} | "
                    f"modelo={exemplo['modelo'] or '-'} | tracao={exemplo['tracao'] or '-'} | "
                    f"anos={exemplo['anos']}"
                )
                for nome in exemplo["candidatos"]:
                    print(f"      -> {nome}")
    return {
        "registros": alteracoes,
        "modelos": modelo_preenchido,
        "tracoes": tracao_preenchida,
        "anos": anos_corrigidos,
    }


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--aplicar", action="store_true")
    ap.add_argument("--exemplos", type=int, default=2,
                    help="quantos exemplos mostrar por grupo no diagnostico")
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

    conexao = conecta(args)
    try:
        executa(conexao, aplicar=args.aplicar, max_exemplos=max(0, args.exemplos))
    finally:
        conexao.close()
