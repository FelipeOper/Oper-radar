<?php
require_once __DIR__ . '/../lib/hoje_painel.php';

function confirma_hoje($condicao, string $mensagem): void {
    if (!$condicao) throw new RuntimeException($mensagem);
}

$agora = new DateTimeImmutable('2026-09-24 12:00:00');

// ---- horas desde ----
confirma_hoje(oper_hoje_horas_desde('2026-09-24 09:30:00', $agora) === 2, 'horas inteiras arredondam para baixo');
confirma_hoje(oper_hoje_horas_desde('2026-09-25 09:30:00', $agora) === 0, 'futuro nao gera horas negativas');
confirma_hoje(oper_hoje_horas_desde(null, $agora) === null, 'null vira null');
confirma_hoje(oper_hoje_horas_desde('lixo', $agora) === null, 'data invalida vira null');

// ---- frescor da coleta ----
$frescor = oper_frescor_coleta([
    ['uf' => 'pr', 'revendas' => 10, 'revendas_coletadas_24h' => 10, 'ultima_coleta' => '2026-09-24 07:05:00'],
    ['uf' => 'SP', 'revendas' => 20, 'revendas_coletadas_24h' => 8, 'ultima_coleta' => '2026-09-24 07:05:00'],
    ['uf' => 'GO', 'revendas' => 6, 'revendas_coletadas_24h' => 0, 'ultima_coleta' => '2026-09-22 19:00:00'],
    ['uf' => 'MT', 'revendas' => 3, 'revendas_coletadas_24h' => 0, 'ultima_coleta' => null],
], $agora);
$porUf = array_column($frescor['itens'], null, 'uf');
confirma_hoje($porUf['PR']['status'] === 'em_dia', 'PR em dia');
confirma_hoje($porUf['PR']['cobertura_pct'] === 100, 'PR cobertura 100');
confirma_hoje($porUf['SP']['status'] === 'parcial', 'SP dentro do prazo mas cobertura 40% e parcial');
confirma_hoje($porUf['GO']['status'] === 'atrasada' && $porUf['GO']['horas'] === 41, 'GO atrasada ha 41 h');
confirma_hoje($porUf['MT']['status'] === 'sem_coleta' && $porUf['MT']['horas'] === null, 'MT sem coleta');
confirma_hoje($frescor['itens'][0]['uf'] === 'MT' && $frescor['itens'][1]['uf'] === 'GO', 'ordena por gravidade');
confirma_hoje($frescor['resumo']['severidade'] === 'alta', 'atrasada/sem coleta = severidade alta');
confirma_hoje($frescor['resumo']['atrasada'] === 1 && $frescor['resumo']['em_dia'] === 1, 'contagens do resumo');

$so = oper_frescor_coleta([['uf' => 'PR', 'revendas' => 10, 'revendas_coletadas_24h' => 9, 'ultima_coleta' => '2026-09-24 06:00:00']], $agora);
confirma_hoje($so['resumo']['severidade'] === 'ok', 'tudo em dia = ok');
$limite = oper_frescor_coleta([['uf' => 'PR', 'revendas' => 10, 'revendas_coletadas_24h' => 10, 'ultima_coleta' => '2026-09-23 12:00:00']], $agora);
confirma_hoje($limite['itens'][0]['status'] === 'em_dia', 'exatamente 24 h ainda e em dia');
$vazio = oper_frescor_coleta([], $agora);
confirma_hoje($vazio['resumo']['ufs'] === 0 && $vazio['resumo']['severidade'] === 'ok', 'sem UFs nao inventa alerta');
$semRevendas = oper_frescor_coleta([['uf' => 'AC', 'revendas' => 0, 'revendas_coletadas_24h' => 5, 'ultima_coleta' => '2026-09-24 08:00:00']], $agora);
confirma_hoje($semRevendas['itens'][0]['cobertura_pct'] === null && $semRevendas['itens'][0]['revendas_coletadas_24h'] === 0, 'coletadas nunca excede revendas');

// ---- feed ----
$novos = [];
for ($i = 0; $i < 10; $i++) {
    $novos[] = ['anuncio_id' => 100 + $i, 'titulo' => "Novo $i", 'cidade' => 'Curitiba', 'uf' => 'PR', 'preco' => 400000, 'quando' => sprintf('2026-09-24 11:%02d:00', 50 - $i)];
}
$reducoes = [
    ['anuncio_id' => 1, 'titulo' => 'Cai', 'uf' => 'SP', 'preco_anterior' => 500000, 'preco_novo' => 480000, 'variacao_pct' => -4.0, 'quando' => '2026-09-24 08:00:00'],
    ['anuncio_id' => 2, 'titulo' => 'Sobe', 'uf' => 'SP', 'preco_anterior' => 480000, 'preco_novo' => 500000, 'variacao_pct' => 4.2, 'quando' => '2026-09-24 11:59:00'],
];
$saidas = [['anuncio_id' => 3, 'titulo' => 'Saiu', 'uf' => 'GO', 'quando' => '2026-09-24 07:00:00']];
$feed = oper_hoje_feed($novos, $reducoes, $saidas, 12);
$tipos = array_count_values(array_column($feed, 'tipo'));
confirma_hoje(($tipos['novo'] ?? 0) === 6, 'entradas limitadas a metade do feed');
confirma_hoje(($tipos['preco'] ?? 0) === 1, 'so quedas de preco entram (alta ignorada)');
confirma_hoje(($tipos['saida'] ?? 0) === 1, 'saida entra');
confirma_hoje($feed[0]['anuncio_id'] === 100, 'mais recente primeiro');
confirma_hoje(end($feed)['anuncio_id'] === 3, 'mais antigo por ultimo');
confirma_hoje(count(oper_hoje_feed($novos, $reducoes, $saidas, 3)) === 3, 'respeita o limite');
confirma_hoje(oper_hoje_feed([], [], []) === [], 'sem eventos, feed vazio');
confirma_hoje($feed[count($feed) - 2]['tipo'] === 'preco' && $feed[count($feed) - 2]['variacao_pct'] === -4.0, 'queda traz variacao');

