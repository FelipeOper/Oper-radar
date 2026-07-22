<?php
/** OPER RADAR — acompanhamento agregado da sincronizacao FIPE. */
require_once __DIR__ . '/config.php';
$conn = conecta();

$resumo = $conn->query("
    SELECT
        SUM(a.tipo='Caminhao' AND a.status='ativo' AND a.marca IS NOT NULL AND a.ano_inicial IS NOT NULL) AS elegiveis,
        SUM(a.tipo='Caminhao' AND a.status='ativo' AND a.marca IS NOT NULL AND a.ano_inicial IS NOT NULL
            AND a.fipe_preco_id IS NOT NULL) AS vinculados_ativos,
        SUM(a.tipo='Caminhao' AND a.status='ativo' AND a.marca IS NOT NULL AND a.ano_inicial IS NOT NULL
            AND a.fipe_preco_id IS NULL) AS aguardando_curadoria,
        SUM(a.tipo='Caminhao' AND a.status='ativo' AND a.marca IS NOT NULL AND a.ano_inicial IS NOT NULL
            AND a.fipe_preco_id IS NULL AND s.anuncio_id IS NOT NULL) AS com_sugestao,
        SUM(a.tipo='Caminhao' AND a.status='ativo' AND a.marca IS NOT NULL AND a.ano_inicial IS NOT NULL
            AND a.fipe_preco_id IS NULL AND s.anuncio_id IS NULL) AS sem_sugestao,
        SUM(a.tipo='Caminhao' AND a.status='ativo' AND a.marca IS NOT NULL AND a.ano_inicial IS NOT NULL
            AND a.fipe_preco_id IS NULL AND a.fipe_ultima_tentativa IS NULL) AS nunca_tentados,
        SUM(a.tipo='Caminhao' AND a.status='ativo' AND a.fipe_match_status='sem_match') AS sem_match,
        SUM(a.tipo='Caminhao' AND a.status='ativo' AND a.fipe_match_status='ambiguo') AS ambiguos,
        SUM(a.tipo='Caminhao' AND a.status='ativo' AND a.fipe_match_status='sem_ano') AS sem_ano,
        SUM(a.tipo='Caminhao' AND a.status='ativo' AND a.fipe_match_status='erro_api') AS erros_api,
        MAX(a.fipe_ultima_tentativa) AS ultima_tentativa
    FROM anuncio a
    LEFT JOIN (SELECT DISTINCT anuncio_id FROM anuncio_fipe_sugestao) s ON s.anuncio_id=a.id
")->fetch_assoc();

$precos = $conn->query("
    SELECT COUNT(*) AS precos_cache,
           MAX(atualizado_em) AS ultima_atualizacao_preco,
           MAX(mes_referencia) AS referencia_mais_recente
    FROM fipe_preco
")->fetch_assoc();

foreach (['elegiveis', 'vinculados_ativos', 'aguardando_curadoria', 'com_sugestao', 'sem_sugestao',
          'nunca_tentados', 'sem_match', 'ambiguos', 'sem_ano', 'erros_api'] as $campo) {
    $resumo[$campo] = (int)($resumo[$campo] ?? 0);
}
$precos['precos_cache'] = (int)($precos['precos_cache'] ?? 0);

$mensal = [
    'referencia_codigo_mais_recente' => null,
    'precos_na_referencia_mais_recente' => 0,
    'precos_fora_referencia' => $precos['precos_cache'],
];
$colunaReferencia = $conn->query("SHOW COLUMNS FROM fipe_preco LIKE 'referencia_codigo'");
if ($colunaReferencia && $colunaReferencia->num_rows > 0) {
    $mensalRow = $conn->query("
        SELECT ref.codigo AS referencia_codigo_mais_recente,
               SUM(fp.referencia_codigo=ref.codigo) AS precos_na_referencia_mais_recente,
               SUM(fp.referencia_codigo IS NULL OR fp.referencia_codigo<>ref.codigo)
                   AS precos_fora_referencia
        FROM fipe_preco fp
        CROSS JOIN (SELECT MAX(referencia_codigo) AS codigo FROM fipe_preco) ref
        GROUP BY ref.codigo
    ")->fetch_assoc() ?: [];
    $mensal = [
        'referencia_codigo_mais_recente' => isset($mensalRow['referencia_codigo_mais_recente'])
            ? (int)$mensalRow['referencia_codigo_mais_recente'] : null,
        'precos_na_referencia_mais_recente' => (int)($mensalRow['precos_na_referencia_mais_recente'] ?? 0),
        'precos_fora_referencia' => (int)($mensalRow['precos_fora_referencia'] ?? 0),
    ];
}

envia_json(array_merge($resumo, $precos, $mensal));
