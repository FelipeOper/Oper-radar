<?php
/**
 * OPER RADAR — API: insights agregados do mercado
 * GET insights.php
 * As agregações que nenhuma ferramenta do nicho entrega, porque nenhuma enxerga
 * o mercado inteiro dos concorrentes: giro por revenda, idade do estoque alheio,
 * concentração regional e posição vs FIPE (quando a Fase 2 tiver vinculado).
 */
require_once __DIR__ . '/config.php';
$conn = conecta();

// Preço médio e volume por tipo de veículo
$porTipo = [];
$res = $conn->query("SELECT tipo, COUNT(*) n, AVG(preco) preco_medio FROM anuncio
                     WHERE status='ativo' AND tipo IS NOT NULL GROUP BY tipo ORDER BY n DESC");
while ($r = $res->fetch_assoc()) {
    $porTipo[] = ['tipo' => $r['tipo'], 'anuncios' => (int)$r['n'],
                  'preco_medio' => $r['preco_medio'] ? round((float)$r['preco_medio']) : null];
}

// Concentração por marca (caminhões)
$porMarca = [];
$res = $conn->query("SELECT marca, COUNT(*) n, AVG(preco) preco_medio FROM anuncio
                     WHERE status='ativo' AND marca IS NOT NULL GROUP BY marca ORDER BY n DESC LIMIT 12");
while ($r = $res->fetch_assoc()) {
    $porMarca[] = ['marca' => $r['marca'], 'anuncios' => (int)$r['n'],
                   'preco_medio' => $r['preco_medio'] ? round((float)$r['preco_medio']) : null];
}

// Cidades com maior oferta
$porCidade = [];
$res = $conn->query("SELECT r.cidade, COUNT(*) n FROM anuncio a JOIN revenda r ON r.id=a.revenda_id
                     WHERE a.status='ativo' GROUP BY r.cidade ORDER BY n DESC LIMIT 12");
while ($r = $res->fetch_assoc()) {
    $porCidade[] = ['cidade' => $r['cidade'], 'anuncios' => (int)$r['n']];
}

// Giro por revenda: vendas confirmadas + idade média do estoque ativo.
// EXCLUSIVO: nenhuma ferramenta do nicho vê o giro/encalhe dos CONCORRENTES.
$giroRevenda = [];
$res = $conn->query("
    SELECT r.nome, r.cidade,
           SUM(CASE WHEN a.status='removido_confirmado' THEN 1 ELSE 0 END) vendas,
           SUM(CASE WHEN a.status='ativo' THEN 1 ELSE 0 END) ativos,
           AVG(CASE WHEN a.status='ativo' THEN DATEDIFF(NOW(), a.primeira_vez_visto) END) idade_media_dias
    FROM revenda r JOIN anuncio a ON a.revenda_id = r.id
    GROUP BY r.id HAVING ativos > 5
    ORDER BY vendas DESC, ativos DESC LIMIT 15");
while ($r = $res->fetch_assoc()) {
    $giroRevenda[] = ['revenda' => $r['nome'], 'cidade' => $r['cidade'],
                      'vendas_confirmadas' => (int)$r['vendas'], 'estoque_ativo' => (int)$r['ativos'],
                      'idade_media_dias' => $r['idade_media_dias'] !== null ? round((float)$r['idade_media_dias']) : null];
}

// Distribuição de faixas de preço (ativo, com preço)
$faixas = [];
$res = $conn->query("
    SELECT CASE
        WHEN preco < 100000 THEN 'até 100 mil'
        WHEN preco < 250000 THEN '100–250 mil'
        WHEN preco < 400000 THEN '250–400 mil'
        WHEN preco < 600000 THEN '400–600 mil'
        ELSE '600 mil+' END faixa,
        COUNT(*) n
    FROM anuncio WHERE status='ativo' AND preco IS NOT NULL
    GROUP BY faixa");
while ($r = $res->fetch_assoc()) {
    $faixas[] = ['faixa' => $r['faixa'], 'anuncios' => (int)$r['n']];
}

// Posição vs FIPE (só quando a Fase 2 tiver vinculado anúncios)
$fipe = ['vinculados' => 0, 'abaixo_fipe' => 0, 'desvio_medio_pct' => null];
$res = $conn->query("
    SELECT COUNT(*) n,
           SUM(CASE WHEN a.preco < f.preco THEN 1 ELSE 0 END) abaixo,
           AVG((a.preco - f.preco) / f.preco) * 100 desvio
    FROM anuncio a JOIN fipe_preco f ON f.id = a.fipe_preco_id
    WHERE a.status='ativo' AND a.preco IS NOT NULL AND f.preco IS NOT NULL");
if ($res && ($r = $res->fetch_assoc()) && (int)$r['n'] > 0) {
    $fipe = ['vinculados' => (int)$r['n'], 'abaixo_fipe' => (int)$r['abaixo'],
             'desvio_medio_pct' => $r['desvio'] !== null ? round((float)$r['desvio'], 1) : null];
}

envia_json([
    'por_tipo' => $porTipo,
    'por_marca' => $porMarca,
    'por_cidade' => $porCidade,
    'giro_por_revenda' => $giroRevenda,
    'faixas_preco' => $faixas,
    'fipe' => $fipe,
]);
