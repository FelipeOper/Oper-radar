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
if (!empty($_GET['revenda_id'])) { $where[] = 'r.id = ?'; $params[] = (int)$_GET['revenda_id']; $types .= 'i'; }
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
    'movimento'  => 'COALESCE(a.data_remocao, a.ultima_vez_ativo, a.primeira_vez_visto) DESC',
    'desvio_fipe' => 'a.preco / NULLIF(f.preco, 0) ASC, a.preco ASC',
];
$ordem = $ordens[$_GET['ordem'] ?? 'aleatorio'] ?? $ordens['aleatorio'];

$sql = "SELECT a.id AS anuncio_id, a.anuncio_portal_id, a.url, a.titulo, a.tipo, a.marca, a.modelo,
               a.ano_inicial, a.ano_final, a.cor,
               COALESCE(CONCAT(a.quilometragem_manual, ' km'), a.km_ou_horas) AS quilometragem,
               CASE WHEN a.quilometragem_manual IS NOT NULL THEN 'curadoria'
                    WHEN a.km_ou_horas IS NOT NULL AND a.km_ou_horas<>'' THEN 'coleta' ELSE NULL END AS quilometragem_origem,
               a.preco, a.status, a.primeira_vez_visto, a.ultima_vez_ativo, a.data_remocao,
               a.fipe_match_status, a.fipe_match_confianca, a.fipe_match_motivo,
               a.fipe_vinculo_origem, f.preco AS preco_fipe, f.codigo_fipe,
               f.ano_codigo AS ano_fipe, f.mes_referencia AS referencia_fipe,
               fm.marca_fipe, fm.modelo_fipe,
               ROUND((a.preco - f.preco) / NULLIF(f.preco, 0) * 100, 1) AS desvio_fipe_pct,
               mc.anuncios_comparaveis, mc.preco_medio_mercado,
               mc.menor_preco_mercado, mc.maior_preco_mercado,
               ROUND((a.preco - mc.preco_medio_mercado) / NULLIF(mc.preco_medio_mercado, 0) * 100, 1) AS desvio_mercado_pct,
               r.id AS revenda_id, r.nome AS revenda, r.cidade, r.uf
        FROM anuncio a
        JOIN revenda r ON r.id = a.revenda_id
        LEFT JOIN fipe_preco f ON f.id = a.fipe_preco_id
        LEFT JOIN fipe_modelo fm ON fm.id = f.fipe_modelo_id
        LEFT JOIN (
            SELECT fipe_preco_id, COUNT(*) AS anuncios_comparaveis,
                   AVG(NULLIF(preco, 0)) AS preco_medio_mercado,
                   MIN(NULLIF(preco, 0)) AS menor_preco_mercado,
                   MAX(NULLIF(preco, 0)) AS maior_preco_mercado
            FROM anuncio
            WHERE status='ativo' AND fipe_preco_id IS NOT NULL AND preco > 0
            GROUP BY fipe_preco_id
        ) mc ON mc.fipe_preco_id=a.fipe_preco_id
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
    $row['anuncio_id'] = (int)$row['anuncio_id'];
    $row['anuncio_portal_id'] = (int)$row['anuncio_portal_id'];
    $row['preco'] = $row['preco'] !== null ? (float)$row['preco'] : null;
    $row['preco_fipe'] = $row['preco_fipe'] !== null ? (float)$row['preco_fipe'] : null;
    $row['desvio_fipe_pct'] = $row['desvio_fipe_pct'] !== null ? (float)$row['desvio_fipe_pct'] : null;
    $row['preco_medio_mercado'] = $row['preco_medio_mercado'] !== null ? (float)$row['preco_medio_mercado'] : null;
    $row['menor_preco_mercado'] = $row['menor_preco_mercado'] !== null ? (float)$row['menor_preco_mercado'] : null;
    $row['maior_preco_mercado'] = $row['maior_preco_mercado'] !== null ? (float)$row['maior_preco_mercado'] : null;
    $row['desvio_mercado_pct'] = $row['desvio_mercado_pct'] !== null ? (float)$row['desvio_mercado_pct'] : null;
    $row['anuncios_comparaveis'] = (int)($row['anuncios_comparaveis'] ?? 0);
    $row['revenda_id'] = (int)$row['revenda_id'];
    $anuncios[] = $row;
}

envia_json([
    'total' => $total,               // total no banco com os filtros aplicados
    'retornados' => count($anuncios),
    'offset' => $offset,
    'limit' => $limit,
    'anuncios' => $anuncios,
]);
