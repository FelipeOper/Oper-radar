<?php
/**
 * Comparador bilateral do mercado de caminhões.
 * Aceita marca, modelo ou marca+modelo e ano-modelo independentemente em cada lado.
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/market_quality.php';
require_once __DIR__ . '/lib/market_comparator.php';
$conn = conecta();

if (($_GET['facetas'] ?? '') === '1') {
    $res = $conn->query("SELECT UPPER(TRIM(marca)) marca, UPPER(TRIM(modelo)) modelo,
                                COALESCE(ano_final,ano_inicial) ano, COUNT(*) n
                         FROM anuncio
                         WHERE status='ativo' AND tipo='Caminhao'
                           AND marca IS NOT NULL AND TRIM(marca)<>''
                           AND modelo IS NOT NULL AND TRIM(modelo)<>''
                           AND COALESCE(ano_final,ano_inicial) BETWEEN 1950 AND YEAR(CURDATE())+2
                         GROUP BY UPPER(TRIM(marca)), UPPER(TRIM(modelo)), COALESCE(ano_final,ano_inicial)
                         ORDER BY marca, modelo, ano DESC");
    $marcas = [];
    $modelos = [];
    $anos = [];
    while ($row = $res->fetch_assoc()) {
        $marca = $row['marca'];
        $modelo = $row['modelo'];
        $ano = (int)$row['ano'];
        $n = (int)$row['n'];
        $marcas[$marca] = ($marcas[$marca] ?? 0) + $n;
        $chaveModelo = $marca . "\0" . $modelo;
        if (!isset($modelos[$chaveModelo])) {
            $modelos[$chaveModelo] = ['marca' => $marca, 'modelo' => $modelo, 'anuncios' => 0];
        }
        $modelos[$chaveModelo]['anuncios'] += $n;
        $anos[] = ['marca' => $marca, 'modelo' => $modelo, 'ano' => $ano, 'anuncios' => $n];
    }
    arsort($marcas);
    $listaMarcas = [];
    foreach ($marcas as $marca => $n) $listaMarcas[] = ['marca' => $marca, 'anuncios' => $n];
    envia_json(['marcas' => $listaMarcas, 'modelos' => array_values($modelos), 'anos' => $anos]);
}

$ladoA = comparador_seletor($_GET, 'a');
$ladoB = comparador_seletor($_GET, 'b');
if (!$ladoA || !$ladoB) {
    http_response_code(422);
    envia_json(['erro' => 'Selecione o recorte e o ano-modelo nos dois lados.']);
}

function comparador_busca_lado(mysqli $conn, array $seletor): array {
    [$condicao, $types, $params] = comparador_condicao($seletor);
    $sql = "SELECT a.preco, a.preco_texto_bruto, a.titulo, a.modelo,
                   f.preco AS preco_fipe, r.id AS revenda_id, r.uf,
                   DATEDIFF(CURDATE(), a.primeira_vez_visto) AS dias_observados,
                   (a.primeira_vez_visto>=DATE_SUB(NOW(), INTERVAL 30 DAY)) AS entrada_30d
            FROM anuncio a
            JOIN revenda r ON r.id=a.revenda_id
            LEFT JOIN fipe_preco f ON f.id=a.fipe_preco_id
            WHERE a.status='ativo' AND $condicao";
    $st = $conn->prepare($sql);
    if ($params) $st->bind_param($types, ...$params);
    $st->execute();
    $res = $st->get_result();
    $registros = [];
    while ($row = $res->fetch_assoc()) $registros[] = $row;
    $st->close();

    $sqlSaidas = "SELECT COUNT(*) n FROM anuncio a
                  WHERE a.status='removido_confirmado'
                    AND a.data_remocao>=DATE_SUB(NOW(), INTERVAL 30 DAY)
                    AND $condicao";
    $st = $conn->prepare($sqlSaidas);
    if ($params) $st->bind_param($types, ...$params);
    $st->execute();
    $saidas = (int)$st->get_result()->fetch_assoc()['n'];
    $st->close();

    return comparador_resumo($registros, $saidas);
}

$resumoA = comparador_busca_lado($conn, $ladoA);
$resumoB = comparador_busca_lado($conn, $ladoB);
$conn->close();

envia_json([
    'lado_a' => ['seletor' => $ladoA, 'rotulo' => comparador_rotulo($ladoA), 'metricas' => $resumoA],
    'lado_b' => ['seletor' => $ladoB, 'rotulo' => comparador_rotulo($ladoB), 'metricas' => $resumoB],
    'diferencas' => [
        'preco_mediano_pct' => comparador_diferenca($resumoA['precos']['mediana'], $resumoB['precos']['mediana']),
        'estoque_pct' => comparador_diferenca($resumoA['ativos'], $resumoB['ativos']),
        'dias_observados_pct' => comparador_diferenca($resumoA['dias_observados_media'], $resumoB['dias_observados_media']),
    ],
    'gerado_em' => date(DATE_ATOM),
]);
