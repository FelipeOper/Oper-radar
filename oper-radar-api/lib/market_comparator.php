<?php
/** Regras puras do comparador bilateral de caminhões. */

function comparador_texto($valor): ?string {
    $texto = strtoupper(trim((string)$valor));
    return $texto === '' ? null : $texto;
}

function comparador_seletor(array $fonte, string $prefixo): ?array {
    $modo = (string)($fonte[$prefixo . '_modo'] ?? 'marca_modelo');
    if (!in_array($modo, ['marca', 'modelo', 'marca_modelo'], true)) return null;
    $marca = comparador_texto($fonte[$prefixo . '_marca'] ?? null);
    $modelo = comparador_texto($fonte[$prefixo . '_modelo'] ?? null);
    $ano = filter_var($fonte[$prefixo . '_ano'] ?? null, FILTER_VALIDATE_INT, [
        'options' => ['min_range' => 1950, 'max_range' => ((int)date('Y') + 2)],
    ]);
    if ($modo === 'marca') $modelo = null;
    if ($modo === 'modelo') $marca = null;
    if (!$ano || ($modo === 'marca' && !$marca) || ($modo === 'modelo' && !$modelo)
        || ($modo === 'marca_modelo' && (!$marca || !$modelo))) return null;
    return ['modo' => $modo, 'marca' => $marca, 'modelo' => $modelo, 'ano' => (int)$ano];
}

function comparador_condicao(array $seletor, string $alias = 'a'): array {
    $where = ["$alias.tipo='Caminhao'"];
    $params = [];
    $types = '';
    if ($seletor['marca']) {
        $where[] = "UPPER(TRIM(COALESCE($alias.marca,'')))=?";
        $params[] = $seletor['marca'];
        $types .= 's';
    }
    if ($seletor['modelo']) {
        $where[] = "UPPER(TRIM(COALESCE($alias.modelo,'')))=?";
        $params[] = $seletor['modelo'];
        $types .= 's';
    }
    $where[] = "COALESCE($alias.ano_final,$alias.ano_inicial)=?";
    $params[] = (int)$seletor['ano'];
    $types .= 'i';
    return [implode(' AND ', $where), $types, $params];
}

function comparador_rotulo(array $seletor): string {
    if ($seletor['marca'] && $seletor['modelo']) {
        $prefixo = $seletor['marca'] . ' ';
        $rotulo = str_starts_with($seletor['modelo'], $prefixo)
            ? $seletor['modelo']
            : $seletor['marca'] . ' ' . $seletor['modelo'];
        return $rotulo . ' · ' . $seletor['ano'];
    }
    return (string)($seletor['marca'] ?: $seletor['modelo']) . ' · ' . $seletor['ano'];
}

function comparador_resumo(array $registros, int $saidas30d): array {
    $stats = mercado_calcula_estatisticas($registros);
    $revendas = [];
    $ufs = [];
    $dias = [];
    $entradas = 0;
    $modelos = [];
    foreach ($registros as $item) {
        if (!empty($item['revenda_id'])) $revendas[(int)$item['revenda_id']] = true;
        if (!empty($item['uf'])) $ufs[(string)$item['uf']] = true;
        if (isset($item['dias_observados'])) $dias[] = (int)$item['dias_observados'];
        if (!empty($item['entrada_30d'])) $entradas++;
        $modelo = trim((string)($item['modelo'] ?? ''));
        if ($modelo !== '') $modelos[$modelo] = ($modelos[$modelo] ?? 0) + 1;
    }
    arsort($modelos);
    $topModelos = [];
    foreach (array_slice($modelos, 0, 8, true) as $modelo => $n) {
        $topModelos[] = ['modelo' => $modelo, 'anuncios' => $n];
    }
    return [
        'ativos' => count($registros),
        'revendas' => count($revendas),
        'ufs' => count($ufs),
        'entradas_30d' => $entradas,
        'saidas_30d' => $saidas30d,
        'dias_observados_media' => $dias ? round(array_sum($dias) / count($dias), 1) : null,
        'precos' => [
            'amostra_total' => $stats['amostra_total'],
            'amostra_qualificada' => $stats['amostra_qualificada'],
            'confianca' => $stats['confianca'],
            'media' => $stats['media'], 'mediana' => $stats['mediana'],
            'p25' => $stats['p25'], 'p75' => $stats['p75'],
            'menor' => $stats['menor'], 'maior' => $stats['maior'],
            'excluidos' => $stats['excluidos'],
        ],
        'top_modelos' => $topModelos,
    ];
}

function comparador_diferenca($a, $b): ?float {
    $base = (float)$b;
    if ($a === null || $b === null || $base == 0.0) return null;
    return round(((float)$a - $base) / $base * 100, 1);
}
