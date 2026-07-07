<?php
/**
 * OPER RADAR — API: lista de anúncios (com filtros avançados e preço FIPE quando houver)
 * GET anuncios.php?status=ativo&limit=50&cidade=Curitiba&revenda=SVD&preco_min=100000&preco_max=500000&q=daf
 */
require_once __DIR__ . '/config.php';
$conn = conecta();

$limit = min((int) ($_GET['limit'] ?? 50), 500);
$where = [];
$params = [];
$types = '';

if (!empty($_GET['status'])) { $where[] = 'a.status = ?'; $params[] = $_GET['status']; $types .= 's'; }
if (!empty($_GET['cidade'])) { $where[] = 'r.cidade LIKE ?'; $params[] = '%' . $_GET['cidade'] . '%'; $types .= 's'; }
if (!empty($_GET['uf']))     { $where[] = 'r.uf = ?'; $params[] = strtoupper($_GET['uf']); $types .= 's'; }
if (!empty($_GET['revenda'])){ $where[] = 'r.nome LIKE ?'; $params[] = '%' . $_GET['revenda'] . '%'; $types .= 's'; }
if (!empty($_GET['tipo']))   { $where[] = 'a.tipo = ?'; $params[] = $_GET['tipo']; $types .= 's'; }
if (!empty($_GET['marca']))  { $where[] = 'a.marca = ?'; $params[] = strtoupper($_GET['marca']); $types .= 's'; }
if (!empty($_GET['preco_min'])) { $where[] = 'a.preco >= ?'; $params[] = (float) $_GET['preco_min']; $types .= 'd'; }
if (!empty($_GET['preco_max'])) { $where[] = 'a.preco <= ?'; $params[] = (float) $_GET['preco_max']; $types .= 'd'; }
if (!empty($_GET['q'])) {
    $where[] = '(a.titulo LIKE ? OR a.marca LIKE ? OR r.nome LIKE ? OR r.cidade LIKE ?)';
    $termo = '%' . $_GET['q'] . '%';
    array_push($params, $termo, $termo, $termo, $termo);
    $types .= 'ssss';
}

$ordens = [
    'recente' => 'a.ultima_vez_ativo DESC',
    'preco_asc' => 'a.preco IS NULL, a.preco ASC',
    'preco_desc' => 'a.preco IS NULL, a.preco DESC',
    'mais_tempo' => 'a.primeira_vez_visto ASC',
];
$ordem = $ordens[$_GET['ordem'] ?? 'recente'] ?? $ordens['recente'];

$sql = "SELECT a.anuncio_portal_id, a.url, a.titulo, a.tipo, a.marca, a.ano_inicial, a.ano_final,
               a.preco, a.status, a.primeira_vez_visto, a.ultima_vez_ativo, a.data_remocao,
               a.fipe_match_confianca,
               f.preco AS preco_fipe, f.codigo_fipe,
               r.nome AS revenda, r.cidade, r.uf
        FROM anuncio a
        JOIN revenda r ON r.id = a.revenda_id
        LEFT JOIN fipe_preco f ON f.id = a.fipe_preco_id";
if ($where) { $sql .= ' WHERE ' . implode(' AND ', $where); }
$sql .= " ORDER BY $ordem LIMIT ?";
$params[] = $limit;
$types .= 'i';

$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$res = $stmt->get_result();

$anuncios = [];
while ($row = $res->fetch_assoc()) {
    $row['preco'] = $row['preco'] !== null ? (float) $row['preco'] : null;
    $row['preco_fipe'] = $row['preco_fipe'] !== null ? (float) $row['preco_fipe'] : null;
    $anuncios[] = $row;
}

envia_json(['total' => count($anuncios), 'anuncios' => $anuncios]);
