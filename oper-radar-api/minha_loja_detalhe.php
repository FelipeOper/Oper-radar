<?php
/** Detalhe editável do estoque próprio e comparação regional pela mesma FIPE. */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/market_quality.php';
require_once __DIR__ . '/lib/regional_insight.php';
require_once __DIR__ . '/lib/store_market.php';
$usuario = exige_autenticacao();
$conn = conecta();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    envia_json(['erro' => 'Metodo nao permitido']);
}

function loja_detalhe_linhas(mysqli $conn, string $sql, string $tipos = '', array $parametros = []): array {
    $st = $conn->prepare($sql);
    if (!$st) throw new RuntimeException('Não foi possível preparar a comparação.');
    if ($parametros) $st->bind_param($tipos, ...$parametros);
    $st->execute();
    $res = $st->get_result();
    $linhas = [];
    while ($linha = $res->fetch_assoc()) $linhas[] = $linha;
    $st->close();
    return $linhas;
}

function loja_detalhe_tabela_existe(mysqli $conn, string $tabela): bool {
    $st = $conn->prepare('SELECT COUNT(*) total FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=?');
    $st->bind_param('s', $tabela);
    $st->execute();
    $existe = (int)($st->get_result()->fetch_assoc()['total'] ?? 0) > 0;
    $st->close();
    return $existe;
}

$id = max(0, (int)($_GET['id'] ?? 0));
if ($id === 0) {
    http_response_code(400);
    envia_json(['erro' => 'Veículo inválido.', 'codigo' => 'VEICULO_INVALIDO']);
}

