"""
OPER RADAR — Fase 2: sincronizacao com a tabela FIPE
Fonte: https://fipe.parallelum.com.br/api/v2 (endpoint 'trucks').

Estrategia incremental: nao baixa a FIPE inteira. Olha os anuncios reais do banco,
mantem uma tabela local e separa tres operacoes:
  bootstrap: descobre combinacoes novas usando a API;
  local: vincula anuncios usando apenas o cache MySQL;
  mensal: atualiza os precos armazenados quando a referencia FIPE muda.

Uso normal:
  set -a; . /root/.oper-radar.env; set +a
  python3 fipe_sync.py --max-req=400

Diagnostico (NAO gasta requisicao, so mostra os scores do matching):
  python3 fipe_sync.py --debug
"""
import argparse
import os
import re
import time
import unicodedata
from pathlib import Path

import requests
import mysql.connector

BASE = "https://fipe.parallelum.com.br/api/v2"
PAUSA = float(os.getenv("FIPE_API_PAUSE", "1.0"))

# Marca como vem do portal -> como aparece na FIPE (quando os nomes diferem)
MAPA_MARCA = {
    "VW": "VOLKSWAGEN", "VOLKSWAGEN": "VOLKSWAGEN",
    "MB": "MERCEDES-BENZ", "MERCEDES BENZ": "MERCEDES-BENZ", "MERCEDES": "MERCEDES-BENZ",
    "GM": "CHEVROLET",
}

contador_req = 0
max_req = 400
headers_api = {}
referencia_codigo = None
referencia_mes = None


def api_get(path):
    global contador_req
    if max_req > 0 and contador_req >= max_req:
        raise RuntimeError(f"Limite de {max_req} requisicoes atingido — rode de novo depois, continua de onde parou.")
    contador_req += 1
    r = requests.get(f"{BASE}{path}", headers=headers_api, timeout=20)
    if r.status_code == 429:
        raise RuntimeError("A API FIPE atingiu o limite de requisicoes. A fila continua na proxima rodada.")
    if r.status_code in (401, 403):
        raise RuntimeError(f"A API FIPE recusou a autenticacao (HTTP {r.status_code}).")
    r.raise_for_status()
    time.sleep(PAUSA)
    return r.json()


def com_referencia(path, codigo=None):
    """Fixa a consulta no mes escolhido sem quebrar caminhos que ja possuem query string."""
    if not codigo:
        return path
    separador = "&" if "?" in path else "?"
    return f"{path}{separador}reference={codigo}"


def obtem_referencia_atual():
    """Retorna a referencia mais recente publicada pela API."""
    referencias = api_get("/references")
    if not referencias:
        raise RuntimeError("A API FIPE nao retornou referencias mensais.")
    atual = referencias[0]
    return int(atual["code"]), atual["month"]


# Tokens de marca e ruido que nao servem pra identificar modelo
MARCAS_RUIDO = {"MB", "VW", "GM", "MERCEDES", "BENZ", "SCANIA", "VOLVO", "DAF", "IVECO",
                "FORD", "AGRALE", "VOLKSWAGEN", "CHEVROLET", "MARCOPOLO", "SAAB"}
# Palavras da FIPE que descrevem acabamento/combustivel, nao a linha do caminhao.
# Comparadas por PREFIXO porque a FIPE abrevia: "Dies.", "Stre.", "High.", "Constel."
RUIDO_RAIZES = ("DIESEL", "STREAMLINE", "HIGHLINE", "TOPLINE", "ELETRICO",
                "EIXOS", "CABINE", "LEITO", "TURBO", "NORMAL", "AUTOMATICO",
                "CAVALO", "MECANICO", "CAMINHAO", "TRUCK", "SPACE", "CAB")

FAMILIAS_FIPE = {
    "DELIVERY": ("DELIVERY",), "CONSTELLATION": ("CONSTELLATION", "CONSTEL"),
    "WORKER": ("WORKER", "WORK"), "METEOR": ("METEOR",),
    "ATEGO": ("ATEGO",), "ACCELO": ("ACCELO",), "AXOR": ("AXOR",),
    "ACTROS": ("ACTROS",), "ATRON": ("ATRON",), "EUROCARGO": ("EUROCARGO",),
    "CARGO": ("CARGO",), "TECTOR": ("TECTOR",), "HI-WAY": ("HIWAY",),
    "S-WAY": ("SWAY",), "STRALIS": ("STRALIS",), "DAILY": ("DAILY",),
    "F-MAX": ("FMAX",), "XF": ("XF",), "CF": ("CF",), "LF": ("LF",),
    "FH": ("FH",), "FM": ("FM",), "VM": ("VM",), "VERTIS": ("VERTIS",),
    "TGX": ("TGX",), "TGS": ("TGS",), "TGM": ("TGM",),
}


