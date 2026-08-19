<?php
/** Regras puras do Insight regional; não consulta o banco nem presume venda. */

const OPER_INSIGHT_PESOS = [
    'movimento' => 30,
    'concorrencia' => 20,
    'tempo_saida' => 20,
    'preco' => 15,
    'qualidade' => 15,
];

function oper_insight_limita_indice($valor): float {
    return max(0.0, min(100.0, (float)$valor));
}

function oper_insight_confianca(array $metricas): array {
    $comparaveis = (int)($metricas['comparaveis'] ?? 0);
    $revendas = (int)($metricas['revendas'] ?? 0);
    $saidas = (int)($metricas['saidas_observadas'] ?? 0);
    $cobertura = (int)($metricas['cobertura_dias'] ?? 0);
    $eventosConfiaveis = !empty($metricas['eventos_confiaveis']);

    if ($comparaveis < 5 || !$eventosConfiaveis) {
        return ['nivel' => 'insuficiente', 'publicavel' => false,
                'motivo' => $comparaveis < 5 ? 'menos de 5 comparáveis' : 'histórico de eventos incompleto'];
    }
    if ($comparaveis >= 30 && $revendas >= 5 && $saidas >= 10 && $cobertura >= 90) {
        return ['nivel' => 'alta', 'publicavel' => true, 'motivo' => 'amostra ampla e cobertura contínua'];
    }
    if ($comparaveis >= 10 && $revendas >= 3 && $saidas >= 3 && $cobertura >= 30) {
        return ['nivel' => 'media', 'publicavel' => true, 'motivo' => 'amostra suficiente com cobertura regional'];
    }
    return ['nivel' => 'baixa', 'publicavel' => true, 'motivo' => 'amostra limitada; interpretar com cautela'];
}

function oper_insight_pontuacao(array $componentes, array $confianca): array {
    $detalhes = [];
    $total = 0.0;
    foreach (OPER_INSIGHT_PESOS as $nome => $peso) {
        $indice = oper_insight_limita_indice($componentes[$nome] ?? 0);
        $contribuicao = $indice * $peso / 100;
        $detalhes[$nome] = [
            'indice' => round($indice, 1),
            'peso' => $peso,
            'contribuicao' => round($contribuicao, 1),
        ];
        $total += $contribuicao;
    }
    return [
        'pontuacao' => round($total, 1),
        'publicavel' => !empty($confianca['publicavel']),
        'confianca' => $confianca['nivel'] ?? 'insuficiente',
        'componentes' => $detalhes,
    ];
}
