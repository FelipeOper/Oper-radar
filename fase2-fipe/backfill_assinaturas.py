"""Backfill das assinaturas FIPE. Dry-run por padrao: so --aplicar escreve.

Passada 1: cria assinaturas a partir dos vinculos 'alto' e manuais ja existentes.
Passada 2: aplica o mesmo fipe_preco_id aos anuncios sem vinculo cuja assinatura ficou ativa.
"""
import argparse
import os


def parse_args(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--aplicar", action="store_true")
    ap.add_argument("--lote", type=int, default=500)
    ap.add_argument("--db-host", default=os.getenv("OPER_RADAR_DB_HOST", "localhost"))
    ap.add_argument("--db-user", default=os.getenv("OPER_RADAR_DB_USER"))
    ap.add_argument("--db-pass", default=os.getenv("OPER_RADAR_DB_PASS"))
    ap.add_argument("--db-name", default=os.getenv("OPER_RADAR_DB_NAME"))
    return ap.parse_args(argv)


def planeja(vinculados, pendentes, resolve_grava, resolve_reuso):
    hashes, incompletas = set(), 0
    for a in vinculados:
        h = resolve_grava(a)
        if h is None:
            incompletas += 1
        else:
            hashes.add(h)
    propagaveis = [a for a in pendentes if resolve_reuso(a) is not None]
    return {"assinaturas_novas": len(hashes), "incompletas": incompletas, "propagaveis": propagaveis}


if __name__ == "__main__":
    import mysql.connector
    from fipe_sync import registra_resultado
    from vinculo_por_assinatura import grava_assinatura, hash_da_assinatura, resolve_por_assinatura

    os.environ["FIPE_ASSINATURA"] = "1"
    args = parse_args()
    if not all((args.db_user, args.db_pass, args.db_name)):
        raise SystemExit("credenciais OPER_RADAR_DB_* ausentes")
    conn = mysql.connector.connect(host=args.db_host, user=args.db_user, password=args.db_pass,
                                   database=args.db_name, charset="utf8mb4")
    cur = conn.cursor(dictionary=True)
    cur.execute("""SELECT id, titulo, url, marca, modelo, tracao, ano_inicial, ano_final, fipe_preco_id AS p,
                          IF(fipe_vinculo_origem='manual','manual','automatico') AS origem
                   FROM anuncio WHERE status='ativo' AND fipe_preco_id IS NOT NULL
                     AND (fipe_vinculo_origem='manual' OR fipe_match_confianca='alto')""")
    vinculados = cur.fetchall()
    cur.execute("""SELECT id, titulo, url, marca, modelo, tracao, ano_inicial, ano_final
                   FROM anuncio WHERE status='ativo' AND tipo='Caminhao' AND fipe_preco_id IS NULL
                     AND COALESCE(fipe_vinculo_origem,'automatico') <> 'manual'""")
    pendentes = cur.fetchall()
    cur.close()

    if args.aplicar:
        for a in vinculados:
            grava_assinatura(conn, a, a["p"], origem=a["origem"])

    plano = planeja(vinculados, pendentes,
                    lambda a: hash_da_assinatura(conn, a),
                    lambda a: resolve_por_assinatura(conn, a))
    print({k: (len(v) if isinstance(v, list) else v) for k, v in plano.items()})
    for a in plano["propagaveis"][:20]:
        print("  propagaria:", a["id"], a["titulo"][:60])

    if args.aplicar:
        propagaveis = plano["propagaveis"]
        for i in range(0, len(propagaveis), args.lote):
            for a in propagaveis[i:i + args.lote]:
                r = resolve_por_assinatura(conn, a)
                if r:
                    registra_resultado(conn, a["id"], "vinculado", r.motivo, preco_id=r.fipe_preco_id,
                                       confianca="alto", assinatura_id=r.assinatura_id)
    conn.close()