def normaliza(s: str) -> str:
    s = unicodedata.normalize("NFD", s or "").encode("ascii", "ignore").decode().upper()
    s = re.sub(r"(?<=\d)[.,-](?=\d)", "", s)      # "11.180" e "11-180" viram "11180"
    return re.sub(r"[^A-Z0-9]+", " ", s)


def texto_sem_anos(s: str) -> str:
    """Remove apenas anos em posicao de ano; preserva modelos como MB 1938."""
    s = s or ""
    return re.sub(
        r"\b(?:19|20)\d{2}\s*/\s*(?:\d{2}|(?:19|20)\d{2})\b(?:\s*\(\s*(?:19|20)\d{2}\s*\))?",
        " ", s,
    )


def numero_modelo(s: str):
    """O numero que identifica o modelo (440, 2430, 11180), ignorando anos."""
    numeros = re.findall(r"\d{3,5}", normaliza(texto_sem_anos(s)))
    return numeros[0] if numeros else None


def identificadores_modelo(s: str) -> set:
    """Formas equivalentes do número técnico: 29 480, 29.480 e 29-480."""
    base = unicodedata.normalize("NFD", texto_sem_anos(s) or "").encode("ascii", "ignore").decode().upper()
    grupos = re.findall(r"\d+", base)
    ids = {g for g in grupos if 3 <= len(g) <= 5}
    for esquerdo, direito in zip(grupos, grupos[1:]):
        unido = esquerdo + direito
        if 3 <= len(unido) <= 5 and 1 <= len(esquerdo) <= 2 and 2 <= len(direito) <= 3:
            ids.add(unido)
    # IVECO escreve a potência como S44T/S48T na FIPE e 440/480 no anúncio.
    for potencia in re.findall(r"\bS\s*(\d{2})\s*T\b", base):
        ids.add(potencia + "0")
    return ids


def serie(s: str):
    """Letra(s) de serie coladas ao numero: 'R440' -> 'R'; 'G-440' -> 'G'.
    Marca nao conta como serie: 'MB 2430' -> None."""
    for pref, num in re.findall(r"\b([A-Z]{1,2})[ ]?(\d{3,5})\b", normaliza(texto_sem_anos(s))):
        if pref not in MARCAS_RUIDO:
            return pref
    return None


def eh_ruido(token: str) -> bool:
    """True se o token e marca ou descreve acabamento/combustivel. Compara por prefixo:
    'DIES' e 'DIESE' sao inicio de 'DIESEL'; 'STRE'/'STREAM' de 'STREAMLINE'."""
    if token in MARCAS_RUIDO:
        return True
    return any(raiz.startswith(token) for raiz in RUIDO_RAIZES)


def palavras_chave(s: str) -> set:
    """Palavras que identificam a LINHA comercial ('Atego', 'Worker', 'Delivery').
    Pode vir vazio — varios nomes FIPE sao so numero + eixo ('R-440 A 4x2 2p (diesel)')."""
    return {t for t in normaliza(s).split()
            if t.isalpha() and len(t) >= 4 and not eh_ruido(t)}


def familia_comercial(s: str):
    """Reconhece a linha comercial sem casar siglas curtas dentro de outra palavra."""
    tokens = normaliza(texto_sem_anos(s)).split()
    compacto = "".join(tokens)
    for familia, aliases in FAMILIAS_FIPE.items():
        for alias in aliases:
            if alias in tokens or (len(alias) >= 4 and alias in compacto):
                return familia
    return None


def mesma_linha(a: set, b: set) -> bool:
    """Conjuntos vazios nunca conflitam. 'WORK' e 'WORKER' sao a mesma linha
    (a FIPE abrevia); 'ATEGO' e 'ATRON' nao."""
    if not a or not b:
        return True
    return any(x.startswith(y) or y.startswith(x) for x in a for y in b)


def eixos(s: str):
    """Configuracao de eixos: '4X2', '6X4', '8X2'... Diferencia caminhoes de preco distinto."""
    m = re.search(r"\b(\d)\s?X\s?(\d)\b", normaliza(s))
    return f"{m.group(1)}X{m.group(2)}" if m else None


def ano_modelo(anuncio: dict):
    """A FIPE e consultada pelo ano-modelo, nunca pelo ano de fabricacao."""
    return anuncio.get("ano_final") or anuncio.get("ano_inicial")


def emissao_no_texto(texto: str):
    """Le Euro 5/6 e seus equivalentes Proconve somente quando explicitos."""
    texto = normaliza(texto)
    if re.search(r"\b(?:E|EURO)\s*6\b", texto) or re.search(r"\b(?:PROCONVE\s*)?P8\b", texto):
        return "E6"
    if re.search(r"\b(?:E|EURO)\s*5\b", texto) or re.search(r"\b(?:PROCONVE\s*)?P7\b", texto):
        return "E5"
    return None


