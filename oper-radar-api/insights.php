<?php
/**
 * OPER RADAR — API: insights agregados + DESCOBERTAS (insights cruzados)
 * As "descobertas" são frases prontas que juntam 2 dados — o que um analista faria.
 * Uma saida significa ausencia confirmada no portal, nao necessariamente uma venda.
 */
require_once __DIR__ . '/config.php';
$conn = conecta();

function rows(mysqli $c, string $sql): array {
    $out = []; $r = $c->query($sql);
    if ($r) while ($row = $r->fetch_assoc()) $out[] = $row;
    return $out;
}

$porTipo   = rows($conn, "SELECT tipo, COUNT(*) n, AVG(preco) preco_medio FROM anuncio WHERE status='ativo' AND tipo IS NOT NULL GROUP BY tipo ORDER BY n DESC");
$porMarca  = rows($conn, "SELECT marca, COUNT(*) n, AVG(preco) preco_medio FROM anuncio WHERE status='ativo' AND marca IS NOT NULL GROUP BY marca ORDER BY n DESC LIMIT 12");
$porCidade = rows($conn, "SELECT r.cidade, COUNT(*) n FROM anuncio a JOIN revenda r ON r.id=a.revenda_id WHERE a.status='ativo' GROUP BY r.cidade ORDER BY n DESC LIMIT 12");

