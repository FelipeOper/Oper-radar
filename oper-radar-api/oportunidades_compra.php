<?php
/**
 * "O que comprar" por região (GET oportunidades_compra.php?uf=PR,SC&modelos_por_uf=3&anuncios_por_modelo=5).
 * Duas camadas: modelos com melhor índice regional por UF e, dentro de cada um, anúncios candidatos com pontuação
 * explicável. Universo: caminhões ativos (segmento Pesado). Toda a regra vive em lib/oportunidade_compra.php (testada);
 * aqui só se consulta o banco. Somente leitura. Preço é anunciado, não de venda; sem amostra não há recomendação.
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/market_quality.php';
require_once __DIR__ . '/lib/market_scope.php';
require_once __DIR__ . '/lib/oportunidade_compra.php';

exige_autenticacao();
@set_time_limit(60);

const OPER_COMPRA_UF_REGIAO = [
    'PR' => 'Sul', 'SC' => 'Sul', 'RS' => 'Sul', 'SP' => 'Sudeste', 'RJ' => 'Sudeste', 'MG' => 'Sudeste', 'ES' => 'Sudeste',
    'MT' => 'Centro-Oeste', 'MS' => 'Centro-Oeste', 'GO' => 'Centro-Oeste', 'DF' => 'Centro-Oeste',
    'BA' => 'Nordeste', 'PE' => 'Nordeste', 'CE' => 'Nordeste', 'MA' => 'Nordeste', 'PB' => 'Nordeste', 'RN' => 'Nordeste',
    'AL' => 'Nordeste', 'PI' => 'Nordeste', 'SE' => 'Nordeste',
    'AM' => 'Norte', 'PA' => 'Norte', 'RO' => 'Norte', 'RR' => 'Norte', 'AC' => 'Norte', 'AP' => 'Norte', 'TO' => 'Norte',
];

function compra_linhas(mysqli $conn, string $sql): array {
    $res = $conn->query($sql);
    if (!$res) throw new RuntimeException('Consulta indisponível.');
    $linhas = [];
    while ($row = $res->fetch_assoc()) $linhas[] = $row;
    $res->free();
    return $linhas;
}

$ufs = painel_normaliza_ufs((string)($_GET['uf'] ?? ''), OPER_COMPRA_UF_REGIAO);
// Limites canônicos ANTES de qualquer chave de cache: entradas extremas não geram arquivos nem consultas novas.
$opcoes = [
    'modelos_por_uf' => max(1, min(10, (int)($_GET['modelos_por_uf'] ?? 3))),
    'anuncios_por_modelo' => max(1, min(20, (int)($_GET['anuncios_por_modelo'] ?? 5))),
];

/** Recorta o resultado (calculado para TODAS as UFs) às UFs pedidas; o índice de cada UF não depende do filtro. */
function compra_recorta_ufs(array $payload, array $ufs): array {
    $payload['escopo']['ufs'] = $ufs;
    if ($ufs) $payload['ufs'] = array_values(array_filter($payload['ufs'], fn($u) => in_array($u['uf'], $ufs, true)));
    return $payload;
}

// Cache de 10 min no servidor (o dado é o mesmo para todos os usuários e a montagem varre o estoque inteiro). A chave só varia
// com os dois limites canônicos (no máximo 200 arquivos); o filtro de UF é aplicado depois. Arquivos com mais de 1 h são removidos.
$cacheBase = rtrim(sys_get_temp_dir(), '/\\') . '/oper_radar_compra_';
$cacheArquivo = $cacheBase . $opcoes['modelos_por_uf'] . 'x' . $opcoes['anuncios_por_modelo'] . '.json';
if (is_file($cacheArquivo) && time() - (int)filemtime($cacheArquivo) < 600) {
    $emCache = json_decode((string)@file_get_contents($cacheArquivo), true);
    if (is_array($emCache) && isset($emCache['ufs'], $emCache['escopo'])) {
        $emCache['em_cache'] = true;
        envia_json(compra_recorta_ufs($emCache, $ufs));
    }
}
foreach ((array)@glob($cacheBase . '*.json') as $antigo) {
    if (is_file($antigo) && time() - (int)filemtime($antigo) > 3600) @unlink($antigo);
}
$conn = conecta();

