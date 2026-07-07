<?php
/**
 * OPER RADAR — API: lista de anúncios
 * GET anuncios.php?status=ativo&limit=50
 * status: ativo | removido_candidato | removido_confirmado | (omitir para todos)
 */
require_once __DIR__ . '/config.php';
$conn = conecta();

$status = $_GET['status'] ?? null;
$limit = min((int) ($_GET['limit'] ?? 50), 200);

$sql = "SELECT a.anuncio_portal_id, a.url, a.titulo, a.tipo, a.marca, a.ano_inicial, a.ano_final,
               a.preco, a.status, a.primeira_vez_visto, a.ultima_vez_ativo, a.data_remocao,
               r.nome AS revenda, r.cidade, r.uf
        FROM anuncio a
        JOIN revenda r ON r.id = a.revenda_id";
$params = [];
$types = '';

if ($status) {
    $sql .= ' WHERE a.status = ?';
    $params[] = $status;
    $types .= 's';
}
$sql .= ' ORDER BY a.ultima_vez_ativo DESC LIMIT ?';
$params[] = $limit;
$types .= 'i';

$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$res = $stmt->get_result();

$anuncios = [];
while ($row = $res->fetch_assoc()) {
    $row['preco'] = $row['preco'] !== null ? (float) $row['preco'] : null;
    $anuncios[] = $row;
}

envia_json(['total' => count($anuncios), 'anuncios' => $anuncios]);
