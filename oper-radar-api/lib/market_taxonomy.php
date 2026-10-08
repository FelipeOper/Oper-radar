<?php
/** Taxonomia de mercado compartilhada pelas APIs de busca e facetas. */

function oper_taxonomia_tipo_categoria(): array {
    return [
        'Caminhao' => 'caminhoes',
        // Implementos rodoviarios: 'Carreta' e o tipo real da coleta (3,8 mil anuncios ativos em 24/09/2026);
        // 'Implemento' e mantido por compatibilidade. Implemento agricola NAO entra aqui.
        'Implemento' => 'implementos', 'Carreta' => 'implementos',
        'Carroceria-sobre-chassi' => 'implementos', 'Trailer' => 'implementos',
        'Onibus' => 'onibus_vans', 'Micro-onibus' => 'onibus_vans',
        'Vans' => 'onibus_vans', 'Motorhome' => 'onibus_vans',
        'Carro' => 'leves', 'Utilitarios' => 'leves',
        'Trator' => 'agricolas', 'Trator-esteira' => 'agricolas',
        'Micro-trator' => 'agricolas', 'Plantadeira' => 'agricolas',
        'Colheitadeira' => 'agricolas', 'Plataforma-colheitadeira' => 'agricolas',
        'Pulverizador' => 'agricolas', 'Semeadeira' => 'agricolas',
        'Distribuidor-autopropelido' => 'agricolas', 'Forragem-e-feno' => 'agricolas',
        'Florestal' => 'agricolas', 'Implementos-agricolas' => 'agricolas',
        'Pa-carregadeira' => 'construcao', 'Escavadeira' => 'construcao',
        'Retro-escavadeira' => 'construcao', 'Motoniveladora' => 'construcao',
        'Rolo-compactador' => 'construcao', 'Guindaste' => 'construcao',
        'Mini-carregadeira' => 'construcao', 'Auto-carregavel' => 'construcao',
        'Mini-escavadeira' => 'construcao', 'Empilhadeira' => 'construcao',
        'Plataforma-elevatoria' => 'construcao', 'Maquinas' => 'construcao',
        'Equipamentos' => 'construcao',
        'Pecas-a-venda' => 'pecas',
        'Moto' => 'outros', 'Imoveis' => 'outros',
        'Quadriciclo' => 'outros', 'Nautico' => 'outros',
    ];
}

function oper_taxonomia_tipos_por_categoria(): array {
    $categorias = [
        'caminhoes' => [], 'implementos' => [], 'onibus_vans' => [], 'leves' => [],
        'agricolas' => [], 'construcao' => [], 'pecas' => [], 'outros' => [],
    ];
    foreach (oper_taxonomia_tipo_categoria() as $tipo => $categoria) {
        $categorias[$categoria][] = $tipo;
    }
    return $categorias;
}

/**
 * Filtro de tipo para uma categoria. 'outros' e o COMPLEMENTO das demais categorias: tipo que aparece no
 * banco mas nao esta no mapa (ex.: Aviao, Sementes) cai em 'outros' tambem ao abrir a categoria, igual a
 * contagem da faceta. Devolve ['operador' => 'IN'|'NOT IN', 'tipos' => [...]]. 'outros' inclui tipo NULL
 * (anuncio sem tipo), como a contagem por UF e o mercado 'outros' ja faziam; use oper_taxonomia_sql_categoria().
 */
function oper_taxonomia_filtro_categoria(string $categoria): ?array {
    $categorias = oper_taxonomia_tipos_por_categoria();
    if (!isset($categorias[$categoria])) return null;
    if ($categoria !== 'outros') return ['operador' => 'IN', 'tipos' => $categorias[$categoria]];
    $conhecidos = [];
    foreach ($categorias as $nome => $tipos) {
        if ($nome !== 'outros') $conhecidos = array_merge($conhecidos, $tipos);
    }
    return ['operador' => 'NOT IN', 'tipos' => $conhecidos];
}

/** Condicao SQL de tipo para um filtro de categoria. $coluna e literal do codigo (ex.: 'a.tipo'), $ph os '?' ou literais. */
function oper_taxonomia_sql_categoria(string $coluna, array $filtro, string $ph): string {
    if ($filtro['operador'] === 'IN') return "$coluna IN ($ph)";
    return "($coluna IS NULL OR $coluna NOT IN ($ph))";
}

function oper_taxonomia_tipos_por_mercado(): array {
    $categorias = oper_taxonomia_tipos_por_categoria();
    $principal = array_merge($categorias['caminhoes'], $categorias['implementos']);
    $outros = [];
    foreach ($categorias as $categoria => $tipos) {
        if (in_array($categoria, ['caminhoes', 'implementos'], true)) continue;
        $outros = array_merge($outros, $tipos);
    }
    return ['principal' => $principal, 'outros' => $outros];
}

function oper_taxonomia_categoria_de_tipo($tipo): string {
    return oper_taxonomia_tipo_categoria()[(string)$tipo] ?? 'outros';
}

function oper_taxonomia_filtros_por_categoria(): array {
    return [
        'todas' => ['marca'],
        'caminhoes' => ['tipo', 'marca', 'carroceria', 'tracao', 'fipe'],
        'implementos' => ['tipo', 'marca', 'carroceria'],
        'onibus_vans' => ['tipo', 'marca', 'carroceria'],
        'leves' => ['tipo', 'marca', 'carroceria'],
        'agricolas' => ['tipo', 'marca'], 'construcao' => ['tipo', 'marca'],
        'pecas' => ['tipo', 'marca'], 'outros' => ['tipo', 'marca'],
    ];
}
