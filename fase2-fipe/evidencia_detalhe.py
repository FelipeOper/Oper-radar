"""Evidencia do detalhe do anuncio usada SOMENTE para desempate.

Nunca introduz familia nem numero de modelo: a descricao livre cita outros veiculos.
"""
import re

from fipe_sync import cabine_daf, cambio_daf, eixo_do_anuncio, eixos, emissao_no_texto, normaliza, texto_anuncio

TOKEN_CABINE = {"SPACE": "SPACE CAB", "SUPER SPACE": "SUPER SPACE CAB", "DAY": "DAY CAB", "SLEEPER": "SLEEPER"}
RE_CAMBIO_DETALHE = re.compile(r"\bCAMBIO\s+(AUT|AUTO|AUTOMATICO|AUTOMATICA|MEC|MECANICO|MECANICA|MANUAL)\b")


def _texto_detalhe(anuncio):
    partes = (anuncio.get("descricao"), anuncio.get("opcionais"), anuncio.get("carroceria"))
    return " ".join(str(p) for p in partes if p)[:2000]


def _valor_unico(valores):
    valores = {v for v in valores if v}
    return next(iter(valores)) if len(valores) == 1 else None


def _trechos(texto):
    # Divide em frases para que "6x2 ou 6x4" gere dois valores, nunca um achado arbitrario.
    return re.split(r"[.;\n,/]|\bou\b", texto, flags=re.IGNORECASE)


def _cambio_do_detalhe(detalhe):
    achados = {"AUTOMATICO" if m.group(1).startswith("AUT") else "MECANICO"
               for m in RE_CAMBIO_DETALHE.finditer(detalhe)}
    return _valor_unico(achados)


def aumenta_com_detalhe(anuncio):
    detalhe = normaliza(_texto_detalhe(anuncio))
    if not detalhe.strip():
        return anuncio
    resultado = dict(anuncio)

    if eixo_do_anuncio(anuncio) == (None, None):
        eixo = _valor_unico({eixos(t) for t in _trechos(detalhe)})
        if eixo:
            resultado["tracao"] = f"{anuncio.get('tracao') or ''} {eixo}".strip()

    base = " ".join(str(anuncio.get(c) or "") for c in ("titulo", "url", "modelo", "tracao"))
    extras = []
    if not emissao_no_texto(base):
        emissao = _valor_unico({emissao_no_texto(t) for t in _trechos(detalhe)})
        if emissao:
            extras.append("EURO 6" if emissao == "E6" else "EURO 5")
    if not cabine_daf(base):
        cabine = _valor_unico({cabine_daf(t) for t in _trechos(detalhe)})
        if cabine:
            extras.append(TOKEN_CABINE.get(cabine, cabine))
    if not cambio_daf(base):
        cambio = _cambio_do_detalhe(detalhe)
        if cambio:
            extras.append(cambio)
    if extras:
        resultado["modelo"] = f"{anuncio.get('modelo') or ''} {' '.join(extras)}".strip()
    return resultado
