"""Politica de monitoria: quando um anuncio sem vinculo volta a ser avaliado."""
REGRA_VERSAO = 1  # incrementar a cada mudanca de regra de matching ou de evidencia
STATUS_MONITORADOS = ("sem_match", "ambiguo", "sem_ano")


def precisa_reprocessar(anuncio, regra_versao_atual=REGRA_VERSAO):
    if anuncio.get("fipe_match_status") not in STATUS_MONITORADOS:
        return False
    ultima = anuncio.get("fipe_ultima_tentativa")
    if ultima is None:
        return True
    detalhe = anuncio.get("detalhe_coletado_em")
    if detalhe and detalhe > ultima:
        return True
    catalogo = anuncio.get("catalogo_atualizado_em")
    if catalogo and catalogo > ultima:
        return True
    return int(anuncio.get("fipe_regra_versao") or 0) < regra_versao_atual


def faixa_estreita(precos, limite=0.05):
    validos = [float(p) for p in precos if p and float(p) > 0]
    if len(validos) < 2:
        return False
    return (max(validos) - min(validos)) / min(validos) <= limite
