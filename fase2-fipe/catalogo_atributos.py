"""Atributos estruturados dos modelos do catalogo FIPE (parseados uma vez)."""
from fipe_sync import (
    cabine_daf, cambio_daf, eixos, emissao_no_texto, familia_comercial, geracao_daf,
    numero_modelo, serie,
)

DIMS = ("serie", "geracao", "eixo", "emissao", "cabine", "cambio")


def chave_familia(texto):
    """Familia comercial, ou a serie quando a linha nao tem nome proprio (Scania R/G/P)."""
    return familia_comercial(texto) or serie(texto)


def atributos_do_modelo_fipe(marca_fipe, modelo_fipe):
    return {
        "familia": chave_familia(modelo_fipe),
        "numero": numero_modelo(modelo_fipe),
        "serie": serie(modelo_fipe),
        "geracao": geracao_daf(modelo_fipe, nome_fipe=True),
        "eixo": eixos(modelo_fipe),
        "emissao": emissao_no_texto(modelo_fipe),
        "cabine": cabine_daf(modelo_fipe),
        "cambio": cambio_daf(modelo_fipe),
    }


def dims_que_variam(linhas):
    """Dimensoes em que os modelos do grupo diferem (None junto de valor tambem e variacao)."""
    return tuple(dim for dim in DIMS if len({linha.get(dim) for linha in linhas}) > 1)


def materializa_catalogo(conn):
    """Preenche fipe_modelo_atributo para todo modelo FIPE. Idempotente (REPLACE por PK)."""
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT id, marca_fipe, modelo_fipe FROM fipe_modelo")
    modelos = cur.fetchall()
    cur.close()
    gravar = conn.cursor()
    for m in modelos:
        a = atributos_do_modelo_fipe(m["marca_fipe"], m["modelo_fipe"])
        gravar.execute(
            "REPLACE INTO fipe_modelo_atributo "
            "(fipe_modelo_id, marca_fipe, familia, numero, serie, geracao, eixo, emissao, cabine, cambio) "
            "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
            (m["id"], m["marca_fipe"], a["familia"], a["numero"], a["serie"], a["geracao"],
             a["eixo"], a["emissao"], a["cabine"], a["cambio"]))
    conn.commit()
    gravar.close()
    return len(modelos)
