<?php
require_once __DIR__ . '/../lib/market_taxonomy.php';

function confirma_taxonomia_mercado($condicao, string $mensagem): void {
    if (!$condicao) throw new RuntimeException($mensagem);
}

$categorias = oper_taxonomia_tipos_por_categoria();
$filtros = oper_taxonomia_filtros_por_categoria();
$mercados = oper_taxonomia_tipos_por_mercado();

confirma_taxonomia_mercado(oper_taxonomia_categoria_de_tipo('Caminhao') === 'caminhoes', 'caminhao');
confirma_taxonomia_mercado(oper_taxonomia_categoria_de_tipo('Motorhome') === 'onibus_vans', 'motorhome');
confirma_taxonomia_mercado(oper_taxonomia_categoria_de_tipo('Utilitarios') === 'leves', 'utilitarios');
confirma_taxonomia_mercado(in_array('Motorhome', $categorias['onibus_vans'], true), 'grupo motorhome');
confirma_taxonomia_mercado(in_array('tracao', $filtros['caminhoes'], true), 'tracao de caminhoes');
confirma_taxonomia_mercado(!in_array('tracao', $filtros['agricolas'], true), 'sem tracao agricola');
confirma_taxonomia_mercado(in_array('Caminhao', $mercados['principal'], true), 'caminhao no foco principal');
confirma_taxonomia_mercado(in_array('Implemento', $mercados['principal'], true), 'implemento no foco principal');
confirma_taxonomia_mercado(!in_array('Trator', $mercados['principal'], true), 'agricola fora do foco principal');
confirma_taxonomia_mercado(in_array('Trator', $mercados['outros'], true), 'agricola preservado nos outros mercados');

// Segmento do Felipe: Pesado = caminhao seminovo + implemento rodoviario. Carreta e implemento rodoviario;
// implemento agricola e o resto ficam fora do foco principal (cenario agricola separado, sem misturar).
confirma_taxonomia_mercado(oper_taxonomia_categoria_de_tipo('Carreta') === 'implementos', 'carreta e implemento rodoviario');
confirma_taxonomia_mercado(in_array('Carreta', $mercados['principal'], true), 'carreta no foco principal');
confirma_taxonomia_mercado(oper_taxonomia_categoria_de_tipo('Implementos-agricolas') === 'agricolas', 'implemento agricola e agricola');
confirma_taxonomia_mercado(!in_array('Implementos-agricolas', $mercados['principal'], true), 'implemento agricola fora do foco principal');
confirma_taxonomia_mercado(in_array('Implementos-agricolas', $mercados['outros'], true), 'implemento agricola nos outros mercados');
confirma_taxonomia_mercado(oper_taxonomia_categoria_de_tipo('Aviao') === 'outros', 'tipo nao mapeado cai em outros');
confirma_taxonomia_mercado(count(array_intersect($mercados['principal'], $mercados['outros'])) === 0, 'principal e outros nao se misturam');

echo "market_taxonomy_test=OK\n";
