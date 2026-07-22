<?php
/**
 * Consulta veicular por placa, isolada no backend.
 *
 * A FIPE Online nao identifica veiculos por placa. Este endpoint usa um
 * provedor veicular separado e cruza o codigo FIPE retornado com o catalogo
 * e os anuncios locais do OPER RADAR.
 */
require_once __DIR__ . '/config.php';
$usuario = exige_autenticacao();

$provedor = strtolower((string)valor_config_oper_radar('OPER_RADAR_PLACA_PROVIDER', 'webxcar'));
$token = (string)valor_config_oper_radar('OPER_RADAR_PLACA_API_TOKEN', '');
$configurado = $provedor === 'webxcar' && $token !== '';

if (($_GET['modo'] ?? '') === 'status' || empty($_GET['placa'])) {
    envia_json([
        'configurado' => $configurado,
        'provedor' => $provedor ?: 'webxcar',
        'recurso' => 'placa_fipe',
    ]);
}

$placa = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', (string)$_GET['placa']));
if (!preg_match('/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/', $placa)) {
    http_response_code(422);
    envia_json(['erro' => 'Informe uma placa válida no formato ABC1234 ou ABC1D23.', 'codigo' => 'PLACA_INVALIDA']);
}
if (!$configurado) {
    http_response_code(503);
    envia_json([
        'erro' => 'A consulta por placa ainda não foi ativada no servidor.',
        'codigo' => 'PLACA_NAO_CONFIGURADA',
        'provedor' => 'webxcar',
    ]);
}
if (!function_exists('curl_init')) {
    http_response_code(500);
    envia_json(['erro' => 'O servidor não possui o módulo necessário para a consulta por placa.', 'codigo' => 'CURL_INDISPONIVEL']);
}

inicia_sessao_oper_radar();
$cacheKey = 'placa_' . hash('sha256', $placa);
$cache = $_SESSION['consulta_placa_cache'][$cacheKey] ?? null;
if (is_array($cache) && (time() - (int)($cache['em'] ?? 0)) < 1800) {
    envia_json($cache['dados']);
}

$ch = curl_init('https://api.webxcar.com.br/placas/' . rawurlencode($placa) . '/basica');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Accept: application/json', 'Authorization: ' . $token],
    CURLOPT_CONNECTTIMEOUT => 8,
    CURLOPT_TIMEOUT => 20,
    CURLOPT_FOLLOWLOCATION => false,
    CURLOPT_USERAGENT => 'OPER-RADAR/1.0',
]);
$corpo = curl_exec($ch);
$status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
$falha = curl_error($ch);
curl_close($ch);

if ($corpo === false || $falha) {
    http_response_code(502);
    envia_json(['erro' => 'O provedor de placa não respondeu. Tente novamente.', 'codigo' => 'PLACA_TIMEOUT']);
}
$payload = json_decode($corpo, true);
if ($status === 404) {
    http_response_code(404);
    envia_json(['erro' => 'Placa não encontrada.', 'codigo' => 'PLACA_NAO_ENCONTRADA']);
}
if ($status === 401 || $status === 403) {
    http_response_code(503);
    envia_json(['erro' => 'A chave da consulta por placa precisa ser revisada.', 'codigo' => 'PLACA_CREDENCIAL_INVALIDA']);
}
if ($status === 429) {
    http_response_code(429);
    envia_json(['erro' => 'Limite temporário de consultas por placa atingido.', 'codigo' => 'PLACA_LIMITE']);
}
if ($status < 200 || $status >= 300 || !is_array($payload)) {
    http_response_code(502);
    envia_json(['erro' => 'Não foi possível consultar esta placa agora.', 'codigo' => 'PLACA_PROVEDOR_ERRO']);
}

$raiz = isset($payload['data']) && is_array($payload['data']) ? $payload['data'] : $payload;
$basico = is_array($raiz['basico'] ?? null) ? $raiz['basico'] : [];
$fipesOrigem = is_array($raiz['fipes'] ?? null) ? $raiz['fipes'] : [];
$conn = conecta();
$fipes = [];

function valor_monetario_placa($valor): ?float {
    if ($valor === null || $valor === '') return null;
    if (is_numeric($valor)) return (float)$valor;
    $limpo = preg_replace('/[^0-9,.-]/', '', (string)$valor);
    if (strpos($limpo, ',') !== false) $limpo = str_replace(['.', ','], ['', '.'], $limpo);
    return is_numeric($limpo) ? (float)$limpo : null;
}

function texto_campo_placa($valor): string {
    if (is_array($valor)) return (string)($valor['nome'] ?? $valor['name'] ?? '');
    return (string)($valor ?? '');
}

