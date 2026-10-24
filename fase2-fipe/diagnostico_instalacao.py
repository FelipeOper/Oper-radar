"""Diagnostico completo e SOMENTE LEITURA da instalacao: banco, FIPE, fila de vinculo e coleta.

Roda como parte de scripts/diagnostico_instalacao.sh. Nao grava nada e nao imprime segredo:
senha, tokens e chaves aparecem so como "definido"; do token da FIPE sai apenas a validade.
"""
import base64
import json
import math
import os
import sys
import time
import urllib.request
from datetime import datetime

FLAGS_VISIVEIS = (
    "FIPE_USA_DETALHE", "FIPE_ASSINATURA", "FIPE_MONITORIA_EVENTOS", "FIPE_PROVISORIO", "FIPE_FILA_JUSTA",
    "FIPE_API_UNLIMITED",
)
SEGREDOS = ("FIPE_API_TOKEN", "OPER_RADAR_DB_PASS", "ANTHROPIC_API_KEY", "OPER_RADAR_PLACA_API_TOKEN")
TABELAS = ("fipe_modelo", "fipe_preco", "fipe_modelo_atributo", "fipe_assinatura", "fipe_auditoria",
           "anuncio_fipe_sugestao", "anuncio_curadoria_log", "meu_estoque", "anuncio_snapshot")
COLUNAS_ANUNCIO = ("fipe_assinatura_id", "fipe_regra_versao", "conjunto", "conjunto_origem", "fipe_vinculo_origem",
                   "descricao", "opcionais", "carroceria", "tracao", "detalhe_coletado_em", "detalhe_status")
BASE = "tipo = 'Caminhao' AND status = 'ativo'"
ELEGIVEL = "marca IS NOT NULL AND COALESCE(ano_final, ano_inicial) IS NOT NULL"
JANELA_DO_JOB_LOCAL = 1000


def rotulo_flag(nome, valor):
    if nome in SEGREDOS:
        return "definido" if valor else "(nao definido)"
    if nome in FLAGS_VISIVEIS:
        return valor if valor not in (None, "") else "(nao definida)"
    return "definida" if valor else "(nao definida)"


def resume_token(token):
    """So a validade: o conteudo do token (usuario, e-mail) nunca sai daqui."""
    if not token:
        return "nao definido"
    partes = str(token).split(".")
    if len(partes) != 3:
        return "formato nao reconhecido"
    try:
        corpo = partes[1] + "=" * (-len(partes[1]) % 4)
        exp = json.loads(base64.urlsafe_b64decode(corpo)).get("exp")
    except Exception:
        return "formato nao reconhecido"
    if exp is None:
        return "sem data de validade no token"
    restante = int(exp) - time.time()
    if restante < 0:
        return f"VENCIDO ha {int(-restante // 86400)} dia(s)"
    return f"valido por mais {math.ceil(restante / 86400)} dia(s)"


def titulo(texto):
    print(f"\n##### {texto}")


def secao(texto, funcao, *args):
    titulo(texto)
    try:
        funcao(*args)
    except Exception as erro:  # um bloco com falha nao pode esconder os outros
        print(f"  (falhou: {type(erro).__name__}: {erro})")


def linhas(cur, sql, params=()):
    cur.execute(sql, params)
    return cur.fetchall()


def ambiente():
    print(f"  python {sys.version.split()[0]}")
    try:
        import mysql.connector
        print(f"  mysql-connector {mysql.connector.__version__}")
    except Exception:
        print("  mysql-connector: nao importavel")
    for nome in FLAGS_VISIVEIS + SEGREDOS:
        print(f"  {nome} = {rotulo_flag(nome, os.environ.get(nome))}")


