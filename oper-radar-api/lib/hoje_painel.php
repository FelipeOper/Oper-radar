<?php
/**
 * Regras puras da tela "Hoje": frescor da coleta por UF, feed de movimento e insights
 * com evidência. Nada aqui acessa banco; os endpoints entregam linhas já consultadas.
 *
 * Princípios do produto que estas regras respeitam:
 * - saída observada não é venda; redução de preço é sinal, não prova;
 * - toda métrica destacada carrega evidência (recorte, período, valor, base, amostra,
 *   confiança, atualização, explicação);
 * - sem amostra suficiente, não há insight (número errado é pior que número nenhum).
 */
require_once __DIR__ . '/market_quality.php';

const OPER_HOJE_COLETA_LIMITE_HORAS = 24;
const OPER_HOJE_COBERTURA_MINIMA_PCT = 80;
const OPER_HOJE_PARADO_DIAS = 90;
const OPER_HOJE_INSIGHT_SAIDAS_MIN = 5;
const OPER_HOJE_INSIGHT_PARADOS_MIN = 4;
const OPER_HOJE_INSIGHT_REDUCOES_MIN = 3;
const OPER_HOJE_INSIGHT_ABAIXO_FIPE_PCT = -4.0;

function oper_hoje_horas_desde(?string $quando, DateTimeInterface $agora): ?int {
    if ($quando === null || trim($quando) === '') return null;
    $instante = strtotime($quando);
    if ($instante === false) return null;
    return max(0, intdiv($agora->getTimestamp() - $instante, 3600));
}

/**
 * Frescor da coleta por UF.
 *
 * Cada linha de entrada: uf, revendas (cadastradas com anúncio ativo),
 * revendas_coletadas_24h (com coleta bem-sucedida nas últimas 24 h) e
 * ultima_coleta (última execução bem-sucedida da UF, ou null).
 * Status: em_dia, parcial (dentro do prazo, mas cobertura baixa), atrasada, sem_coleta.
 */
function oper_frescor_coleta(array $ufs, DateTimeInterface $agora, int $limiteHoras = OPER_HOJE_COLETA_LIMITE_HORAS): array {
    $itens = [];
    foreach ($ufs as $linha) {
        $revendas = max(0, (int)($linha['revendas'] ?? 0));
        $coletadas = max(0, min($revendas, (int)($linha['revendas_coletadas_24h'] ?? 0)));
        $horas = oper_hoje_horas_desde($linha['ultima_coleta'] ?? null, $agora);
        $cobertura = $revendas > 0 ? (int)round($coletadas / $revendas * 100) : null;
        if ($horas === null) {
            $status = 'sem_coleta';
        } elseif ($horas > $limiteHoras) {
            $status = 'atrasada';
        } elseif ($cobertura !== null && $cobertura < OPER_HOJE_COBERTURA_MINIMA_PCT) {
            $status = 'parcial';
        } else {
            $status = 'em_dia';
        }
        $itens[] = [
            'uf' => strtoupper((string)($linha['uf'] ?? '')),
            'ultima_coleta' => $linha['ultima_coleta'] ?? null,
            'horas' => $horas,
            'revendas' => $revendas,
            'revendas_coletadas_24h' => $coletadas,
            'cobertura_pct' => $cobertura,
            'status' => $status,
        ];
    }

    $peso = ['sem_coleta' => 0, 'atrasada' => 1, 'parcial' => 2, 'em_dia' => 3];
    usort($itens, function ($a, $b) use ($peso) {
        if ($peso[$a['status']] !== $peso[$b['status']]) return $peso[$a['status']] <=> $peso[$b['status']];
        return ($b['horas'] ?? PHP_INT_MAX) <=> ($a['horas'] ?? PHP_INT_MAX);
    });

    $contagem = ['em_dia' => 0, 'parcial' => 0, 'atrasada' => 0, 'sem_coleta' => 0];
    foreach ($itens as $item) $contagem[$item['status']]++;
    $severidade = ($contagem['atrasada'] + $contagem['sem_coleta']) > 0
        ? 'alta'
        : ($contagem['parcial'] > 0 ? 'media' : 'ok');

    return [
        'limite_horas' => $limiteHoras,
        'resumo' => array_merge(['ufs' => count($itens), 'severidade' => $severidade], $contagem),
        'itens' => $itens,
    ];
}

