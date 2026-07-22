<?php
/**
 * OPER RADAR — Fase 1 (versão PHP)
 * Extração de anúncios a partir da página de uma revenda — v2, HTML bruto real.
 * Porta 1:1 da versão Python (parser.py v2), estrutura confirmada direto no servidor
 * de produção via curl+grep.
 */

const BASE_URL_PARSER = 'https://www.caminhoesecarretas.com.br';
const HREF_RE = '/href="(\/veiculo\/[a-z0-9\/\-]+\/(\d+))"/';
const TITULO_RE = '/<h2 class="h16">\s*(.*?)\s*<\/h2>/s';
const PRECO_RE = '/<span class="money">\s*(R\$[^<]+)<\/span>/';
const ANO_RE_PARSER = '/(\d{4})\/(\d{4})/';

const MARCAS_CAMINHAO_FALLBACK = [
    "daf", "volvo", "scania", "mercedes-benz", "iveco", "man", "ford", "vw",
    "volkswagen", "agrale", "gm", "hyundai", "mack",
];
const MARCAS_EXTRA_FALLBACK = [
    "pastre", "rodomoura", "bertolini", "rossetti", "fibraforte", "rodotec",
    "recrusul", "sanchezi", "kaili",
    "massey-ferguson", "valtra", "landini", "mahindra", "ls-tractor", "foton",
    "stara", "yanmar",
];

function carrega_marcas_conhecidas(string $caminho_taxonomia = __DIR__ . '/taxonomia.json'): array {
    $marcas = [];
    if (file_exists($caminho_taxonomia)) {
        $taxonomia = json_decode(file_get_contents($caminho_taxonomia), true);
        foreach ($taxonomia['marcas_por_categoria'] ?? [] as $lista) {
            foreach ($lista as $marca) {
                $marcas[] = strtolower(str_replace(' ', '-', $marca));
            }
        }
    }
    foreach (array_merge(MARCAS_CAMINHAO_FALLBACK, MARCAS_EXTRA_FALLBACK) as $m) {
        $marcas[] = $m;
    }
    return array_unique($marcas);
}

function limpa_texto_html(string $texto): string {
    $texto = html_entity_decode($texto, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    return trim(preg_replace('/\s+/', ' ', $texto));
}

function extrai_km_ou_horas(string $bloco): ?string {
    $texto = limpa_texto_html(strip_tags($bloco));
    if (preg_match('/(?:quilometragem|od[oô]metro)?\s*[:\-]?\s*([\d.]+)\s*(?:km|quil[oô]metros?)\b/iu', $texto, $m)) {
        return ((int) preg_replace('/\D/', '', $m[1])) . ' km';
    }
    if (preg_match('/(?:hor[ií]metro|horas?\s+de\s+uso)\s*[:\-]?\s*([\d.]+)\s*(?:h|horas?)?\b/iu', $texto, $m)) {
        return ((int) preg_replace('/\D/', '', $m[1])) . ' horas';
    }
    return null;
}

function extrai_tipo_e_marca_da_url(string $url_relativa, array $marcas_conhecidas): array {
    $partes = explode('/', trim($url_relativa, '/'));
    // partes[0] == "veiculo"
    $tipo = isset($partes[3]) ? ucfirst($partes[3]) : null;

    foreach ($partes as $segmento) {
        if (in_array(strtolower($segmento), $marcas_conhecidas, true)) {
            return [$tipo, strtoupper(str_replace('-', ' ', $segmento))];
        }
    }
    return [$tipo, null];
}

/**
 * @return array Lista de anúncios extraídos (arrays associativos).
 */
function parse_listings(string $html, array $marcas_conhecidas): array {
    $anuncios = [];
    $ids_processados = [];

    $blocos = preg_split('/(?=<div class="list-product list-view-item">)/', $html);

    foreach ($blocos as $bloco) {
        if (!preg_match(HREF_RE, $bloco, $hrefM)) {
            continue;
        }
        $urlRelativa = $hrefM[1];
        $anuncioId = (int) $hrefM[2];
        if (in_array($anuncioId, $ids_processados, true)) {
            continue;
        }
        $ids_processados[] = $anuncioId;

        [$tipo, $marca] = extrai_tipo_e_marca_da_url($urlRelativa, $marcas_conhecidas);

        $titulo = (string) $anuncioId;
        if (preg_match(TITULO_RE, $bloco, $tituloM)) {
            $titulo = limpa_texto_html($tituloM[1]);
        }

        $anoInicial = $anoFinal = null;
        if (preg_match(ANO_RE_PARSER, $titulo, $anoM)) {
            $anoInicial = (int) $anoM[1];
            $anoFinal = (int) $anoM[2];
        }

        $preco = null;
        $precoTextoBruto = '';
        if (preg_match(PRECO_RE, $bloco, $precoM)) {
            $precoTextoBruto = limpa_texto_html($precoM[1]);
            if (preg_match('/[\d.]+,\d{2}/', $precoTextoBruto, $valorM)) {
                $preco = (float) str_replace(',', '.', str_replace('.', '', $valorM[0]));
            }
        } elseif (stripos($bloco, 'consultar') !== false) {
            $precoTextoBruto = '(A consultar)';
        }
        $kmOuHoras = extrai_km_ou_horas($bloco);

        $anuncios[] = [
            'anuncio_portal_id' => $anuncioId,
            'url' => BASE_URL_PARSER . $urlRelativa,
            'titulo' => $titulo,
            'tipo' => $tipo,
            'marca' => $marca,
            'ano_inicial' => $anoInicial,
            'ano_final' => $anoFinal,
            'preco' => $preco,
            'preco_texto_bruto' => $precoTextoBruto,
            'km_ou_horas' => $kmOuHoras,
        ];
    }
    return $anuncios;
}

function hash_pagina(string $page_text): string {
    return hash('sha256', $page_text);
}

// ---- teste local, roda com: php parser.php ----
if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    $texto = file_get_contents(__DIR__ . '/sample_page_real.html');
    $marcas = carrega_marcas_conhecidas();
    $anuncios = parse_listings($texto, $marcas);

    echo count($anuncios) . " anúncios extraídos:\n\n";
    foreach ($anuncios as $a) {
        printf(
            "  #%d | %s | %s/%s | %s/%s | %s\n",
            $a['anuncio_portal_id'], $a['titulo'], $a['tipo'], $a['marca'],
            $a['ano_inicial'], $a['ano_final'], $a['preco_texto_bruto']
        );
    }
    echo "\nhash da página: " . substr(hash_pagina($texto), 0, 16) . "...\n";
}