try {
    $ano = 'COALESCE(a.ano_final,a.ano_inicial)';
    // Universo comparável: caminhão sem implemento de 2006 em diante (mesmas regras do desvio FIPE; ver lib/oportunidade_compra.php).
    $universo = mercado_sql_carroceria_comparavel() . mercado_sql_ano_minimo(OPER_RADAR_ANO_MINIMO_FIPE);
    $anuncios = compra_linhas($conn, "SELECT a.id, a.url, a.titulo, a.marca, a.modelo, $ano AS ano, a.preco, a.preco_texto_bruto,
            a.carroceria, a.tipo, f.preco AS preco_fipe, a.fipe_match_confianca,
            r.id AS revenda_id, r.nome AS revenda, r.cidade, r.uf, a.primeira_vez_visto
        FROM anuncio a
        JOIN revenda r ON r.id=a.revenda_id
        LEFT JOIN fipe_preco f ON f.id=a.fipe_preco_id
        WHERE a.status='ativo' AND a.preco>0" . $universo);

    $temEventos = (int)(compra_linhas($conn, "SELECT COUNT(*) n FROM information_schema.TABLES
        WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='anuncio_evento'")[0]['n'] ?? 0) > 0;
    $coberturaDias = 0;
    $saidasPorGrupoUf = [];
    $reduzidos = [];
    if ($temEventos) {
        $cobertura = compra_linhas($conn, "SELECT MIN(e.dia_referencia) inicio, MAX(e.dia_referencia) fim
            FROM anuncio_evento e WHERE e.origem='anuncio_snapshot'")[0] ?? [];
        if (!empty($cobertura['inicio']) && !empty($cobertura['fim'])) {
            $coberturaDias = max(1, (int)((strtotime($cobertura['fim']) - strtotime($cobertura['inicio'])) / 86400) + 1);
        }
        // Queda maior que 50% é erro de coleta, não sinal (mesma regra de hoje_stats.php e lojistas.php).
        foreach (compra_linhas($conn, "SELECT DISTINCT e.anuncio_id
            FROM anuncio_evento e JOIN anuncio a ON a.id=e.anuncio_id
            WHERE a.status='ativo' AND e.tipo_evento='mudanca_preco'
              AND e.dia_referencia>=DATE_SUB(CURDATE(), INTERVAL 30 DAY)
              AND e.valor_anterior_decimal>e.valor_novo_decimal AND e.valor_novo_decimal>=e.valor_anterior_decimal*0.5" . $universo) as $linha) {
            $reduzidos[(int)$linha['anuncio_id']] = true;
        }
        foreach (compra_linhas($conn, "SELECT a.marca, a.modelo, $ano AS ano, r.uf,
                GREATEST(0, DATEDIFF(e.dia_referencia, COALESCE(
                  (SELECT MAX(origem.dia_referencia) FROM anuncio_evento origem
                   WHERE origem.anuncio_id=e.anuncio_id AND origem.tipo_evento IN ('primeira_observacao','reaparecimento')
                     AND origem.ocorrido_em<=e.ocorrido_em), DATE(a.primeira_vez_visto)))) AS dias_observados
            FROM anuncio_evento e JOIN anuncio a ON a.id=e.anuncio_id JOIN revenda r ON r.id=a.revenda_id
            WHERE e.tipo_evento='saida_detectada'
              AND e.dia_referencia>=DATE_SUB(CURDATE(), INTERVAL 180 DAY)" . $universo) as $saida) {
            $chave = oper_compra_chave_grupo(['marca' => $saida['marca'], 'modelo' => $saida['modelo'], 'ano' => $saida['ano']]);
            $saidasPorGrupoUf[$chave][strtoupper((string)$saida['uf'])][] = $saida['dias_observados'] !== null ? (int)$saida['dias_observados'] : null;
        }
    }
    foreach ($anuncios as &$a) {
        $a['id'] = (int)$a['id'];
        $a['ano'] = (int)$a['ano'];
        $a['preco'] = (float)$a['preco'];
        $a['preco_fipe'] = $a['preco_fipe'] !== null ? (float)$a['preco_fipe'] : null;
        $a['revenda_id'] = (int)$a['revenda_id'];
        $a['reduziu_30d'] = isset($reduzidos[$a['id']]) ? 1 : 0;
    }
    unset($a);

    $ufsResultado = oper_compra_monta($anuncios, $saidasPorGrupoUf, $temEventos, $coberturaDias, $opcoes); // todas as UFs; o recorte vem depois
} catch (Throwable $e) {
    error_log('oportunidades_compra: ' . $e->getMessage());
    http_response_code(500);
    envia_json(['erro' => 'Não foi possível montar as oportunidades agora.', 'codigo' => 'OPORTUNIDADES_INDISPONIVEL']);
}
$conn->close();

$payload = [
    'escopo' => ['segmento' => 'Pesado (caminhões sem implemento, 2006 em diante)', 'ufs' => [], 'modelos_por_uf' => $opcoes['modelos_por_uf'], 'anuncios_por_modelo' => $opcoes['anuncios_por_modelo']],
    'ufs' => $ufsResultado,
    'pesos' => OPER_COMPRA_PESOS,
    'historico_eventos' => ['disponivel' => $temEventos, 'cobertura_dias' => $coberturaDias],
    'nota' => 'Candidatos à negociação, não recomendação de compra. Preço é anunciado, não de venda. Redução de preço e tempo observado são sinais, não prova de disposição para negociar. UFs ou modelos sem amostra e histórico suficientes não aparecem.',
    'gerado_em' => date(DATE_ATOM),
];
@file_put_contents($cacheArquivo, json_encode($payload, JSON_UNESCAPED_UNICODE), LOCK_EX);
envia_json(compra_recorta_ufs($payload, $ufs));
