<?php
/**
 * Oportunidade regional de UM recorte de veículo (marca + modelo + ano-modelo).
 *
 * Reaproveita a regra da Minha Loja (docs/ESPECIFICACAO_INSIGHT_REGIONAL.md): componentes
 * normalizados entre as praças comparadas, pesos 30/20/20/15/15 e confiança pela amostra.
 * Nunca compara categorias diferentes: quem chama entrega só linhas do mesmo recorte.
 * Saída observada não é venda; a região só recebe pontuação publicável com amostra e
 * histórico de eventos suficientes.
 */
require_once __DIR__ . '/market_quality.php';
require_once __DIR__ . '/regional_insight.php';
require_once __DIR__ . '/store_market.php';

/**
 * @param array $linhasPorUf  uf => [registros com preco, preco_fipe, titulo, preco_texto_bruto, revenda_id]
 * @param array $saidasPorUf  uf => [dias observados até a saída (int|null), ...]
 * @param bool  $eventosDisponiveis  a trilha de eventos existe no banco
 * @param int   $coberturaDias       dias cobertos pela trilha para este recorte
 */
function oper_regioes_do_modelo(array $linhasPorUf, array $saidasPorUf, bool $eventosDisponiveis, int $coberturaDias): array {
    $regioes = [];
    foreach ($linhasPorUf as $uf => $linhas) {
        $uf = strtoupper((string)$uf);
        if (!preg_match('/^[A-Z]{2}$/', $uf) || !$linhas) continue;
        $estatisticas = mercado_calcula_estatisticas($linhas);
        $revendas = array_unique(array_map('intval', array_column($linhas, 'revenda_id')));
        $duracoes = $saidasPorUf[$uf] ?? [];
        $regioes[] = [
            'uf' => $uf,
            'comparaveis' => (int)$estatisticas['amostra_qualificada'],
            'amostra_total' => (int)$estatisticas['amostra_total'],
            'revendas' => count($revendas),
            'preco_mediano' => $estatisticas['mediana'],
            'preco_p25' => $estatisticas['p25'],
            'preco_p75' => $estatisticas['p75'],
            'saidas_observadas' => count($duracoes),
            'mediana_dias_saida' => oper_loja_mediana($duracoes),
            'cobertura_dias' => $coberturaDias,
        ];
    }

    $componentes = oper_loja_componentes_regionais($regioes);
    foreach ($regioes as $indice => &$regiao) {
        $confianca = oper_insight_confianca([
            'comparaveis' => $regiao['comparaveis'],
            'revendas' => $regiao['revendas'],
            'saidas_observadas' => $regiao['saidas_observadas'],
            'cobertura_dias' => $regiao['cobertura_dias'],
            'eventos_confiaveis' => $eventosDisponiveis && $coberturaDias >= 7,
        ]);
        $regiao['avaliacao'] = oper_insight_pontuacao($componentes[$indice] ?? [], $confianca);
        $regiao['avaliacao']['motivo_confianca'] = $confianca['motivo'];
        $regiao['texto'] = oper_loja_texto_regional($regiao, $regiao['avaliacao']);
    }
    unset($regiao);

    usort($regioes, function ($a, $b) {
        $publicavel = (!empty($b['avaliacao']['publicavel']) ? 1 : 0) <=> (!empty($a['avaliacao']['publicavel']) ? 1 : 0);
        if ($publicavel !== 0) return $publicavel;
        return (float)$b['avaliacao']['pontuacao'] <=> (float)$a['avaliacao']['pontuacao'];
    });

    $melhor = null;
    foreach ($regioes as $regiao) {
        if (!empty($regiao['avaliacao']['publicavel'])) { $melhor = $regiao['uf']; break; }
    }

    return [
        'regioes' => $regioes,
        'melhor_uf' => $melhor,
        'historico_eventos' => ['disponivel' => $eventosDisponiveis, 'cobertura_dias' => $coberturaDias],
        'nota' => 'Índice comparativo entre as UFs deste modelo e ano. Saída observada não é venda; UFs sem amostra ou histórico suficiente não recebem selo de oportunidade.',
    ];
}
