<?php
/**
 * Orientação de venda para UM veículo do estoque próprio (Minha Loja): manter preço, avaliar redução ou
 * avaliar outra praça. Decisão do Felipe (28/09/2026, retomando a conversa com o Orquestrador-GPT): o Oper
 * Radar é ferramenta estratégica pra vender melhor o PRÓPRIO estoque — não pra achar caminhão pra comprar.
 * "Onde há mais liquidez" só interessa se vira decisão sobre o preço ou a praça do veículo que já é meu.
 *
 * Regra fail-closed: sem amostra mínima (5) na praça usada como base, não decide — 'sem_base'. Saída
 * observada não é venda; a orientação nunca promete resultado, só aponta onde a evidência empurra.
 */
require_once __DIR__ . '/market_quality.php';

const OPER_ORIENTACAO_CORTE_PCT = 5.0; // mesmo corte de "acima do mercado" já usado em minhaLojaModel.js/comprarModel.js

/**
 * @param array      $item        do meu_estoque: preco_anunciado, uf
 * @param array|null $nacional    bloco 'mercado_nacional' de minha_loja_detalhe.php (ou null)
 * @param array      $regioes     lista 'regioes' de minha_loja_detalhe.php (cada uma com uf, comparaveis, preco_mediano, avaliacao.publicavel)
 * @param array|null $melhorRegiao 'melhor_regiao_observada' (ou null)
 */
function oper_loja_orienta_veiculo(array $item, ?array $nacional, array $regioes, ?array $melhorRegiao): array {
    $preco = (float)($item['preco_anunciado'] ?? 0);
    if ($preco <= 0) {
        return ['acao' => 'sem_base', 'motivo' => 'Informe o preço anunciado para orientar a venda deste veículo.'];
    }

    $ufItem = strtoupper((string)($item['uf'] ?? ''));
    $propriaPraca = null;
    foreach ($regioes as $regiao) {
        if (($regiao['uf'] ?? null) === $ufItem) { $propriaPraca = $regiao; break; }
    }

    $base = null;
    $origemBase = null;
    if ($propriaPraca !== null && (int)($propriaPraca['comparaveis'] ?? 0) >= OPER_RADAR_AMOSTRA_MINIMA && (float)($propriaPraca['preco_mediano'] ?? 0) > 0) {
        $base = $propriaPraca;
        $origemBase = 'propria_praca';
    } elseif ($nacional !== null && !empty($nacional['amostra_suficiente']) && (float)($nacional['preco_mediano'] ?? 0) > 0) {
        $base = $nacional;
        $origemBase = 'nacional';
    } else {
        return ['acao' => 'sem_base', 'motivo' => 'Amostra insuficiente na sua praça e no Brasil para orientar o preço deste veículo.'];
    }

    $desvio = round(($preco / (float)$base['preco_mediano'] - 1) * 100, 1);
    $baseTexto = $origemBase === 'nacional' ? 'mediana nacional' : 'mediana da sua praça';

    if (abs($desvio) < OPER_ORIENTACAO_CORTE_PCT) {
        return [
            'acao' => 'manter', 'origem_base' => $origemBase, 'desvio_pct' => $desvio,
            'motivo' => "Preço dentro da faixa competitiva da {$baseTexto} ({$desvio}%).",
        ];
    }

    if ($desvio < 0) {
        return [
            'acao' => 'manter', 'origem_base' => $origemBase, 'desvio_pct' => $desvio,
            'motivo' => "Preço já {$desvio}% abaixo da {$baseTexto}; posição competitiva.",
        ];
    }

    // Acima da faixa: só sugere outra praça se ela for de fato diferente, publicável e sustentar um preço
    // próximo do atual — senão a recomendação certa é revisar o preço, não mudar de lugar.
    $melhorOutraPraca = ($melhorRegiao !== null && ($melhorRegiao['uf'] ?? null) !== $ufItem && !empty($melhorRegiao['avaliacao']['publicavel']))
        ? $melhorRegiao : null;
    if ($melhorOutraPraca !== null && (float)($melhorOutraPraca['preco_mediano'] ?? 0) >= $preco * (1 - OPER_ORIENTACAO_CORTE_PCT / 100)) {
        return [
            'acao' => 'avaliar_outra_praca', 'origem_base' => $origemBase, 'desvio_pct' => $desvio, 'uf_sugerida' => $melhorOutraPraca['uf'],
            'motivo' => "Preço {$desvio}% acima da {$baseTexto}; {$melhorOutraPraca['uf']} sustenta preço mais próximo do seu, com melhor movimento observado.",
        ];
    }

    return [
        'acao' => 'avaliar_reducao', 'origem_base' => $origemBase, 'desvio_pct' => $desvio,
        'motivo' => "Preço {$desvio}% acima da {$baseTexto}.",
    ];
}
