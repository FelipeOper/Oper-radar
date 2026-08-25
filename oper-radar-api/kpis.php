<?php
/**
 * OPER RADAR — API: KPIs do Dashboard
 * GET kpis.php  ->  { revendas_monitoradas, anuncios_ativos, saidas_detectadas_mes, desvio_medio_fipe, ultima_coleta }
 */
require_once __DIR__ . '/config.php';
$conn = conecta();

$revendas = $conn->query('SELECT COUNT(*) AS n FROM revenda')->fetch_assoc()['n'];
$ciclo = $conn->query("
    SELECT
      CASE WHEN HOUR(NOW()) < 8 THEN DATE(DATE_SUB(NOW(), INTERVAL 1 DAY)) ELSE DATE(NOW()) END AS dia,
      CASE WHEN HOUR(NOW()) < 8 THEN '19h' WHEN HOUR(NOW()) < 20 THEN '07h' ELSE '19h' END AS janela
")->fetch_assoc();
$stmtAtivos = $conn->prepare("
    SELECT COUNT(*) AS total,
           SUM(c.revenda_id IS NOT NULL) AS revalidados,
           COUNT(DISTINCT c.revenda_id) AS revendas_revalidadas
    FROM anuncio a
    LEFT JOIN (
        SELECT DISTINCT revenda_id
        FROM execucao_coleta
        WHERE sucesso=1 AND revenda_id IS NOT NULL
          AND DATE(timestamp)=? AND janela=?
    ) c ON c.revenda_id=a.revenda_id
    WHERE a.status='ativo'
");
$stmtAtivos->bind_param('ss', $ciclo['dia'], $ciclo['janela']);
$stmtAtivos->execute();
$ativosCiclo = $stmtAtivos->get_result()->fetch_assoc();
$stmtAtivos->close();
$anunciosAtivos = (int)($ativosCiclo['total'] ?? 0);
$anunciosRevalidados = (int)($ativosCiclo['revalidados'] ?? 0);
$anunciosHerdados = $anunciosAtivos - $anunciosRevalidados;
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
    'anuncios_ativos_total' => $anunciosAtivos,
    'anuncios_ativos_revalidados' => $anunciosRevalidados,
    'anuncios_ativos_herdados' => $anunciosHerdados,
    'revendas_revalidadas' => (int)($ativosCiclo['revendas_revalidadas'] ?? 0),
    'ciclo_referencia' => [
        'dia' => $ciclo['dia'],
        'janela' => $ciclo['janela'],
    ],
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
