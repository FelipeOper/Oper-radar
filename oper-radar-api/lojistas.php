<?php
/**
 * OPER RADAR — API: lista de lojistas com metricas honestas
 * A idade media do estoque só é confiavel quando ha pelo menos 14 dias
 * desde a primeira coleta (senao, todos os anuncios teriam "idade" recente
 * artificialmente — bug real detectado em 09/jul quando toda revenda mostrava "1d").
 */
require_once __DIR__ . '/config.php';
$conn = conecta();

$REGIOES = [
    'Sul' => ['PR','SC','RS'], 'Sudeste' => ['SP','RJ','MG','ES'],
    'Centro-Oeste' => ['MT','MS','GO','DF'],
    'Nordeste' => ['BA','PE','CE','MA','PB','RN','AL','PI','SE'],
    'Norte' => ['AM','PA','RO','RR','AC','AP','TO'],
];
$uf = $_GET['uf'] ?? null;
$regiao = $_GET['regiao'] ?? null;
$ufsRegiao = ($regiao && isset($REGIOES[$regiao])) ? $REGIOES[$regiao] : null;

$sql = "SELECT r.id, r.nome, r.cidade, r.uf, r.url_perfil, r.telefone, r.ativa_desde,
               COUNT(a.id) AS total_historico,
               SUM(CASE WHEN a.status = 'ativo' THEN 1 ELSE 0 END) AS ativos,
               SUM(CASE WHEN a.status = 'removido_confirmado' THEN 1 ELSE 0 END) AS saidas_detectadas,
               SUM(CASE WHEN a.status = 'removido_confirmado' AND a.data_remocao >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS saidas_30d,
               ROUND(AVG(CASE WHEN a.status='ativo' THEN DATEDIFF(NOW(), a.primeira_vez_visto) END), 1) AS idade_media_estoque,
               DATEDIFF(NOW(), (SELECT MIN(primeira_vez_visto) FROM anuncio WHERE revenda_id = r.id)) AS dias_de_coleta,
               MIN(a.primeira_vez_visto) AS primeiro_anuncio_visto,
               MAX(a.ultima_vez_ativo) AS ultima_atividade
        FROM revenda r
        LEFT JOIN anuncio a ON a.revenda_id = r.id";
$params = []; $types = '';
if ($ufsRegiao) {
    $ph = implode(',', array_fill(0, count($ufsRegiao), '?'));
    $sql .= " WHERE r.uf IN ($ph)";
    foreach ($ufsRegiao as $u) { $params[] = $u; $types .= 's'; }
} elseif ($uf) {
    $sql .= ' WHERE r.uf = ?'; $params[] = strtoupper($uf); $types .= 's';
}
$sql .= ' GROUP BY r.id ORDER BY ativos DESC, saidas_detectadas DESC';

$stmt = $conn->prepare($sql);
if ($params) $stmt->bind_param($types, ...$params);
$stmt->execute();
$res = $stmt->get_result();

$lojistas = []; $mapaId = [];
while ($row = $res->fetch_assoc()) {
    $row['total_historico'] = (int)$row['total_historico'];
    $row['ativos'] = (int)$row['ativos'];
    $row['saidas_detectadas'] = (int)$row['saidas_detectadas'];
    $row['saidas_30d'] = (int)$row['saidas_30d'];
    // Compatibilidade temporaria com bundles anteriores.
    $row['vendidos'] = $row['saidas_detectadas'];
    $row['vendidos_30d'] = $row['saidas_30d'];
    $row['idade_media_estoque'] = $row['idade_media_estoque'] !== null ? (float)$row['idade_media_estoque'] : null;
    $row['dias_de_coleta'] = $row['dias_de_coleta'] !== null ? (int)$row['dias_de_coleta'] : 0;
    // Giro só é confiavel apos 14 dias de coleta acumulada — antes disso,
    // "primeira_vez_visto" e recente demais pra todos os anuncios.
    $row['giro_confiavel'] = $row['dias_de_coleta'] >= 14;
    $row['mix_categorias'] = [];
    $mapaId[$row['id']] = count($lojistas);
    $lojistas[] = $row;
}

if ($lojistas) {
    $ids = array_column($lojistas, 'id');
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $ts = $conn->prepare("SELECT revenda_id, tipo, COUNT(*) n FROM anuncio
                          WHERE revenda_id IN ($placeholders) AND status='ativo' AND tipo IS NOT NULL
                          GROUP BY revenda_id, tipo");
    $ts->bind_param(str_repeat('i', count($ids)), ...$ids);
    $ts->execute();
    $tr = $ts->get_result();
    while ($m = $tr->fetch_assoc()) {
        $idx = $mapaId[$m['revenda_id']] ?? null;
        if ($idx !== null) $lojistas[$idx]['mix_categorias'][$m['tipo']] = (int)$m['n'];
    }
}

envia_json(['total' => count($lojistas), 'lojistas' => $lojistas]);
