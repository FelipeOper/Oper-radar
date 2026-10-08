<?php
require_once __DIR__ . '/../lib/regional_modelo.php';

function confirma_regional($condicao, string $mensagem): void {
    if (!$condicao) throw new RuntimeException($mensagem);
}

function linhas_uf(int $quantidade, float $base, int $revendas, float $fipe = 500000.0): array {
    $linhas = [];
    for ($i = 0; $i < $quantidade; $i++) {
        $linhas[] = [
            'preco' => $base + $i * 1000,
            'preco_fipe' => $fipe,
            'titulo' => 'Volvo FH 540 2021',
            'preco_texto_bruto' => 'R$ ' . number_format($base, 0, ',', '.'),
            'revenda_id' => 100 + ($i % $revendas),
        ];
    }
    return $linhas;
}

$linhasPorUf = [
    'PR' => linhas_uf(36, 490000, 8),   // amostra ampla
    'GO' => linhas_uf(12, 470000, 4),   // amostra media
    'SC' => linhas_uf(3, 480000, 2),    // insuficiente (<5)
];
$saidasPorUf = [
    'PR' => array_fill(0, 14, 40),
    'GO' => [20, 25, 30, 35],
    'SC' => [50],
];

$res = oper_regioes_do_modelo($linhasPorUf, $saidasPorUf, true, 120);
$porUf = array_column($res['regioes'], null, 'uf');

confirma_regional(count($res['regioes']) === 3, 'tres UFs comparadas');
confirma_regional($porUf['PR']['avaliacao']['confianca'] === 'alta', 'PR: amostra ampla e 120 dias = alta');
confirma_regional($porUf['GO']['avaliacao']['confianca'] === 'media', 'GO: media');
confirma_regional($porUf['SC']['avaliacao']['confianca'] === 'insuficiente', 'SC: menos de 5 comparaveis = insuficiente');
confirma_regional($porUf['SC']['avaliacao']['publicavel'] === false, 'SC nao e publicavel');
confirma_regional($porUf['PR']['avaliacao']['publicavel'] === true, 'PR publicavel');
confirma_regional(end($res['regioes'])['uf'] === 'SC', 'nao publicavel vai por ultimo');
confirma_regional(in_array($res['melhor_uf'], ['PR', 'GO'], true), 'melhor UF e uma praca publicavel');
confirma_regional($res['melhor_uf'] === $res['regioes'][0]['uf'], 'melhor UF e a primeira da lista');

// Pesos e componentes seguem a especificacao.
$comp = $porUf['PR']['avaliacao']['componentes'];
confirma_regional(array_keys($comp) === ['movimento', 'concorrencia', 'tempo_saida', 'preco', 'qualidade'], 'cinco componentes na ordem da especificacao');
confirma_regional(array_sum(array_column($comp, 'peso')) === 100, 'pesos somam 100');
confirma_regional($porUf['PR']['avaliacao']['pontuacao'] >= 0 && $porUf['PR']['avaliacao']['pontuacao'] <= 100, 'pontuacao entre 0 e 100');
confirma_regional($porUf['PR']['revendas'] === 8 && $porUf['GO']['revendas'] === 4, 'revendas distintas por UF');
confirma_regional($porUf['GO']['mediana_dias_saida'] === 27.5, 'mediana de dias ate a saida');
confirma_regional(strpos($porUf['GO']['texto'], 'GO:') === 0, 'texto factual por UF');

// Sem trilha de eventos, nenhuma UF e publicavel (nao ha historico para sustentar o indice).
$semEventos = oper_regioes_do_modelo($linhasPorUf, [], false, 0);
foreach ($semEventos['regioes'] as $r) confirma_regional($r['avaliacao']['publicavel'] === false, 'sem eventos nao publica ' . $r['uf']);
confirma_regional($semEventos['melhor_uf'] === null, 'sem eventos nao ha melhor UF');
confirma_regional($semEventos['historico_eventos']['disponivel'] === false, 'historico indisponivel sinalizado');

// Cobertura curta (menos de 7 dias) tambem nao sustenta o indice.
$curta = oper_regioes_do_modelo($linhasPorUf, $saidasPorUf, true, 3);
confirma_regional($curta['melhor_uf'] === null, 'cobertura de 3 dias nao publica');

// Entradas invalidas nao quebram.
$vazio = oper_regioes_do_modelo([], [], true, 30);
confirma_regional($vazio['regioes'] === [] && $vazio['melhor_uf'] === null, 'sem linhas, sem regioes');
$invalido = oper_regioes_do_modelo(['xx1' => linhas_uf(6, 400000, 2), 'PR' => []], [], true, 30);
confirma_regional($invalido['regioes'] === [], 'UF invalida ou vazia e ignorada');

echo "regional_modelo_test=OK\n";
