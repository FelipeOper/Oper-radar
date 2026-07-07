<?php
/**
 * OPER RADAR — API: KPIs do Dashboard
 * GET kpis.php  ->  { revendas_monitoradas, anuncios_ativos, vendas_estimadas_mes, desvio_medio_fipe, ultima_coleta }
 */
require_once __DIR__ . '/config.php';
$conn = conecta();

$revendas = $conn->query('SELECT COUNT(*) AS n FROM revenda')->fetch_assoc()['n'];
$anunciosAtivos = $conn->query("SELECT COUNT(*) AS n FROM anuncio WHERE status = 'ativo'")->fetch_assoc()['n'];

$vendasEstimadasMes = $conn->query("
    SELECT COUNT(*) AS n FROM anuncio
    WHERE status = 'removido_confirmado'
      AND data_remocao >= DATE_FORMAT(NOW(), '%Y-%m-01')
")->fetch_assoc()['n'];

$desvioRow = $conn->query("
    SELECT AVG((preco - preco) / preco) AS media FROM anuncio WHERE preco IS NOT NULL
")->fetch_assoc();
// Nota: ainda não temos preco_fipe na tabela anuncio (isso é Fase 2 — mapeamento FIPE).
// Por enquanto o desvio fica null até esse campo existir de verdade.
$desvioMedioFipe = null;

$ultimaColeta = $conn->query('SELECT MAX(timestamp) AS t FROM execucao_coleta')->fetch_assoc()['t'];

envia_json([
    'revendas_monitoradas' => (int) $revendas,
    'anuncios_ativos' => (int) $anunciosAtivos,
    'vendas_estimadas_mes' => (int) $vendasEstimadasMes,
    'desvio_medio_fipe' => $desvioMedioFipe,
    'ultima_coleta' => $ultimaColeta,
]);
