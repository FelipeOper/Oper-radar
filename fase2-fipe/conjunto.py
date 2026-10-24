"""Detecta anuncio de CONJUNTO (cavalo mecanico + carreta/semirreboque vendidos juntos).

O portal herda o tipo e a FIPE so do cavalo, mas o preco anunciado e do conjunto; comparar esse
preco com a FIPE do cavalo infla o desvio. Aqui so entram sinais EXPLICITOS no titulo ou na URL.
Palavras que tambem aparecem em caminhao isolado (baú, tanque, bitruck, "com carroceria") ficam de fora.
A classificacao automatica pode errar: a auditoria da tela permite corrigir, e o manual sempre vence.
"""
import re
import unicodedata

CARRETEIRAS = r"RANDON|FACCHINI|NOMA|LIBRELATO|GUERRA|ROSSETTI|RODOTEC|BRASPAMPA|KRONE"
ALVO_ENGATADO = r"CARRETA|SEMI ?REBOQUE|SEMIRREBOQUE|REBOQUE|BITREM|RODOTREM|TREMINHAO|PRANCHA|" + CARRETEIRAS

PADROES = [
    re.compile(r"\bCONJUNTO\b(?!\s+(DE|DO|DA|DOS|DAS)\b)"),
    re.compile(r"\bCONJ\b"),
    re.compile(r"\bBITREM\b"),
    re.compile(r"\bRODOTREM\b"),
    re.compile(r"\bTREMINHAO\b"),
    re.compile(r"\bROMEU\s*(E|&)\s*JULIETA\b"),
    re.compile(r"\+\s*(" + ALVO_ENGATADO + r")\b"),
    re.compile(r"\b(COM|C/|C)\s*(CARRETA|SEMI ?REBOQUE|SEMIRREBOQUE|REBOQUE|BITREM|RODOTREM)\b"),
    re.compile(r"\bCAVALO\s*(E|&)\s*(CARRETA|SEMI ?REBOQUE|SEMIRREBOQUE)\b"),
]


def _normaliza(texto):
    sem_acento = unicodedata.normalize("NFD", texto or "").encode("ascii", "ignore").decode()
    limpo = re.sub(r"[^A-Z0-9+/&]+", " ", sem_acento.upper().replace("-", " "))
    return re.sub(r"\s+", " ", limpo).strip()


def detecta_conjunto(titulo, url=None):
    texto = _normaliza(f"{titulo or ''} {_trecho_da_url(url)}")
    return bool(texto) and any(padrao.search(texto) for padrao in PADROES)


def _trecho_da_url(url):
    if not url:
        return ""
    partes = [p for p in str(url).split("/") if p]
    return " ".join(partes[-4:-1]) if len(partes) >= 4 else ""
