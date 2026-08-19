<?php
/** Painel detalhado do concorrente com fatos observados, nunca vendas presumidas. */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/competitor_history.php';
require_once __DIR__ . '/lib/market_quality.php';
require_once __DIR__ . '/lib/market_taxonomy.php';
$conn = conecta();

function concorrente_linhas(mysqli $conn, string $sql, string $types = '', array $params = []): array {
    $stmt = $conn->prepare($sql);
    if (!$stmt) throw new RuntimeException('Não foi possível preparar a consulta do concorrente.');
    if ($params) $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $res = $stmt->get_result();
    $linhas = [];
    while ($row = $res->fetch_assoc()) $linhas[] = $row;
    $stmt->close();
    return $linhas;
}

function concorrente_normaliza_anuncio(array $row): array {
    foreach (['anuncio_id', 'anuncio_portal_id', 'ano_inicial', 'ano_final', 'dias_observados', 'evento_id'] as $campo) {
        $row[$campo] = isset($row[$campo]) && $row[$campo] !== null ? (int)$row[$campo] : null;
    }
    $row['preco'] = isset($row['preco']) && $row['preco'] !== null ? (float)$row['preco'] : null;
    if (array_key_exists('preco_saida', $row)) {
        $row['preco_saida'] = $row['preco_saida'] !== null ? (float)$row['preco_saida'] : null;
    }
    if (array_key_exists('reapareceu', $row)) $row['reapareceu'] = (bool)$row['reapareceu'];
    return $row;
}

$lojistaId = max(0, (int)($_GET['id'] ?? 0));
if ($lojistaId === 0) {
    http_response_code(400);
    envia_json(['erro' => 'Lojista inválido.', 'codigo' => 'LOJISTA_INVALIDO']);
}

