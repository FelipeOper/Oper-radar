"""
OPER RADAR — Fase 1
Extração de anúncios a partir da página de uma revenda no portal Caminhões e Carretas.

v2 — reescrito para trabalhar em cima do HTML BRUTO de verdade (recebido via `requests`
em produção), não mais do texto simplificado que aparecia nas ferramentas de leitura do
chat. A estrutura real foi confirmada direto no servidor de produção (curl + grep numa
página de revenda ao vivo): cada anúncio é um bloco
`<div class="list-product list-view-item">...</div>`, com até 3 links repetidos pro mesmo
anúncio (imagem, título, botão "Ver Mais") — por isso extraímos 1 anúncio por BLOCO, não
por link.
"""
import re
import html as html_lib
import hashlib
from dataclasses import dataclass
from typing import Optional, List

BASE_URL = "https://www.caminhoesecarretas.com.br"

# Cada anúncio vive dentro de um bloco assim — cortamos a página nesses pontos.
BLOCO_INICIO_RE = re.compile(r'(?=<div class="list-product list-view-item">)')

# Dentro do bloco: primeiro link /veiculo/... encontrado (pega o mesmo ID nas 3 ocorrências).
HREF_RE = re.compile(r'href="(/veiculo/[a-z0-9/-]+/(\d+))"')
TITULO_RE = re.compile(r'<h2 class="h16">\s*(.*?)\s*</h2>', re.DOTALL)
PRECO_RE = re.compile(r'<span class="money">\s*(R\$[^<]+)</span>')
ANO_RE = re.compile(r"\b((?:19|20)\d{2})\s*/\s*(\d{2}|(?:19|20)\d{2})\b(?:\s*\(\s*((?:19|20)\d{2})\s*\))?")
KM_RE = re.compile(r"(?:quilometragem|od[oô]metro)?\s*[:\-]?\s*([\d.]+)\s*(km|quil[oô]metros?)\b", re.IGNORECASE)
HORAS_RE = re.compile(r"(?:hor[ií]metro|horas?\s+de\s+uso)\s*[:\-]?\s*([\d.]+)\s*(?:h|horas?)?\b", re.IGNORECASE)

# Marcas de caminhão (posição fixa no path: /veiculo/.../<tipo>/<marca>/<modelo>/...)
# Esta lista pequena é só um FALLBACK para quando taxonomia.json ainda não foi gerado
# (rodando `python taxonomia.py` a partir do discovery real no portal — ver taxonomia.py).
MARCAS_CAMINHAO_FALLBACK = {
    "daf", "volvo", "scania", "mercedes-benz", "iveco", "man", "ford", "vw",
    "volkswagen", "agrale", "gm", "hyundai", "mack",
}

# Marcas vistas em anúncios reais durante esta sessão mas que o primeiro discovery
# (taxonomia.json) ainda não capturou nas categorias de carreta e trator.
MARCAS_EXTRA_FALLBACK = {
    "pastre", "rodomoura", "bertolini", "rossetti", "fibraforte", "rodotec",
    "recrusul", "sanchezi", "kaili",
    "massey-ferguson", "valtra", "landini", "mahindra", "ls-tractor", "foton",
    "stara", "yanmar",
}


def _carrega_marcas_conhecidas() -> set[str]:
    try:
        from taxonomia import carrega_marcas_conhecidas
        marcas = carrega_marcas_conhecidas()
        return {m.lower().replace(" ", "-") for m in marcas} | MARCAS_CAMINHAO_FALLBACK | MARCAS_EXTRA_FALLBACK
    except (FileNotFoundError, ImportError):
        return set(MARCAS_CAMINHAO_FALLBACK) | MARCAS_EXTRA_FALLBACK


MARCAS_CONHECIDAS = _carrega_marcas_conhecidas()


@dataclass
class Anuncio:
    anuncio_portal_id: int
    url: str
    titulo: str
    tipo: Optional[str]
    marca: Optional[str]
    ano_inicial: Optional[int]
    ano_final: Optional[int]
    preco: Optional[float]
    preco_texto_bruto: str
    km_ou_horas: Optional[str] = None


def _limpa_texto_html(texto: str) -> str:
    """Decodifica entidades HTML (&nbsp;, &#226; etc) e colapsa espaços/quebras de linha."""
    texto = html_lib.unescape(texto)
    return re.sub(r"\s+", " ", texto).strip()


