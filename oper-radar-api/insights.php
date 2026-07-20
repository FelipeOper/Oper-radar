<?php
/** OPER RADAR — inteligência agregada, tolerante a dados ainda incompletos. */
require_once __DIR__ . '/config.php';
$conn = conecta();
$avisos = [];

function consulta(mysqli $conn, string $nome, string $sql): array {
    global $avisos;
    $saida = [];
    $resultado = $conn->query($sql);
    if (!$resultado) {
        $avisos[] = $nome;
        return [];
    }
    while ($linha = $resultado->fetch_assoc()) $saida[] = $linha;
    return $saida;
}

function consulta_um(mysqli $conn, string $nome, string $sql): array {
    $linhas = consulta($conn, $nome, $sql);
    return $linhas[0] ?? [];
}

$porTipo = consulta($conn, 'por_tipo', "
    SELECT tipo, COUNT(*) anuncios, ROUND(AVG(NULLIF(preco,0))) preco_medio
    FROM anuncio WHERE status='ativo' AND tipo IS NOT NULL
    GROUP BY tipo ORDER BY anuncios DESC");
$porMarca = consulta($conn, 'por_marca', "
    SELECT marca, COUNT(*) anuncios, ROUND(AVG(NULLIF(preco,0))) preco_medio
    FROM anuncio WHERE status='ativo' AND marca IS NOT NULL AND marca<>''
    GROUP BY marca ORDER BY anuncios DESC LIMIT 12");
$porCidade = consulta($conn, 'por_cidade', "
    SELECT r.cidade, r.uf, COUNT(*) anuncios
    FROM anuncio a JOIN revenda r ON r.id=a.revenda_id
    WHERE a.status='ativo' GROUP BY r.cidade, r.uf ORDER BY anuncios DESC LIMIT 12");

$giroRevenda = consulta($conn, 'giro_revenda', "
    SELECT r.nome revenda, r.cidade, r.uf,
           SUM(CASE WHEN a.status='removido_confirmado' THEN 1 ELSE 0 END) saidas_detectadas,
           SUM(CASE WHEN a.status='ativo' THEN 1 ELSE 0 END) estoque_ativo,
           ROUND(AVG(CASE WHEN a.status='ativo' THEN DATEDIFF(NOW(),a.primeira_vez_visto) END)) idade_media_dias
    FROM revenda r JOIN anuncio a ON a.revenda_id=r.id
    GROUP BY r.id HAVING estoque_ativo>5
    ORDER BY saidas_detectadas DESC, estoque_ativo DESC LIMIT 15");

$faixas = consulta($conn, 'faixas_preco', "
    SELECT CASE WHEN preco < 100000 THEN 'Até R$ 100 mil'
                WHEN preco < 250000 THEN 'R$ 100–250 mil'
                WHEN preco < 400000 THEN 'R$ 250–400 mil'
                WHEN preco < 600000 THEN 'R$ 400–600 mil'
                ELSE 'R$ 600 mil+' END faixa, COUNT(*) anuncios
    FROM anuncio WHERE status='ativo' AND preco IS NOT NULL AND preco>0
    GROUP BY faixa ORDER BY MIN(preco)");

$fipeRow = consulta_um($conn, 'fipe', "
    SELECT COUNT(*) vinculados,
           SUM(CASE WHEN a.preco < f.preco THEN 1 ELSE 0 END) abaixo_fipe,
           ROUND(AVG((a.preco-f.preco)/NULLIF(f.preco,0))*100,1) desvio_medio_pct
    FROM anuncio a JOIN fipe_preco f ON f.id=a.fipe_preco_id
    WHERE a.status='ativo' AND a.preco IS NOT NULL AND a.preco>0 AND f.preco IS NOT NULL AND f.preco>0");
$fipe = [
    'vinculados'=>(int)($fipeRow['vinculados'] ?? 0),
    'abaixo_fipe'=>(int)($fipeRow['abaixo_fipe'] ?? 0),
    'desvio_medio_pct'=>isset($fipeRow['desvio_medio_pct']) ? (float)$fipeRow['desvio_medio_pct'] : null,
];

$descobertas = [];
$conversao = consulta_um($conn, 'descoberta_saida', "
    SELECT r.cidade, r.uf,
           SUM(CASE WHEN a.status='ativo' THEN 1 ELSE 0 END) estoque,
           SUM(CASE WHEN a.status='removido_confirmado' AND a.data_remocao>=DATE_SUB(NOW(),INTERVAL 30 DAY) THEN 1 ELSE 0 END) saidas
    FROM revenda r JOIN anuncio a ON a.revenda_id=r.id
    GROUP BY r.cidade,r.uf HAVING estoque>20 AND saidas>0
    ORDER BY saidas/estoque DESC LIMIT 1");
if ($conversao) {
    $taxa = round(((int)$conversao['saidas']/(int)$conversao['estoque'])*100,1);
    $descobertas[] = ['tipo'=>'conversao','titulo'=>'Maior movimento relativo',
        'texto'=>"{$conversao['cidade']}/{$conversao['uf']} registrou {$conversao['saidas']} saídas para {$conversao['estoque']} ativos ({$taxa}%) em 30 dias. Saída do portal não comprova venda."];
}

$novos = consulta_um($conn, 'descoberta_estoque', "
    SELECT r.nome,r.cidade,r.uf,
           SUM(CASE WHEN a.primeira_vez_visto>=DATE_SUB(NOW(),INTERVAL 7 DAY) THEN 1 ELSE 0 END) novos_7d,
           SUM(CASE WHEN a.status='ativo' THEN 1 ELSE 0 END) ativos
    FROM revenda r JOIN anuncio a ON a.revenda_id=r.id
    GROUP BY r.id HAVING ativos>20 AND novos_7d>5
    ORDER BY novos_7d/ativos DESC LIMIT 1");
if ($novos) {
    $pct = round(((int)$novos['novos_7d']/(int)$novos['ativos'])*100);
    $descobertas[] = ['tipo'=>'movimento','titulo'=>'Reposição forte de estoque',
        'texto'=>"{$novos['nome']} ({$novos['cidade']}/{$novos['uf']}) adicionou {$novos['novos_7d']} anúncios em 7 dias; {$pct}% do estoque atual entrou recentemente."];
}

$quente = consulta_um($conn, 'descoberta_faixa', "
    SELECT CASE WHEN preco<100000 THEN 'até R$ 100 mil'
                WHEN preco<250000 THEN 'de R$ 100 a 250 mil'
                WHEN preco<400000 THEN 'de R$ 250 a 400 mil'
                WHEN preco<600000 THEN 'de R$ 400 a 600 mil'
                ELSE 'acima de R$ 600 mil' END faixa,
           SUM(CASE WHEN status='ativo' THEN 1 ELSE 0 END) ativos,
           SUM(CASE WHEN status='removido_confirmado' AND data_remocao>=DATE_SUB(NOW(),INTERVAL 30 DAY) THEN 1 ELSE 0 END) saidas
    FROM anuncio WHERE preco IS NOT NULL AND preco>0
    GROUP BY faixa HAVING ativos>100 AND saidas>0 ORDER BY saidas/ativos DESC LIMIT 1");
if ($quente) {
    $taxa = round(((int)$quente['saidas']/(int)$quente['ativos'])*100,1);
    $descobertas[] = ['tipo'=>'faixa','titulo'=>'Faixa com maior movimento',
        'texto'=>"Veículos {$quente['faixa']} têm a maior relação observada entre saídas e estoque: {$taxa}% nos últimos 30 dias."];
}

foreach ($porTipo as &$item) { $item['anuncios']=(int)$item['anuncios']; $item['preco_medio']=$item['preco_medio']!==null?(int)$item['preco_medio']:null; }
foreach ($porMarca as &$item) { $item['anuncios']=(int)$item['anuncios']; $item['preco_medio']=$item['preco_medio']!==null?(int)$item['preco_medio']:null; }
foreach ($porCidade as &$item) $item['anuncios']=(int)$item['anuncios'];
foreach ($faixas as &$item) $item['anuncios']=(int)$item['anuncios'];
foreach ($giroRevenda as &$item) {
    $item['saidas_detectadas']=(int)$item['saidas_detectadas'];
    $item['estoque_ativo']=(int)$item['estoque_ativo'];
    $item['idade_media_dias']=$item['idade_media_dias']!==null?(int)$item['idade_media_dias']:null;
}

envia_json([
    'gerado_em'=>date(DATE_ATOM), 'por_tipo'=>$porTipo, 'por_marca'=>$porMarca,
    'por_cidade'=>$porCidade, 'giro_por_revenda'=>$giroRevenda,
    'faixas_preco'=>$faixas, 'fipe'=>$fipe, 'descobertas'=>$descobertas,
    'parciais_indisponiveis'=>$avisos,
]);
