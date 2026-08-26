<?php
/** Taxonomia de mercado compartilhada pelas APIs de busca e facetas. */

function oper_taxonomia_tipo_categoria(): array {
    return [
        'Caminhao' => 'caminhoes',
        'Implemento' => 'implementos', 'Carroceria-sobre-chassi' => 'implementos',
        'Trailer' => 'implementos',
        'Onibus' => 'onibus_vans', 'Micro-onibus' => 'onibus_vans',
        'Vans' => 'onibus_vans', 'Motorhome' => 'onibus_vans',
        'Carro' => 'leves', 'Utilitarios' => 'leves',
        'Trator' => 'agricolas', 'Trator-esteira' => 'agricolas',
        'Micro-trator' => 'agricolas', 'Plantadeira' => 'agricolas',
        'Colheitadeira' => 'agricolas', 'Plataforma-colheitadeira' => 'agricolas',
        'Pulverizador' => 'agricolas', 'Semeadeira' => 'agricolas',
        'Distribuidor-autopropelido' => 'agricolas', 'Forragem-e-feno' => 'agricolas',
        'Florestal' => 'agricolas',
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
