<?php
/**
 * "O que comprar" por região, em duas camadas (docs/oper-radar-redesign/ANUNCIO_IDEAL_POR_REGIAO.md):
 *  1. por UF, os modelos (marca + modelo + ano-modelo) com melhor índice regional (lib/regional_modelo.php);
 *  2. dentro de cada um, os anúncios candidatos da UF, com pontuação explicável.
 *
 * Lógica pura: não consulta o banco. Sem 5 preços válidos, sem histórico suficiente ou com preço fora da faixa esperada
 * não há pontuação. Preço é anunciado, não de venda; redução de preço e tempo observado são sinais, nunca prova de
 * disposição para negociar. Nunca chama nada de "ideal": são candidatos à negociação.
 */
require_once __DIR__ . '/market_quality.php';
require_once __DIR__ . '/regional_modelo.php';

const OPER_COMPRA_PESOS = [
    'preco_mediana' => 35,
    'preco_fipe' => 20,
    'negociacao' => 20,
    'liquidez' => 15,
    'qualidade' => 10,
];
const OPER_COMPRA_MIN_ANUNCIOS_GRUPO = 10; // grupos menores no Brasil inteiro nem entram no ranking

function oper_compra_clamp($valor): float {
    return max(0.0, min(100.0, (float)$valor));
}

function oper_compra_chave_grupo(array $a): string {
    return strtoupper(trim((string)($a['marca'] ?? ''))) . "\0" . strtoupper(trim((string)($a['modelo'] ?? ''))) . "\0" . (int)($a['ano'] ?? 0);
}

/** Dias desde a primeira observação pelo Radar (não é a data de publicação). */
function oper_compra_dias_observados(array $a, ?DateTimeImmutable $agora = null): ?int {
    $inicio = trim((string)($a['primeira_vez_visto'] ?? ''));
    if ($inicio === '') return null;
    try {
        $ts = new DateTimeImmutable($inicio);
    } catch (Throwable $e) {
        return null;
    }
    $agora = $agora ?: new DateTimeImmutable('now');
    return max(0, (int)floor(($agora->getTimestamp() - $ts->getTimestamp()) / 86400));
}

/** A FIPE serve de referência para este anúncio? Mesmas regras do desvio agregado (ano, carroceria, tipo) e vínculo confiável. */
function oper_compra_fipe_utilizavel(array $a): bool {
    return (float)($a['preco_fipe'] ?? 0) > 0
        && ($a['fipe_match_confianca'] ?? null) === 'alto'
        && mercado_ano_comparavel_fipe($a)
        && mercado_carroceria_comparavel_fipe($a)
        && mercado_tipo_comparavel_fipe($a);
}

/**
 * Pontua UM anúncio dentro da praça (UF) do seu modelo.
 * @param float|null $medianaUf  mediana qualificada do mesmo modelo/ano na UF (null = sem base)
 * @param float      $liquidez   pontuação regional do modelo (0-100)
 * @return array{elegivel:bool, motivo?:string, pontuacao?:float, componentes?:array, desvio_mediana_pct?:float, desvio_fipe_pct?:?float}
 */
