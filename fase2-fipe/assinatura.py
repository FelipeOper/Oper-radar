"""Assinatura canonica de um veiculo: base do 'mesmo veiculo, mesmo ID de FIPE'."""
import hashlib
from dataclasses import dataclass

from catalogo_atributos import DIMS, chave_familia
from fipe_sync import (
    ano_modelo, cabine_daf, cambio_daf, eixo_do_anuncio, emissao_no_texto,
    geracao_daf, normaliza, numero_modelo, serie, texto_anuncio,
)

MAPA_VALOR_NULO = "-"


@dataclass(frozen=True)
class Assinatura:
    hash: str
    marca: str
    familia: str
    numero: str
    ano_modelo: int
    valores: dict
    dims_discriminantes: tuple
    completa: bool


def atributos_do_anuncio(anuncio):
    texto = texto_anuncio(anuncio)
    eixo, conflito = eixo_do_anuncio(anuncio)
    return {
        "marca": " ".join(normaliza(anuncio.get("marca", "")).split()) or None,
        "familia": chave_familia(texto),
        "numero": numero_modelo(texto),
        "ano_modelo": ano_modelo(anuncio),
        "serie": serie(texto),
        "geracao": geracao_daf(texto),
        "eixo": None if conflito else eixo,
        "emissao": emissao_no_texto(texto),
        "cabine": cabine_daf(texto),
        "cambio": cambio_daf(texto),
    }


def monta_assinatura(attrs, dims_discriminantes):
    base = (attrs.get("marca"), attrs.get("familia"), attrs.get("numero"), attrs.get("ano_modelo"))
    if not all(base):
        return None
    dims = tuple(d for d in DIMS if d in dims_discriminantes)
    valores = {d: attrs.get(d) for d in dims}
    partes = [str(x) for x in base] + ["dims=" + ",".join(dims)] + [
        f"{d}={valores[d] or MAPA_VALOR_NULO}" for d in dims]
    return Assinatura(
        hash=hashlib.sha1("|".join(partes).encode("utf-8")).hexdigest(),
        marca=attrs["marca"], familia=attrs["familia"], numero=str(attrs["numero"]),
        ano_modelo=int(attrs["ano_modelo"]), valores=valores, dims_discriminantes=dims,
        completa=all(valores[d] for d in dims),
    )
