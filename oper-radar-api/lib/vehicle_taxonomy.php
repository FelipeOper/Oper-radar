<?php
/** Normalizações compartilhadas de atributos coletados do veículo. */

function oper_tracao_normalizada($valor): ?string {
    $texto = trim((string)$valor);
    if (!preg_match('/(?:^|[^0-9])(\d{1,2})\s*[x×]\s*(\d{1,2})(?:[^0-9]|$)/iu', $texto, $partes)) {
        return null;
    }
    return (int)$partes[1] . 'x' . (int)$partes[2];
}

function oper_tracao_regexp($valor): ?string {
    $normalizada = oper_tracao_normalizada($valor);
    if ($normalizada === null) return null;
    [$primeiro, $segundo] = array_map('intval', explode('x', $normalizada));
    return '(^|[^0-9])' . $primeiro
        . '[[:space:]]*X[[:space:]]*' . $segundo . '([^0-9]|$)';
}
