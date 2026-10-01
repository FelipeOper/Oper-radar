<?php
/**
 * OPER RADAR — API: fila de vinculação FIPE agrupada por marca + modelo ("categoria")
 * GET fipe_fila_categorias.php
 *
 * Pedido do Felipe (01/10/2026): sem vínculo FIPE não há mediana, sem mediana não há
 * sistema — priorizar a cobertura FIPE × Anúncios, com "uma área que faz somente a
 * vinculação de FIPE com anúncios faltantes e por categorias separadas". Esta tela
 * mostra ONDE a fila concentra (qual marca/modelo tem mais anúncios pendentes), pra
 * atacar as maiores categorias primeiro — a curadoria em si (buscar e salvar a FIPE
 * certa, com sugestões inteligentes) já existe por anúncio, em Mercado.
 *
 * Reaproveita exatamente os mesmos três estados de anuncios.php?fipe_fila=: sem
 * nenhum vínculo e sem sugestão pré-calculada (sem_sugestao), sem vínculo mas com
 * sugestão pronta pra confirmar (com_sugestao), e já vinculado (vinculados). Nenhuma
 * escrita — só leitura e contagem.
 */
require_once __DIR__ . '/config.php';
$usuario = exige_autenticacao();
$conn = conecta();

$limit = min(max((int)($_GET['limit'] ?? 80), 1), 200);

$sql = "SELECT
    COALESCE(NULLIF(TRIM(a.marca), ''), '—') AS marca,
    COALESCE(NULLIF(TRIM(a.modelo), ''), '—') AS modelo,
    SUM(a.fipe_preco_id IS NULL AND NOT EXISTS (SELECT 1 FROM anuncio_fipe_sugestao sx WHERE sx.anuncio_id = a.id)) AS sem_sugestao,
    SUM(a.fipe_preco_id IS NULL AND EXISTS (SELECT 1 FROM anuncio_fipe_sugestao sx WHERE sx.anuncio_id = a.id)) AS com_sugestao,
    SUM(a.fipe_preco_id IS NOT NULL) AS vinculados,
    COUNT(*) AS total
    FROM anuncio a
    WHERE a.tipo = 'Caminhao' AND a.status = 'ativo'
    GROUP BY marca, modelo
    HAVING (sem_sugestao + com_sugestao) > 0
    ORDER BY (sem_sugestao + com_sugestao) DESC, total DESC
    LIMIT ?";
$st = $conn->prepare($sql);
$st->bind_param('i', $limit);
$st->execute();
$res = $st->get_result();
$categorias = [];
while ($linha = $res->fetch_assoc()) {
    $semSugestao = (int)$linha['sem_sugestao'];
    $comSugestao = (int)$linha['com_sugestao'];
    $categorias[] = [
        'marca' => $linha['marca'],
        'modelo' => $linha['modelo'],
        'sem_sugestao' => $semSugestao,
        'com_sugestao' => $comSugestao,
        'revisar' => $semSugestao + $comSugestao,
        'vinculados' => (int)$linha['vinculados'],
        'total' => (int)$linha['total'],
    ];
}
$st->close();

// Totais do universo inteiro (não só o top N retornado), pro resumo no topo da tela.
$resumo = $conn->query("SELECT
    SUM(a.fipe_preco_id IS NULL) AS pendentes,
    SUM(a.fipe_preco_id IS NOT NULL) AS vinculados,
    COUNT(*) AS total
    FROM anuncio a WHERE a.tipo = 'Caminhao' AND a.status = 'ativo'")->fetch_assoc();

$categoriasPendentes = $conn->query("SELECT COUNT(*) n FROM (
    SELECT 1 FROM anuncio a WHERE a.tipo = 'Caminhao' AND a.status = 'ativo'
    GROUP BY COALESCE(NULLIF(TRIM(a.marca), ''), '—'), COALESCE(NULLIF(TRIM(a.modelo), ''), '—')
    HAVING SUM(a.fipe_preco_id IS NULL) > 0
) x")->fetch_assoc()['n'] ?? 0;

envia_json([
    'resumo' => [
        'pendentes' => (int)($resumo['pendentes'] ?? 0),
        'vinculados' => (int)($resumo['vinculados'] ?? 0),
        'total' => (int)($resumo['total'] ?? 0),
        'categorias_pendentes' => (int)$categoriasPendentes,
        'cobertura_pct' => (int)($resumo['total'] ?? 0) > 0
            ? round((int)($resumo['vinculados'] ?? 0) / (int)$resumo['total'] * 100, 1) : null,
    ],
    'categorias' => $categorias,
    'limite' => $limit,
]);