function oper_compra_pontua_anuncio(array $a, ?float $medianaUf, float $liquidez, ?DateTimeImmutable $agora = null): array {
    $fipeUtil = oper_compra_fipe_utilizavel($a);
    // Mesma qualificação de preço do resto do produto (sem preço, condição comercial especial, fora de 35–250% da FIPE).
    $motivo = mercado_motivo_preco($a['preco'] ?? null, $a['preco_fipe'] ?? null, (string)($a['titulo'] ?? ''), (string)($a['preco_texto_bruto'] ?? ''));
    if ($motivo !== null) return ['elegivel' => false, 'motivo' => $motivo];
    if ($medianaUf === null || $medianaUf <= 0) return ['elegivel' => false, 'motivo' => 'sem mediana regional com amostra suficiente'];

    $preco = (float)$a['preco'];
    $desvioMediana = ($preco / $medianaUf - 1) * 100;
    $desvioFipe = $fipeUtil ? ($preco / (float)$a['preco_fipe'] - 1) * 100 : null;
    $dias = oper_compra_dias_observados($a, $agora);
    $reduziu = !empty($a['reduziu_30d']);

    $componentes = [
        // 100 com 15% ou mais abaixo da mediana da praça; 0 com 5% ou mais acima.
        'preco_mediana' => oper_compra_clamp((5 - $desvioMediana) / 20 * 100),
        'preco_fipe' => $desvioFipe === null ? null : oper_compra_clamp((10 - $desvioFipe) / 25 * 100),
        // Sinal: redução recente pesa 60; tempo observado até 90 dias pesa até 40. Não é prova de disposição.
        'negociacao' => oper_compra_clamp(($reduziu ? 60 : 0) + ($dias === null ? 0 : min(90, $dias) / 90 * 40)),
        'liquidez' => oper_compra_clamp($liquidez),
        'qualidade' => oper_compra_clamp(($fipeUtil ? 100 : 60)),
    ];

    // Sem FIPE utilizável, o peso dela é redistribuído (não punimos nem premiamos); a tela mostra quais componentes entraram.
    $pesoTotal = 0.0;
    $soma = 0.0;
    $detalhe = [];
    foreach (OPER_COMPRA_PESOS as $nome => $peso) {
        $indice = $componentes[$nome];
        if ($indice === null) { $detalhe[$nome] = ['indice' => null, 'peso' => 0]; continue; }
        $pesoTotal += $peso;
        $soma += $indice * $peso;
        $detalhe[$nome] = ['indice' => round($indice, 1), 'peso' => $peso];
    }
    foreach ($detalhe as $nome => &$d) {
        if ($d['indice'] !== null && $pesoTotal > 0) $d['peso'] = round($d['peso'] / $pesoTotal * 100, 1);
    }
    unset($d);

    return [
        'elegivel' => true,
        'pontuacao' => $pesoTotal > 0 ? round($soma / $pesoTotal, 1) : 0.0,
        'componentes' => $detalhe,
        'desvio_mediana_pct' => round($desvioMediana, 1),
        'desvio_fipe_pct' => $desvioFipe === null ? null : round($desvioFipe, 1),
        'dias_observados' => $dias,
        'reduziu_30d' => $reduziu,
    ];
}

/**
 * Monta as duas camadas.
 * @param array $anuncios ativos do universo Pesado (tipo Caminhao): id, url, titulo, marca, modelo, ano, preco, preco_texto_bruto,
 *                        carroceria, tipo, preco_fipe, fipe_match_confianca, revenda_id, revenda, cidade, uf, primeira_vez_visto, reduziu_30d
 * @param array $saidasPorGrupoUf  chave_grupo => uf => [dias observados até a saída, ...]
 * @param array $opcoes ufs (lista ou vazio = todas), modelos_por_uf, anuncios_por_modelo
 */
