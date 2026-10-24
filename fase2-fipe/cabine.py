"""Cabine / teto por marca, do jeito que cada fabricante e a FIPE escrevem.

A FIPE tem precos diferentes por cabine e escreve isso de forma diferente em cada marca (nomes reais do catalogo,
outubro/2026, em fixtures/fipe_nomes_cabine.json):
  DAF       Day, Sleeper, Space, Super Space
  Volvo     sem rotulo, GLOBETROTTER, GLOBETROTTER XL
  Scania    sem rotulo, HIGHLINE (a FIPE junta em "HIGH./STRE."), TOPLINE (modelos antigos)
  Mercedes  Actros e Axor: S e LS (algumas linhas juntam em "S/LS")
  Iveco     S-Way: sem rotulo, Grand Cab, Mega Cab
  VW        o nome FIPE nao distingue cabine
O que cada sigla significa fisicamente (por exemplo S e LS) nao foi confirmado em fonte; por isso so se compara rotulo
com rotulo, sem traduzir para "teto alto". "Teto alto" so vira SUPER SPACE no XF da DAF (confirmado pela operacao);
nas outras marcas vira o rotulo generico ALTO, que so combina com variantes altas conhecidas.
"""
import re
import unicodedata

ROTULOS_ALTOS = frozenset({"SUPER SPACE", "HIGHLINE", "TOPLINE", "GLOBETROTTER XL", "GLOBETROTTER"})
GENERICO_ALTO = "ALTO"


def _normaliza(texto):
    sem_acento = unicodedata.normalize("NFD", texto or "").encode("ascii", "ignore").decode()
    limpo = re.sub(r"[^A-Z0-9/]+", " ", sem_acento.upper())
    return re.sub(r"\s+", " ", limpo).strip()


def _chave_marca(marca):
    texto = _normaliza(marca)
    for chave in ("DAF", "VOLVO", "SCANIA", "MERCEDES", "IVECO"):
        if texto.startswith(chave) or (chave == "SCANIA" and "SCANIA" in texto):
            return chave
    return None


def _teto_alto(t):
    return bool(re.search(r"\bTETO ALTO\b", t))


def _daf(t):
    if re.search(r"\bSUPER ?SPACE\b|\bSUP SPA\b", t):
        return "SUPER SPACE"
    if _teto_alto(t) and re.search(r"\bXF\b", t):
        return "SUPER SPACE"
    if re.search(r"\bDAY\b", t):
        return "DAY"
    if re.search(r"\bSLEEP(?:ER)?\b|\bSPLEEP\b", t):
        return "SLEEPER"
    if re.search(r"\bSPACE\b", t):
        return "SPACE"
    return GENERICO_ALTO if _teto_alto(t) else None


def _volvo(t):
    if re.search(r"\bGLOB\w*\s+XL\b", t) or (re.search(r"\bFH\b", t) and re.search(r"\bXL\b", t)):
        return "GLOBETROTTER XL"
    if re.search(r"\bGLOB\w*\b", t):
        return "GLOBETROTTER"
    return GENERICO_ALTO if _teto_alto(t) else None


def _scania(t):
    if re.search(r"\bTOP ?L(?:INE)?\b", t):
        return "TOPLINE"
    if re.search(r"\bHIG(?:H)?(?: ?LINE)?\b", t):
        return "HIGHLINE"
    return GENERICO_ALTO if _teto_alto(t) else None


def _mercedes(t):
    if re.search(r"\bACTROS\b|\bAXOR\b", t):
        if re.search(r"\bS ?/ ?LS\b", t):
            return "S/LS"
        if re.search(r"\bLS\b", t):
            return "LS"
        if re.search(r"\b(?:ACTROS|AXOR) ?\d{4} ?(?:MP\d )?S\b", t):
            return "S"
    return GENERICO_ALTO if _teto_alto(t) else None


def _iveco(t):
    if re.search(r"\bMEGA ?CAB\b", t):
        return "MEGA CAB"
    if re.search(r"\bGRAND ?CAB\b", t):
        return "GRAND CAB"
    return GENERICO_ALTO if _teto_alto(t) else None


_POR_MARCA = {"DAF": _daf, "VOLVO": _volvo, "SCANIA": _scania, "MERCEDES": _mercedes, "IVECO": _iveco}


def cabine_marca(texto, marca):
    """Rotulo de cabine no texto (titulo de anuncio ou nome FIPE), ou None quando nao ha como saber."""
    detecta = _POR_MARCA.get(_chave_marca(marca))
    if detecta is None:
        return None
    return detecta(_normaliza(texto))


def cabine_compativel(rotulo_anuncio, rotulo_fipe):
    """O rotulo do anuncio serve para este registro FIPE?"""
    if rotulo_anuncio is None or rotulo_fipe is None:
        return False
    if rotulo_anuncio == rotulo_fipe:
        return True
    if rotulo_anuncio == GENERICO_ALTO:
        return rotulo_fipe in ROTULOS_ALTOS
    if "/" in rotulo_fipe:
        return rotulo_anuncio in rotulo_fipe.split("/")
    return False