def _extrai_km_ou_horas(bloco: str) -> Optional[str]:
    """Usa apenas um valor explicitamente rotulado; nunca deduz quilometragem."""
    texto = _limpa_texto_html(re.sub(r"<[^>]+>", " ", bloco))
    km = KM_RE.search(texto)
    if km:
        valor = int(re.sub(r"\D", "", km.group(1)))
        return f"{valor} km"
    horas = HORAS_RE.search(texto)
    if horas:
        valor = int(re.sub(r"\D", "", horas.group(1)))
        return f"{valor} horas"
    return None


def _extrai_anos(titulo: str) -> tuple[Optional[int], Optional[int]]:
    """Retorna (fabricacao, modelo), inclusive para formatos como 2021/22 (2022)."""
    match = ANO_RE.search(titulo)
    if not match:
        return None, None
    fabricacao = int(match.group(1))
    modelo_bruto = match.group(2)
    if len(modelo_bruto) == 2:
        modelo = (fabricacao // 100) * 100 + int(modelo_bruto)
        if modelo < fabricacao - 1:
            modelo += 100
    else:
        modelo = int(modelo_bruto)
    modelo_parenteses = int(match.group(3)) if match.group(3) else None
    if modelo_parenteses is not None and fabricacao <= modelo_parenteses <= fabricacao + 2:
        modelo = modelo_parenteses
    return fabricacao, modelo


def _extrai_tipo_e_marca_da_url(url_relativa: str) -> tuple[Optional[str], Optional[str]]:
    # Formato: /veiculo/<cidade>/<uf>/<tipo>/<...várias partes descritivas.../<revenda>/<id>
    partes = url_relativa.strip("/").split("/")
    # partes[0] == "veiculo"
    tipo = partes[3].capitalize() if len(partes) > 3 else None

    for segmento in partes:
        if segmento.lower() in MARCAS_CONHECIDAS:
            return tipo, segmento.replace("-", " ").upper()

    return tipo, None  # marca não reconhecida — fica None em vez de errada


def parse_listings(html: str) -> List[Anuncio]:
    """Extrai todos os anúncios de uma página de revenda (HTML bruto, como vem do `requests`)."""
    anuncios = []
    ids_ja_processados = set()

    blocos = BLOCO_INICIO_RE.split(html)
    for bloco in blocos:
        href_m = HREF_RE.search(bloco)
        if not href_m:
            continue
        url_relativa, anuncio_id_str = href_m.group(1), href_m.group(2)
        anuncio_id = int(anuncio_id_str)
        if anuncio_id in ids_ja_processados:
            continue  # o mesmo bloco não devia repetir, mas por segurança
        ids_ja_processados.add(anuncio_id)

        tipo, marca = _extrai_tipo_e_marca_da_url(url_relativa)

        titulo_m = TITULO_RE.search(bloco)
        titulo = _limpa_texto_html(titulo_m.group(1)) if titulo_m else str(anuncio_id)

        ano_inicial, ano_final = _extrai_anos(titulo)

        preco_m = PRECO_RE.search(bloco)
        if preco_m:
            preco_texto_bruto = _limpa_texto_html(preco_m.group(1))
            valor_str = re.search(r"[\d.]+,\d{2}", preco_texto_bruto)
            preco = float(valor_str.group(0).replace(".", "").replace(",", ".")) if valor_str else None
        else:
            preco = None
            preco_texto_bruto = "(A consultar)" if "consultar" in bloco.lower() else ""

        km_ou_horas = _extrai_km_ou_horas(bloco)

        anuncios.append(Anuncio(
            anuncio_portal_id=anuncio_id, url=f"{BASE_URL}{url_relativa}", titulo=titulo,
            tipo=tipo, marca=marca, ano_inicial=ano_inicial, ano_final=ano_final,
            preco=preco, preco_texto_bruto=preco_texto_bruto, km_ou_horas=km_ou_horas,
        ))
    return anuncios


def hash_pagina(page_text: str) -> str:
    """Hash estável do conteúdo da página — usado para pular reprocessamento sem mudança."""
    return hashlib.sha256(page_text.encode("utf-8")).hexdigest()


if __name__ == "__main__":
    with open("sample_page_real.html", encoding="utf-8") as f:
        texto = f.read()
    resultado = parse_listings(texto)
    print(f"{len(resultado)} anúncios extraídos:\n")
    for a in resultado:
        print(f"  #{a.anuncio_portal_id} | {a.titulo} | {a.tipo}/{a.marca} | "
              f"{a.ano_inicial}/{a.ano_final} | {a.preco_texto_bruto}")
    print(f"\nhash da página: {hash_pagina(texto)[:16]}...")
