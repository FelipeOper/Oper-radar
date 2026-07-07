<?php
/**
 * OPER RADAR — API: lista de lojistas (revendas) já monitoradas de verdade
 * GET lojistas.php?uf=PR
 */
require_once __DIR__ . '/config.php';
$conn = conecta();

$uf = $_GET['uf'] ?? null;

$sql = "SELECT r.id, r.nome, r.cidade, r.uf, r.url_perfil,
               COUNT(a.id) AS total_anuncios,
               SUM(CASE WHEN a.status = 'ativo' THEN 1 ELSE 0 END) AS anuncios_ativos
        FROM revenda r
        LEFT JOIN anuncio a ON a.revenda_id = r.id";
$params = [];
$types = '';
if ($uf) {
    $sql .= ' WHERE r.uf = ?';
    $params[] = strtoupper($uf);
    $types .= 's';
}
$sql .= ' GROUP BY r.id ORDER BY r.nome';

$stmt = $conn->prepare($sql);
if ($params) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$res = $stmt->get_result();

$lojistas = [];
while ($row = $res->fetch_assoc()) {
    $row['total_anuncios'] = (int) $row['total_anuncios'];
    $row['anuncios_ativos'] = (int) $row['anuncios_ativos'];
    $lojistas[] = $row;
}

envia_json(['total' => count($lojistas), 'lojistas' => $lojistas]);
