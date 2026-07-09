<?php
/**
 * OPER RADAR — API: lista de lojistas (revendas) com metricas completas
 * GET lojistas.php?uf=PR
 * Retorna, alem dos campos basicos: total historico, ativos, vendidos, giro medio,
 * mix de categorias (quantos anuncios cada revenda tem por categoria).
 */
require_once __DIR__ . '/config.php';
$conn = conecta();
$uf = $_GET['uf'] ?? null;

$sql = "SELECT r.id, r.nome, r.cidade, r.uf, r.url_perfil, r.telefone, r.ativa_desde,
               COUNT(a.id) AS total_historico,
               SUM(CASE WHEN a.status = 'ativo' THEN 1 ELSE 0 END) AS ativos,
               SUM(CASE WHEN a.status = 'removido_confirmado' THEN 1 ELSE 0 END) AS vendidos,
               SUM(CASE WHEN a.status = 'removido_confirmado' AND a.data_remocao >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS vendidos_30d,
               ROUND(AVG(CASE WHEN a.status='ativo' THEN DATEDIFF(NOW(), a.primeira_vez_visto) END), 1) AS idade_media_estoque,
               MIN(a.primeira_vez_visto) AS primeiro_anuncio_visto,
               MAX(a.ultima_vez_ativo) AS ultima_atividade
        FROM revenda r
        LEFT JOIN anuncio a ON a.revenda_id = r.id";
$params = []; $types = '';
if ($uf) { $sql .= ' WHERE r.uf = ?'; $params[] = strtoupper($uf); $types .= 's'; }
$sql .= ' GROUP BY r.id ORDER BY ativos DESC, vendidos DESC';

$stmt = $conn->prepare($sql);
if ($params) $stmt->bind_param($types, ...$params);
$stmt->execute();
$res = $stmt->get_result();

$lojistas = [];
$mapaId = [];
while ($row = $res->fetch_assoc()) {
    $row['total_historico'] = (int)$row['total_historico'];
    $row['ativos'] = (int)$row['ativos'];
    $row['vendidos'] = (int)$row['vendidos'];
    $row['vendidos_30d'] = (int)$row['vendidos_30d'];
    $row['idade_media_estoque'] = $row['idade_media_estoque'] !== null ? (float)$row['idade_media_estoque'] : null;
    $row['mix_categorias'] = []; // preenchido abaixo
    $mapaId[$row['id']] = count($lojistas);
    $lojistas[] = $row;
}

// Mix de categorias: para cada revenda, quantos anuncios ativos por "tipo".
// Frontend agrupa em 8 categorias — aqui devolvemos os tipos crus, sem mapeamento.
if ($lojistas) {
    $ids = array_column($lojistas, 'id');
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $tSql = "SELECT revenda_id, tipo, COUNT(*) n FROM anuncio
             WHERE revenda_id IN ($placeholders) AND status = 'ativo' AND tipo IS NOT NULL
             GROUP BY revenda_id, tipo";
    $ts = $conn->prepare($tSql);
    $ts->bind_param(str_repeat('i', count($ids)), ...$ids);
    $ts->execute();
    $tr = $ts->get_result();
    while ($m = $tr->fetch_assoc()) {
        $idx = $mapaId[$m['revenda_id']] ?? null;
        if ($idx !== null) $lojistas[$idx]['mix_categorias'][$m['tipo']] = (int)$m['n'];
    }
}

envia_json(['total' => count($lojistas), 'lojistas' => $lojistas]);