$itens = loja_detalhe_linhas($conn, "SELECT me.id,me.referencia_interna,me.titulo,me.marca,me.modelo,me.ano,
    me.preco_anunciado,me.cidade,me.uf,me.data_entrada,me.status,me.fipe_preco_id,
    me.origem,me.placa,me.quilometragem,me.url_anuncio,me.imagem_url,me.usar_comparativo,
    me.ultima_sincronizacao,me.criado_em,me.atualizado_em,
    fp.preco preco_fipe,fp.codigo_fipe,fp.ano_codigo ano_fipe,fp.mes_referencia,
    fm.marca_fipe,fm.modelo_fipe,DATEDIFF(CURDATE(),me.data_entrada) dias_estoque
    FROM meu_estoque me
    LEFT JOIN fipe_preco fp ON fp.id=me.fipe_preco_id
    LEFT JOIN fipe_modelo fm ON fm.id=fp.fipe_modelo_id
    WHERE me.id=? AND me.usuario_id=? LIMIT 1", 'ii', [$id, $usuario['id']]);
if (!$itens) {
    http_response_code(404);
    envia_json(['erro' => 'Veículo não encontrado.', 'codigo' => 'VEICULO_NAO_ENCONTRADO']);
}
$item = $itens[0];
foreach (['id','ano','fipe_preco_id','quilometragem','usar_comparativo','dias_estoque'] as $campo) {
    $item[$campo] = $item[$campo] !== null ? (int)$item[$campo] : null;
}
foreach (['preco_anunciado','preco_fipe'] as $campo) {
    $item[$campo] = $item[$campo] !== null ? (float)$item[$campo] : null;
}

$fipeId = (int)($item['fipe_preco_id'] ?? 0);
if ($fipeId === 0 || (int)($item['usar_comparativo'] ?? 1) !== 1) {
    envia_json([
        'item' => $item,
        'mercado_nacional' => null,
        'regioes' => [],
        'melhor_regiao_observada' => null,
        'historico_eventos' => ['disponivel' => loja_detalhe_tabela_existe($conn, 'anuncio_evento'), 'cobertura_dias' => 0],
        'nota' => $fipeId === 0
            ? 'Vincule uma referência FIPE para habilitar comparáveis equivalentes.'
            : 'Este veículo está fora da base comparativa por opção da loja.',
    ]);
}

$comparaveis = loja_detalhe_linhas($conn, "SELECT a.preco,a.titulo,a.preco_texto_bruto,
    fp.preco preco_fipe,r.id revenda_id,r.uf
    FROM anuncio a JOIN revenda r ON r.id=a.revenda_id
    JOIN fipe_preco fp ON fp.id=a.fipe_preco_id
    WHERE a.status='ativo' AND a.fipe_preco_id=? AND a.preco IS NOT NULL AND a.preco>0", 'i', [$fipeId]);
$nacional = mercado_calcula_estatisticas($comparaveis);
$nacional['desvio_preco_loja_pct'] = $nacional['mediana'] > 0 && (float)($item['preco_anunciado'] ?? 0) > 0
    ? round(((float)$item['preco_anunciado'] - $nacional['mediana']) / $nacional['mediana'] * 100, 1)
    : null;

$porUf = [];
foreach ($comparaveis as $linha) {
    $uf = strtoupper((string)($linha['uf'] ?? ''));
    if (!preg_match('/^[A-Z]{2}$/', $uf)) continue;
    $porUf[$uf][] = $linha;
}

$eventosDisponiveis = loja_detalhe_tabela_existe($conn, 'anuncio_evento');
$coberturaInicio = null;
$coberturaFim = null;
$coberturaDias = 0;
$saidasPorUf = [];
if ($eventosDisponiveis) {
    $cobertura = loja_detalhe_linhas($conn, "SELECT MIN(e.dia_referencia) inicio,MAX(e.dia_referencia) fim
        FROM anuncio_evento e JOIN anuncio a ON a.id=e.anuncio_id
        WHERE a.fipe_preco_id=? AND e.origem='anuncio_snapshot'", 'i', [$fipeId])[0] ?? [];
    $coberturaInicio = $cobertura['inicio'] ?? null;
    $coberturaFim = $cobertura['fim'] ?? null;
    if ($coberturaInicio && $coberturaFim) {
        $coberturaDias = max(1, (int)((strtotime($coberturaFim) - strtotime($coberturaInicio)) / 86400) + 1);
    }
    $saidas = loja_detalhe_linhas($conn, "SELECT r.uf,
        GREATEST(0,DATEDIFF(e.dia_referencia,COALESCE(
          (SELECT MAX(origem.dia_referencia) FROM anuncio_evento origem
           WHERE origem.anuncio_id=e.anuncio_id
             AND origem.tipo_evento IN ('primeira_observacao','reaparecimento')
             AND origem.ocorrido_em<=e.ocorrido_em),DATE(a.primeira_vez_visto)))) dias_observados
        FROM anuncio_evento e JOIN anuncio a ON a.id=e.anuncio_id JOIN revenda r ON r.id=a.revenda_id
        WHERE a.fipe_preco_id=? AND e.tipo_evento='saida_detectada'
          AND e.dia_referencia>=DATE_SUB(CURDATE(),INTERVAL 180 DAY)", 'i', [$fipeId]);
    foreach ($saidas as $saida) {
        $uf = strtoupper((string)$saida['uf']);
        $saidasPorUf[$uf][] = $saida['dias_observados'] !== null ? (int)$saida['dias_observados'] : null;
    }
}

$regioes = [];
foreach ($porUf as $uf => $linhas) {
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
    $publicavel = (!empty($b['avaliacao']['publicavel']) ? 1 : 0)
        <=> (!empty($a['avaliacao']['publicavel']) ? 1 : 0);
    if ($publicavel !== 0) return $publicavel;
    return (float)$b['avaliacao']['pontuacao'] <=> (float)$a['avaliacao']['pontuacao'];
});
$melhor = null;
foreach ($regioes as $regiao) {
    if (!empty($regiao['avaliacao']['publicavel'])) { $melhor = $regiao; break; }
}

envia_json([
    'item' => $item,
    'mercado_nacional' => [
        'comparaveis' => (int)$nacional['amostra_qualificada'],
        'amostra_total' => (int)$nacional['amostra_total'],
        'amostra_suficiente' => (bool)$nacional['amostra_suficiente'],
        'confianca' => $nacional['confianca'],
        'preco_mediano' => $nacional['mediana'],
        'preco_p25' => $nacional['p25'],
        'preco_p75' => $nacional['p75'],
        'desvio_preco_loja_pct' => $nacional['desvio_preco_loja_pct'],
    ],
    'regioes' => $regioes,
    'melhor_regiao_observada' => $melhor,
    'historico_eventos' => [
        'disponivel' => $eventosDisponiveis,
        'cobertura_inicio' => $coberturaInicio,
        'cobertura_fim' => $coberturaFim,
        'cobertura_dias' => $coberturaDias,
    ],
    'nota' => 'A análise usa anúncios ativos equivalentes e saídas observadas do portal. Não comprova venda nem garante desempenho futuro.',
]);