/**
 * Feed de movimento: entradas, quedas de preço e saídas observadas, do mais recente ao
 * mais antigo. Entradas são limitadas à metade do feed para não esconder os demais sinais.
 *
 * Linhas de entrada: anuncio_id, titulo, marca, modelo, ano, cidade, uf, preco, quando.
 * Reduções trazem também preco_anterior, preco_novo e variacao_pct (negativa = queda).
 */
function oper_hoje_feed(array $novos, array $reducoes, array $saidas, int $limite = 12): array {
    $eventos = [];
    $monta = function (string $tipo, array $linha) {
        return [
            'tipo' => $tipo,
            'anuncio_id' => (int)($linha['anuncio_id'] ?? 0),
            'titulo' => trim((string)($linha['titulo'] ?? '')),
            'marca' => $linha['marca'] ?? null,
            'modelo' => $linha['modelo'] ?? null,
            'ano' => isset($linha['ano']) ? (int)$linha['ano'] : null,
            'cidade' => $linha['cidade'] ?? null,
            'uf' => $linha['uf'] ?? null,
            'preco' => isset($linha['preco']) ? (float)$linha['preco'] : null,
            'preco_anterior' => isset($linha['preco_anterior']) ? (float)$linha['preco_anterior'] : null,
            'preco_novo' => isset($linha['preco_novo']) ? (float)$linha['preco_novo'] : null,
            'variacao_pct' => isset($linha['variacao_pct']) ? (float)$linha['variacao_pct'] : null,
            'quando' => (string)($linha['quando'] ?? ''),
        ];
    };
    foreach ($novos as $linha) $eventos[] = $monta('novo', $linha);
    foreach ($reducoes as $linha) {
        if (isset($linha['variacao_pct']) && (float)$linha['variacao_pct'] >= 0) continue; // só quedas
        $eventos[] = $monta('preco', $linha);
    }
    foreach ($saidas as $linha) $eventos[] = $monta('saida', $linha);

    usort($eventos, fn($a, $b) => (strtotime($b['quando']) ?: 0) <=> (strtotime($a['quando']) ?: 0));

    $limiteNovos = (int)ceil($limite / 2);
    $totalNovos = 0;
    $feed = [];
    foreach ($eventos as $evento) {
        if (count($feed) >= $limite) break;
        if ($evento['tipo'] === 'novo') {
            if ($totalNovos >= $limiteNovos) continue;
            $totalNovos++;
        }
        $feed[] = $evento;
    }
    return $feed;
}

function oper_hoje_brl($valor): string {
    return 'R$ ' . number_format((float)$valor, 0, ',', '.');
}

function oper_hoje_pct($valor): string {
    return number_format(abs((float)$valor), 1, ',', '.') . '%';
}

/**
 * Insights do dia, cada um com evidência. Um insight só existe se passar do mínimo de
 * amostra da sua regra.
 *
 * Contexto: atualizacao (texto), saidas_total, saidas_por_uf[uf,saidas,ativos],
 * parados[marca,modelo,ano,parados,total,revendas],
 * reducoes_revendas[id,nome,cidade,uf,reducoes,ativos],
 * abaixo_fipe[marca,modelo,ano,mediana,fipe,amostra,revendas].
 */
