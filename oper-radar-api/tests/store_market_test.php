<?php
require_once __DIR__ . '/../lib/store_market.php';

function confirma_loja($condicao, string $mensagem): void {
    if (!$condicao) throw new RuntimeException("Falhou: $mensagem");
}

confirma_loja(oper_loja_mediana([10, 30, 20]) === 20.0, 'mediana ímpar');
confirma_loja(oper_loja_mediana([10, 20]) === 15.0, 'mediana par');
confirma_loja(oper_loja_mediana([]) === null, 'mediana vazia');

$componentes = oper_loja_componentes_regionais([
    ['comparaveis' => 20, 'saidas_observadas' => 8, 'revendas' => 5,
     'cobertura_dias' => 100, 'mediana_dias_saida' => 35, 'preco_mediano' => 650000],
    ['comparaveis' => 10, 'saidas_observadas' => 2, 'revendas' => 3,
     'cobertura_dias' => 60, 'mediana_dias_saida' => 50, 'preco_mediano' => 675000],
]);
confirma_loja($componentes[0]['movimento'] === 100.0, 'maior movimento');
confirma_loja($componentes[1]['concorrencia'] === 100.0, 'menor concorrência');
confirma_loja($componentes[1]['preco'] === 100.0, 'maior preço mediano');
confirma_loja(str_contains(oper_loja_texto_regional(
    ['uf' => 'PR', 'comparaveis' => 20, 'saidas_observadas' => 8, 'preco_mediano' => 650000],
    ['confianca' => 'media']
), 'Confiança media'), 'texto explicável');

echo "store_market_test=OK\n";
