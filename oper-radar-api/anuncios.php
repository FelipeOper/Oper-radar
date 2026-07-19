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
$conn = conecta();

$REGIOES = [
    'Sul' => ['PR','SC','RS'], 'Sudeste' => ['SP','RJ','MG','ES'],
    'Centro-Oeste' => ['MT','MS','GO','DF'],
    'Nordeste' => ['BA','PE','CE','MA','PB','RN','AL','PI','SE'],
    'Norte' => ['AM','PA','RO','RR','AC','AP','TO'],
];

// Mapa categoria -> tipos do portal (espelha o TIPO_PARA_CATEGORIA do frontend)
$CATEGORIA_TIPOS = [
  'caminhoes'   => ['Caminhao','Motorhome'],
  'implementos' => ['Implemento','Carroceria-sobre-chassi','Trailer'],
  'onibus_vans' => ['Onibus','Micro-onibus','Vans','Utilitarios'],
  'leves'       => ['Carro'],
  'agricolas'   => ['Trator','Trator-esteira','Micro-trator','Plantadeira','Colheitadeira',
                    'Plataforma-colheitadeira','Pulverizador','Semeadeira',
                    'Distribuidor-autopropelido','Forragem-e-feno','Florestal'],
  'construcao'  => ['Pa-carregadeira','Escavadeira','Retro-escavadeira','Motoniveladora',
                    'Rolo-compactador','Guindaste','Mini-carregadeira','Auto-carregavel',
                    'Mini-escavadeira','Empilhadeira','Plataforma-elevatoria','Maquinas','Equipamentos'],
  'pecas'       => ['Pecas-a-venda'],
  'outros'      => ['Moto','Imoveis','Quadriciclo','Nautico'],
];

$limit  = min(max((int)($_GET['limit'] ?? 60), 1), 200);
$offset = max((int)($_GET['offset'] ?? 0), 0);

$where = []; $params = []; $types = '';

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
if (!empty($_GET['tipo']))      { $where[] = 'a.tipo = ?';      $params[] = $_GET['tipo']; $types .= 's'; }
if (!empty($_GET['marca']))     { $where[] = 'a.marca = ?';     $params[] = strtoupper($_GET['marca']); $types .= 's'; }
if (!empty($_GET['preco_min'])) { $where[] = 'a.preco >= ?';    $params[] = (float)$_GET['preco_min']; $types .= 'd'; }
if (!empty($_GET['preco_max'])) { $where[] = 'a.preco <= ?';    $params[] = (float)$_GET['preco_max']; $types .= 'd'; }
if (($_GET['abaixo_fipe'] ?? '') === '1') {
    $where[] = 'a.preco IS NOT NULL AND f.preco IS NOT NULL AND a.preco < f.preco';
}
if (!empty($_GET['fipe_confianca']) && in_array($_GET['fipe_confianca'], ['alto', 'medio'], true)) {
    $where[] = 'a.fipe_match_confianca = ?';
    $params[] = $_GET['fipe_confianca']; $types .= 's';
}
if (!empty($_GET['q'])) {
    // Cada palavra precisa existir em algum campo do veiculo. Assim, "DAF XF 530"
    // encontra titulos com palavras intermediarias sem misturar a revenda/cidade.
    $tokens = preg_split('/\s+/u', trim($_GET['q']), -1, PREG_SPLIT_NO_EMPTY);
    foreach (array_slice($tokens ?: [], 0, 8) as $token) {
        $where[] = "(a.titulo LIKE ? OR COALESCE(a.marca, '') LIKE ? OR COALESCE(a.modelo, '') LIKE ?)";
        $termo = '%' . $token . '%';
        array_push($params, $termo, $termo, $termo);
        $types .= 'sss';
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
    'aleatorio'  => "RAND($semente)",
    'recente'    => 'a.ultima_vez_ativo DESC',
    'preco_asc'  => 'a.preco IS NULL, a.preco ASC',
    'preco_desc' => 'a.preco IS NULL, a.preco DESC',
    'mais_tempo' => 'a.primeira_vez_visto ASC',
    'desvio_fipe' => 'a.preco / NULLIF(f.preco, 0) ASC, a.preco ASC',
];
$ordem = $ordens[$_GET['ordem'] ?? 'aleatorio'] ?? $ordens['aleatorio'];

$sql = "SELECT a.anuncio_portal_id, a.url, a.titulo, a.tipo, a.marca, a.ano_inicial, a.ano_final,
               a.preco, a.status, a.primeira_vez_visto, a.ultima_vez_ativo, a.data_remocao,
               a.fipe_match_confianca, f.preco AS preco_fipe, f.codigo_fipe,
               ROUND((a.preco - f.preco) / NULLIF(f.preco, 0) * 100, 1) AS desvio_fipe_pct,
               r.nome AS revenda, r.cidade, r.uf
        FROM anuncio a
        JOIN revenda r ON r.id = a.revenda_id
        LEFT JOIN fipe_preco f ON f.id = a.fipe_preco_id
        $clausula
        ORDER BY $ordem
        LIMIT ? OFFSET ?";
$paramsPag = $params; $typesPag = $types;
$paramsPag[] = $limit;  $typesPag .= 'i';
$paramsPag[] = $offset; $typesPag .= 'i';

$stmt = $conn->prepare($sql);
$stmt->bind_param($typesPag, ...$paramsPag);
$stmt->execute();
$res = $stmt->get_result();

$anuncios = [];
while ($row = $res->fetch_assoc()) {
    $row['preco'] = $row['preco'] !== null ? (float)$row['preco'] : null;
    $row['preco_fipe'] = $row['preco_fipe'] !== null ? (float)$row['preco_fipe'] : null;
    $row['desvio_fipe_pct'] = $row['desvio_fipe_pct'] !== null ? (float)$row['desvio_fipe_pct'] : null;
    $anuncios[] = $row;
}

envia_json([
    'total' => $total,               // total no banco com os filtros aplicados
    'retornados' => count($anuncios),
    'offset' => $offset,
    'limit' => $limit,
    'anuncios' => $anuncios,
]);
