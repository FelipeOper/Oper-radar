<?php
/**
 * OPER RADAR — Fase 1 (versão PHP, para hospedagem compartilhada sem Python/terminal)
 * Extração de anúncios a partir da página de uma revenda no portal Caminhões e Carretas.
 *
 * Porta 1:1 a lógica já validada em parser.py (Python) — mesmas regex, mesmo
 * comportamento, só a sintaxe muda. Testado contra a mesma amostra real (sample_page.md).
 */

const VEICULO_URL_RE = '/\[(?<titulo>[^\]]+)\]\((?<url>https:\/\/www\.caminhoesecarretas\.com\.br\/veiculo\/[^)]+)\)/';
const PRECO_RE = '/R\$\s*([\d.]+),\d{2}/';
const PRECO_CONSULTAR_RE = '/\(A consultar\)/';
const ANO_RE = '/(\d{4})\/(\d{4})/';

/** Marcas de caminhão conhecidas — fallback de segurança quando taxonomia.json não tem
 * a categoria ainda. Mesma lista do parser.py. */
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

/**
 * Carrega o conjunto de marcas conhecidas: taxonomia.json (descoberta real no portal,
 * ver taxonomia.php) + os dois fallbacks acima.
 */
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

function extrai_id_da_url(string $url): int {
    $partes = explode('/', rtrim($url, '/'));
    return (int) end($partes);
}

function extrai_tipo_e_marca_da_url(string $url, array $marcas_conhecidas): array {
    $partes = explode('/veiculo/', $url);
    $segmentos = explode('/', end($partes));
    $tipo = isset($segmentos[2]) ? ucfirst($segmentos[2]) : null;

    // A marca não tem posição fixa em todos os tipos — escaneia todos os segmentos
    // do path procurando um nome presente na taxonomia descoberta no próprio portal
    // (mesma lógica de parser.py: o primeiro segmento que bater já resolve, e como a
    // encarroçadora/marca aparece antes do chassi na URL, o scan naturalmente acerta).
    foreach ($segmentos as $segmento) {
        if (in_array(strtolower($segmento), $marcas_conhecidas, true)) {
            return [$tipo, strtoupper(str_replace('-', ' ', $segmento))];
        }
    }
    return [$tipo, null]; // marca não reconhecida — fica null em vez de errada
}

/**
 * @return array Lista de anúncios extraídos, cada um como array associativo.
 */
function parse_listings(string $page_text, array $marcas_conhecidas): array {
    $anuncios = [];
    // Cada bloco de anúncio começa no link do título ("## [") e vai até o próximo bloco.
    $blocos = preg_split('/(?=## \[)/', $page_text);

    foreach ($blocos as $bloco) {
        if (!preg_match(VEICULO_URL_RE, $bloco, $m)) {
            continue;
        }
        $titulo = $m['titulo'];
        $url = $m['url'];
        $anuncio_id = extrai_id_da_url($url);
        [$tipo, $marca] = extrai_tipo_e_marca_da_url($url, $marcas_conhecidas);

        $ano_inicial = $ano_final = null;
        if (preg_match(ANO_RE, $titulo, $anoM)) {
            $ano_inicial = (int) $anoM[1];
            $ano_final = (int) $anoM[2];
        }

        $preco = null;
        $preco_texto_bruto = '';
        if (preg_match(PRECO_RE, $bloco, $precoM)) {
            $preco = (float) str_replace('.', '', $precoM[1]);
            $preco_texto_bruto = $precoM[0];
        } elseif (preg_match(PRECO_CONSULTAR_RE, $bloco)) {
            $preco_texto_bruto = '(A consultar)';
        }

        $anuncios[] = [
            'anuncio_portal_id' => $anuncio_id,
            'url' => $url,
            'titulo' => $titulo,
            'tipo' => $tipo,
            'marca' => $marca,
            'ano_inicial' => $ano_inicial,
            'ano_final' => $ano_final,
            'preco' => $preco,
            'preco_texto_bruto' => $preco_texto_bruto,
        ];
    }
    return $anuncios;
}

function hash_pagina(string $page_text): string {
    return hash('sha256', $page_text);
}

// ---- teste local, roda com: php parser.php ----
if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    $texto = file_get_contents(__DIR__ . '/sample_page.md');
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
