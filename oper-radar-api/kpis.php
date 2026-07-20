<?php
/**
 * OPER RADAR — API: KPIs do Dashboard
 * GET kpis.php  ->  { revendas_monitoradas, anuncios_ativos, saidas_detectadas_mes, desvio_medio_fipe, ultima_coleta }
 */
require_once __DIR__ . '/config.php';
$conn = conecta();

$revendas = $conn->query('SELECT COUNT(*) AS n FROM revenda')->fetch_assoc()['n'];
$anunciosAtivos = $conn->query("SELECT COUNT(*) AS n FROM anuncio WHERE status = 'ativo'")->fetch_assoc()['n'];
$revendasComEstoque = $conn->query("SELECT COUNT(DISTINCT revenda_id) AS n FROM anuncio WHERE status='ativo'")->fetch_assoc()['n'];

$movimento48h = $conn->query("
    SELECT
      SUM(CASE WHEN primeira_vez_visto >= DATE_SUB(NOW(), INTERVAL 48 HOUR) THEN 1 ELSE 0 END) entradas,
      SUM(CASE WHEN status='removido_confirmado' AND data_remocao >= DATE_SUB(NOW(), INTERVAL 48 HOUR) THEN 1 ELSE 0 END) saidas
    FROM anuncio
")->fetch_assoc();

$saidasDetectadasMes = $conn->query("
    SELECT COUNT(*) AS n FROM anuncio
    WHERE status = 'removido_confirmado'
      AND data_remocao >= DATE_FORMAT(NOW(), '%Y-%m-01')
")->fetch_assoc()['n'];

$desvioRow = $conn->query("
    SELECT AVG((a.preco - f.preco) / NULLIF(f.preco, 0)) * 100 AS media,
           COUNT(*) AS vinculados
    FROM anuncio a
    JOIN fipe_preco f ON f.id = a.fipe_preco_id
    WHERE a.status='ativo' AND a.preco IS NOT NULL AND f.preco IS NOT NULL
      AND a.fipe_match_confianca='alto'
")->fetch_assoc();
$desvioMedioFipe = $desvioRow['media'] !== null ? round((float)$desvioRow['media'], 1) : null;

$ultimaColeta = $conn->query('SELECT MAX(timestamp) AS t FROM execucao_coleta')->fetch_assoc()['t'];

$ufsAtivas = [];
$r = $conn->query("SELECT DISTINCT r.uf FROM revenda r JOIN anuncio a ON a.revenda_id=r.id WHERE a.status='ativo' ORDER BY r.uf");
while ($row = $r->fetch_assoc()) $ufsAtivas[] = $row['uf'];
$REGIOES = [
    'Sul'=>['PR','SC','RS'], 'Sudeste'=>['SP','RJ','MG','ES'],
    'Centro-Oeste'=>['MT','MS','GO','DF'],
    'Nordeste'=>['BA','PE','CE','MA','PB','RN','AL','PI','SE'],
    'Norte'=>['AM','PA','RO','RR','AC','AP','TO'],
];
$regioesAtivas = [];
foreach ($REGIOES as $nome => $ufs) {
    if (array_intersect($ufs, $ufsAtivas)) $regioesAtivas[] = $nome;
}

envia_json([
    'revendas_monitoradas' => (int) $revendas,
    'revendas_com_estoque' => (int) $revendasComEstoque,
    'anuncios_ativos' => (int) $anunciosAtivos,
    'entradas_48h' => (int)($movimento48h['entradas'] ?? 0),
    'saidas_48h' => (int)($movimento48h['saidas'] ?? 0),
    'saidas_detectadas_mes' => (int) $saidasDetectadasMes,
    // Compatibilidade temporaria com bundles anteriores.
    'vendas_estimadas_mes' => (int) $saidasDetectadasMes,
    'desvio_medio_fipe' => $desvioMedioFipe,
    'fipe_vinculados_ativos_alta_confianca' => (int)$desvioRow['vinculados'],
    'ufs_ativas' => $ufsAtivas,
    'regioes_ativas' => $regioesAtivas,
    'ultima_coleta' => $ultimaColeta,
]);
