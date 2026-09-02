<?php
/**
 * Painel geográfico do mercado principal.
 * O recorte comparável desta versão é factual: marca + modelo + ano-modelo exatos.
 * Nenhuma equivalência comercial é inferida silenciosamente.
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/market_quality.php';
require_once __DIR__ . '/lib/market_scope.php';
require_once __DIR__ . '/lib/market_taxonomy.php';
require_once __DIR__ . '/lib/query_contract.php';

$conn = conecta();
$periodo = oper_periodo_contrato($_GET['periodo'] ?? null);
$dias = (int)$periodo['dias'];

$REGIOES = [
    'Sul' => ['PR','SC','RS'], 'Sudeste' => ['SP','RJ','MG','ES'],
    'Centro-Oeste' => ['MT','MS','GO','DF'],
    'Nordeste' => ['BA','PE','CE','MA','PB','RN','AL','PI','SE'],
    'Norte' => ['AM','PA','RO','RR','AC','AP','TO'],
];
$UF_REGIAO = [];
foreach ($REGIOES as $nome => $ufs) foreach ($ufs as $sigla) $UF_REGIAO[$sigla] = $nome;

function painel_rows(mysqli $conn, string $sql, string $types = '', array $params = []): array {
    $st = $conn->prepare($sql);
    if ($params) $st->bind_param($types, ...$params);
    $st->execute();
    $res = $st->get_result();
    $rows = [];
    while ($row = $res->fetch_assoc()) $rows[] = $row;
    $st->close();
    return $rows;
}

function painel_placeholders(array $valores): string {
    return implode(',', array_fill(0, count($valores), '?'));
}

function painel_rotulo_grupo(string $marca, string $modelo, int $ano): string {
    $marca = strtoupper(trim($marca));
    $modelo = strtoupper(trim($modelo));
    $prefixo = $marca . ' ';
    $veiculo = str_starts_with($modelo, $prefixo) ? $modelo : trim($marca . ' ' . $modelo);
    return $veiculo . ' · ' . $ano;
}

function painel_chave_grupo(string $marca, string $modelo, int $ano): string {
    return strtoupper(trim($marca)) . "\0" . strtoupper(trim($modelo)) . "\0" . $ano;
}

function painel_resumo_grupo(array $grupo, int $saidas, array $periodo): array {
    $stats = mercado_calcula_estatisticas($grupo['registros']);
    $entradas = (int)$grupo['entradas'];
    $ativos = count($grupo['registros']);
    return [
        'id' => substr(hash('sha256', $grupo['chave']), 0, 20),
        'tipo_recorte' => 'marca_modelo_ano_exato',
        'equivalencia_aplicada' => false,
        'marca' => $grupo['marca'],
        'modelo' => $grupo['modelo'],
        'ano' => $grupo['ano'],
        'rotulo' => painel_rotulo_grupo($grupo['marca'], $grupo['modelo'], $grupo['ano']),
        'anuncios' => $ativos,
        'lojistas' => count($grupo['lojistas']),
        'entradas_periodo' => $entradas,
        'saidas_periodo' => $saidas,
        'saldo_periodo' => $entradas - $saidas,
        'movimento_pct' => $ativos > 0 ? round(($entradas - $saidas) / $ativos * 100, 1) : null,
        'periodo' => $periodo,
        'precos' => [
            'mediana' => $stats['mediana'], 'media' => $stats['media'],
            'p25' => $stats['p25'], 'p75' => $stats['p75'],
            'menor' => $stats['menor'], 'maior' => $stats['maior'],
            'amostra_total' => $stats['amostra_total'],
            'amostra_qualificada' => $stats['amostra_qualificada'],
            'confianca' => $stats['confianca'], 'excluidos' => $stats['excluidos'],
        ],
    ];
}

$categorias = oper_taxonomia_tipos_por_categoria();
$mercados = oper_taxonomia_tipos_por_mercado();
$segmento = (string)($_GET['segmento'] ?? 'todas');
$tipos = $segmento !== 'todas' && isset($categorias[$segmento])
    ? $categorias[$segmento]
    : $mercados['principal'];

$baseWhere = ['a.tipo IN (' . painel_placeholders($tipos) . ')'];
$baseParams = array_values($tipos);
$baseTypes = str_repeat('s', count($tipos));

$regiao = trim((string)($_GET['regiao'] ?? 'todas'));
// Multisseleção de UF (item 3/redesign): aceita "uf=PR,SC" (várias) ou "uf=PR" (uma só,
// compatível com o formato anterior). "ufs" no retorno é a lista real; "uf" continua sendo a
// primeira UF (ou 'todas') só para não quebrar quem já lia esse campo como string única
// (ex.: o drill-down de cidade, que só faz sentido com exatamente uma UF selecionada).
$ufParametro = (string)($_GET['uf'] ?? 'todas');
$ufsSelecionadas = painel_normaliza_ufs($ufParametro, $UF_REGIAO);
$cidade = trim((string)($_GET['cidade'] ?? 'todas'));
$scopeWhere = $baseWhere;
$scopeParams = $baseParams;
$scopeTypes = $baseTypes;
if ($ufsSelecionadas) {
    $scopeWhere[] = 'r.uf IN (' . painel_placeholders($ufsSelecionadas) . ')';
    foreach ($ufsSelecionadas as $sigla) { $scopeParams[] = $sigla; $scopeTypes .= 's'; }
    $regiao = painel_regiao_unica($ufsSelecionadas, $UF_REGIAO);
    $uf = $ufsSelecionadas[0];
    if (count($ufsSelecionadas) > 1) $cidade = 'todas'; // drill-down de cidade exige UF única
} elseif ($regiao !== 'todas' && isset($REGIOES[$regiao])) {
    $scopeWhere[] = 'r.uf IN (' . painel_placeholders($REGIOES[$regiao]) . ')';
    foreach ($REGIOES[$regiao] as $sigla) { $scopeParams[] = $sigla; $scopeTypes .= 's'; }
    $uf = 'todas';
} else {
    $regiao = 'todas'; $uf = 'todas';
}
if ($cidade !== '' && strtolower($cidade) !== 'todas') {
    $scopeWhere[] = 'r.cidade=?'; $scopeParams[] = $cidade; $scopeTypes .= 's';
} else {
    $cidade = 'todas';
}
$scopeSql = implode(' AND ', $scopeWhere);

$ativos = painel_rows($conn, "SELECT a.preco, a.preco_texto_bruto, a.titulo, f.preco preco_fipe,
        r.id revenda_id, r.uf, r.cidade
    FROM anuncio a JOIN revenda r ON r.id=a.revenda_id
    LEFT JOIN fipe_preco f ON f.id=a.fipe_preco_id
    WHERE a.status='ativo' AND $scopeSql", $scopeTypes, $scopeParams);
$statsGeral = mercado_calcula_estatisticas($ativos);
$desvioFipeMedioPct = mercado_desvio_fipe_medio_pct($ativos);
$lojistasSet = []; $cidadesSet = []; $ufsSet = [];
foreach ($ativos as $item) {
    $lojistasSet[(int)$item['revenda_id']] = true;
    $cidadesSet[$item['uf'] . "\0" . $item['cidade']] = true;
    $ufsSet[$item['uf']] = true;
}

// Movimento do recorte inteiro (Panorama do redesign) — não confundir com o movimento por
// modelo (grupos abaixo): aqui é a contagem total de anúncios que entraram/saíram no recorte
// selecionado (segmento + UF/cidade), no mesmo período já escolhido pelo usuário no topo.
$entradasPeriodoGeral = (int)(painel_rows($conn, "SELECT COUNT(*) n FROM anuncio a
    JOIN revenda r ON r.id=a.revenda_id
    WHERE a.status='ativo' AND $scopeSql
      AND a.primeira_vez_visto>=DATE_SUB(NOW(), INTERVAL $dias DAY)", $scopeTypes, $scopeParams)[0]['n'] ?? 0);
$saidasPeriodoGeral = (int)(painel_rows($conn, "SELECT COUNT(*) n FROM anuncio a
    JOIN revenda r ON r.id=a.revenda_id
    WHERE a.status='removido_confirmado' AND a.data_remocao>=DATE_SUB(NOW(), INTERVAL $dias DAY)
      AND $scopeSql", $scopeTypes, $scopeParams)[0]['n'] ?? 0);

$geoWhere = implode(' AND ', $baseWhere);
$geografia = painel_rows($conn, "SELECT r.uf, COUNT(*) anuncios, COUNT(DISTINCT r.id) lojistas,
        COUNT(DISTINCT r.cidade) cidades
    FROM anuncio a JOIN revenda r ON r.id=a.revenda_id
    WHERE a.status='ativo' AND $geoWhere GROUP BY r.uf ORDER BY anuncios DESC", $baseTypes, $baseParams);
$ufsGeo = [];
foreach ($geografia as $item) {
    $sigla = $item['uf'];
    $ufsGeo[] = [
        'uf' => $sigla, 'regiao' => $UF_REGIAO[$sigla] ?? null,
        'anuncios' => (int)$item['anuncios'], 'lojistas' => (int)$item['lojistas'],
        'cidades' => (int)$item['cidades'],
    ];
}

$cidades = painel_rows($conn, "SELECT r.cidade, r.uf, COUNT(*) anuncios, COUNT(DISTINCT r.id) lojistas
    FROM anuncio a JOIN revenda r ON r.id=a.revenda_id
    WHERE a.status='ativo' AND $scopeSql
    GROUP BY r.uf, r.cidade ORDER BY anuncios DESC LIMIT 12", $scopeTypes, $scopeParams);
foreach ($cidades as &$item) {
    $item['anuncios'] = (int)$item['anuncios']; $item['lojistas'] = (int)$item['lojistas'];
}
unset($item);

$grupoWhere = array_merge($scopeWhere, [
    "a.tipo='Caminhao'", "a.marca IS NOT NULL", "TRIM(a.marca)<>''",
    "a.modelo IS NOT NULL", "TRIM(a.modelo)<>''",
    'COALESCE(a.ano_final,a.ano_inicial) BETWEEN 1950 AND YEAR(CURDATE())+2',
]);
$grupoSql = implode(' AND ', $grupoWhere);
$grupoRows = painel_rows($conn, "SELECT UPPER(TRIM(a.marca)) marca, UPPER(TRIM(a.modelo)) modelo,
        COALESCE(a.ano_final,a.ano_inicial) ano, a.preco, a.preco_texto_bruto, a.titulo,
        f.preco preco_fipe, r.id revenda_id, r.uf, r.cidade,
        (a.primeira_vez_visto>=DATE_SUB(NOW(), INTERVAL $dias DAY)) entrada_periodo
    FROM anuncio a JOIN revenda r ON r.id=a.revenda_id
    LEFT JOIN fipe_preco f ON f.id=a.fipe_preco_id
    WHERE a.status='ativo' AND $grupoSql", $scopeTypes, $scopeParams);

$grupos = [];
foreach ($grupoRows as $row) {
    $ano = (int)$row['ano'];
    $chave = painel_chave_grupo($row['marca'], $row['modelo'], $ano);
    if (!isset($grupos[$chave])) $grupos[$chave] = [
        'chave' => $chave, 'marca' => $row['marca'], 'modelo' => $row['modelo'], 'ano' => $ano,
        'registros' => [], 'lojistas' => [], 'entradas' => 0,
    ];
    $grupos[$chave]['registros'][] = $row;
    $grupos[$chave]['lojistas'][(int)$row['revenda_id']] = true;
    if (!empty($row['entrada_periodo'])) $grupos[$chave]['entradas']++;
}
uasort($grupos, fn($a, $b) => count($b['registros']) <=> count($a['registros']));

$saidaRows = painel_rows($conn, "SELECT UPPER(TRIM(a.marca)) marca, UPPER(TRIM(a.modelo)) modelo,
        COALESCE(a.ano_final,a.ano_inicial) ano, COUNT(*) saidas
    FROM anuncio a JOIN revenda r ON r.id=a.revenda_id
    WHERE a.status='removido_confirmado' AND a.data_remocao>=DATE_SUB(NOW(), INTERVAL $dias DAY)
      AND $grupoSql GROUP BY marca, modelo, ano", $scopeTypes, $scopeParams);
$saidasPorGrupo = [];
foreach ($saidaRows as $row) {
    $saidasPorGrupo[painel_chave_grupo($row['marca'], $row['modelo'], (int)$row['ano'])] = (int)$row['saidas'];
}

// Limite ampliado de 10 para 30 (decisão registrada no CLAUDE.md, item 5): o agrupamento por
// marca+modelo+ano (item 4) satura o top-10 com variações de ano do mesmo modelo, então o
// frontend busca mais e mostra as 10 primeiras com um "Ver mais" para expandir sem nova consulta.
$LIMITE_MODELOS = 30;
$modelos = [];
foreach (array_slice($grupos, 0, $LIMITE_MODELOS, true) as $chave => $grupo) {
    $modelos[] = painel_resumo_grupo($grupo, $saidasPorGrupo[$chave] ?? 0, $periodo);
}

$marcaSelecionada = strtoupper(trim((string)($_GET['marca'] ?? '')));
$modeloSelecionado = strtoupper(trim((string)($_GET['modelo'] ?? '')));
$anoSelecionado = (int)($_GET['ano'] ?? 0);
$chaveSelecionada = $marcaSelecionada && $modeloSelecionado && $anoSelecionado
    ? painel_chave_grupo($marcaSelecionada, $modeloSelecionado, $anoSelecionado) : null;
if (!$chaveSelecionada || !isset($grupos[$chaveSelecionada])) $chaveSelecionada = array_key_first($grupos);
$selecionado = $chaveSelecionada && isset($grupos[$chaveSelecionada])
    ? painel_resumo_grupo($grupos[$chaveSelecionada], $saidasPorGrupo[$chaveSelecionada] ?? 0, $periodo)
    : null;

$serie = [];
$regioesSelecionado = [];
$lojistasSelecionado = [];
$temSnapshots = false;
if ($selecionado) {
    $tabela = $conn->query("SELECT COUNT(*) n FROM information_schema.TABLES
        WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='anuncio_snapshot'");
    $temSnapshots = $tabela && (int)$tabela->fetch_assoc()['n'] > 0;
    $selectedWhere = array_merge($scopeWhere, [
        "a.tipo='Caminhao'", "UPPER(TRIM(a.marca))=?", "UPPER(TRIM(a.modelo))=?",
        'COALESCE(a.ano_final,a.ano_inicial)=?',
    ]);
    $selectedParams = array_merge($scopeParams, [$selecionado['marca'], $selecionado['modelo'], $selecionado['ano']]);
    $selectedTypes = $scopeTypes . 'ssi';
    $selectedSql = implode(' AND ', $selectedWhere);
    if ($temSnapshots) {
        $serieRows = painel_rows($conn, "SELECT s.dia, COUNT(*) ofertas,
                ROUND(AVG(CASE WHEN s.preco_do_dia>0 THEN s.preco_do_dia END)) preco_medio
            FROM anuncio_snapshot s JOIN anuncio a ON a.id=s.anuncio_id
            JOIN revenda r ON r.id=a.revenda_id
            WHERE s.dia>=DATE_SUB(CURDATE(), INTERVAL $dias DAY) AND s.status_do_dia='ativo'
              AND $selectedSql GROUP BY s.dia ORDER BY s.dia", $selectedTypes, $selectedParams);
        foreach ($serieRows as $row) $serie[] = [
            'dia' => $row['dia'], 'ofertas' => (int)$row['ofertas'],
            'preco_medio' => $row['preco_medio'] !== null ? (float)$row['preco_medio'] : null,
        ];
    }
    if (!$serie) $serie[] = [
        'dia' => date('Y-m-d'), 'ofertas' => $selecionado['anuncios'],
        'preco_medio' => $selecionado['precos']['media'],
    ];

    $nacionalWhere = array_merge($baseWhere, [
        "a.tipo='Caminhao'", "UPPER(TRIM(a.marca))=?", "UPPER(TRIM(a.modelo))=?",
        'COALESCE(a.ano_final,a.ano_inicial)=?',
    ]);
    $nacionalParams = array_merge($baseParams, [$selecionado['marca'], $selecionado['modelo'], $selecionado['ano']]);
    $nacionalTypes = $baseTypes . 'ssi';
    $regiaoRows = painel_rows($conn, "SELECT r.uf, COUNT(*) anuncios
        FROM anuncio a JOIN revenda r ON r.id=a.revenda_id
        WHERE a.status='ativo' AND " . implode(' AND ', $nacionalWhere) . " GROUP BY r.uf",
        $nacionalTypes, $nacionalParams);
    $regiaoMapa = [];
    foreach ($regiaoRows as $row) {
        $nome = $UF_REGIAO[$row['uf']] ?? 'Sem região';
        $regiaoMapa[$nome] = ($regiaoMapa[$nome] ?? 0) + (int)$row['anuncios'];
    }
    arsort($regiaoMapa);
    foreach ($regiaoMapa as $nome => $n) $regioesSelecionado[] = ['regiao' => $nome, 'anuncios' => $n];

    $lojistaRows = painel_rows($conn, "SELECT r.id, r.nome, r.cidade, r.uf, a.preco,
            a.preco_texto_bruto, a.titulo, f.preco preco_fipe
        FROM anuncio a JOIN revenda r ON r.id=a.revenda_id
        LEFT JOIN fipe_preco f ON f.id=a.fipe_preco_id
        WHERE a.status='ativo' AND $selectedSql", $selectedTypes, $selectedParams);
    $porLojista = [];
    foreach ($lojistaRows as $row) {
        $id = (int)$row['id'];
        if (!isset($porLojista[$id])) $porLojista[$id] = [
            'id' => $id, 'nome' => $row['nome'], 'cidade' => $row['cidade'], 'uf' => $row['uf'], 'registros' => [],
        ];
        $porLojista[$id]['registros'][] = $row;
    }
    uasort($porLojista, fn($a, $b) => count($b['registros']) <=> count($a['registros']));
    foreach (array_slice($porLojista, 0, 8, true) as $item) {
        $stats = mercado_calcula_estatisticas($item['registros']);
        $lojistasSelecionado[] = [
            'id' => $item['id'], 'nome' => $item['nome'], 'cidade' => $item['cidade'], 'uf' => $item['uf'],
            'anuncios' => count($item['registros']), 'mediana' => $stats['mediana'], 'confianca' => $stats['confianca'],
        ];
    }
}

$ultima = painel_rows($conn, "SELECT MAX(a.ultima_vez_ativo) atualizado_em FROM anuncio a
    JOIN revenda r ON r.id=a.revenda_id WHERE $scopeSql", $scopeTypes, $scopeParams)[0]['atualizado_em'] ?? null;

envia_json([
    'periodo' => $periodo,
    'escopo' => [
        'regiao' => $regiao, 'uf' => $uf, 'ufs' => $ufsSelecionadas, 'cidade' => $cidade,
        'segmento' => $segmento,
    ],
    'resumo' => [
        'anuncios' => count($ativos), 'lojistas' => count($lojistasSet),
        'cidades' => count($cidadesSet), 'ufs' => count($ufsSet),
        'ticket_mediano' => $statsGeral['mediana'], 'amostra_qualificada' => $statsGeral['amostra_qualificada'],
        'confianca' => $statsGeral['confianca'],
        'desvio_fipe_medio_pct' => $desvioFipeMedioPct,
        'entradas_periodo' => $entradasPeriodoGeral, 'saidas_periodo' => $saidasPeriodoGeral,
        'saldo_periodo' => $entradasPeriodoGeral - $saidasPeriodoGeral,
    ],
    'geografia' => ['ufs' => $ufsGeo, 'cidades' => $cidades],
    'modelos' => $modelos,
    'modelos_total' => count($grupos),
    'selecionado' => $selecionado ? $selecionado + [
        'serie' => $serie, 'regioes' => $regioesSelecionado, 'lojistas_destaque' => $lojistasSelecionado,
    ] : null,
    'fonte' => [
        'atualizado_em' => $ultima, 'historico_snapshot' => $temSnapshots,
        'preco_serie_metrica' => 'media_observada',
        'nota' => 'Preços são anunciados. Saída detectada não comprova venda.',
    ],
]);
