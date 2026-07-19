<?php
/**
 * OPER RADAR — API: KPIs do Dashboard
 * GET kpis.php  ->  { revendas_monitoradas, anuncios_ativos, saidas_detectadas_mes, desvio_medio_fipe, ultima_coleta }
 */
require_once __DIR__ . '/config.php';
$conn = conecta();

$revendas = $conn->query('SELECT COUNT(*) AS n FROM revenda')->fetch_assoc()['n'];
$anunciosAtivos = $conn->query("SELECT COUNT(*) AS n FROM anuncio WHERE status = 'ativo'")->fetch_assoc()['n'];

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

envia_json([
    'revendas_monitoradas' => (int) $revendas,
    'anuncios_ativos' => (int) $anunciosAtivos,
    'saidas_detectadas_mes' => (int) $saidasDetectadasMes,
    // Compatibilidade temporaria com bundles anteriores.
    'vendas_estimadas_mes' => (int) $saidasDetectadasMes,
    'desvio_medio_fipe' => $desvioMedioFipe,
    'fipe_vinculados_ativos_alta_confianca' => (int)$desvioRow['vinculados'],
    'ultima_coleta' => $ultimaColeta,
]);
