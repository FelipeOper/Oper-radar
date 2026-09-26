<?php
/** Metricas de revenda calculadas apenas com anuncios ativos e precos qualificados. */
require_once __DIR__ . '/market_quality.php';

function oper_concorrencia_desvio_fipe(array $linhas): array {
    $desvios = [];
    foreach ($linhas as $linha) {
        $fipe = (float)($linha['preco_fipe'] ?? 0);
        if ($fipe <= 0 || in_array($linha['fipe_match_status'] ?? '', ['ambiguo', 'ambigua'], true)) continue;
        if (!mercado_ano_comparavel_fipe($linha)) continue; // modelo antigo: FIPE nao e referencia (F0c)
        if (!mercado_carroceria_comparavel_fipe($linha) || !mercado_tipo_comparavel_fipe($linha)) continue; // implemento no preco; so caminhao (F0d)
        if (mercado_motivo_preco($linha['preco'] ?? null, $fipe,
            (string)($linha['titulo'] ?? ''), (string)($linha['preco_texto_bruto'] ?? '')) !== null) continue;
        $desvios[] = ((float)$linha['preco'] - $fipe) / $fipe * 100;
    }
    $n = count($desvios);
    return [
        'desvio_fipe_mediano_pct' => $n >= OPER_RADAR_AMOSTRA_MINIMA
            ? round(mercado_percentil($desvios, 0.5), 1) : null,
        'desvio_fipe_amostra' => $n,
        'desvio_fipe_confianca' => mercado_confianca($n),
    ];
}
