<?php
/** OPER RADAR — acompanhamento agregado da sincronizacao FIPE. */
require_once __DIR__ . '/config.php';
$conn = conecta();

$resumo = $conn->query("
    SELECT
        SUM(tipo='Caminhao' AND status='ativo' AND marca IS NOT NULL AND ano_inicial IS NOT NULL) AS elegiveis,
        SUM(tipo='Caminhao' AND status='ativo' AND fipe_preco_id IS NOT NULL) AS vinculados_ativos,
        SUM(tipo='Caminhao' AND status='ativo' AND fipe_preco_id IS NULL AND fipe_ultima_tentativa IS NULL) AS nunca_tentados,
        SUM(fipe_match_status='sem_match') AS sem_match,
        SUM(fipe_match_status='ambiguo') AS ambiguos,
        SUM(fipe_match_status='sem_ano') AS sem_ano,
        SUM(fipe_match_status='erro_api') AS erros_api,
        MAX(fipe_ultima_tentativa) AS ultima_tentativa
    FROM anuncio
")->fetch_assoc();

$precos = $conn->query("
    SELECT COUNT(*) AS precos_cache,
           MAX(atualizado_em) AS ultima_atualizacao_preco,
           MAX(mes_referencia) AS referencia_mais_recente
    FROM fipe_preco
")->fetch_assoc();

foreach (['elegiveis', 'vinculados_ativos', 'nunca_tentados', 'sem_match', 'ambiguos', 'sem_ano', 'erros_api'] as $campo) {
    $resumo[$campo] = (int)($resumo[$campo] ?? 0);
}
$precos['precos_cache'] = (int)($precos['precos_cache'] ?? 0);

envia_json(array_merge($resumo, $precos));
