<?php
require_once __DIR__ . '/../lib/market_period.php';

function confirma_market_period($condicao, string $mensagem): void {
    if (!$condicao) throw new RuntimeException($mensagem);
}

confirma_market_period(mercado_periodo('90D') === [
    'codigo' => '90d', 'dias' => 90, 'rotulo' => '90 dias',
], 'normaliza periodo conhecido');
confirma_market_period(mercado_periodo('invalido')['codigo'] === '30d', 'fallback seguro');
confirma_market_period(mercado_periodo(null, '7d')['dias'] === 7, 'padrao explicito');
confirma_market_period(mercado_periodo('12m')['dias'] === 365, 'janela anual');
confirma_market_period(oper_periodo_contrato('180d') === mercado_periodo('180d'), 'alias compativel');

echo "market_period_test=OK\n";