foreach ($fipesOrigem as $item) {
    if (!is_array($item)) continue;
    $codigo = (string)($item['codigo_fipe'] ?? $item['code_fipe'] ?? $item['codigo'] ?? '');
    $codigoAno = (string)($item['codigo_ano'] ?? $item['code_year'] ?? $item['ano_codigo'] ?? '');
    $anoItem = (int)($item['ano'] ?? $item['year'] ?? 0);
    $mercado = null;
    if ($codigo !== '') {
        $sql = "
            SELECT fp.id AS fipe_preco_id, fp.preco AS preco_local, fp.mes_referencia,
                   fm.marca_fipe, fm.modelo_fipe,
                   COUNT(a.id) AS anuncios_ativos,
                   AVG(NULLIF(a.preco,0)) AS preco_medio_mercado,
                   MIN(NULLIF(a.preco,0)) AS menor_anuncio,
                   MAX(NULLIF(a.preco,0)) AS maior_anuncio
            FROM fipe_preco fp
            JOIN fipe_modelo fm ON fm.id=fp.fipe_modelo_id
            LEFT JOIN anuncio a ON a.fipe_preco_id=fp.id AND a.status='ativo'
            WHERE fp.codigo_fipe=?" . ($codigoAno !== '' ? " AND fp.ano_codigo=?" : "") . "
            GROUP BY fp.id, fp.preco, fp.mes_referencia, fm.marca_fipe, fm.modelo_fipe
            ORDER BY fp.referencia_codigo DESC
            LIMIT 1";
        $st = $conn->prepare($sql);
        if ($codigoAno !== '') $st->bind_param('ss', $codigo, $codigoAno);
        else $st->bind_param('s', $codigo);
        $st->execute();
        $mercado = $st->get_result()->fetch_assoc() ?: null;
        $st->close();
        if (!$mercado && $anoItem > 0) {
            $anoBusca = $anoItem . '-%';
            $st = $conn->prepare("\n                SELECT fp.id AS fipe_preco_id, fp.preco AS preco_local, fp.mes_referencia,\n                       fm.marca_fipe, fm.modelo_fipe, COUNT(a.id) AS anuncios_ativos,\n                       AVG(NULLIF(a.preco,0)) AS preco_medio_mercado,\n                       MIN(NULLIF(a.preco,0)) AS menor_anuncio, MAX(NULLIF(a.preco,0)) AS maior_anuncio\n                FROM fipe_preco fp\n                JOIN fipe_modelo fm ON fm.id=fp.fipe_modelo_id\n                LEFT JOIN anuncio a ON a.fipe_preco_id=fp.id AND a.status='ativo'\n                WHERE fp.codigo_fipe=? AND fp.ano_codigo LIKE ?\n                GROUP BY fp.id, fp.preco, fp.mes_referencia, fm.marca_fipe, fm.modelo_fipe\n                ORDER BY fp.referencia_codigo DESC LIMIT 1");
            $st->bind_param('ss', $codigo, $anoBusca);
            $st->execute();
            $mercado = $st->get_result()->fetch_assoc() ?: null;
            $st->close();
        }
        if ($mercado) {
            foreach (['fipe_preco_id', 'anuncios_ativos'] as $campo) $mercado[$campo] = (int)($mercado[$campo] ?? 0);
            foreach (['preco_local', 'preco_medio_mercado', 'menor_anuncio', 'maior_anuncio'] as $campo) {
                $mercado[$campo] = $mercado[$campo] !== null ? (float)$mercado[$campo] : null;
            }
        }
    }
    $fipes[] = [
        'codigo_fipe' => $codigo,
        'codigo_ano' => $codigoAno,
        'marca' => texto_campo_placa($item['marca'] ?? $item['brand'] ?? ''),
        'modelo' => texto_campo_placa($item['modelo'] ?? $item['model'] ?? ''),
        'ano' => $anoItem,
        'combustivel' => texto_campo_placa($item['combustivel'] ?? $item['fuel'] ?? ''),
        'preco_fipe' => valor_monetario_placa($item['preco'] ?? $item['price'] ?? $item['valor'] ?? null),
        'referencia' => texto_campo_placa($item['referencia'] ?? $item['reference'] ?? ''),
        'mercado' => $mercado,
    ];
}

$resultado = [
    'placa' => $placa,
    'veiculo' => [
        'marca' => texto_campo_placa($basico['marca'] ?? $basico['brand'] ?? ''),
        'modelo' => texto_campo_placa($basico['modelo'] ?? $basico['model'] ?? ''),
        'ano_fabricacao' => (int)($basico['ano']['fabricacao'] ?? $basico['year']['manufacture'] ?? $basico['ano_fabricacao'] ?? 0),
        'ano_modelo' => (int)($basico['ano']['modelo'] ?? $basico['year']['model'] ?? $basico['ano_modelo'] ?? 0),
        'cor' => texto_campo_placa($basico['cor'] ?? $basico['color'] ?? ''),
        'combustivel' => array_values((array)($basico['combustivel'] ?? $basico['fuel'] ?? [])),
        'cidade' => texto_campo_placa($basico['cidade'] ?? $basico['city'] ?? ''),
        'uf' => (string)($basico['estado']['sigla'] ?? $basico['state']['code'] ?? $basico['uf'] ?? ''),
    ],
    'fipes' => $fipes,
    'provedor' => 'webxcar',
    'consultado_em' => date(DATE_ATOM),
];
$_SESSION['consulta_placa_cache'][$cacheKey] = ['em' => time(), 'dados' => $resultado];
if (count($_SESSION['consulta_placa_cache']) > 20) {
    uasort($_SESSION['consulta_placa_cache'], fn($a, $b) => ($a['em'] ?? 0) <=> ($b['em'] ?? 0));
    $_SESSION['consulta_placa_cache'] = array_slice($_SESSION['consulta_placa_cache'], -20, null, true);
}
envia_json($resultado);
