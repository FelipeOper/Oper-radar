"""Verificacao consolidada e somente de leitura da saude do OPER RADAR."""
import argparse
import os
from datetime import date, datetime

import mysql.connector


def horas_entre(agora, momento):
    if momento is None:
        return None
    return max(0.0, (agora - momento).total_seconds() / 3600)


def main():
    ap = argparse.ArgumentParser()
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

    conn = mysql.connector.connect(
        host=args.db_host,
        user=args.db_user,
        password=args.db_pass,
        database=args.db_name,
        charset="utf8mb4",
    )
    cur = conn.cursor(dictionary=True)
    alertas = []
    avisos = []
    try:
        cur.execute("SELECT NOW() AS agora")
        agora = cur.fetchone()["agora"]

        cur.execute("""
            SELECT MAX(timestamp) AS ultima,
                   SUM(timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR) AND sucesso=0) AS falhas_24h
            FROM execucao_coleta
        """)
        coleta = cur.fetchone()
        idade_coleta = horas_entre(agora, coleta["ultima"])
        if idade_coleta is None or idade_coleta > 18:
            alertas.append("coleta principal sem atualizacao ha mais de 18h")
        if int(coleta["falhas_24h"] or 0) > 0:
            avisos.append(f"{int(coleta['falhas_24h'])} execucoes de revenda falharam nas ultimas 24h")

        cur.execute("""
            SELECT COUNT(*) AS total,
                   SUM(status='ativo') AS ativos,
                   SUM(status='removido_candidato') AS candidatos
            FROM anuncio
        """)
        anuncios = cur.fetchone()
        ativos = int(anuncios["ativos"] or 0)
        if ativos < 1000:
            alertas.append(f"volume ativo anormalmente baixo: {ativos}")

        cur.execute("SELECT MAX(dia) AS ultimo_dia, COUNT(DISTINCT dia) AS dias FROM anuncio_snapshot")
        series = cur.fetchone()
        ultimo_dia = series["ultimo_dia"]
        idade_snapshot = (agora.date() - ultimo_dia).days if isinstance(ultimo_dia, date) else None
        if idade_snapshot is None or idade_snapshot > 1:
            alertas.append("snapshot diario ausente ou atrasado")

        cur.execute("SELECT MAX(referencia_codigo) AS atual FROM fipe_preco")
        referencia = cur.fetchone()["atual"]
        cur.execute("""
            SELECT COUNT(*) AS precos_antigos
            FROM fipe_preco
            WHERE referencia_codigo IS NULL OR referencia_codigo<>%s
        """, (referencia,))
        precos_antigos = int(cur.fetchone()["precos_antigos"] or 0)
        cur.execute("""
            SELECT COUNT(*) AS ativos_antigos
            FROM anuncio a
            JOIN fipe_preco fp ON fp.id=a.fipe_preco_id
            WHERE a.status='ativo'
              AND (fp.referencia_codigo IS NULL OR fp.referencia_codigo<>%s)
        """, (referencia,))
        ativos_antigos = int(cur.fetchone()["ativos_antigos"] or 0)
        if ativos_antigos:
            avisos.append(f"{ativos_antigos} anuncios ativos usam referencia FIPE anterior")

        estado = "CRITICO" if alertas else "ATENCAO" if avisos else "OK"
        print(f"OPER_RADAR_SAUDE={estado}")
        print(f"agora={agora:%Y-%m-%d %H:%M:%S}")
        print(f"ultima_coleta={coleta['ultima']} idade_horas={idade_coleta:.1f}" if idade_coleta is not None else "ultima_coleta=ausente")
        print(f"anuncios_total={int(anuncios['total'])} ativos={ativos} candidatos={int(anuncios['candidatos'] or 0)}")
        print(f"ultimo_snapshot={ultimo_dia} dias_registrados={int(series['dias'] or 0)}")
        print(f"fipe_referencia={referencia} precos_anteriores={precos_antigos} ativos_anteriores={ativos_antigos}")
        for item in avisos:
            print(f"AVISO: {item}")
        for item in alertas:
            print(f"CRITICO: {item}")
        return 1 if alertas else 0
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    raise SystemExit(main())
