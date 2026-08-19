<?php
require_once __DIR__ . '/../lib/market_taxonomy.php';

function confirma_taxonomia_mercado($condicao, string $mensagem): void {
    if (!$condicao) throw new RuntimeException($mensagem);
}

$categorias = oper_taxonomia_tipos_por_categoria();
$filtros = oper_taxonomia_filtros_por_categoria();

confirma_taxonomia_mercado(oper_taxonomia_categoria_de_tipo('Caminhao') === 'caminhoes', 'caminhao');
confirma_taxonomia_mercado(oper_taxonomia_categoria_de_tipo('Motorhome') === 'onibus_vans', 'motorhome');
confirma_taxonomia_mercado(oper_taxonomia_categoria_de_tipo('Utilitarios') === 'leves', 'utilitarios');
confirma_taxonomia_mercado(in_array('Motorhome', $categorias['onibus_vans'], true), 'grupo motorhome');
confirma_taxonomia_mercado(in_array('tracao', $filtros['caminhoes'], true), 'tracao de caminhoes');
confirma_taxonomia_mercado(!in_array('tracao', $filtros['agricolas'], true), 'sem tracao agricola');

echo "market_taxonomy_test=OK\n";
