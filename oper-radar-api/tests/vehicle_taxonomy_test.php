<?php
require_once __DIR__ . '/../lib/vehicle_taxonomy.php';

function confirma_taxonomia($condicao, string $mensagem): void {
    if (!$condicao) throw new RuntimeException($mensagem);
}

confirma_taxonomia(oper_tracao_normalizada('Cavalo 6X4') === '6x4', 'cavalo 6x4');
confirma_taxonomia(oper_tracao_normalizada('Truck 8 × 2') === '8x2', 'unicode e espacos');
confirma_taxonomia(oper_tracao_normalizada('16x4') === '16x4', 'dois digitos');
confirma_taxonomia(oper_tracao_normalizada('sem eixo informado') === null, 'ausente');
confirma_taxonomia(oper_tracao_regexp('6x4') === '(^|[^0-9])6[[:space:]]*X[[:space:]]*4([^0-9]|$)', 'regexp');
confirma_taxonomia(oper_tracao_regexp('qualquer') === null, 'filtro invalido');

echo "vehicle_taxonomy_test=OK\n";