def emissao_preferida(anuncio: dict):
    """Retorna (norma, origem). Informacao explicita sempre supera a estimativa."""
    explicita = emissao_no_texto(f"{anuncio.get('titulo', '')} {anuncio.get('url', '')}")
    if explicita:
        return explicita, "explicita"
    fabricacao = anuncio.get("ano_inicial")
    if fabricacao is None:
        return None, None
    if fabricacao >= 2023:
        return "E6", "estimada_fabricacao"
    if 2012 <= fabricacao <= 2022:
        return "E5", "estimada_fabricacao"
    return None, None


def pontua_sugestao(anuncio: dict, modelo: dict):
    """Pontua uma possibilidade sem transforma-la automaticamente em verdade."""
    titulo = anuncio.get("titulo", "")
    nome_fipe = modelo.get("modelo_fipe", "")
    pontos = 20  # modelos_da_marca ja restringiu a marca
    motivos = ["marca"]

    numeros_anuncio = identificadores_modelo(titulo)
    numeros_fipe = identificadores_modelo(nome_fipe)
    anos_conhecidos = {str(a) for a in (anuncio.get("ano_inicial"), anuncio.get("ano_final")) if a}
    numeros_anuncio -= anos_conhecidos
    numeros_fipe -= anos_conhecidos
    numeros_iguais = numeros_anuncio & numeros_fipe

    familia_anuncio, familia_fipe = familia_comercial(titulo), familia_comercial(nome_fipe)
    familia_igual = bool(familia_anuncio and familia_fipe == familia_anuncio)
    if numeros_anuncio:
        if numeros_iguais:
            numero_confirmado = sorted(numeros_iguais, key=lambda n: (-len(n), n))[0]
            pontos += 48
            motivos.append(f"modelo {numero_confirmado}")
        elif not familia_igual:
            return 0, []
        else:
            motivos.append("versao a confirmar")

    if familia_anuncio:
        if familia_fipe and familia_anuncio != familia_fipe:
            return 0, []
        if familia_igual:
            pontos += 28 if numeros_iguais else 45
            motivos.append(f"familia {familia_anuncio}")

    serie_anuncio, serie_fipe = serie(titulo), serie(nome_fipe)
    if serie_anuncio and serie_fipe:
        if serie_anuncio != serie_fipe:
            return 0, []
        pontos += 12
        motivos.append(f"serie {serie_anuncio}")

    eixo_anuncio, eixo_fipe = eixos(titulo), eixos(nome_fipe)
    if eixo_anuncio and eixo_fipe:
        if eixo_anuncio == eixo_fipe:
            pontos += 8
            motivos.append(eixo_anuncio)
        else:
            pontos -= 18

    emissao, _ = emissao_preferida(anuncio)
    emissao_fipe = emissao_no_texto(nome_fipe)
    if emissao and emissao_fipe:
        if emissao == emissao_fipe:
            pontos += 8
            motivos.append(emissao)
        else:
            pontos -= 20

    if not numeros_anuncio and not familia_anuncio:
        return 0, []
    return max(0, min(99, pontos)), motivos


def avalia(titulo: str, modelo_fipe: str):
    """Devolve (score, motivo). Regra: o numero do modelo TEM que bater; se ambos
    tem letra de serie, elas TEM que ser iguais (senao 'R440' casaria com 'G-440',
    que e outro caminhao e outro preco)."""
    n_t, n_f = numero_modelo(titulo), numero_modelo(modelo_fipe)
    if not n_t or not n_f or n_t != n_f:
        return 0.0, "numero difere"
    s_t, s_f = serie(titulo), serie(modelo_fipe)
    if s_t and s_f and s_t != s_f:
        return 0.0, f"serie {s_t}!={s_f}"
    if s_t and s_f:
        return 0.95, "numero+serie"
    return 0.60, "so numero"


def garante_marcas(conn, codigo_referencia=None):
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT COUNT(*) AS n FROM fipe_modelo")
    n = cur.fetchone()["n"]
    cur.close()
    if n > 0:
        print(f"Catalogo FIPE ja em cache: {n} modelos.")
        return
    print("Catalogo FIPE vazio — baixando marcas e modelos de caminhao...")
    marcas = api_get(com_referencia("/trucks/brands", codigo_referencia))
    cur = conn.cursor()
    for m in marcas:
        print(f"  {m['name']} (id {m['code']})...")
        for mod in api_get(com_referencia(f"/trucks/brands/{m['code']}/models", codigo_referencia)):
            cur.execute(
                "INSERT IGNORE INTO fipe_modelo (marca_fipe, marca_fipe_id, modelo_fipe, modelo_fipe_id) VALUES (%s,%s,%s,%s)",
                (m["name"].upper(), int(m["code"]), mod["name"], int(mod["code"])),
            )
        conn.commit()
    cur.close()


