<?php
/** Regras puras para comparar o estoque próprio entre regiões observadas. */

function oper_loja_mediana(array $valores): ?float {
    $numeros = array_values(array_map('floatval', array_filter(
        $valores,
        fn($valor) => $valor !== null && is_numeric($valor)
    )));
    if (!$numeros) return null;
    sort($numeros, SORT_NUMERIC);
    $quantidade = count($numeros);
    $meio = intdiv($quantidade, 2);
    return $quantidade % 2
        ? (float)$numeros[$meio]
        : ((float)$numeros[$meio - 1] + (float)$numeros[$meio]) / 2;
}

function oper_loja_indice_relativo($valor, $melhor, bool $menorMelhor = false): float {
    $valor = (float)$valor;
    $melhor = (float)$melhor;
    if ($valor <= 0 || $melhor <= 0) return 0.0;
    $indice = $menorMelhor ? $melhor / $valor : $valor / $melhor;
    return round(max(0.0, min(1.0, $indice)) * 100, 1);
}

/**
 * Converte métricas regionais em componentes comparáveis de 0 a 100.
 * A pontuação é relativa somente às regiões presentes no mesmo recorte FIPE.
 */
function oper_loja_componentes_regionais(array $regioes): array {
    $taxas = [];
    $estoques = [];
    $tempos = [];
    $precos = [];
    foreach ($regioes as $regiao) {
        $ativos = max(0, (int)($regiao['comparaveis'] ?? 0));
        $saidas = max(0, (int)($regiao['saidas_observadas'] ?? 0));
        $taxas[] = $ativos + $saidas > 0 ? $saidas / ($ativos + $saidas) : 0;
        if ($ativos > 0) $estoques[] = $ativos;
        if ((float)($regiao['mediana_dias_saida'] ?? 0) > 0) $tempos[] = (float)$regiao['mediana_dias_saida'];
        if ((float)($regiao['preco_mediano'] ?? 0) > 0) $precos[] = (float)$regiao['preco_mediano'];
    }

    $melhorTaxa = $taxas ? max($taxas) : 0;
    $menorEstoque = $estoques ? min($estoques) : 0;
    $menorTempo = $tempos ? min($tempos) : 0;
    $melhorPreco = $precos ? max($precos) : 0;
    $saida = [];
    foreach ($regioes as $indice => $regiao) {
        $ativos = max(0, (int)($regiao['comparaveis'] ?? 0));
        $saidas = max(0, (int)($regiao['saidas_observadas'] ?? 0));
        $taxa = $ativos + $saidas > 0 ? $saidas / ($ativos + $saidas) : 0;
        $revendas = max(0, (int)($regiao['revendas'] ?? 0));
        $cobertura = max(0, (int)($regiao['cobertura_dias'] ?? 0));
        $qualidade = min(100, ($ativos / 30 * 40) + ($revendas / 5 * 25)
            + ($saidas / 10 * 25) + ($cobertura / 90 * 10));
        $saida[$indice] = [
            'movimento' => oper_loja_indice_relativo($taxa, $melhorTaxa),
            'concorrencia' => oper_loja_indice_relativo($ativos, $menorEstoque, true),
            'tempo_saida' => oper_loja_indice_relativo($regiao['mediana_dias_saida'] ?? 0, $menorTempo, true),
            'preco' => oper_loja_indice_relativo($regiao['preco_mediano'] ?? 0, $melhorPreco),
            'qualidade' => round(max(0, min(100, $qualidade)), 1),
        ];
    }
    return $saida;
}

function oper_loja_texto_regional(array $regiao, array $pontuacao): string {
    $uf = (string)($regiao['uf'] ?? 'Região');
    $comparaveis = (int)($regiao['comparaveis'] ?? 0);
    $saidas = (int)($regiao['saidas_observadas'] ?? 0);
    $preco = $regiao['preco_mediano'] ?? null;
    $confianca = (string)($pontuacao['confianca'] ?? 'insuficiente');
    $textoPreco = $preco !== null
        ? 'preço mediano anunciado de R$ ' . number_format((float)$preco, 0, ',', '.')
        : 'sem mediana de preço segura';
    return "$uf: $comparaveis ofertas comparáveis, $saidas saídas observadas e $textoPreco. Confiança $confianca.";
}
