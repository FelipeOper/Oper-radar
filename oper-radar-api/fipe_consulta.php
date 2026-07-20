<?php
/**
 * OPER RADAR — consulta interna ao catálogo FIPE armazenado no MySQL.
 * Nenhuma busca deste endpoint acessa a API externa.
 */
require_once __DIR__ . '/config.php';
$conn = conecta();

$modo = $_GET['modo'] ?? 'buscar';

if ($modo === 'facetas') {
    $marcas = [];
    $res = $conn->query("
        SELECT fm.marca_fipe AS marca, COUNT(DISTINCT fm.id) AS modelos,
               COUNT(fp.id) AS precos
        FROM fipe_modelo fm
        LEFT JOIN fipe_preco fp ON fp.fipe_modelo_id=fm.id
        GROUP BY fm.marca_fipe
        HAVING precos > 0
        ORDER BY fm.marca_fipe
    ");
    while ($row = $res->fetch_assoc()) {
        $row['modelos'] = (int)$row['modelos'];
        $row['precos'] = (int)$row['precos'];
        $marcas[] = $row;
    }

    $modelos = [];
    if (!empty($_GET['marca'])) {
        $marca = (string)$_GET['marca'];
        $st = $conn->prepare("
            SELECT fm.id, fm.modelo_fipe AS modelo, COUNT(fp.id) AS anos
            FROM fipe_modelo fm
            JOIN fipe_preco fp ON fp.fipe_modelo_id=fm.id
            WHERE fm.marca_fipe=?
            GROUP BY fm.id, fm.modelo_fipe
            ORDER BY fm.modelo_fipe
        ");
        $st->bind_param('s', $marca);
        $st->execute();
        $res = $st->get_result();
        while ($row = $res->fetch_assoc()) {
            $row['id'] = (int)$row['id'];
            $row['anos'] = (int)$row['anos'];
            $modelos[] = $row;
        }
        $st->close();
    }

    $anos = [];
    if (!empty($_GET['modelo_id'])) {
        $modeloId = (int)$_GET['modelo_id'];
        $st = $conn->prepare("
            SELECT DISTINCT CAST(SUBSTRING_INDEX(ano_codigo, '-', 1) AS UNSIGNED) AS ano
            FROM fipe_preco
            WHERE fipe_modelo_id=?
            ORDER BY ano DESC
        ");
        $st->bind_param('i', $modeloId);
        $st->execute();
        $res = $st->get_result();
        while ($row = $res->fetch_assoc()) $anos[] = (int)$row['ano'];
        $st->close();
    }

    $resumo = $conn->query("
        SELECT COUNT(DISTINCT fm.marca_fipe) AS marcas,
               COUNT(DISTINCT fm.id) AS modelos,
               COUNT(fp.id) AS precos,
               MAX(fp.mes_referencia) AS referencia,
               MAX(fp.referencia_codigo) AS referencia_codigo
        FROM fipe_modelo fm
        JOIN fipe_preco fp ON fp.fipe_modelo_id=fm.id
    ")->fetch_assoc();
    $resumo['marcas'] = (int)$resumo['marcas'];
    $resumo['modelos'] = (int)$resumo['modelos'];
    $resumo['precos'] = (int)$resumo['precos'];
    $resumo['referencia_codigo'] = (int)$resumo['referencia_codigo'];

    envia_json(['resumo' => $resumo, 'marcas' => $marcas, 'modelos' => $modelos, 'anos' => $anos]);
}

$limit = min(max((int)($_GET['limit'] ?? 40), 1), 100);
$offset = max((int)($_GET['offset'] ?? 0), 0);
$where = ['fp.preco IS NOT NULL'];
$params = [];
$types = '';

if (!empty($_GET['marca'])) {
    $where[] = 'fm.marca_fipe=?';
    $params[] = $_GET['marca'];
    $types .= 's';
}
if (!empty($_GET['modelo_id'])) {
    $where[] = 'fm.id=?';
    $params[] = (int)$_GET['modelo_id'];
    $types .= 'i';
}
if (!empty($_GET['ano']) && ctype_digit((string)$_GET['ano'])) {
    $where[] = 'fp.ano_codigo LIKE ?';
    $params[] = ((int)$_GET['ano']) . '-%';
    $types .= 's';
}
if (!empty($_GET['q'])) {
    $tokens = preg_split('/\s+/u', trim($_GET['q']), -1, PREG_SPLIT_NO_EMPTY);
    foreach (array_slice($tokens ?: [], 0, 8) as $token) {
        $where[] = '(fm.marca_fipe LIKE ? OR fm.modelo_fipe LIKE ? OR fp.codigo_fipe LIKE ? OR fp.ano_codigo LIKE ?)';
        $termo = '%' . $token . '%';
        array_push($params, $termo, $termo, $termo, $termo);
        $types .= 'ssss';
    }
}
$clausula = ' WHERE ' . implode(' AND ', $where);

$st = $conn->prepare("
    SELECT COUNT(*) AS n
    FROM fipe_preco fp
    JOIN fipe_modelo fm ON fm.id=fp.fipe_modelo_id
    $clausula
");
if ($params) $st->bind_param($types, ...$params);
$st->execute();
$total = (int)$st->get_result()->fetch_assoc()['n'];
$st->close();

$ordens = [
    'mercado' => 'anuncios_ativos DESC, fm.marca_fipe, fm.modelo_fipe, ano DESC',
    'preco_asc' => 'fp.preco ASC, fm.marca_fipe, fm.modelo_fipe',
    'preco_desc' => 'fp.preco DESC, fm.marca_fipe, fm.modelo_fipe',
    'modelo' => 'fm.marca_fipe, fm.modelo_fipe, ano DESC',
    'ano_desc' => 'ano DESC, fm.marca_fipe, fm.modelo_fipe',
];
$ordem = $ordens[$_GET['ordem'] ?? 'mercado'] ?? $ordens['mercado'];

$sql = "
    SELECT fp.id, fm.id AS modelo_id, fm.marca_fipe AS marca,
           fm.modelo_fipe AS modelo, fp.ano_codigo,
           CAST(SUBSTRING_INDEX(fp.ano_codigo, '-', 1) AS UNSIGNED) AS ano,
           fp.codigo_fipe, fp.preco AS preco_fipe, fp.mes_referencia,
           fp.referencia_codigo,
           COUNT(a.id) AS anuncios_ativos,
           SUM(CASE WHEN a.preco > 0 AND a.preco < fp.preco THEN 1 ELSE 0 END) AS abaixo_fipe,
           MIN(NULLIF(a.preco, 0)) AS menor_anuncio,
           AVG(NULLIF(a.preco, 0)) AS preco_medio_mercado,
           MAX(NULLIF(a.preco, 0)) AS maior_anuncio,
           GROUP_CONCAT(DISTINCT r.uf ORDER BY r.uf SEPARATOR ',') AS ufs,
           ROUND((AVG(NULLIF(a.preco, 0)) - fp.preco) / NULLIF(fp.preco, 0) * 100, 1) AS desvio_medio_pct
    FROM fipe_preco fp
    JOIN fipe_modelo fm ON fm.id=fp.fipe_modelo_id
    LEFT JOIN anuncio a ON a.fipe_preco_id=fp.id AND a.status='ativo'
    LEFT JOIN revenda r ON r.id=a.revenda_id
    $clausula
    GROUP BY fp.id, fm.id, fm.marca_fipe, fm.modelo_fipe, fp.ano_codigo,
             fp.codigo_fipe, fp.preco, fp.mes_referencia, fp.referencia_codigo
    ORDER BY $ordem
    LIMIT ? OFFSET ?
";
$paramsPag = $params;
$typesPag = $types;
$paramsPag[] = $limit; $typesPag .= 'i';
$paramsPag[] = $offset; $typesPag .= 'i';
$st = $conn->prepare($sql);
$st->bind_param($typesPag, ...$paramsPag);
$st->execute();
$res = $st->get_result();
$itens = [];
while ($row = $res->fetch_assoc()) {
    foreach (['id', 'modelo_id', 'ano', 'referencia_codigo', 'anuncios_ativos', 'abaixo_fipe'] as $campo) {
        $row[$campo] = (int)($row[$campo] ?? 0);
    }
    foreach (['preco_fipe', 'menor_anuncio', 'preco_medio_mercado', 'maior_anuncio', 'desvio_medio_pct'] as $campo) {
        $row[$campo] = $row[$campo] !== null ? (float)$row[$campo] : null;
    }
    $row['ufs'] = $row['ufs'] ? explode(',', $row['ufs']) : [];
    $itens[] = $row;
}
$st->close();

envia_json([
    'total' => $total, 'retornados' => count($itens),
    'offset' => $offset, 'limit' => $limit, 'itens' => $itens,
]);