$lojistas = concorrente_linhas($conn, "SELECT id, nome, cidade, uf, url_perfil, telefone, ativa_desde
    FROM revenda WHERE id=? LIMIT 1", 'i', [$lojistaId]);
if (!$lojistas) {
    http_response_code(404);
    envia_json(['erro' => 'Lojista não encontrado.', 'codigo' => 'LOJISTA_NAO_ENCONTRADO']);
}
$lojista = $lojistas[0];
$lojista['id'] = (int)$lojista['id'];

$categorias = oper_taxonomia_tipos_por_categoria();
$categoria = $_GET['categoria'] ?? 'todas';
if ($categoria !== 'todas' && !isset($categorias[$categoria])) $categoria = 'todas';

$where = 'a.revenda_id=?';
$types = 'i';
$params = [$lojistaId];
if ($categoria !== 'todas') {
    $tipos = $categorias[$categoria];
    $where .= ' AND a.tipo IN (' . implode(',', array_fill(0, count($tipos), '?')) . ')';
    foreach ($tipos as $tipo) { $params[] = $tipo; $types .= 's'; }
}

$resumoAtual = concorrente_linhas($conn, "SELECT COUNT(*) total_historico,
    SUM(CASE WHEN a.status='ativo' THEN 1 ELSE 0 END) ativos,
    SUM(CASE WHEN a.status='removido_confirmado' THEN 1 ELSE 0 END) saidas_status,
    SUM(CASE WHEN a.status='removido_confirmado'
              AND a.data_remocao>=DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) saidas_status_30d
    FROM anuncio a WHERE $where", $types, $params)[0];
$ativosTotal = (int)($resumoAtual['ativos'] ?? 0);

$baseCampos = "a.id anuncio_id, a.anuncio_portal_id, a.titulo, a.url, a.tipo,
    a.marca, a.modelo, a.carroceria, a.tracao, a.ano_inicial, a.ano_final, a.preco,
    a.status, a.primeira_vez_visto, a.ultima_vez_ativo, a.data_remocao";

$estoqueAtivo = concorrente_linhas($conn, "SELECT $baseCampos,
    GREATEST(0, DATEDIFF(CURDATE(), DATE(a.primeira_vez_visto))) dias_observados
    FROM anuncio a WHERE $where AND a.status='ativo'
    ORDER BY a.ultima_vez_ativo DESC, a.id DESC LIMIT 150", $types, $params);
$estoqueAtivo = array_map('concorrente_normaliza_anuncio', $estoqueAtivo);

$precosAtivos = concorrente_linhas($conn, "SELECT a.preco, a.titulo, a.preco_texto_bruto,
    f.preco preco_fipe FROM anuncio a LEFT JOIN fipe_preco f ON f.id=a.fipe_preco_id
    WHERE $where AND a.status='ativo' AND a.preco IS NOT NULL AND a.preco>0", $types, $params);
$estatisticasPrecoAtivo = mercado_calcula_estatisticas($precosAtivos);

$tabelaEventos = $conn->query("SELECT COUNT(*) total FROM information_schema.TABLES
    WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='anuncio_evento'");
$eventosDisponiveis = $tabelaEventos && (int)($tabelaEventos->fetch_assoc()['total'] ?? 0) > 0;
$contagensEventos = [];
$coberturaInicio = null;
$coberturaFim = null;
$saidas30d = 0;
$duracoesSaida = [];

if ($eventosDisponiveis) {
    $eventosResumo = concorrente_linhas($conn, "SELECT e.tipo_evento, COUNT(*) quantidade,
        MIN(e.dia_referencia) primeira_data, MAX(e.dia_referencia) ultima_data,
        SUM(CASE WHEN e.tipo_evento='saida_detectada'
                  AND e.dia_referencia>=DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) saidas_30d
        FROM anuncio_evento e JOIN anuncio a ON a.id=e.anuncio_id
        WHERE $where GROUP BY e.tipo_evento", $types, $params);
    foreach ($eventosResumo as $item) {
        $contagensEventos[$item['tipo_evento']] = (int)$item['quantidade'];
        $saidas30d += (int)$item['saidas_30d'];
        if ($coberturaInicio === null || $item['primeira_data'] < $coberturaInicio) $coberturaInicio = $item['primeira_data'];
        if ($coberturaFim === null || $item['ultima_data'] > $coberturaFim) $coberturaFim = $item['ultima_data'];
    }
    $inicioEpisodio = "COALESCE(
        (SELECT MAX(origem.dia_referencia) FROM anuncio_evento origem
         WHERE origem.anuncio_id=e.anuncio_id
           AND origem.tipo_evento IN ('primeira_observacao','reaparecimento')
           AND origem.ocorrido_em<=e.ocorrido_em), DATE(a.primeira_vez_visto))";
    $sqlSaidas = "SELECT $baseCampos, e.id evento_id, e.ocorrido_em data_saida,
        COALESCE(s.preco_do_dia, a.preco) preco_saida,
        GREATEST(0, DATEDIFF(e.dia_referencia, COALESCE(
            (SELECT MAX(origem.dia_referencia) FROM anuncio_evento origem
             WHERE origem.anuncio_id=e.anuncio_id
               AND origem.tipo_evento IN ('primeira_observacao','reaparecimento')
               AND origem.ocorrido_em<=e.ocorrido_em), DATE(a.primeira_vez_visto)))) dias_observados,
        EXISTS(SELECT 1 FROM anuncio_evento volta
               WHERE volta.anuncio_id=e.anuncio_id AND volta.tipo_evento='reaparecimento'
                 AND volta.ocorrido_em>e.ocorrido_em) reapareceu
        FROM anuncio_evento e
        JOIN anuncio a ON a.id=e.anuncio_id
        LEFT JOIN anuncio_snapshot s ON s.anuncio_id=e.anuncio_id AND s.dia=e.dia_referencia
        WHERE $where AND e.tipo_evento='saida_detectada'
        ORDER BY e.ocorrido_em DESC, e.id DESC LIMIT 150";
    $saidasObservadas = concorrente_linhas($conn, $sqlSaidas, $types, $params);
    $saidasObservadas = array_map('concorrente_normaliza_anuncio', $saidasObservadas);
    $duracoesSaida = concorrente_linhas($conn, "SELECT GREATEST(0,
        DATEDIFF(e.dia_referencia, $inicioEpisodio)) dias_observados
        FROM anuncio_evento e JOIN anuncio a ON a.id=e.anuncio_id
        WHERE $where AND e.tipo_evento='saida_detectada'", $types, $params);
    $duracoesSaida = array_column($duracoesSaida, 'dias_observados');
} else {
    $saidasObservadas = concorrente_linhas($conn, "SELECT $baseCampos,
        a.data_remocao data_saida,
        GREATEST(0, DATEDIFF(DATE(a.data_remocao), DATE(a.primeira_vez_visto))) dias_observados,
        0 reapareceu
        FROM anuncio a WHERE $where AND a.status='removido_confirmado'
        ORDER BY a.data_remocao DESC, a.id DESC LIMIT 150", $types, $params);
    $saidasObservadas = array_map('concorrente_normaliza_anuncio', $saidasObservadas);
    $duracoesSaida = concorrente_linhas($conn, "SELECT GREATEST(0,
        DATEDIFF(DATE(a.data_remocao), DATE(a.primeira_vez_visto))) dias_observados
        FROM anuncio a WHERE $where AND a.status='removido_confirmado'", $types, $params);
    $duracoesSaida = array_column($duracoesSaida, 'dias_observados');
    $saidas30d = (int)($resumoAtual['saidas_status_30d'] ?? 0);
}

$saidasTotal = $eventosDisponiveis
    ? (int)($contagensEventos['saida_detectada'] ?? 0)
    : (int)($resumoAtual['saidas_status'] ?? 0);
$coberturaDias = ($coberturaInicio && $coberturaFim)
    ? max(1, (int)((strtotime($coberturaFim) - strtotime($coberturaInicio)) / 86400) + 1)
    : 0;
$confianca = oper_concorrente_confianca($eventosDisponiveis, $coberturaDias, $saidasTotal);

envia_json([
    'lojista' => $lojista,
    'recorte' => ['categoria' => $categoria],
    'resumo' => [
        'ativos' => $ativosTotal,
        'saidas_observadas' => $saidasTotal,
        'saidas_30d' => $saidas30d,
        'reaparecimentos' => (int)($contagensEventos['reaparecimento'] ?? 0),
        'mediana_dias_ate_saida' => oper_mediana_numerica($duracoesSaida),
        'preco_mediano_ativo' => $estatisticasPrecoAtivo['mediana'],
        'preco_ativo_amostra' => (int)$estatisticasPrecoAtivo['amostra_qualificada'],
        'preco_ativo_confianca' => $estatisticasPrecoAtivo['confianca'],
    ],
    'historico_eventos' => [
        'disponivel' => $eventosDisponiveis,
        'cobertura_inicio' => $coberturaInicio,
        'cobertura_fim' => $coberturaFim,
        'cobertura_dias' => $coberturaDias,
        'contagens' => $contagensEventos,
    ],
    'confianca' => $confianca,
    'estoque_ativo' => $estoqueAtivo,
    'saidas_observadas' => $saidasObservadas,
    'nota' => 'Saída observada significa ausência confirmada no portal, não venda comprovada.',
]);
