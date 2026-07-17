<?php
/**
 * OPER RADAR — API: KPIs adicionais para o painel "Hoje"
 * GET hoje_stats.php
 * - top_modelos: modelos com mais anúncios ativos + preço médio
 * - regioes_saidas: cidades com mais saídas detectadas (últimos 30 dias)
 * - top_lojas_novos: lojas que mais subiram anúncios (últimos 7 dias)
 * - top_lojas_saidas: lojas com mais saídas detectadas (últimos 30 dias)
 */
require_once __DIR__ . '/config.php';
$conn = conecta();

function rows(mysqli $c, string $sql): array {
    $out = []; $r = $c->query($sql);
    if ($r) while ($row = $r->fetch_assoc()) $out[] = $row;
    return $out;
}

// Extrai as primeiras 3 "palavras significativas" do título para agrupar modelos
// (ex: "DAF XF FTT 530 2022/2023" vira "DAF XF FTT")
$topModelos = rows($conn, "
    SELECT
        SUBSTRING_INDEX(titulo, ' ', 3) AS modelo,
        marca, tipo,
        COUNT(*) AS n,
        ROUND(AVG(preco)) AS preco_medio
    FROM anuncio
    WHERE status='ativo' AND preco IS NOT NULL AND marca IS NOT NULL
    GROUP BY modelo, marca, tipo
    HAVING n >= 3
    ORDER BY n DESC
    LIMIT 8
");
foreach ($topModelos as &$m) { $m['n'] = (int)$m['n']; $m['preco_medio'] = (int)$m['preco_medio']; }

// Cidades com mais anuncios que deixaram o portal (ultimos 30 dias)
$regioesSaidas = rows($conn, "
    SELECT r.cidade, r.uf, COUNT(*) n
    FROM anuncio a JOIN revenda r ON r.id = a.revenda_id
    WHERE a.status='removido_confirmado' AND a.data_remocao >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY r.cidade, r.uf
    ORDER BY n DESC LIMIT 6
");
foreach ($regioesSaidas as &$c) { $c['n'] = (int)$c['n']; }

// Lojas que mais SUBIRAM anúncios (últimos 7 dias) — quem está mais ativo comercialmente
$topLojasNovos = rows($conn, "
    SELECT r.nome, r.cidade, r.uf, COUNT(*) n
    FROM anuncio a JOIN revenda r ON r.id = a.revenda_id
    WHERE a.primeira_vez_visto >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    GROUP BY r.id
    ORDER BY n DESC LIMIT 6
");
foreach ($topLojasNovos as &$l) { $l['n'] = (int)$l['n']; }

// Lojas com mais saidas detectadas (ultimos 30 dias); isso nao comprova venda.
$topLojasSaidas = rows($conn, "
    SELECT r.nome, r.cidade, r.uf, COUNT(*) n
    FROM anuncio a JOIN revenda r ON r.id = a.revenda_id
    WHERE a.status='removido_confirmado' AND a.data_remocao >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY r.id
    ORDER BY n DESC LIMIT 6
");
foreach ($topLojasSaidas as &$l) { $l['n'] = (int)$l['n']; }

envia_json([
    'top_modelos' => $topModelos,
    'regioes_saidas' => $regioesSaidas,
    'top_lojas_novos' => $topLojasNovos,
    'top_lojas_saidas' => $topLojasSaidas,
    // Compatibilidade temporaria com bundles anteriores.
    'regioes_vendas' => $regioesSaidas,
    'top_lojas_vendas' => $topLojasSaidas,
]);
