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

// 'outros' e o complemento das outras categorias: tipo nao mapeado aparece ao abrir a categoria, igual a contagem da faceta.
function tipo_passa_no_filtro(string $tipo, ?array $filtro): bool {
    if ($filtro === null) return false;
    $dentro = in_array($tipo, $filtro['tipos'], true);
    return $filtro['operador'] === 'IN' ? $dentro : !$dentro;
}
confirma_taxonomia_mercado(oper_taxonomia_filtro_categoria('inexistente') === null, 'categoria invalida sem filtro');
confirma_taxonomia_mercado(oper_taxonomia_filtro_categoria('caminhoes')['operador'] === 'IN', 'caminhoes usa IN');
confirma_taxonomia_mercado(oper_taxonomia_filtro_categoria('outros')['operador'] === 'NOT IN', 'outros usa complemento');
$filtroOutros = oper_taxonomia_filtro_categoria('outros');
confirma_taxonomia_mercado(tipo_passa_no_filtro('Aviao', $filtroOutros), 'tipo nao mapeado aparece em outros');
confirma_taxonomia_mercado(tipo_passa_no_filtro('Moto', $filtroOutros), 'tipo de outros aparece em outros');
confirma_taxonomia_mercado(!tipo_passa_no_filtro('Carreta', $filtroOutros), 'carreta nao aparece em outros');
confirma_taxonomia_mercado(!tipo_passa_no_filtro('Implementos-agricolas', $filtroOutros), 'implemento agricola nao aparece em outros');
foreach (oper_taxonomia_tipo_categoria() as $tipo => $categoria) {
    foreach (array_keys(oper_taxonomia_tipos_por_categoria()) as $candidata) {
        confirma_taxonomia_mercado(
            tipo_passa_no_filtro($tipo, oper_taxonomia_filtro_categoria($candidata)) === ($candidata === $categoria),
            "tipo $tipo so pertence a sua categoria ($candidata)"
        );
    }
}
// SQL: categorias fechadas usam IN; 'outros' e o complemento e tambem inclui anuncio sem tipo (NULL).
confirma_taxonomia_mercado(oper_taxonomia_sql_categoria('a.tipo', oper_taxonomia_filtro_categoria('caminhoes'), '?') === 'a.tipo IN (?)', 'sql categoria fechada usa IN');
confirma_taxonomia_mercado(oper_taxonomia_sql_categoria('a.tipo', $filtroOutros, '?,?') === '(a.tipo IS NULL OR a.tipo NOT IN (?,?))', 'sql outros e complemento com NULL');
foreach (['Aviao', 'Sementes'] as $naoMapeado) {
    $donas = array_filter(array_keys(oper_taxonomia_tipos_por_categoria()), fn($cat) => tipo_passa_no_filtro($naoMapeado, oper_taxonomia_filtro_categoria($cat)));
    confirma_taxonomia_mercado(array_values($donas) === ['outros'], "$naoMapeado pertence so a outros");
}

echo "market_taxonomy_test=OK\n";
