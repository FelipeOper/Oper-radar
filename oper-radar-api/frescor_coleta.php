<?php
/**
 * OPER RADAR — API: frescor da coleta por UF (monitor de dados da tela "Hoje")
 * GET frescor_coleta.php
 *
 * Para cada UF com anúncio ativo: última execução bem-sucedida (janela de 30 dias),
 * revendas cadastradas com estoque e quantas foram coletadas com sucesso nas últimas 24 h.
 * A classificação (em_dia, parcial, atrasada, sem_coleta) vive em lib/hoje_painel.php.
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/hoje_painel.php';
$conn = conecta();

$agoraLinha = oper_hoje_consulta($conn, 'SELECT NOW() agora');
$linhas = oper_hoje_consulta($conn, "
    SELECT r.uf,
           COUNT(DISTINCT r.id) AS revendas,
           COUNT(DISTINCT CASE WHEN e.sucesso=1 AND e.timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN r.id END) AS revendas_coletadas_24h,
           MAX(CASE WHEN e.sucesso=1 THEN e.timestamp END) AS ultima_coleta
    FROM revenda r
    JOIN (SELECT DISTINCT revenda_id FROM anuncio WHERE status='ativo') ativa ON ativa.revenda_id = r.id
    LEFT JOIN execucao_coleta e ON e.revenda_id = r.id AND e.timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY r.uf
    ORDER BY r.uf
");

if ($linhas === null || $agoraLinha === null) {
    http_response_code(503);
    envia_json([
        'erro' => 'Não foi possível consultar a coleta agora.',
        'codigo' => 'FRESCOR_COLETA_INDISPONIVEL',
    ]);
}

$agora = new DateTimeImmutable((string)($agoraLinha[0]['agora'] ?? 'now'));
$frescor = oper_frescor_coleta($linhas, $agora);

envia_json($frescor + [
    'atualizado_em' => $agora->format('Y-m-d H:i:s'),
    'nota' => 'Coleta atrasada significa mais de ' . $frescor['limite_horas']
        . ' h sem execução bem-sucedida na UF; os números dessa região podem estar defasados.',
]);
