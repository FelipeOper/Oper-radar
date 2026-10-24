<?php
/**
 * Escopo de setor para os KPIs: por padrao so o que o produto acompanha de perto (caminhoes + carretas/implementos
 * rodoviarios); agro, construcao, leves etc. ficam fora da conta e aparecem separados em por_setor.
 */
require_once __DIR__ . '/market_taxonomy.php';

/** Setores aceitos em ?setor= : 'principal' (padrao), 'todos' ou uma categoria da taxonomia. Valor desconhecido cai no padrao. */
function oper_escopo_setor(?string $pedido): string {
    $pedido = strtolower(trim((string)$pedido));
    if ($pedido === 'todos' || $pedido === 'principal') return $pedido;
    return oper_taxonomia_filtro_categoria($pedido) ? $pedido : 'principal';
}

/** Condicao SQL (sem AND inicial) do escopo, ou '' quando o escopo e 'todos'. $coluna e literal do codigo (ex.: 'a.tipo'). */
function oper_escopo_sql(string $escopo, string $coluna = 'tipo'): string {
    if ($escopo === 'todos') return '';
    if ($escopo === 'principal') {
        $filtro = ['operador' => 'IN', 'tipos' => oper_taxonomia_tipos_por_mercado()['principal']];
    } else {
        $filtro = oper_taxonomia_filtro_categoria($escopo);
        if (!$filtro) return '';
    }
    // Os tipos vem de constantes do codigo (market_taxonomy.php), nunca da requisicao.
    $literais = implode(',', array_map(fn($t) => "'" . str_replace("'", "''", $t) . "'", $filtro['tipos']));
    return oper_taxonomia_sql_categoria($coluna, $filtro, $literais);
}

/** Soma contagens por tipo em contagens por setor. $linhas: [['tipo' => 'Trator', 'n' => 10], ...]. NULL e tipo fora do mapa vao para 'outros'. */
function oper_contagem_por_setor(array $linhas): array {
    $setores = [];
    foreach ($linhas as $linha) {
        $setor = oper_taxonomia_categoria_de_tipo($linha['tipo'] ?? '');
        $setores[$setor] = ($setores[$setor] ?? 0) + (int)$linha['n'];
    }
    arsort($setores);
    return $setores;
}