def banco(cur):
    existentes = {linha[0] for linha in linhas(cur, "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()")}
    for tabela in TABELAS:
        print(f"  tabela {tabela}: {'ok' if tabela in existentes else 'FALTA'}")
    colunas = {linha[0] for linha in linhas(cur, "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'anuncio'")}
    faltam = [c for c in COLUNAS_ANUNCIO if c not in colunas]
    print(f"  colunas de anuncio: {'todas presentes' if not faltam else 'FALTAM ' + ', '.join(faltam)}")
    for tabela in ("fipe_modelo", "fipe_preco", "fipe_modelo_atributo"):
        if tabela in existentes:
            print(f"  linhas em {tabela}: {linhas(cur, f'SELECT COUNT(*) FROM {tabela}')[0][0]}")
    if "fipe_assinatura" in existentes:
        print(f"  assinaturas por status: {dict(linhas(cur, 'SELECT status, COUNT(*) FROM fipe_assinatura GROUP BY status'))}")
    if "fipe_auditoria" in existentes:
        print(f"  vereditos de auditoria: {dict(linhas(cur, 'SELECT veredito, COUNT(*) FROM fipe_auditoria GROUP BY veredito'))}")


def fipe(cur):
    print(f"  token FIPE: {resume_token(os.environ.get('FIPE_API_TOKEN'))}")
    banco_ref, na_ref, total = linhas(cur, "SELECT MAX(referencia_codigo), SUM(referencia_codigo = (SELECT MAX(referencia_codigo) FROM fipe_preco)), COUNT(*) FROM fipe_preco")[0]
    print(f"  referencia no banco: {banco_ref} ({na_ref} de {total} precos nela)")
    try:
        with urllib.request.urlopen("https://fipe.parallelum.com.br/api/v2/references", timeout=20) as resposta:
            ultima = json.loads(resposta.read())[0]
        print(f"  referencia mais recente na API da FIPE: {ultima['code']} ({ultima['month']})")
        print("  situacao: " + ("EM DIA" if str(banco_ref) == str(ultima["code"]) else "BANCO ATRASADO em relacao a FIPE"))
    except Exception as erro:
        print(f"  (nao consegui consultar a API da FIPE: {type(erro).__name__})")
    ultima_carga = linhas(cur, "SELECT MAX(atualizado_em) FROM fipe_preco")[0][0]
    print(f"  ultima atualizacao de preco: {ultima_carga}")


