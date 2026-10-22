"""Reuso do fipe_preco_id por assinatura canonica (mesmo veiculo, mesmo ID)."""
import json
from dataclasses import dataclass

from assinatura import atributos_do_anuncio, monta_assinatura
from catalogo_atributos import dims_que_variam

ORIGENS_QUE_GRAVAM = {"automatico", "manual"}


@dataclass(frozen=True)
class Reuso:
    fipe_preco_id: int
    assinatura_id: int
    motivo: str


def dims_do_grupo(conn, marca, familia, numero):
    cur = conn.cursor(dictionary=True)
    cur.execute(
        "SELECT eixo, emissao, cabine, cambio, serie, geracao FROM fipe_modelo_atributo "
        "WHERE familia=%s AND numero=%s AND UPPER(marca_fipe) LIKE %s",
        (familia, numero, f"%{marca.split()[0]}%"))
    linhas = cur.fetchall()
    cur.close()
    return dims_que_variam(linhas)


def _busca_assinatura(conn, hash_assinatura):
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT id, fipe_preco_id, origem, status FROM fipe_assinatura WHERE hash_assinatura=%s",
                (hash_assinatura,))
    linha = cur.fetchone()
    cur.close()
    return linha


def status_apos_gravar(existente, novo_preco, novo_origem):
    if not existente or int(existente["fipe_preco_id"]) == int(novo_preco):
        return "ativa"
    if novo_origem == "manual" and existente.get("origem") != "manual":
        return "ativa"
    return "em_revisao"


def decide_gravacao(existente, novo_preco, novo_origem):
    """Devolve (fipe_preco_id, origem, status) que a assinatura deve ter depois da nova evidencia."""
    if not existente:
        return novo_preco, novo_origem, "ativa"
    preco_atual, origem_atual = existente["fipe_preco_id"], existente["origem"]
    if existente.get("status") == "em_revisao":
        return preco_atual, origem_atual, "em_revisao"
    status = status_apos_gravar(existente, novo_preco, novo_origem)
    if status == "em_revisao":
        return preco_atual, origem_atual, "em_revisao"
    if origem_atual == "manual" and novo_origem != "manual":
        return preco_atual, "manual", "ativa"
    return novo_preco, novo_origem, "ativa"


def _upsert_assinatura(conn, ass, fipe_preco_id, origem):
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT id, fipe_preco_id, origem, status FROM fipe_assinatura "
                "WHERE hash_assinatura=%s FOR UPDATE", (ass.hash,))
    existente = cur.fetchone()
    if existente is None:
        preco, origem_final, status = decide_gravacao(None, fipe_preco_id, origem)
        cur.execute(
            "INSERT INTO fipe_assinatura (hash_assinatura, marca, familia, numero, ano_modelo, "
            "dims_discriminantes, valores, fipe_preco_id, origem, status) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            (ass.hash, ass.marca, ass.familia, ass.numero, ass.ano_modelo,
             ",".join(ass.dims_discriminantes), json.dumps(ass.valores, sort_keys=True),
             preco, origem_final, status))
        novo_id = cur.lastrowid
    else:
        preco, origem_final, status = decide_gravacao(existente, fipe_preco_id, origem)
        cur.execute(
            "UPDATE fipe_assinatura SET fipe_preco_id=%s, origem=%s, status=%s, evidencias=evidencias+1 "
            "WHERE id=%s", (preco, origem_final, status, existente["id"]))
        novo_id = existente["id"]
    conn.commit()
    cur.close()
    return novo_id


def _assinatura_do_anuncio(conn, anuncio):
    attrs = atributos_do_anuncio(anuncio)
    if not all((attrs.get("marca"), attrs.get("familia"), attrs.get("numero"))):
        return None
    dims = dims_do_grupo(conn, attrs["marca"], attrs["familia"], attrs["numero"])
    return monta_assinatura(attrs, dims)


def resolve_por_assinatura(conn, anuncio):
    ass = _assinatura_do_anuncio(conn, anuncio)
    if ass is None or not ass.completa:
        return None
    achada = _busca_assinatura(conn, ass.hash)
    if not achada or achada["status"] != "ativa":
        return None
    return Reuso(int(achada["fipe_preco_id"]), int(achada["id"]), f"assinatura {ass.hash[:10]}")


def grava_assinatura(conn, anuncio, fipe_preco_id, origem):
    if origem not in ORIGENS_QUE_GRAVAM:
        return None
    ass = _assinatura_do_anuncio(conn, anuncio)
    if ass is None or not ass.completa:
        return None
    return _upsert_assinatura(conn, ass, fipe_preco_id, origem)
