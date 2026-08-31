<?php
/**
 * OPER RADAR — API: lista de anuncios com filtros, paginacao real e total do banco
 * GET anuncios.php?categoria=caminhoes&limit=60&offset=0&ordem=aleatorio&q=daf
 *
 * Diferenca importante vs versao anterior: agora devolve `total` = quantos anuncios
 * batem os filtros NO BANCO INTEIRO (nao so na pagina). O app usa isso pro scroll
 * infinito e pras contagens honestas.
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/market_quality.php';
require_once __DIR__ . '/lib/market_taxonomy.php';
require_once __DIR__ . '/lib/vehicle_taxonomy.php';
require_once __DIR__ . '/lib/query_contract.php';
$conn = conecta();

$REGIOES = [
    'Sul' => ['PR','SC','RS'], 'Sudeste' => ['SP','RJ','MG','ES'],
    'Centro-Oeste' => ['MT','MS','GO','DF'],
    'Nordeste' => ['BA','PE','CE','MA','PB','RN','AL','PI','SE'],
    'Norte' => ['AM','PA','RO','RR','AC','AP','TO'],
];

$CATEGORIA_TIPOS = oper_taxonomia_tipos_por_categoria();
$MERCADO_TIPOS = oper_taxonomia_tipos_por_mercado();

$limit  = min(max((int)($_GET['limit'] ?? 60), 1), 200);
$offset = max((int)($_GET['offset'] ?? 0), 0);
$somenteAbaixoFipe = (($_GET['abaixo_fipe'] ?? '') === '1');

$where = []; $params = []; $types = '';

if (!empty($_GET['mercado']) && isset($MERCADO_TIPOS[$_GET['mercado']])) {
    $tipos = $MERCADO_TIPOS['principal'];
    $ph = implode(',', array_fill(0, count($tipos), '?'));
    $where[] = $_GET['mercado'] === 'principal' ? "a.tipo IN ($ph)" : "COALESCE(a.tipo,'') NOT IN ($ph)";
    foreach ($tipos as $t) { $params[] = $t; $types .= 's'; }
}
if (!empty($_GET['categoria']) && isset($CATEGORIA_TIPOS[$_GET['categoria']])) {
    $tipos = $CATEGORIA_TIPOS[$_GET['categoria']];
    $ph = implode(',', array_fill(0, count($tipos), '?'));
    $where[] = "a.tipo IN ($ph)";
    foreach ($tipos as $t) { $params[] = $t; $types .= 's'; }
}
if (!empty($_GET['status']))    { $where[] = 'a.status = ?';    $params[] = $_GET['status']; $types .= 's'; }
if (!empty($_GET['cidade']))    { $where[] = 'r.cidade = ?';    $params[] = $_GET['cidade']; $types .= 's'; }
if (!empty($_GET['regiao']) && isset($REGIOES[$_GET['regiao']])) {
    $ufsR = $REGIOES[$_GET['regiao']];
    $ph = implode(',', array_fill(0, count($ufsR), '?'));
    $where[] = "r.uf IN ($ph)";
    foreach ($ufsR as $u) { $params[] = $u; $types .= 's'; }
} elseif (!empty($_GET['uf'])) { $where[] = 'r.uf = ?'; $params[] = strtoupper($_GET['uf']); $types .= 's'; }
if (!empty($_GET['revenda']))   { $where[] = 'r.nome = ?';      $params[] = $_GET['revenda']; $types .= 's'; }
if (!empty($_GET['revenda_id'])) { $where[] = 'r.id = ?'; $params[] = (int)$_GET['revenda_id']; $types .= 'i'; }
if (!empty($_GET['tipo']))      { $where[] = 'a.tipo = ?';      $params[] = $_GET['tipo']; $types .= 's'; }
if (!empty($_GET['marca']))     { $where[] = 'a.marca = ?';     $params[] = strtoupper($_GET['marca']); $types .= 's'; }
if (!empty($_GET['carroceria'])) { $where[] = 'TRIM(a.carroceria) = ?'; $params[] = trim($_GET['carroceria']); $types .= 's'; }
if (!empty($_GET['preco_min'])) { $where[] = 'a.preco >= ?';    $params[] = (float)$_GET['preco_min']; $types .= 'd'; }
if (!empty($_GET['preco_max'])) { $where[] = 'a.preco <= ?';    $params[] = (float)$_GET['preco_max']; $types .= 'd'; }
$padraoTracao = oper_tracao_regexp($_GET['tracao'] ?? '');
if ($padraoTracao !== null) {
    $where[] = "REPLACE(UPPER(COALESCE(a.tracao,'')), '×', 'X') REGEXP ?";
    $params[] = $padraoTracao;
    $types .= 's';
}
if ($somenteAbaixoFipe) {
    $where[] = "a.preco IS NOT NULL AND f.preco IS NOT NULL
                AND a.preco >= f.preco * " . OPER_RADAR_RAZAO_MIN_FIPE . "
                AND a.preco < f.preco
                AND UPPER(CONCAT_WS(' ', a.titulo, a.preco_texto_bruto))
                    NOT REGEXP 'PARCEL|LEIL|LANCE|CONSORC|MENSAL|A[[:space:]]+PARTIR[[:space:]]+DE'";
}
if (!empty($_GET['fipe_confianca']) && in_array($_GET['fipe_confianca'], ['alto', 'medio'], true)) {
    $where[] = 'a.fipe_match_confianca = ?';
    $params[] = $_GET['fipe_confianca']; $types .= 's';
}
$fipeFila = $_GET['fipe_fila'] ?? 'todos';
if ($fipeFila === 'revisar') {
    $where[] = "a.tipo='Caminhao' AND a.status='ativo' AND a.fipe_preco_id IS NULL";
} elseif ($fipeFila === 'com_sugestao') {
    $where[] = "a.tipo='Caminhao' AND a.status='ativo' AND a.fipe_preco_id IS NULL
                AND EXISTS (SELECT 1 FROM anuncio_fipe_sugestao sx WHERE sx.anuncio_id=a.id)";
} elseif ($fipeFila === 'sem_sugestao') {
    $where[] = "a.tipo='Caminhao' AND a.status='ativo' AND a.fipe_preco_id IS NULL
                AND NOT EXISTS (SELECT 1 FROM anuncio_fipe_sugestao sx WHERE sx.anuncio_id=a.id)";
} elseif ($fipeFila === 'vinculado') {
    $where[] = "a.tipo='Caminhao' AND a.status='ativo' AND a.fipe_preco_id IS NOT NULL";
}
if (!empty($_GET['q'])) {
    // Cada palavra precisa existir em algum campo do veiculo. Assim, "DAF XF 530"
    // encontra titulos com palavras intermediarias sem misturar a revenda/cidade.
    $tokens = preg_split('/\s+/u', trim($_GET['q']), -1, PREG_SPLIT_NO_EMPTY);
    foreach (array_slice($tokens ?: [], 0, 8) as $token) {
        $where[] = "(a.titulo LIKE ? OR COALESCE(a.marca, '') LIKE ? OR COALESCE(a.modelo, '') LIKE ? OR COALESCE(a.tracao, '') LIKE ?)";
        $termo = '%' . $token . '%';
        array_push($params, $termo, $termo, $termo, $termo);
        $types .= 'ssss';
    }
}
$clausula = $where ? ' WHERE ' . implode(' AND ', $where) : '';

// 1) Total real no banco (respeitando filtros) — pro scroll infinito saber quando parar
$sqlCount = "SELECT COUNT(*) AS n FROM anuncio a
             JOIN revenda r ON r.id = a.revenda_id
             LEFT JOIN fipe_preco f ON f.id = a.fipe_preco_id" . $clausula;
$stc = $conn->prepare($sqlCount);
if ($params) $stc->bind_param($types, ...$params);
$stc->execute();
$total = (int)$stc->get_result()->fetch_assoc()['n'];
$stc->close();

// 2) Pagina de resultados
// 'aleatorio' usa RAND() com semente estavel por dia, pra paginacao nao repetir/pular itens
$semente = (int)date('Ymd');
$ordens = [
    'aleatorio'  => "RAND($semente), a.id ASC",
    'recente'    => "COALESCE(a.ultima_vez_ativo, a.primeira_vez_visto, '1970-01-01 00:00:00') DESC, a.id DESC",
    'preco_asc'  => 'a.preco IS NULL, a.preco ASC, a.id ASC',
    'preco_desc' => 'a.preco IS NULL, a.preco DESC, a.id DESC',
    'mais_tempo' => "COALESCE(a.primeira_vez_visto, a.ultima_vez_ativo, '1970-01-01 00:00:00') ASC, a.id ASC",
    'movimento'  => "COALESCE(a.data_remocao, a.ultima_vez_ativo, a.primeira_vez_visto, '1970-01-01 00:00:00') DESC, a.id DESC",
    'desvio_fipe' => 'a.preco / NULLIF(f.preco, 0) ASC, a.preco ASC, a.id ASC',
];
$ordemChave = isset($ordens[$_GET['ordem'] ?? '']) ? (string)$_GET['ordem'] : 'aleatorio';
$ordem = $ordens[$ordemChave];
$cursorSpecs = [
    'recente' => [
        'expressao' => "COALESCE(a.ultima_vez_ativo, a.primeira_vez_visto, '1970-01-01 00:00:00')",
        'direcao' => 'DESC',
    ],
    'mais_tempo' => [
        'expressao' => "COALESCE(a.primeira_vez_visto, a.ultima_vez_ativo, '1970-01-01 00:00:00')",
        'direcao' => 'ASC',
    ],
    'movimento' => [
        'expressao' => "COALESCE(a.data_remocao, a.ultima_vez_ativo, a.primeira_vez_visto, '1970-01-01 00:00:00')",
        'direcao' => 'DESC',
    ],
];
$cursorSuportado = isset($cursorSpecs[$ordemChave]) && !$somenteAbaixoFipe;
$fingerprint = oper_query_fingerprint($_GET);
$cursorRecebido = trim((string)($_GET['cursor'] ?? ''));
$cursorDados = null;
if ($cursorRecebido !== '') {
    if (!$cursorSuportado) {
        http_response_code(422);
        envia_json(['erro' => 'Cursor nao suportado para esta ordenacao.', 'codigo' => 'CURSOR_NAO_SUPORTADO']);
    }
    $cursorDados = oper_cursor_decode($cursorRecebido, $fingerprint, $ordemChave);
    if ($cursorDados === null) {
        http_response_code(422);
        envia_json(['erro' => 'Cursor invalido ou incompatível com os filtros.', 'codigo' => 'CURSOR_INVALIDO']);
    }
}

$wherePagina = $where;
$paramsPagina = $params;
$typesPagina = $types;
$cursorExpressao = $cursorSuportado ? $cursorSpecs[$ordemChave]['expressao'] : 'NULL';
if ($cursorDados !== null) {
    $comparador = $cursorSpecs[$ordemChave]['direcao'] === 'DESC' ? '<' : '>';
    $wherePagina[] = "($cursorExpressao $comparador ? OR ($cursorExpressao = ? AND a.id $comparador ?))";
    $paramsPagina[] = $cursorDados['valor'];
    $paramsPagina[] = $cursorDados['valor'];
    $paramsPagina[] = $cursorDados['id'];
    $typesPagina .= 'ssi';
}
$clausulaPagina = $wherePagina ? ' WHERE ' . implode(' AND ', $wherePagina) : '';

$sql = "SELECT a.id AS anuncio_id, a.anuncio_portal_id, a.url, a.titulo, a.tipo, a.marca, a.modelo, a.carroceria, a.tracao,
               a.ano_inicial, a.ano_final,
               a.ano_inicial AS ano_fabricacao, a.ano_final AS ano_modelo, a.cor,
               COALESCE(CONCAT(a.quilometragem_manual, ' km'), a.km_ou_horas) AS quilometragem,
               CASE WHEN a.quilometragem_manual IS NOT NULL THEN 'curadoria'
                    WHEN a.km_ou_horas IS NOT NULL AND a.km_ou_horas<>'' THEN 'coleta' ELSE NULL END AS quilometragem_origem,
               a.preco, a.preco_texto_bruto, a.status, a.primeira_vez_visto, a.ultima_vez_ativo, a.data_remocao,
               a.fipe_preco_id,
               a.fipe_match_status, a.fipe_match_confianca, a.fipe_match_motivo,
               a.fipe_vinculo_origem, COALESCE(fs.total, 0) AS fipe_sugestoes,
               f.preco AS preco_fipe, f.codigo_fipe,
               f.ano_codigo AS ano_fipe, f.mes_referencia AS referencia_fipe,
               fm.marca_fipe, fm.modelo_fipe,
               ROUND((a.preco - f.preco) / NULLIF(f.preco, 0) * 100, 1) AS desvio_fipe_pct,
               0 AS anuncios_comparaveis, NULL AS preco_medio_mercado,
               NULL AS menor_preco_mercado, NULL AS maior_preco_mercado,
               NULL AS desvio_mercado_pct,
               r.id AS revenda_id, r.nome AS revenda, r.cidade, r.uf,
               $cursorExpressao AS cursor_ordem_valor
        FROM anuncio a
        JOIN revenda r ON r.id = a.revenda_id
        LEFT JOIN fipe_preco f ON f.id = a.fipe_preco_id
        LEFT JOIN fipe_modelo fm ON fm.id = f.fipe_modelo_id
        LEFT JOIN (
            SELECT anuncio_id, COUNT(*) AS total
            FROM anuncio_fipe_sugestao GROUP BY anuncio_id
        ) fs ON fs.anuncio_id=a.id
        $clausulaPagina
        ORDER BY $ordem
        LIMIT ? OFFSET ?";
$paramsPag = $paramsPagina; $typesPag = $typesPagina;
// O filtro estatístico é aplicado após a consulta. Buscamos candidatos suficientes
// para que um preço inválido no início não esconda oportunidades válidas posteriores.
$limiteSql = $somenteAbaixoFipe ? 1000 : ($cursorSuportado ? $limit + 1 : $limit);
$offsetSql = ($somenteAbaixoFipe || $cursorDados !== null) ? 0 : $offset;
$paramsPag[] = $limiteSql;  $typesPag .= 'i';
$paramsPag[] = $offsetSql; $typesPag .= 'i';

$stmt = $conn->prepare($sql);
$stmt->bind_param($typesPag, ...$paramsPag);
$stmt->execute();
$res = $stmt->get_result();

$anuncios = [];
$cursoresPagina = [];
while ($row = $res->fetch_assoc()) {
    $cursorValor = $row['cursor_ordem_valor'] !== null ? (string)$row['cursor_ordem_valor'] : null;
    unset($row['cursor_ordem_valor']);
    $row['anuncio_id'] = (int)$row['anuncio_id'];
    $row['anuncio_portal_id'] = (int)$row['anuncio_portal_id'];
    foreach (['ano_inicial', 'ano_final', 'ano_fabricacao', 'ano_modelo'] as $campo) {
        $row[$campo] = $row[$campo] !== null ? (int)$row[$campo] : null;
    }
    $row['preco'] = $row['preco'] !== null ? (float)$row['preco'] : null;
    $row['preco_fipe'] = $row['preco_fipe'] !== null ? (float)$row['preco_fipe'] : null;
    $row['desvio_fipe_pct'] = $row['desvio_fipe_pct'] !== null ? (float)$row['desvio_fipe_pct'] : null;
    $row['preco_medio_mercado'] = $row['preco_medio_mercado'] !== null ? (float)$row['preco_medio_mercado'] : null;
    $row['menor_preco_mercado'] = $row['menor_preco_mercado'] !== null ? (float)$row['menor_preco_mercado'] : null;
    $row['maior_preco_mercado'] = $row['maior_preco_mercado'] !== null ? (float)$row['maior_preco_mercado'] : null;
    $row['desvio_mercado_pct'] = $row['desvio_mercado_pct'] !== null ? (float)$row['desvio_mercado_pct'] : null;
    $row['anuncios_comparaveis'] = (int)($row['anuncios_comparaveis'] ?? 0);
    $row['fipe_sugestoes'] = (int)($row['fipe_sugestoes'] ?? 0);
    $row['revenda_id'] = (int)$row['revenda_id'];
    $cursoresPagina[] = ['valor' => $cursorValor, 'id' => $row['anuncio_id']];
    $anuncios[] = $row;
}

$temExcedente = $cursorSuportado && count($anuncios) > $limit;
if ($temExcedente) {
    $anuncios = array_slice($anuncios, 0, $limit);
    $cursoresPagina = array_slice($cursoresPagina, 0, $limit);
}
$ultimoCursor = $cursoresPagina ? $cursoresPagina[count($cursoresPagina) - 1] : null;

$estatisticas = mercado_estatisticas_por_fipe($conn, array_column($anuncios, 'fipe_preco_id'));
foreach ($anuncios as &$row) {
    $fipeId = (int)($row['fipe_preco_id'] ?? 0);
    $row['fipe_preco_id'] = $fipeId ?: null;
    mercado_aplica_estatisticas($row, $estatisticas[$fipeId] ?? null);
}
unset($row);

if ($somenteAbaixoFipe) {
    $totalBruto = $total;
    $anuncios = array_values(array_filter($anuncios, fn($row) =>
        $row['preco_qualidade_status'] === 'valido'
        && $row['mercado_amostra_suficiente']
    ));
    $total = count($anuncios);
    $anuncios = array_slice($anuncios, $offset, $limit);
}

$retornados = count($anuncios);
$temMais = $cursorSuportado
    ? $temExcedente
    : ($offset + $retornados < $total);
$proximoCursor = ($cursorSuportado && $temMais)
    ? oper_cursor_encode($fingerprint, $ordemChave, $ultimoCursor['valor'], $ultimoCursor['id'])
    : null;

envia_json([
    'total' => $total,               // total no banco com os filtros aplicados
    'total_bruto' => $totalBruto ?? $total,
    'retornados' => $retornados,
    'offset' => $offset,
    'limit' => $limit,
    'pagination_mode' => $cursorSuportado ? 'cursor' : 'offset',
    'cursor_supported' => $cursorSuportado,
    'proximo_cursor' => $proximoCursor,
    'has_more' => $temMais,
    'anuncios' => $anuncios,
]);