def fila(cur):
    total, vinculados, elegiveis, sem_dados = linhas(cur, f"""
        SELECT COUNT(*), SUM(fipe_preco_id IS NOT NULL),
               SUM(fipe_preco_id IS NULL AND {ELEGIVEL}),
               SUM(fipe_preco_id IS NULL AND NOT ({ELEGIVEL}))
        FROM anuncio WHERE {BASE}""")[0]
    total, vinculados = int(total or 0), int(vinculados or 0)
    pct = f"{100 * vinculados / total:.1f}%" if total else "—"
    print(f"  caminhoes ativos: {total} | vinculados: {vinculados} ({pct}) | sem vinculo e elegiveis: {int(elegiveis or 0)} | sem marca/ano: {int(sem_dados or 0)}")

    base_fila = f"""FROM anuncio WHERE {BASE} AND fipe_preco_id IS NULL
        AND COALESCE(fipe_vinculo_origem, 'automatico') <> 'manual' AND {ELEGIVEL}"""
    nunca, h24, d7, ultima = linhas(cur, f"""SELECT SUM(fipe_ultima_tentativa IS NULL),
        SUM(fipe_ultima_tentativa >= NOW() - INTERVAL 1 DAY), SUM(fipe_ultima_tentativa >= NOW() - INTERVAL 7 DAY),
        MAX(fipe_ultima_tentativa) {base_fila}""")[0]
    nunca = int(nunca or 0)
    print(f"  nunca tentados: {nunca} | tentados nas ultimas 24h: {int(h24 or 0)} | em 7 dias: {int(d7 or 0)} | ultima tentativa: {ultima}")
    if nunca > JANELA_DO_JOB_LOCAL:
        print(f"  >>> FILA ENTUPIDA: {nunca} anuncios nunca tentados, e o job local examina {JANELA_DO_JOB_LOCAL} por rodada.")
        print("      Quem espera o preco do ano no cache nao registra tentativa e volta ao topo toda rodada (flag FIPE_FILA_JUSTA).")
    else:
        print(f"  fila cabe na janela do job local ({JANELA_DO_JOB_LOCAL} por rodada).")
    status = linhas(cur, f"SELECT COALESCE(fipe_match_status, '(nunca tentado)'), COUNT(*) {base_fila} GROUP BY 1 ORDER BY 2 DESC")
    print("  sem vinculo por status: " + ", ".join(f"{s}={n}" for s, n in status))
    elegiveis_agora = linhas(cur, f"""SELECT COUNT(*) {base_fila} AND (fipe_ultima_tentativa IS NULL
        OR (fipe_match_status = 'erro_api' AND fipe_ultima_tentativa <= NOW() - INTERVAL 1 DAY)
        OR fipe_match_status LIKE 'reprocessar_%'
        OR (fipe_match_status IN ('sem_match', 'ambiguo', 'sem_ano') AND fipe_ultima_tentativa <= NOW() - INTERVAL 30 DAY))""")[0][0]
    print(f"  elegiveis para o proximo ciclo (pela regra atual): {elegiveis_agora}")
    esperando = linhas(cur, f"SELECT COUNT(*) {base_fila} AND fipe_match_status IN ('sem_match', 'ambiguo', 'sem_ano') AND fipe_ultima_tentativa > NOW() - INTERVAL 30 DAY")[0][0]
    print(f"  presos aguardando os 30 dias para nova tentativa: {esperando}")
    print("  motivos mais frequentes:")
    for motivo, n in linhas(cur, f"SELECT LEFT(fipe_match_motivo, 70), COUNT(*) {base_fila} AND fipe_match_motivo IS NOT NULL GROUP BY 1 ORDER BY 2 DESC LIMIT 12"):
        print(f"    {n:>5}  {motivo}")
    print("  marcas com mais anuncios sem vinculo:")
    for marca, n in linhas(cur, f"SELECT COALESCE(marca, '(sem marca)'), COUNT(*) FROM anuncio WHERE {BASE} AND fipe_preco_id IS NULL GROUP BY 1 ORDER BY 2 DESC LIMIT 10"):
        print(f"    {n:>5}  {marca}")


def evidencia(cur):
    com, total = linhas(cur, f"SELECT SUM(descricao IS NOT NULL AND descricao <> ''), COUNT(*) FROM anuncio WHERE {BASE} AND fipe_preco_id IS NULL")[0]
    print(f"  sem vinculo com descricao de detalhe (evidencia hoje ignorada): {int(com or 0)} de {int(total or 0)}")
    estados = linhas(cur, f"SELECT COALESCE(detalhe_status, '(vazio)'), COUNT(*) FROM anuncio WHERE {BASE} GROUP BY 1")
    print(f"  detalhe_status: {dict(estados)}")


def conjunto(cur):
    print(f"  conjunto por origem: {linhas(cur, f'SELECT conjunto, conjunto_origem, COUNT(*) FROM anuncio WHERE {BASE} GROUP BY 1, 2')}")


def cobertura(conn):
    from diagnostico_cobertura import coleta, relatorio_markdown
    print(relatorio_markdown(*coleta(conn)))


def main():
    import mysql.connector
    secao("AMBIENTE E FLAGS (segredos so como 'definido')", ambiente)
    conn = mysql.connector.connect(
        host=os.getenv("OPER_RADAR_DB_HOST", "localhost"), user=os.environ["OPER_RADAR_DB_USER"],
        password=os.environ["OPER_RADAR_DB_PASS"], database=os.environ["OPER_RADAR_DB_NAME"], charset="utf8mb4")
    cur = conn.cursor()
    print(f"\n(gerado em {datetime.now():%Y-%m-%d %H:%M})")
    secao("BANCO: tabelas e colunas", banco, cur)
    secao("FIPE: token e referencia", fipe, cur)
    secao("FILA DE VINCULO (o que trava novos vinculos)", fila, cur)
    secao("EVIDENCIA DE DETALHE", evidencia, cur)
    secao("CONJUNTO (cavalo + carreta)", conjunto, cur)
    secao("COBERTURA POR CAUSA", cobertura, conn)
    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