function oper_hoje_insights(array $ctx, int $maximo = 4): array {
    $atualizacao = (string)($ctx['atualizacao'] ?? '');
    $insights = [];

    // 1) Onde as saídas observadas se concentram.
    $melhorUf = null;
    foreach (($ctx['saidas_por_uf'] ?? []) as $linha) {
        if ($melhorUf === null || (int)$linha['saidas'] > (int)$melhorUf['saidas']) $melhorUf = $linha;
    }
    $saidasTotal = (int)($ctx['saidas_total'] ?? 0);
    if ($melhorUf !== null && (int)$melhorUf['saidas'] >= OPER_HOJE_INSIGHT_SAIDAS_MIN && $saidasTotal > 0) {
        $uf = strtoupper((string)$melhorUf['uf']);
        $n = (int)$melhorUf['saidas'];
        $insights[] = [
            'id' => 'saidas-uf',
            'tipo' => 'saidas',
            'titulo' => "{$uf} concentra as saídas observadas",
            'texto' => "{$n} dos {$saidasTotal} anúncios que saíram do radar em 30 dias eram de {$uf}. Saída observada não comprova venda.",
            'evidencia' => [
                'recorte' => "{$uf} · caminhões e implementos",
                'periodo' => 'Últimos 30 dias',
                'valor' => "{$n} saídas",
                'base' => "{$saidasTotal} saídas no total",
                'amostra' => (int)$melhorUf['ativos'] . ' anúncios ativos',
                'confianca' => mercado_confianca($saidasTotal),
                'atualizacao' => $atualizacao,
                'explicacao' => 'Anúncio ausente em verificações consecutivas do portal. Não confirma venda.',
            ],
            'acao' => ['rotulo' => 'Ver mercado da região', 'pagina' => 'mercado', 'contexto' => ['uf' => $uf]],
        ];
    }

    // 2) Modelo com mediana qualificada abaixo da FIPE.
    $melhorFipe = null;
    foreach (($ctx['abaixo_fipe'] ?? []) as $linha) {
        $fipe = (float)($linha['fipe'] ?? 0);
        $mediana = (float)($linha['mediana'] ?? 0);
        if ($fipe <= 0 || $mediana <= 0 || (int)($linha['amostra'] ?? 0) < OPER_RADAR_AMOSTRA_MINIMA) continue;
        $desvio = ($mediana - $fipe) / $fipe * 100;
        if ($desvio > OPER_HOJE_INSIGHT_ABAIXO_FIPE_PCT) continue;
        if ($melhorFipe === null || $desvio < $melhorFipe['desvio']) $melhorFipe = $linha + ['desvio' => $desvio];
    }
    if ($melhorFipe !== null) {
        $rotulo = trim("{$melhorFipe['marca']} {$melhorFipe['modelo']} {$melhorFipe['ano']}");
        $amostra = (int)$melhorFipe['amostra'];
        $insights[] = [
            'id' => 'abaixo-fipe',
            'tipo' => 'preco',
            'titulo' => "{$rotulo} anunciado abaixo da FIPE",
            'texto' => 'A mediana qualificada (' . oper_hoje_brl($melhorFipe['mediana']) . ') está '
                . oper_hoje_pct($melhorFipe['desvio']) . ' abaixo da FIPE (' . oper_hoje_brl($melhorFipe['fipe'])
                . '). Pode indicar oportunidade de compra; confira estado e versão.',
            'evidencia' => [
                'recorte' => "{$rotulo} · todas as UFs",
                'periodo' => 'Estoque ativo',
                'valor' => oper_hoje_brl($melhorFipe['mediana']),
                'base' => 'FIPE ' . oper_hoje_brl($melhorFipe['fipe']),
                'amostra' => "{$amostra} preços válidos · " . (int)($melhorFipe['revendas'] ?? 0) . ' revendas',
                'confianca' => mercado_confianca($amostra),
                'atualizacao' => $atualizacao,
                'explicacao' => 'Mediana qualificada (sem valores extremos ou inválidos), não média bruta.',
            ],
            'acao' => ['rotulo' => 'Ver modelo no mercado', 'pagina' => 'mercado', 'contexto' => [
                'marca' => $melhorFipe['marca'], 'modelo' => $melhorFipe['modelo'], 'ano' => (int)$melhorFipe['ano'],
            ]],
        ];
    }

    // 3) Estoque parado há mais de 90 dias.
    $melhorParado = null;
    foreach (($ctx['parados'] ?? []) as $linha) {
        if ((int)$linha['parados'] < OPER_HOJE_INSIGHT_PARADOS_MIN || (int)$linha['total'] < OPER_RADAR_AMOSTRA_MINIMA) continue;
        if ($melhorParado === null || (int)$linha['parados'] > (int)$melhorParado['parados']) $melhorParado = $linha;
    }
    if ($melhorParado !== null) {
        $rotulo = trim("{$melhorParado['marca']} {$melhorParado['modelo']} {$melhorParado['ano']}");
        $p = (int)$melhorParado['parados'];
        $t = (int)$melhorParado['total'];
        $dias = OPER_HOJE_PARADO_DIAS;
        $insights[] = [
            'id' => 'estoque-parado',
            'tipo' => 'estoque',
            'titulo' => "{$rotulo}: estoque parado há mais de {$dias} dias",
            'texto' => "{$p} de {$t} anúncios estão há mais de {$dias} dias no ar. Tempo longo sugere preço acima do que o mercado aceita.",
            'evidencia' => [
                'recorte' => $rotulo,
                'periodo' => 'Estoque ativo',
                'valor' => "{$p} anúncios",
                'base' => "{$t} anúncios do grupo",
                'amostra' => (int)($melhorParado['revendas'] ?? 0) . ' revendas',
                'confianca' => mercado_confianca($t),
                'atualizacao' => $atualizacao,
                'explicacao' => 'Idade = dias desde a primeira observação do anúncio.',
            ],
            'acao' => ['rotulo' => 'Ver modelo no mercado', 'pagina' => 'mercado', 'contexto' => [
                'marca' => $melhorParado['marca'], 'modelo' => $melhorParado['modelo'], 'ano' => (int)$melhorParado['ano'],
            ]],
        ];
    }

    // 4) Concorrente que reduziu preço em vários anúncios.
    $melhorRevenda = null;
    foreach (($ctx['reducoes_revendas'] ?? []) as $linha) {
        if ((int)$linha['reducoes'] < OPER_HOJE_INSIGHT_REDUCOES_MIN) continue;
        if ($melhorRevenda === null || (int)$linha['reducoes'] > (int)$melhorRevenda['reducoes']) $melhorRevenda = $linha;
    }
    if ($melhorRevenda !== null) {
        $r = (int)$melhorRevenda['reducoes'];
        $a = (int)$melhorRevenda['ativos'];
        $local = "{$melhorRevenda['cidade']}/{$melhorRevenda['uf']}";
        $insights[] = [
            'id' => 'concorrente-reduziu',
            'tipo' => 'concorrencia',
            'titulo' => "{$melhorRevenda['nome']} reduziu preço em {$r} anúncios",
            'texto' => "Concorrente em {$local} com {$a} anúncios ativos. Reduções recentes podem pressionar os seus preços; redução é sinal, não prova de venda.",
            'evidencia' => [
                'recorte' => "{$melhorRevenda['nome']} · {$local}",
                'periodo' => 'Últimos 30 dias',
                'valor' => "{$r} reduções",
                'base' => "{$a} anúncios ativos",
                'amostra' => "{$a} anúncios",
                'confianca' => mercado_confianca($a),
                'atualizacao' => $atualizacao,
                'explicacao' => 'Redução = queda de preço detectada entre duas coletas.',
            ],
            'acao' => ['rotulo' => 'Ver concorrência', 'pagina' => 'concorrentes', 'contexto' => []],
        ];
    }

    return array_slice($insights, 0, max(0, $maximo));
}

/**
 * Consulta tolerante: PHP 8.1+ lança exceção em erro de SQL. Em vez de derrubar a tela
 * inteira, devolve null e o endpoint registra o bloco como indisponível.
 */
function oper_hoje_consulta(mysqli $conn, string $sql): ?array {
    try {
        $resultado = $conn->query($sql);
        if (!$resultado) return null;
        $linhas = [];
        while ($linha = $resultado->fetch_assoc()) $linhas[] = $linha;
        return $linhas;
    } catch (Throwable $e) {
        return null;
    }
}

function oper_hoje_tabela_existe(mysqli $conn, string $tabela): bool {
    $linhas = oper_hoje_consulta($conn, "SELECT COUNT(*) total FROM information_schema.TABLES
        WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='" . $conn->real_escape_string($tabela) . "'");
    return $linhas !== null && (int)($linhas[0]['total'] ?? 0) > 0;
}