// ---- insights ----
$ctx = [
    'atualizacao' => '24/09/2026 07:05',
    'saidas_total' => 37,
    'saidas_por_uf' => [['uf' => 'SP', 'saidas' => 9, 'ativos' => 581], ['uf' => 'PR', 'saidas' => 21, 'ativos' => 422]],
    'abaixo_fipe' => [
        ['marca' => 'Volvo', 'modelo' => 'FH 540', 'ano' => 2021, 'mediana' => 480000, 'fipe' => 505000, 'amostra' => 9, 'revendas' => 6],
        ['marca' => 'Scania', 'modelo' => 'R 450', 'ano' => 2020, 'mediana' => 400000, 'fipe' => 500000, 'amostra' => 3, 'revendas' => 2],
        ['marca' => 'DAF', 'modelo' => 'XF', 'ano' => 2022, 'mediana' => 500000, 'fipe' => 505000, 'amostra' => 12, 'revendas' => 5],
    ],
    'parados' => [
        ['marca' => 'Volvo', 'modelo' => 'FH 540', 'ano' => 2019, 'parados' => 6, 'total' => 11, 'revendas' => 7],
        ['marca' => 'Iveco', 'modelo' => 'S-Way', 'ano' => 2022, 'parados' => 3, 'total' => 8, 'revendas' => 4],
    ],
    'reducoes_revendas' => [
        ['id' => 7, 'nome' => 'Rota Exemplo', 'cidade' => 'Curitiba', 'uf' => 'PR', 'reducoes' => 5, 'ativos' => 30],
        ['id' => 8, 'nome' => 'Poucas', 'cidade' => 'Goiania', 'uf' => 'GO', 'reducoes' => 2, 'ativos' => 12],
    ],
];
$ins = oper_hoje_insights($ctx);
$ids = array_column($ins, 'id');
confirma_hoje($ids === ['saidas-uf', 'abaixo-fipe', 'estoque-parado', 'concorrente-reduziu'], 'quatro insights na ordem definida');
$porId = array_column($ins, null, 'id');
confirma_hoje(strpos($porId['saidas-uf']['titulo'], 'PR') === 0, 'UF com mais saidas vence');
confirma_hoje($porId['abaixo-fipe']['acao']['contexto']['modelo'] === 'FH 540', 'so o modelo com amostra suficiente e desvio relevante');
confirma_hoje($porId['abaixo-fipe']['evidencia']['confianca'] === 'baixa', 'confianca segue a regra real (9 precos = baixa)');
confirma_hoje(strpos($porId['abaixo-fipe']['texto'], '5,0%') !== false, 'desvio formatado em pt-BR');
confirma_hoje($porId['estoque-parado']['evidencia']['valor'] === '6 anúncios', 'estoque parado usa o grupo com mais parados');
confirma_hoje($porId['concorrente-reduziu']['titulo'] === 'Rota Exemplo reduziu preço em 5 anúncios', 'revenda com >=3 reducoes');
foreach ($ins as $i) {
    foreach (['recorte', 'periodo', 'valor', 'base', 'amostra', 'confianca', 'atualizacao', 'explicacao'] as $campo) {
        confirma_hoje(isset($i['evidencia'][$campo]) && $i['evidencia'][$campo] !== '', "evidencia {$i['id']} tem $campo");
    }
}
confirma_hoje(count(oper_hoje_insights($ctx, 2)) === 2, 'respeita o maximo');

// Abaixo dos minimos, nenhum insight e criado.
$fraco = oper_hoje_insights([
    'saidas_total' => 10,
    'saidas_por_uf' => [['uf' => 'PR', 'saidas' => 4, 'ativos' => 100]],
    'abaixo_fipe' => [['marca' => 'A', 'modelo' => 'B', 'ano' => 2020, 'mediana' => 90, 'fipe' => 100, 'amostra' => 4, 'revendas' => 2]],
    'parados' => [['marca' => 'A', 'modelo' => 'B', 'ano' => 2020, 'parados' => 3, 'total' => 20, 'revendas' => 3]],
    'reducoes_revendas' => [['id' => 1, 'nome' => 'X', 'cidade' => 'Y', 'uf' => 'PR', 'reducoes' => 2, 'ativos' => 9]],
]);
confirma_hoje($fraco === [], 'sem amostra suficiente nao ha insight');
confirma_hoje(oper_hoje_insights([]) === [], 'contexto vazio nao quebra');

echo "hoje_painel_test=OK\n";
