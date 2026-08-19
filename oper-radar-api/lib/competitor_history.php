<?php
/** Regras puras para resumir histórico observado de concorrentes. */

function oper_mediana_numerica(array $valores): ?float {
    $numericos = array_values(array_filter(array_map(
        fn($valor) => is_numeric($valor) ? (float)$valor : null,
        $valores
    ), fn($valor) => $valor !== null));
    if (!$numericos) return null;
    sort($numericos, SORT_NUMERIC);
    $n = count($numericos);
    $meio = intdiv($n, 2);
    return $n % 2 ? $numericos[$meio] : ($numericos[$meio - 1] + $numericos[$meio]) / 2;
}

function oper_concorrente_confianca(bool $eventosDisponiveis, int $coberturaDias, int $saidas): array {
    if (!$eventosDisponiveis) {
        return [
            'nivel' => 'parcial',
            'motivo' => 'histórico de eventos ainda não materializado; usando o status atual',
        ];
    }
    if ($coberturaDias >= 90 && $saidas >= 10) {
        return ['nivel' => 'alta', 'motivo' => '90+ dias de eventos e saídas observadas suficientes'];
    }
    if ($coberturaDias >= 30 && $saidas >= 3) {
        return ['nivel' => 'media', 'motivo' => '30+ dias de eventos com movimento observável'];
    }
    return ['nivel' => 'baixa', 'motivo' => 'histórico recente ou poucas saídas observadas'];
}
