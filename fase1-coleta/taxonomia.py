"""
OPER RADAR — Fase 1
Descoberta de taxonomia (marcas e modelos) direto do portal Caminhões e Carretas.

Ideia central (sugestão do Felipe): em vez de manter uma lista de marcas escrita à mão,
o próprio portal já expõe a lista oficial e completa nos filtros de cada categoria
(ex: /venda/carreta/semi-reboque/marca/25 tem um bloco "Fabricante" com todas as marcas
de carreta, e um bloco "Modelo" com todos os tipos de carroceria). Como o portal é o
maior do nicho no Brasil, essa lista tende a cobrir praticamente tudo que se vende de
pesados e extrapesados no país — e se atualiza sozinha quando o portal adiciona marcas
novas, bastando rodar esse discovery de novo periodicamente (ex: 1x por mês).
"""
import json
import re
import time
from dataclasses import dataclass, asdict
from typing import Optional

import requests

HEADERS = {"User-Agent": "Mozilla/5.0 (OPER RADAR monitoring bot; contato@agenciaoper.com.br)"}

FABRICANTE_ITEM_RE = re.compile(r"\* \[([^\]]+)\]\([^)]*\?fabricante=[^)]+\)")
MODELO_ITEM_RE = re.compile(r"\* \[([^\]]+)\]\([^)]*/modelo/(\d+)\)")
TIPO_LIST_RE = re.compile(r"\* \(Todos os Tipos\)\n((?:[A-ZÀ-Ú ]+\n?)+)")
# Ônibus/micro-ônibus usam um link de categoria diferente do "?fabricante=" das carretas:
# "### [NOME](/venda/onibus/slug/marca/123)" — encarroçadora — e um filtro à parte pro chassi.
ENCARROCADORA_ITEM_RE = re.compile(r"### \[([^\]]+)\]\(/venda/[a-z-]+/[a-z0-9%\-]+/marca/\d+\)")
CHASSI_ITEM_RE = re.compile(r"\* \[([^\]]+)\]\([^)]*\?chassi=[^)]+\)")

# Categorias relevantes para o nicho de caminhões pesados/extrapesados (Fase 1 do OPER RADAR).
# Cada entrada é a URL de uma página de categoria/subcategoria que tem os filtros de
# Fabricante e Modelo — é dessas páginas que a taxonomia é extraída.
CATEGORIAS_RELEVANTES = {
    "caminhao": "https://www.caminhoesecarretas.com.br/venda/caminhao",
    "carreta_semi_reboque": "https://www.caminhoesecarretas.com.br/venda/carreta/semi-reboque/marca/25",
    "trator": "https://www.caminhoesecarretas.com.br/venda/trator",
    "onibus": "https://www.caminhoesecarretas.com.br/venda/onibus/3",
    "vans": "https://www.caminhoesecarretas.com.br/venda/vans/12",
    "utilitarios": "https://www.caminhoesecarretas.com.br/venda/utilitarios/37",
}

# Ônibus/micro-ônibus tem DUAS dimensões de marca no portal, não uma:
#   - "marca" = a encarroçadora (Busscar, Marcopolo, Comil, Caio, Mascarello, Nielson, Neobus)
#     -> fica em posição fixa no path, igual caminhão (/veiculo/.../onibus/<encarrocadora>/...)
#   - "chassi" = o fabricante do chassi (Mercedes-Benz, Scania, Volvo, Volkswagen, Volare)
#     -> aparece mais adiante no path, como um segmento a mais
# Confirmado via fetch real de https://www.caminhoesecarretas.com.br/venda/onibus/3
ENCARROCADORAS_ONIBUS = {
    "busscar", "marcopolo", "caio", "comil", "mascarello", "nielson", "neobus", "chassi",
}
CHASSIS_ONIBUS = {"mercedes-benz", "scania", "volare", "volkswagen", "volvo"}


@dataclass
class Taxonomia:
    tipos_disponiveis: list       # todas as categorias de veículo que o portal vende
    marcas_por_categoria: dict    # {categoria: [marca1, marca2, ...]}
    modelos_por_categoria: dict   # {categoria: [(nome_modelo, id_modelo), ...]}


