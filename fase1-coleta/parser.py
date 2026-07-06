"""
OPER RADAR — Fase 1
Extração de anúncios a partir da página de uma revenda no portal Caminhões e Carretas.

Esta versão usa regex sobre o texto/markdown da página. Em produção, com o HTML bruto
disponível via `requests`, o ideal é trocar por BeautifulSoup + seletores CSS reais
(mais robusto a mudanças de formatação) — mas a lógica de extração de campos abaixo
já foi validada contra uma página real do portal (SVD Seminovos, Curitiba/PR).
"""
import re
import hashlib
from dataclasses import dataclass
from typing import Optional, List

VEICULO_URL_RE = re.compile(
    r"\[(?P<titulo>[^\]]+)\]\((?P<url>https://www\.caminhoesecarretas\.com\.br/veiculo/[^)]+)\)"
)
PRECO_RE = re.compile(r"R\$\s*([\d.]+),\d{2}")
PRECO_CONSULTAR_RE = re.compile(r"\(A consultar\)")
ANO_RE = re.compile(r"(\d{4})/(\d{4})")


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


def _extrai_id_da_url(url: str) -> int:
    # URL termina em .../<slug-revenda>/<id-numerico>
    return int(url.rstrip("/").split("/")[-1])


def _extrai_tipo_e_marca_da_url(url: str) -> tuple[Optional[str], Optional[str]]:
    # Formato: /veiculo/<cidade>/<uf>/<tipo>/<marca>/<modelo>/<ano>/.../<revenda>/<id>
    partes = url.split("/veiculo/")[-1].split("/")
    tipo = partes[2].capitalize() if len(partes) > 2 else None
    marca = partes[3].replace("-", " ").upper() if len(partes) > 3 else None
    return tipo, marca


def parse_listings(page_text: str) -> List[Anuncio]:
    """Extrai todos os anúncios de uma página de revenda (texto/markdown extraído)."""
    anuncios = []
    # Cada bloco de anúncio começa no link do título e vai até o próximo "## [" ou fim do texto
    blocos = re.split(r"(?=## \[)", page_text)
    for bloco in blocos:
        m = VEICULO_URL_RE.search(bloco)
        if not m:
            continue
        titulo, url = m.group("titulo"), m.group("url")
        anuncio_id = _extrai_id_da_url(url)
        tipo, marca = _extrai_tipo_e_marca_da_url(url)

        ano_m = ANO_RE.search(titulo)
        ano_inicial = int(ano_m.group(1)) if ano_m else None
        ano_final = int(ano_m.group(2)) if ano_m else None

        preco_m = PRECO_RE.search(bloco)
        if preco_m:
            preco = float(preco_m.group(1).replace(".", ""))
            preco_texto_bruto = preco_m.group(0)
        elif PRECO_CONSULTAR_RE.search(bloco):
            preco = None
            preco_texto_bruto = "(A consultar)"
        else:
            preco = None
            preco_texto_bruto = ""

        anuncios.append(Anuncio(
            anuncio_portal_id=anuncio_id, url=url, titulo=titulo, tipo=tipo, marca=marca,
            ano_inicial=ano_inicial, ano_final=ano_final, preco=preco, preco_texto_bruto=preco_texto_bruto,
        ))
    return anuncios


def hash_pagina(page_text: str) -> str:
    """Hash estável do conteúdo da página — usado para pular reprocessamento sem mudança."""
    return hashlib.sha256(page_text.encode("utf-8")).hexdigest()


if __name__ == "__main__":
    with open("sample_page.md", encoding="utf-8") as f:
        texto = f.read()
    resultado = parse_listings(texto)
    print(f"{len(resultado)} anúncios extraídos:\n")
    for a in resultado:
        print(f"  #{a.anuncio_portal_id} | {a.titulo} | {a.tipo}/{a.marca} | "
              f"{a.ano_inicial}/{a.ano_final} | {a.preco_texto_bruto}")
    print(f"\nhash da página: {hash_pagina(texto)[:16]}...")