def anuncios_pendentes(conn, limite):
    cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT id, titulo, url, marca, ano_inicial, ano_final FROM anuncio
        WHERE (fipe_preco_id IS NULL OR fipe_match_status = 'reprocessar_ano_modelo')
          AND COALESCE(fipe_vinculo_origem, 'automatico') <> 'manual'
          AND tipo = 'Caminhao' AND marca IS NOT NULL
          AND COALESCE(ano_final, ano_inicial) IS NOT NULL AND status = 'ativo'
          AND (
              fipe_ultima_tentativa IS NULL
              OR (fipe_match_status = 'erro_api'
                  AND fipe_ultima_tentativa <= DATE_SUB(NOW(), INTERVAL 1 DAY))
              OR (fipe_match_status IN ('sem_match', 'ambiguo', 'sem_ano')
                  AND fipe_ultima_tentativa <= DATE_SUB(NOW(), INTERVAL 30 DAY))
          )
        ORDER BY fipe_ultima_tentativa IS NULL DESC, fipe_ultima_tentativa ASC, id
        LIMIT %s
    """, (limite,))
    rows = cur.fetchall()
    cur.close()
    return rows


def modelos_da_marca(conn, marca_portal):
    chave = " ".join(normaliza(marca_portal).split())
    alvo = MAPA_MARCA.get(chave, chave)
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM fipe_modelo WHERE marca_fipe LIKE %s", (f"%{alvo}%",))
    rows = cur.fetchall()
    cur.close()
    if not rows and " " in alvo:  # tenta so a primeira palavra (ex: "MERCEDES")
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM fipe_modelo WHERE marca_fipe LIKE %s", (f"%{alvo.split()[0]}%",))
        rows = cur.fetchall()
        cur.close()
    return rows


def busca_preco_cache(conn, modelo, ano, codigo_referencia=None):
    cur = conn.cursor(dictionary=True)
    sql = "SELECT id FROM fipe_preco WHERE fipe_modelo_id=%s AND ano_codigo LIKE %s"
    params = [modelo["id"], f"{ano}-%"]
    if codigo_referencia is not None:
        sql += " AND referencia_codigo=%s"
        params.append(codigo_referencia)
    cur.execute(sql, tuple(params))
    achou = cur.fetchone()
    cur.close()
    return achou["id"] if achou else None


def busca_ou_cria_preco(conn, modelo, ano, codigo_referencia=None, mes_referencia=None):
    achou = busca_preco_cache(conn, modelo, ano, codigo_referencia)
    if achou:
        return achou

    anos = api_get(com_referencia(
        f"/trucks/brands/{modelo['marca_fipe_id']}/models/{modelo['modelo_fipe_id']}/years",
        codigo_referencia,
    ))
    ano_alvo = next((a for a in anos if a["code"].startswith(str(ano))), None)
    if not ano_alvo:
        return None

    dados = api_get(com_referencia(
        f"/trucks/brands/{modelo['marca_fipe_id']}/models/{modelo['modelo_fipe_id']}/years/{ano_alvo['code']}",
        codigo_referencia,
    ))
    preco = parse_preco(dados.get("price", ""))

    cur = conn.cursor()
    cur.execute(
        "INSERT INTO fipe_preco (fipe_modelo_id, ano_codigo, codigo_fipe, preco, mes_referencia, referencia_codigo) "
        "VALUES (%s,%s,%s,%s,%s,%s) "
        "ON DUPLICATE KEY UPDATE preco=VALUES(preco), mes_referencia=VALUES(mes_referencia), "
        "referencia_codigo=VALUES(referencia_codigo), atualizado_em=NOW()",
        (modelo["id"], ano_alvo["code"], dados.get("codeFipe"), preco,
         dados.get("referenceMonth") or mes_referencia, codigo_referencia),
    )
    conn.commit()
    novo = cur.lastrowid
    cur.close()
    return novo


def parse_preco(preco_txt):
    """Converte 'R$ 123.456,78' para decimal aceito pelo MySQL."""
    return (float(re.sub(r"[^\d,]", "", preco_txt).replace(".", "").replace(",", "."))
            if preco_txt else None)


def atualiza_precos_mensais(conn, limite, codigo_referencia, mes_referencia,
                            somente_ativos=True):
    """Atualiza a tabela local apenas quando a referencia publicada mudou.

    Precos usados por mais anuncios ativos vem primeiro. Se houver mais registros que o
    limite diario, a proxima execucao continua exatamente de onde parou.
    """
    if limite <= 0:
        return 0
    cur = conn.cursor(dictionary=True)
    filtro_uso = "uso.ativos > 0 AND" if somente_ativos else ""
    cur.execute(f"""
        SELECT fp.id, fp.ano_codigo, fm.marca_fipe_id, fm.modelo_fipe_id,
               COALESCE(uso.ativos, 0) AS uso_ativo
        FROM fipe_preco fp
        JOIN fipe_modelo fm ON fm.id = fp.fipe_modelo_id
        LEFT JOIN (
            SELECT fipe_preco_id, COUNT(*) AS ativos
            FROM anuncio
            WHERE status='ativo' AND fipe_preco_id IS NOT NULL
            GROUP BY fipe_preco_id
        ) uso ON uso.fipe_preco_id=fp.id
        WHERE {filtro_uso}
          (fp.referencia_codigo IS NULL OR fp.referencia_codigo<>%s)
        ORDER BY uso_ativo DESC, fp.atualizado_em, fp.id
        LIMIT %s
    """, (codigo_referencia, limite))
    vencidos = cur.fetchall()
    cur.close()
    atualizados = 0
    for item in vencidos:
        try:
            dados = api_get(com_referencia(
                f"/trucks/brands/{item['marca_fipe_id']}/models/"
                f"{item['modelo_fipe_id']}/years/{item['ano_codigo']}",
                codigo_referencia,
            ))
            cur = conn.cursor()
            cur.execute("""
                UPDATE fipe_preco
                SET codigo_fipe=%s, preco=%s, mes_referencia=%s,
                    referencia_codigo=%s, atualizado_em=NOW()
                WHERE id=%s
            """, (dados.get("codeFipe"), parse_preco(dados.get("price", "")),
                  dados.get("referenceMonth") or mes_referencia, codigo_referencia, item["id"]))
            conn.commit()
            cur.close()
            atualizados += 1
        except RuntimeError:
            raise
        except requests.RequestException as e:
            print(f"  ! erro ao atualizar preco FIPE {item['id']}: {e}")
    if vencidos:
        print(f"Referencia {mes_referencia}: {len(vencidos)} precos na fila, {atualizados} atualizados.")
    else:
        print(f"Referencia {mes_referencia}: tabela local ja esta atualizada.")
    return atualizados


def registra_resultado(conn, anuncio_id, status, motivo, preco_id=None, confianca=None):
    cur = conn.cursor()
    cur.execute("""
        UPDATE anuncio
        SET fipe_preco_id=%s,
            fipe_preco_automatico_id=%s,
            fipe_match_confianca=%s,
            fipe_match_confianca_automatico=%s,
            fipe_match_status=%s,
            fipe_match_status_automatico=%s,
            fipe_match_motivo=%s,
            fipe_match_motivo_automatico=%s,
            fipe_vinculo_origem='automatico',
            fipe_ultima_tentativa=NOW(),
            fipe_tentativas=fipe_tentativas+1
        WHERE id=%s
    """, (preco_id, preco_id, confianca, confianca, status, status,
          motivo[:160], motivo[:160], anuncio_id))
    conn.commit()
    cur.close()


def melhores_candidatos(conn, anuncio, quantos=3):
    cands = modelos_da_marca(conn, anuncio["marca"])
    pontuados = []
    for c in cands:
        score, motivo = avalia(anuncio["titulo"], c["modelo_fipe"])
        pontuados.append((score, motivo, c))
    pontuados.sort(key=lambda x: (-x[0], len(x[2]["modelo_fipe"])))
    return pontuados[:quantos]


def melhores_sugestoes(conn, anuncio, quantos=12, modelos=None):
    pontuados = []
    for modelo in modelos if modelos is not None else modelos_da_marca(conn, anuncio["marca"]):
        score, motivos = pontua_sugestao(anuncio, modelo)
        if score >= 45:
            pontuados.append((score, motivos, modelo))
    pontuados.sort(key=lambda item: (-item[0], len(item[2]["modelo_fipe"])))
    return pontuados[:quantos]


def salva_sugestoes(conn, anuncio, modelos=None, commit=True):
    """Persiste alternativas do ano-modelo atual para a curadoria humana."""
    cur = conn.cursor(dictionary=True)
    cur.execute("DELETE FROM anuncio_fipe_sugestao WHERE anuncio_id=%s", (anuncio["id"],))
    gravadas = 0
    posicao = 0
    candidatos = melhores_sugestoes(conn, anuncio, modelos=modelos)
    precos = {}
    if candidatos:
        ids = [modelo["id"] for _, _, modelo in candidatos]
        marcadores = ",".join(["%s"] * len(ids))
        cur.execute(f"""
            SELECT id, fipe_modelo_id FROM fipe_preco
            WHERE fipe_modelo_id IN ({marcadores}) AND ano_codigo LIKE %s
            ORDER BY referencia_codigo DESC, atualizado_em DESC, id DESC
        """, tuple(ids) + (f"{ano_modelo(anuncio)}-%",))
        for preco in cur.fetchall():
            precos.setdefault(preco["fipe_modelo_id"], preco["id"])

    for score, motivos, modelo in candidatos:
        preco_id = precos.get(modelo["id"])
        if not preco_id:
            continue
        posicao += 1
        confianca = "alta" if score >= 85 else "media" if score >= 65 else "baixa"
        cur.execute("""
            INSERT INTO anuncio_fipe_sugestao
                (anuncio_id, fipe_preco_id, posicao, score, confianca, motivos, atualizado_em)
            VALUES (%s,%s,%s,%s,%s,%s,NOW())
            ON DUPLICATE KEY UPDATE posicao=VALUES(posicao), score=VALUES(score),
                confianca=VALUES(confianca), motivos=VALUES(motivos), atualizado_em=NOW()
        """, (anuncio["id"], preco_id, posicao, score, confianca, " + ".join(motivos)))
        gravadas += 1
        if gravadas >= 8:
            break
    if commit:
        conn.commit()
    cur.close()
    return gravadas


def gera_sugestoes_pendentes(conn, lote=5000):
    cur = conn.cursor(dictionary=True)
    cur.execute("""
        SELECT id, titulo, url, marca, ano_inicial, ano_final
        FROM anuncio
        WHERE status='ativo' AND tipo='Caminhao' AND marca IS NOT NULL
          AND COALESCE(ano_final, ano_inicial) IS NOT NULL
          AND fipe_preco_id IS NULL
          AND COALESCE(fipe_vinculo_origem, 'automatico') <> 'manual'
        ORDER BY id LIMIT %s
    """, (lote,))
    anuncios = cur.fetchall()
    cur.close()
    com_sugestao = total_sugestoes = 0
    modelos_cache = {}
    for indice, anuncio in enumerate(anuncios, 1):
        chave_marca = " ".join(normaliza(anuncio["marca"]).split())
        if chave_marca not in modelos_cache:
            modelos_cache[chave_marca] = modelos_da_marca(conn, anuncio["marca"])
        quantidade = salva_sugestoes(
            conn, anuncio, modelos=modelos_cache[chave_marca], commit=False,
        )
        if quantidade:
            com_sugestao += 1
            total_sugestoes += quantidade
        if indice % 100 == 0:
            conn.commit()
    conn.commit()
    print(
        f"Sugestoes locais: {len(anuncios)} anuncios analisados · "
        f"{com_sugestao} com candidatos · {total_sugestoes} opcoes gravadas."
    )
    return {"analisados": len(anuncios), "com_sugestao": com_sugestao, "opcoes": total_sugestoes}


def escolhe(conn, anuncio):
    """Devolve (candidatos, confianca) ou (None, motivo).

    Regras, nesta ordem:
      1. Prioriza a geracao de emissoes explicita; sem ela, usa a fabricacao
         apenas como preferencia segura (2012-2022 E5; 2023+ E6).
      2. Se o titulo informa o eixo ('R440 6X4'), filtra por ele.
      3. Linhas comerciais em conflito (Atego x Atron) -> nao vincula.
         Conjunto vazio nunca conflita: 'R-440 A 4x2 (diesel)' nao declara linha.
      4. Eixos explicitos em conflito (6x2 x 8x2) -> tenta o nome base da FIPE,
         aquele que nao declara eixo ('11-180 Delivery 2p'), que e o modelo padrao.
         Se nao houver base, ai sim nao vincula.
    """
    validos = [(s, m, c) for s, m, c in melhores_candidatos(conn, anuncio, quantos=100) if s >= 0.5]
    if not validos:
        return None, "sem match"

    emissao, origem_emissao = emissao_preferida(anuncio)
    if emissao:
        com_emissao = [v for v in validos if emissao_no_texto(v[2]["modelo_fipe"]) == emissao]
        sem_emissao = [v for v in validos if emissao_no_texto(v[2]["modelo_fipe"]) is None]
        if com_emissao:
            validos = com_emissao
        elif origem_emissao == "explicita" and sem_emissao:
            validos = sem_emissao
        elif origem_emissao == "explicita":
            return None, f"sem match emissao {emissao}"

    eixo_titulo = eixos(anuncio["titulo"])
    if eixo_titulo:
        filtrados = [v for v in validos if eixos(v[2]["modelo_fipe"]) in (eixo_titulo, None)]
        if filtrados:
            validos = filtrados

    # 3) linhas conflitantes: dois conjuntos nao-vazios e sem interseccao
    chaves = [palavras_chave(c["modelo_fipe"]) for _, _, c in validos]
    nao_vazias = [k for k in chaves if k]
    for i_ in range(len(nao_vazias)):
        for j_ in range(i_ + 1, len(nao_vazias)):
            if not mesma_linha(nao_vazias[i_], nao_vazias[j_]):
                conflito = "/".join(sorted(nao_vazias[i_] | nao_vazias[j_]))[:26]
                return None, f"ambiguo linha ({conflito})"

    # 4) eixos conflitantes: prefere o nome base (sem eixo declarado)
    eixos_expl = {e for e in (eixos(c["modelo_fipe"]) for _, _, c in validos) if e}
    if len(eixos_expl) > 1:
        base = [v for v in validos if eixos(v[2]["modelo_fipe"]) is None]
        if not base:
            return None, "ambiguo eixo (" + "/".join(sorted(eixos_expl))[:22] + ")"
        validos = base

    confianca = "alto" if validos[0][0] >= 0.95 else "medio"
    return [c for _, _, c in validos], confianca


def roda_debug(conn):
    print("MODO DIAGNOSTICO — nenhuma requisicao sera feita.\n")
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT COUNT(*) n FROM fipe_modelo")
    print(f"Modelos FIPE em cache: {cur.fetchone()['n']}")
    cur.execute("SELECT marca_fipe, COUNT(*) n FROM fipe_modelo GROUP BY marca_fipe ORDER BY n DESC LIMIT 10")
    print("Marcas no cache:", ", ".join(f"{r['marca_fipe']}({r['n']})" for r in cur.fetchall()) or "NENHUMA")
    cur.close()

    pendentes = anuncios_pendentes(conn, 20)
    print(f"\nMatching nos {len(pendentes)} primeiros anuncios pendentes:\n")
    cont = {"vincula": 0, "sem match": 0, "ambiguo": 0}
    for a in pendentes:
        cands, info = escolhe(conn, a)
        if cands:
            cont["vincula"] += 1
            extra = f" (+{len(cands)-1} variantes, o ano decide)" if len(cands) > 1 else ""
            print(f"  OK  [{info:5}] {a['titulo'][:32]:32} -> {cands[0]['modelo_fipe'][:38]}{extra}")
        else:
            cont["ambiguo" if info.startswith("ambiguo") else "sem match"] += 1
            print(f"  --  [{info[:34]:34}] {a['titulo'][:30]}")
            for s, motivo, c in melhores_candidatos(conn, a, quantos=2):
                print(f"          {s:.2f} {motivo:14} {c['modelo_fipe'][:38]}")
    print(f"\nResumo: {cont['vincula']} vinculariam · {cont['sem match']} sem match · "
          f"{cont['ambiguo']} ambiguos (nao vinculam de proposito)")


def processa_anuncios(conn, lote=200, permitir_api=True, codigo_referencia=None, mes_referencia=None):
    pendentes = anuncios_pendentes(conn, lote)
    if not permitir_api:
        origem = "somente cache local"
    elif max_req == 0:
        origem = "API PRO ilimitada + cache"
    else:
        origem = f"API + cache (limite {max_req} req)"
    print(f"{len(pendentes)} anuncios de caminhao sem vinculo FIPE — processando com {origem}...")
    vinculados = sem_match = ambiguos = sem_ano = aguardando_cache = processados = 0
    limite_atingido = False

    for a in pendentes:
        processados += 1
        try:
            cands, info = escolhe(conn, a)
            if not cands:
                if info.startswith("ambiguo"):
                    ambiguos += 1
                    registra_resultado(conn, a["id"], "ambiguo", info)
                else:
                    sem_match += 1
                    registra_resultado(conn, a["id"], "sem_match", info)
                continue

            # O preco FIPE usa o ano-modelo. Fabricacao serve apenas para a geracao de emissoes.
            modelo_ano = ano_modelo(a)
            preco_id = escolhido = None
            for c in cands[:3]:
                if permitir_api:
                    preco_id = busca_ou_cria_preco(
                        conn, c, modelo_ano, codigo_referencia, mes_referencia
                    )
                else:
                    preco_id = busca_preco_cache(conn, c, modelo_ano, codigo_referencia)
                if preco_id:
                    escolhido = c
                    break
            if not preco_id:
                if not permitir_api:
                    aguardando_cache += 1
                    continue
                sem_ano += 1
                registra_resultado(conn, a["id"], "sem_ano", f"ano-modelo {modelo_ano} ausente nos candidatos FIPE")
                continue

            registra_resultado(
                conn, a["id"], "vinculado",
                f"{escolhido['marca_fipe']} | {escolhido['modelo_fipe']}",
                preco_id=preco_id, confianca=info,
            )
            vinculados += 1
            print(f"  [{info}] {a['titulo'][:38]:38} -> {escolhido['modelo_fipe'][:36]}")
        except RuntimeError as e:
            print(f"\n{e}")
            limite_atingido = True
            break
        except requests.RequestException as e:
            print(f"  ! erro de rede em '{a['titulo'][:32]}': {e}")
            registra_resultado(conn, a["id"], "erro_api", str(e))
            continue

    print(f"\n{vinculados} vinculados · {sem_match} sem match · {ambiguos} ambiguos (pulados de proposito) "
          f"· {sem_ano} sem o ano na FIPE · {aguardando_cache} aguardando carga")
    print(f"{contador_req} requisicoes usadas nesta rodada.")
    return {
        "pendentes": len(pendentes), "vinculados": vinculados, "sem_match": sem_match,
        "ambiguos": ambiguos, "sem_ano": sem_ano, "aguardando_cache": aguardando_cache,
        "processados": processados, "limite_atingido": limite_atingido,
    }


def roda_bootstrap(conn, lote=300):
    global referencia_codigo, referencia_mes
    referencia_codigo, referencia_mes = obtem_referencia_atual()
    print(f"Referencia FIPE publicada: {referencia_mes} (codigo {referencia_codigo}).")
    garante_marcas(conn, referencia_codigo)
    return processa_anuncios(
        conn, lote=lote, permitir_api=True,
        codigo_referencia=referencia_codigo, mes_referencia=referencia_mes,
    )


def roda_local(conn, lote=500):
    """Vincula anuncios sem qualquer chamada externa; faltas de cache permanecem na fila."""
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT MAX(referencia_codigo) AS codigo FROM fipe_preco")
    atual = cur.fetchone()["codigo"]
    cur.close()
    if atual is not None:
        print(f"Referencia local em uso: codigo {atual}.")
    return processa_anuncios(
        conn, lote=lote, permitir_api=False, codigo_referencia=atual
    )


def roda_mensal(conn, max_refresh=480, somente_ativos=True):
    global referencia_codigo, referencia_mes
    referencia_codigo, referencia_mes = obtem_referencia_atual()
    print(f"Referencia FIPE publicada: {referencia_mes} (codigo {referencia_codigo}).")
    atualizados = atualiza_precos_mensais(
        conn, max_refresh, referencia_codigo, referencia_mes, somente_ativos
    )
    print(f"{contador_req} requisicoes usadas nesta rodada mensal.")
    return atualizados


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--db-host", default=os.getenv("OPER_RADAR_DB_HOST", "localhost"))
    ap.add_argument("--db-user", default=os.getenv("OPER_RADAR_DB_USER"))
    ap.add_argument("--db-pass", default=os.getenv("OPER_RADAR_DB_PASS"))
    ap.add_argument("--db-name", default=os.getenv("OPER_RADAR_DB_NAME"))
    ap.add_argument("--max-req", type=int, default=400)
    ap.add_argument("--lote", type=int, default=200, help="quantos anuncios examinar por rodada")
    ap.add_argument("--modo", choices=("bootstrap", "local", "mensal", "sugestoes", "debug"), default="bootstrap",
                    help="bootstrap consulta combinacoes novas; local usa so MySQL; mensal renova precos")
    ap.add_argument("--max-refresh", type=int, default=480, help="quantos precos mensais atualizar por rodada")
    ap.add_argument("--atualizar-todos-precos", action="store_true",
                    help="no modo mensal, renova todo o catalogo local (plano PRO)")
    ap.add_argument("--token", default=os.getenv("FIPE_API_TOKEN"), help="token opcional da API FIPE")
    ap.add_argument("--marcador-conclusao",
                    help="no bootstrap, cria este arquivo quando toda a fila atual terminar")
    ap.add_argument("--debug", action="store_true", help="alias legado de --modo=debug")
    args = ap.parse_args()

    faltando = [nome for nome, valor in {
        "OPER_RADAR_DB_USER/--db-user": args.db_user,
        "OPER_RADAR_DB_PASS/--db-pass": args.db_pass,
        "OPER_RADAR_DB_NAME/--db-name": args.db_name,
    }.items() if not valor]
    if faltando:
        ap.error("credenciais ausentes: " + ", ".join(faltando))

    max_req = args.max_req
    contador_req = 0
    headers_api.clear()
    if args.token:
        headers_api["Authorization"] = f"Bearer {args.token}"

    conn = mysql.connector.connect(host=args.db_host, user=args.db_user, password=args.db_pass,
                                   database=args.db_name, charset="utf8mb4")
    try:
        modo = "debug" if args.debug else args.modo
        if modo == "debug":
            roda_debug(conn)
        elif modo == "local":
            roda_local(conn, lote=args.lote)
        elif modo == "mensal":
            roda_mensal(
                conn, max_refresh=args.max_refresh,
                somente_ativos=not args.atualizar_todos_precos,
            )
        elif modo == "sugestoes":
            gera_sugestoes_pendentes(conn, lote=args.lote)
        else:
            resultado = roda_bootstrap(conn, lote=args.lote)
            concluiu = (resultado["pendentes"] < args.lote
                        and resultado["processados"] == resultado["pendentes"]
                        and not resultado["limite_atingido"])
            if concluiu and args.marcador_conclusao:
                marcador = Path(args.marcador_conclusao)
                marcador.parent.mkdir(parents=True, exist_ok=True)
                marcador.write_text(
                    f"concluido_em={time.strftime('%Y-%m-%dT%H:%M:%S')}\n"
                    f"referencia={referencia_mes}\n",
                    encoding="utf-8",
                )
                print(f"Carga das combinacoes atuais concluida: {marcador}")
    finally:
        conn.close()
