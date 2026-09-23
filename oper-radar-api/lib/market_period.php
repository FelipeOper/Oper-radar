<?php
/** Contrato unico das janelas temporais usadas nas analises de mercado. */

function mercado_periodos_suportados(): array {
    return [
        '7d' => ['dias' => 7, 'rotulo' => '7 dias'],
        '30d' => ['dias' => 30, 'rotulo' => '30 dias'],
        '90d' => ['dias' => 90, 'rotulo' => '90 dias'],
        '180d' => ['dias' => 180, 'rotulo' => '180 dias'],
        '12m' => ['dias' => 365, 'rotulo' => '12 meses'],
    ];
}

/** Normaliza o valor recebido do frontend por whitelist. */
function mercado_periodo($valor, string $padrao = '30d'): array {
    $periodos = mercado_periodos_suportados();
    $chave = strtolower(trim((string)$valor));
    if (!isset($periodos[$chave])) {
        $chave = isset($periodos[$padrao]) ? $padrao : '30d';
    }
    return ['codigo' => $chave] + $periodos[$chave];
}

function oper_periodos_suportados(): array {
    return mercado_periodos_suportados();
}

function oper_periodo_contrato($valor, string $padrao = '30d'): array {
    return mercado_periodo($valor, $padrao);
}