function oper_compra_monta(array $anuncios, array $saidasPorGrupoUf, bool $eventosDisponiveis, int $coberturaDias, array $opcoes = [], ?DateTimeImmutable $agora = null): array {
    $modelosPorUf = max(1, min(10, (int)($opcoes['modelos_por_uf'] ?? 3)));
    $anunciosPorModelo = max(1, min(20, (int)($opcoes['anuncios_por_modelo'] ?? 5)));
    $ufsPedidas = array_map('strtoupper', (array)($opcoes['ufs'] ?? []));

    $grupos = [];
    foreach ($anuncios as $a) {
        $uf = strtoupper((string)($a['uf'] ?? ''));
        if (!preg_match('/^[A-Z]{2}$/', $uf) || (int)($a['ano'] ?? 0) <= 0 || trim((string)($a['modelo'] ?? '')) === '') continue;
        $a['uf'] = $uf;
        $grupos[oper_compra_chave_grupo($a)]['por_uf'][$uf][] = $a;
        $grupos[oper_compra_chave_grupo($a)]['total'] = ($grupos[oper_compra_chave_grupo($a)]['total'] ?? 0) + 1;
    }

    $candidatos = []; // uf => [ [pontuacao, dados do modelo], ... ]
    foreach ($grupos as $chave => $grupo) {
        if ($grupo['total'] < OPER_COMPRA_MIN_ANUNCIOS_GRUPO) continue;
        $porUf = $ufsPedidas ? array_intersect_key($grupo['por_uf'], array_flip($ufsPedidas)) : $grupo['por_uf'];
        // O índice compara as praças do MESMO modelo; recortar UFs só depois de calculá-lo, para não distorcer a normalização.
        $regionais = oper_regioes_do_modelo($grupo['por_uf'], $saidasPorGrupoUf[$chave] ?? [], $eventosDisponiveis, $coberturaDias);
        foreach ($regionais['regioes'] as $regiao) {
            if (empty($regiao['avaliacao']['publicavel']) || !isset($porUf[$regiao['uf']])) continue;
            $candidatos[$regiao['uf']][] = ['chave' => $chave, 'regiao' => $regiao, 'anuncios' => $porUf[$regiao['uf']]];
        }
    }

    $saida = [];
    foreach ($candidatos as $uf => $lista) {
        usort($lista, fn($x, $y) => (float)$y['regiao']['avaliacao']['pontuacao'] <=> (float)$x['regiao']['avaliacao']['pontuacao']);
        $modelos = [];
        foreach ($lista as $item) {
            $r = $item['regiao'];
            $pontuados = [];
            foreach ($item['anuncios'] as $a) {
                $p = oper_compra_pontua_anuncio($a, $r['preco_mediano'] !== null ? (float)$r['preco_mediano'] : null, (float)$r['avaliacao']['pontuacao'], $agora);
                if (empty($p['elegivel'])) continue;
                $pontuados[] = [
                    'anuncio_id' => (int)($a['id'] ?? 0), 'url' => $a['url'] ?? null, 'titulo' => $a['titulo'] ?? null,
                    'preco' => (float)$a['preco'], 'cidade' => $a['cidade'] ?? null, 'uf' => $uf, 'revenda' => $a['revenda'] ?? null,
                    'pontuacao' => $p['pontuacao'], 'componentes' => $p['componentes'],
                    'desvio_mediana_pct' => $p['desvio_mediana_pct'], 'desvio_fipe_pct' => $p['desvio_fipe_pct'],
                    'dias_observados' => $p['dias_observados'], 'reduziu_30d' => $p['reduziu_30d'],
                ];
            }
            if (!$pontuados) continue; // modelo sem nenhum anúncio elegível não vira recomendação
            usort($pontuados, fn($x, $y) => [$y['pontuacao'], $x['preco']] <=> [$x['pontuacao'], $y['preco']]);
            $primeiro = $item['anuncios'][0];
            $modelos[] = [
                'marca' => $primeiro['marca'], 'modelo' => $primeiro['modelo'], 'ano' => (int)$primeiro['ano'],
                'indice' => $r['avaliacao'],
                'mediana_uf' => $r['preco_mediano'], 'comparaveis' => $r['comparaveis'], 'revendas' => $r['revendas'],
                'saidas_observadas' => $r['saidas_observadas'], 'texto' => $r['texto'],
                'anuncios' => array_slice($pontuados, 0, $anunciosPorModelo),
                'anuncios_elegiveis' => count($pontuados),
            ];
            if (count($modelos) >= $modelosPorUf) break;
        }
        if ($modelos) $saida[] = ['uf' => $uf, 'modelos' => $modelos];
    }
    usort($saida, fn($x, $y) => strcmp($x['uf'], $y['uf']));
    return $saida;
}