def extrai_marcas(texto: str) -> list[str]:
    return sorted(set(m.upper() for m in FABRICANTE_ITEM_RE.findall(texto)))


def extrai_encarrocadoras(texto: str) -> list[str]:
    return sorted(set(m.upper() for m in ENCARROCADORA_ITEM_RE.findall(texto) if m.upper() != "CHASSI"))


def extrai_chassis(texto: str) -> list[str]:
    return sorted(set(m.upper() for m in CHASSI_ITEM_RE.findall(texto)))


def extrai_modelos(texto: str) -> list[tuple[str, str]]:
    return sorted(set((nome.upper(), modelo_id) for nome, modelo_id in MODELO_ITEM_RE.findall(texto)))


def extrai_tipos_disponiveis(texto: str) -> list[str]:
    m = TIPO_LIST_RE.search(texto)
    if not m:
        return []
    return [linha.strip() for linha in m.group(1).splitlines() if linha.strip()]


def fetch_categoria(url: str) -> str:
    resp = requests.get(url, headers=HEADERS, timeout=20)
    resp.raise_for_status()
    return resp.text


def descobre_taxonomia_completa(categorias: dict = CATEGORIAS_RELEVANTES, pausa_segundos: float = 1.5) -> Taxonomia:
    """Roda o discovery em todas as categorias relevantes.
    pausa_segundos existe para não bater no portal em sequência rápida demais."""
    marcas_por_categoria = {}
    modelos_por_categoria = {}
    tipos_disponiveis = []

    for i, (nome_categoria, url) in enumerate(categorias.items()):
        texto = fetch_categoria(url)
        # Categorias diferentes usam padrões de link diferentes no portal (ver notas em
        # ENCARROCADORA_ITEM_RE vs FABRICANTE_ITEM_RE) — mesclar os dois extratores é
        # seguro, já que cada um só retorna algo quando o padrão dele realmente aparece.
        marcas_por_categoria[nome_categoria] = sorted(set(extrai_marcas(texto)) | set(extrai_encarrocadoras(texto)))
        modelos_por_categoria[nome_categoria] = extrai_modelos(texto)
        if not tipos_disponiveis:
            tipos_disponiveis = extrai_tipos_disponiveis(texto)
        if i < len(categorias) - 1:
            time.sleep(pausa_segundos)

    return Taxonomia(
        tipos_disponiveis=tipos_disponiveis,
        marcas_por_categoria=marcas_por_categoria,
        modelos_por_categoria=modelos_por_categoria,
    )


def salva_taxonomia(taxonomia: Taxonomia, caminho: str = "taxonomia.json"):
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(asdict(taxonomia), f, ensure_ascii=False, indent=2)


def carrega_marcas_conhecidas(caminho: str = "taxonomia.json") -> set[str]:
    """Usado pelo parser.py: junta as marcas de todas as categorias num único set
    para checagem rápida ao processar um anúncio."""
    with open(caminho, encoding="utf-8") as f:
        taxonomia = json.load(f)
    marcas = set()
    for lista in taxonomia["marcas_por_categoria"].values():
        marcas.update(lista)
    return marcas


if __name__ == "__main__":
    # Teste local com o texto real já coletado da página de carreta/semi-reboque
    with open("sample_categoria_carreta.md", encoding="utf-8") as f:
        texto = f.read()

    marcas = extrai_marcas(texto)
    modelos = extrai_modelos(texto)
    tipos = extrai_tipos_disponiveis(texto)

    print(f"{len(tipos)} tipos de veículo disponíveis no portal:")
    print(" ", ", ".join(tipos[:8]), "...")
    print(f"\n{len(marcas)} marcas encontradas para carreta/semi-reboque:")
    print(" ", ", ".join(marcas))
    print(f"\n{len(modelos)} modelos/carrocerias encontrados:")
    for nome, modelo_id in modelos:
        print(f"   #{modelo_id} {nome}")