$giroRevenda = rows($conn, "
    SELECT r.nome, r.cidade,
           SUM(CASE WHEN a.status='removido_confirmado' THEN 1 ELSE 0 END) saidas,
           SUM(CASE WHEN a.status='ativo' THEN 1 ELSE 0 END) ativos,
           AVG(CASE WHEN a.status='ativo' THEN DATEDIFF(NOW(), a.primeira_vez_visto) END) idade_media_dias
    FROM revenda r JOIN anuncio a ON a.revenda_id=r.id
    GROUP BY r.id HAVING ativos>5 ORDER BY saidas DESC, ativos DESC LIMIT 15");

$faixas = rows($conn, "
    SELECT CASE WHEN preco < 100000 THEN 'até 100 mil'
                WHEN preco < 250000 THEN '100–250 mil'
                WHEN preco < 400000 THEN '250–400 mil'
                WHEN preco < 600000 THEN '400–600 mil'
                ELSE '600 mil+' END faixa, COUNT(*) n
    FROM anuncio WHERE status='ativo' AND preco IS NOT NULL GROUP BY faixa");

$fipeRow = $conn->query("SELECT COUNT(*) n, SUM(CASE WHEN a.preco < f.preco THEN 1 ELSE 0 END) abaixo,
                                AVG((a.preco - f.preco) / f.preco) * 100 desvio
                         FROM anuncio a JOIN fipe_preco f ON f.id = a.fipe_preco_id
                         WHERE a.status='ativo' AND a.preco IS NOT NULL AND f.preco IS NOT NULL")->fetch_assoc();
$fipe = ['vinculados' => (int)($fipeRow['n'] ?? 0),
         'abaixo_fipe' => (int)($fipeRow['abaixo'] ?? 0),
         'desvio_medio_pct' => $fipeRow['desvio'] !== null ? round((float)$fipeRow['desvio'], 1) : null];

// ---- DESCOBERTAS: insights cruzados calculados aqui ----
$descobertas = [];

// 1) Cidade com maior taxa observada de saida/estoque
$conv = rows($conn, "
    SELECT r.cidade,
           SUM(a.status='ativo') estoque,
           SUM(a.status='removido_confirmado' AND a.data_remocao >= DATE_SUB(NOW(), INTERVAL 30 DAY)) saidas
    FROM revenda r JOIN anuncio a ON a.revenda_id=r.id
    GROUP BY r.cidade HAVING estoque > 20 ORDER BY (saidas/estoque) DESC LIMIT 1");
if ($conv && $conv[0]['saidas'] > 0) {
    $c = $conv[0];
    $taxa = round(($c['saidas'] / $c['estoque']) * 100, 1);
    $descobertas[] = ['tipo' => 'conversao', 'titulo' => 'Maior taxa de saída do mercado',
        'texto' => "{$c['cidade']}: {$c['saidas']} saídas detectadas / {$c['estoque']} anúncios = {$taxa}% no mês. A ausência no portal não comprova venda."];
}

// 2) Marca dominante em uma região
$dom = rows($conn, "
    SELECT r.cidade, a.marca, COUNT(*) n,
           ROUND(COUNT(*) / (SELECT COUNT(*) FROM anuncio a2 JOIN revenda r2 ON r2.id=a2.revenda_id
                             WHERE r2.cidade=r.cidade AND a2.status='ativo') * 100, 1) pct
    FROM anuncio a JOIN revenda r ON r.id=a.revenda_id
    WHERE a.status='ativo' AND a.marca IS NOT NULL
    GROUP BY r.cidade, a.marca HAVING n > 30 AND pct > 30
    ORDER BY pct DESC LIMIT 1");
if ($dom) {
    $d = $dom[0];
    $descobertas[] = ['tipo' => 'concentracao', 'titulo' => "Concentração em {$d['cidade']}",
        'texto' => "{$d['marca']} representa {$d['pct']}% dos anúncios da cidade ({$d['n']} unidades). Alta concentração = margem menor de negociação."];
}

// 3) Revenda que mais subiu anuncios recentemente vs estoque total
$novos = rows($conn, "
    SELECT r.nome, r.cidade,
           SUM(a.primeira_vez_visto >= DATE_SUB(NOW(), INTERVAL 7 DAY)) novos_7d,
           SUM(a.status='ativo') ativos
    FROM revenda r JOIN anuncio a ON a.revenda_id=r.id
    GROUP BY r.id HAVING ativos > 20 ORDER BY (novos_7d/ativos) DESC LIMIT 1");
if ($novos && $novos[0]['novos_7d'] > 5) {
    $n = $novos[0];
    $pct = round(($n['novos_7d'] / $n['ativos']) * 100, 0);
    $descobertas[] = ['tipo' => 'movimento', 'titulo' => "Loja carregando estoque",
        'texto' => "{$n['nome']} ({$n['cidade']}) subiu {$n['novos_7d']} anúncios nos últimos 7 dias — {$pct}% do estoque dela é novo. Sinal de reposição ou entrada em novo segmento."];
}

// 4) Faixa de preço mais quente (maior giro)
$hot = rows($conn, "
    SELECT CASE WHEN a.preco < 100000 THEN 'até 100 mil'
                WHEN a.preco < 250000 THEN '100–250 mil'
                WHEN a.preco < 400000 THEN '250–400 mil'
                WHEN a.preco < 600000 THEN '400–600 mil'
                ELSE '600 mil+' END faixa,
           SUM(a.status='ativo') ativos,
           SUM(a.status='removido_confirmado' AND a.data_remocao >= DATE_SUB(NOW(), INTERVAL 30 DAY)) saidas
    FROM anuncio a WHERE a.preco IS NOT NULL
    GROUP BY faixa HAVING ativos > 100 ORDER BY (saidas/ativos) DESC LIMIT 1");
if ($hot && $hot[0]['saidas'] > 0) {
    $h = $hot[0];
    $taxa = round(($h['saidas'] / $h['ativos']) * 100, 1);
    $descobertas[] = ['tipo' => 'faixa', 'titulo' => "Faixa mais quente",
        'texto' => "Anúncios de {$h['faixa']} têm {$taxa}% de giro no mês — a mais alta entre todas as faixas de preço. Segmento onde o cliente aparece."];
}

foreach ($porTipo as &$m)   { $m['n']=(int)$m['n']; $m['preco_medio']=$m['preco_medio']?round((float)$m['preco_medio']):null; }
foreach ($porMarca as &$m)  { $m['n']=(int)$m['n']; $m['preco_medio']=$m['preco_medio']?round((float)$m['preco_medio']):null; }
foreach ($porCidade as &$c) { $c['n']=(int)$c['n']; }
foreach ($faixas as &$f)    { $f['n']=(int)$f['n']; }
foreach ($giroRevenda as &$g) {
    $g['saidas']=(int)$g['saidas']; $g['ativos']=(int)$g['ativos'];
    $g['idade_media_dias']=$g['idade_media_dias']!==null?round((float)$g['idade_media_dias']):null;
    $g['revenda']=$g['nome']; unset($g['nome']);
    $g['saidas_detectadas']=$g['saidas']; unset($g['saidas']);
    // Compatibilidade temporaria com bundles anteriores.
    $g['vendas_confirmadas']=$g['saidas_detectadas'];
    $g['estoque_ativo']=$g['ativos']; unset($g['ativos']);
}

envia_json([
    'por_tipo' => $porTipo, 'por_marca' => $porMarca, 'por_cidade' => $porCidade,
    'giro_por_revenda' => $giroRevenda, 'faixas_preco' => $faixas,
    'fipe' => $fipe, 'descobertas' => $descobertas,
]);
