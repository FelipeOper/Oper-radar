<?php
require_once __DIR__ . '/../lib/regional_insight.php';

function confirma_insight($condicao, string $mensagem): void {
    if (!$condicao) throw new RuntimeException($mensagem);
}

$insuficiente = oper_insight_confianca([
    'comparaveis' => 4, 'revendas' => 3, 'saidas_observadas' => 3,
    'cobertura_dias' => 90, 'eventos_confiaveis' => true,
]);
confirma_insight($insuficiente['nivel'] === 'insuficiente', 'amostra mínima');
confirma_insight($insuficiente['publicavel'] === false, 'não publica amostra insuficiente');

$media = oper_insight_confianca([
    'comparaveis' => 20, 'revendas' => 4, 'saidas_observadas' => 5,
    'cobertura_dias' => 60, 'eventos_confiaveis' => true,
]);
confirma_insight($media['nivel'] === 'media', 'confiança média');

$alta = oper_insight_confianca([
    'comparaveis' => 40, 'revendas' => 8, 'saidas_observadas' => 15,
    'cobertura_dias' => 120, 'eventos_confiaveis' => true,
]);
confirma_insight($alta['nivel'] === 'alta', 'confiança alta');

$pontuacao = oper_insight_pontuacao([
    'movimento' => 80, 'concorrencia' => 70, 'tempo_saida' => 60,
    'preco' => 50, 'qualidade' => 90,
], $media);
confirma_insight($pontuacao['pontuacao'] === 71.0, 'soma ponderada');
confirma_insight($pontuacao['publicavel'] === true, 'pontuação publicável');
confirma_insight($pontuacao['componentes']['movimento']['peso'] === 30, 'explicação por componente');

echo "regional_insight_test=OK\n";
