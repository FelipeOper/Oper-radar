"""
OPER RADAR — Fase 1, extensão
Extração de campos da página INDIVIDUAL de um anúncio (/veiculo/.../<id>), diferente de
parser.py (que só lê a página de LISTAGEM de uma revenda). Escopo desta etapa: só caminhões.

Estrutura confirmada em duas amostras reais (revendas diferentes): a seção "Detalhes do
Veículo" tem uma coluna de <h3 style="font-size: 15px; font-weight: 500; ...">Label:
<strong>Valor</strong></h3> (Preço, Tipo, Marca, Modelo, Ano, Ano do Modelo, Carroceria, Cor,
Quilometragem, Tração); "Opcionais do Veículo" é uma lista de
<div><i class="fa fa-check"></i>&nbsp;<h3 style="display: inline; ...">Item</h3></div>;
"Descrição do Veículo" é um <p style="font-weight: 400 !important; font-size: 14px; ...">.
"""
import html as html_lib
import json
import re
import unicodedata

# Ancorado no style= inline exato — mais específico e menos propenso a colidir com outro
# trecho da página do que casar pelo texto do título da seção.
FICHA_H3_RE = re.compile(
    r'<h3\s+style="font-size:\s*15px;\s*font-weight:\s*500[^"]*">\s*'
    r'([^:<]+?)\s*:\s*<strong>\s*([^<]*?)\s*</strong>',
    re.IGNORECASE | re.DOTALL,
)
OPCIONAL_RE = re.compile(r'<i class="fa fa-check"></i>&nbsp;<h3[^>]*>\s*(.*?)\s*</h3>', re.DOTALL)
DESCRICAO_RE = re.compile(
    r'<p style="font-weight:\s*400\s*!important;\s*font-size:\s*14px[^"]*">\s*(.*?)\s*</p>',
    re.DOTALL,
)

TAMANHO_MINIMO_PAGINA_VALIDA = 8000


def _limpa(texto: str) -> str:
    texto = html_lib.unescape(texto)
    return re.sub(r"\s+", " ", texto).strip()


def _normaliza_rotulo(rotulo: str) -> str:
    sem_acento = unicodedata.normalize("NFD", rotulo).encode("ascii", "ignore").decode()
    return sem_acento.lower().strip()


def _extrai_ficha_tecnica(html: str) -> dict:
    """Mapa rótulo-normalizado -> valor limpo. Inclui Preço/Tipo/Marca/Ano, que já vêm de
    outra fonte (listagem) e são ignorados pelo caller — não é erro estarem aqui."""
    ficha = {}
    for rotulo, valor in FICHA_H3_RE.findall(html):
        ficha[_normaliza_rotulo(rotulo)] = _limpa(valor)
    return ficha


def _extrai_km(ficha: dict):
    bruto = ficha.get("quilometragem")
    if not bruto:
        return None
    digitos = re.sub(r"\D", "", bruto)
    if not digitos:
        return None
    return f"{int(digitos)} km"


def parse_detalhe(html: str) -> dict:
    ficha = _extrai_ficha_tecnica(html)
    opcionais = [_limpa(o) for o in OPCIONAL_RE.findall(html)]

    descricao = None
    descricao_m = DESCRICAO_RE.search(html)
    if descricao_m:
        bruto = re.sub(r"<br\s*/?>", "\n", descricao_m.group(1))
        bruto = html_lib.unescape(re.sub(r"<[^>]+>", " ", bruto))
        bruto = re.sub(r"[ \t]+", " ", bruto).strip()
        descricao = bruto or None

    return {
        "modelo": ficha.get("modelo"),
        "cor": ficha.get("cor"),
        "carroceria": ficha.get("carroceria"),
        "tracao": ficha.get("tracao"),
        "km_ou_horas": _extrai_km(ficha),
        "opcionais_json": json.dumps(opcionais, ensure_ascii=False) if opcionais else None,
        "descricao": descricao,
        "campos_encontrados": len(ficha) + len(opcionais) + (1 if descricao else 0),
    }


def parece_bloqueio_ou_pagina_invalida(html: str, campos_encontrados: int) -> bool:
    """Circuit breaker: distingue "anúncio genuinamente pobre em specs" de "página de
    challenge/erro do Cloudflare" — sem isso, um bloqueio no meio de um lote gravaria
    detalhe_coletado_em em massa com campos vazios, e a fila nunca mais os reprocessaria."""
    amostra = html[:3000].lower()
    if "cloudflare" in amostra or "challenge" in amostra or "attention required" in amostra:
        return True
    if campos_encontrados == 0 and len(html) < TAMANHO_MINIMO_PAGINA_VALIDA:
        return True
    return False


if __name__ == "__main__":
    with open("sample_detalhe_real.html", encoding="utf-8") as f:
        texto = f.read()
    resultado = parse_detalhe(texto)
    for chave, valor in resultado.items():
        print(f"  {chave}: {valor}")
