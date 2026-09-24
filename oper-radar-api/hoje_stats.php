<?php
/**
 * OPER RADAR — API: KPIs adicionais para o painel "Hoje"
 * GET hoje_stats.php
 * - top_modelos: modelos com mais anúncios ativos + preço médio
 * - regioes_saidas: cidades com mais saídas detectadas (últimos 30 dias)
 * - top_lojas_novos: lojas que mais subiram anúncios (últimos 7 dias)
 * - top_lojas_saidas: lojas com mais saídas detectadas (últimos 30 dias)
 * - feed: entradas, quedas de preço e saídas recentes (ver lib/hoje_painel.php)
 * - ufs_saidas: saídas em 30 dias e estoque ativo por UF
 * - insights: destaques do dia, cada um com evidência
 * - parciais_indisponiveis: blocos novos que não puderam ser calculados
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/market_quality.php';
require_once __DIR__ . '/lib/hoje_painel.php';
$conn = conecta();

function rows(mysqli $c, string $sql): array {
    $out = []; $r = $c->query($sql);
    if ($r) while ($row = $r->fetch_assoc()) $out[] = $row;
    return $out;
}

// Extrai as primeiras 3 "palavras significativas" do título para agrupar modelos
// (ex: "DAF XF FTT 530 2022/2023" vira "DAF XF FTT")
$topModelos = rows($conn, "
    SELECT
        SUBSTRING_INDEX(titulo, ' ', 3) AS modelo,
        marca, tipo,
        COUNT(*) AS n,
        ROUND(AVG(preco)) AS preco_medio
    FROM anuncio
    WHERE status='ativo' AND preco IS NOT NULL AND marca IS NOT NULL
    GROUP BY modelo, marca, tipo
    HAVING n >= 3
    ORDER BY n DESC
    LIMIT 8
");
foreach ($topModelos as &$m) { $m['n'] = (int)$m['n']; $m['preco_medio'] = (int)$m['preco_medio']; }

// Cidades com mais anuncios que deixaram o portal (ultimos 30 dias)
$regioesSaidas = rows($conn, "
    SELECT r.cidade, r.uf, COUNT(*) n
    FROM anuncio a JOIN revenda r ON r.id = a.revenda_id
    WHERE a.status='removido_confirmado' AND a.data_remocao >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY r.cidade, r.uf
    ORDER BY n DESC LIMIT 6
");
foreach ($regioesSaidas as &$c) { $c['n'] = (int)$c['n']; }

// Lojas que mais SUBIRAM anúncios (últimos 7 dias) — quem está mais ativo comercialmente
$topLojasNovos = rows($conn, "
    SELECT r.nome, r.cidade, r.uf, COUNT(*) n
    FROM anuncio a JOIN revenda r ON r.id = a.revenda_id
    WHERE a.primeira_vez_visto >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    GROUP BY r.id
    ORDER BY n DESC LIMIT 6
");
foreach ($topLojasNovos as &$l) { $l['n'] = (int)$l['n']; }

// Lojas com mais saidas detectadas (ultimos 30 dias); isso nao comprova venda.
$topLojasSaidas = rows($conn, "
    SELECT r.nome, r.cidade, r.uf, COUNT(*) n
    FROM anuncio a JOIN revenda r ON r.id = a.revenda_id
    WHERE a.status='removido_confirmado' AND a.data_remocao >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY r.id
    ORDER BY n DESC LIMIT 6
");
foreach ($topLojasSaidas as &$l) { $l['n'] = (int)$l['n']; }

// ---------------------------------------------------------------------------
// Blocos novos da tela "Hoje". Cada um é tolerante: se falhar, o restante continua
// e o nome do bloco aparece em parciais_indisponiveis (número errado é pior que nenhum).
// ---------------------------------------------------------------------------
$parciais = [];
$agoraLinha = oper_hoje_consulta($conn, 'SELECT NOW() agora');
$agoraDb = new DateTimeImmutable((string)($agoraLinha[0]['agora'] ?? 'now'));
$temEventos = oper_hoje_tabela_existe($conn, 'anuncio_evento');
$anoModelo = 'COALESCE(a.ano_final,a.ano_inicial)';
// Queda maior que 50% é tratada como erro de coleta, não como sinal.
$queda = "e.tipo_evento='mudanca_preco' AND e.valor_anterior_decimal>0
          AND e.valor_novo_decimal < e.valor_anterior_decimal
          AND e.valor_novo_decimal >= e.valor_anterior_decimal*0.5";

$bloco = function (string $nome, ?array $linhas) use (&$parciais): array {
    if ($linhas === null) { $parciais[] = $nome; return []; }
    return $linhas;
};

$feedNovos = $bloco('feed_novos', oper_hoje_consulta($conn, "
    SELECT a.id AS anuncio_id, a.url, a.titulo, a.marca, a.modelo, $anoModelo AS ano, a.preco,
           r.cidade, r.uf, a.primeira_vez_visto AS quando
    FROM anuncio a JOIN revenda r ON r.id=a.revenda_id
    WHERE a.status='ativo' AND a.primeira_vez_visto >= DATE_SUB(NOW(), INTERVAL 48 HOUR)
    ORDER BY a.primeira_vez_visto DESC LIMIT 20"));
$feedSaidas = $bloco('feed_saidas', oper_hoje_consulta($conn, "
    SELECT a.id AS anuncio_id, a.url, a.titulo, a.marca, a.modelo, $anoModelo AS ano, a.preco,
           r.cidade, r.uf, a.data_remocao AS quando
    FROM anuncio a JOIN revenda r ON r.id=a.revenda_id
    WHERE a.status='removido_confirmado' AND a.data_remocao >= DATE_SUB(NOW(), INTERVAL 72 HOUR)
    ORDER BY a.data_remocao DESC LIMIT 20"));
$feedVerificacao = $bloco('feed_verificacao', oper_hoje_consulta($conn, "
    SELECT a.id AS anuncio_id, a.url, a.titulo, a.marca, a.modelo, $anoModelo AS ano, a.preco,
           r.cidade, r.uf, a.ultima_vez_ativo AS quando
    FROM anuncio a JOIN revenda r ON r.id=a.revenda_id
    WHERE a.status='removido_candidato' AND a.ultima_vez_ativo >= DATE_SUB(NOW(), INTERVAL 72 HOUR)
    ORDER BY a.ultima_vez_ativo DESC LIMIT 10"));
$feedReducoes = [];
if ($temEventos) {
    $feedReducoes = $bloco('feed_reducoes', oper_hoje_consulta($conn, "
        SELECT e.anuncio_id, a.url, a.titulo, a.marca, a.modelo, $anoModelo AS ano, r.cidade, r.uf,
               e.valor_anterior_decimal AS preco_anterior, e.valor_novo_decimal AS preco_novo,
               ROUND((e.valor_novo_decimal - e.valor_anterior_decimal) / e.valor_anterior_decimal * 100, 1) AS variacao_pct,
               e.ocorrido_em AS quando
        FROM anuncio_evento e
        JOIN anuncio a ON a.id=e.anuncio_id JOIN revenda r ON r.id=a.revenda_id
        WHERE $queda AND e.dia_referencia >= DATE_SUB(CURDATE(), INTERVAL 3 DAY)
        ORDER BY e.ocorrido_em DESC LIMIT 20"));
} else {
    $parciais[] = 'feed_reducoes';
}
$feed = oper_hoje_feed($feedNovos, $feedReducoes, $feedSaidas, 12, $feedVerificacao);

$ufsSaidas = $bloco('ufs_saidas', oper_hoje_consulta($conn, "
    SELECT r.uf,
           SUM(CASE WHEN a.status='removido_confirmado' AND a.data_remocao >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS saidas,
           SUM(CASE WHEN a.status='ativo' THEN 1 ELSE 0 END) AS ativos
    FROM anuncio a JOIN revenda r ON r.id=a.revenda_id
    GROUP BY r.uf
    HAVING saidas > 0 OR ativos > 0
    ORDER BY saidas DESC, ativos DESC"));
$saidasTotal = 0;
foreach ($ufsSaidas as &$linhaUf) {
    $linhaUf['saidas'] = (int)$linhaUf['saidas'];
    $linhaUf['ativos'] = (int)$linhaUf['ativos'];
    $saidasTotal += $linhaUf['saidas'];
}
unset($linhaUf);

$parados = $bloco('estoque_parado', oper_hoje_consulta($conn, "
    SELECT a.marca, a.modelo, $anoModelo AS ano, COUNT(*) AS total,
           SUM(CASE WHEN a.primeira_vez_visto < DATE_SUB(NOW(), INTERVAL " . OPER_HOJE_PARADO_DIAS . " DAY) THEN 1 ELSE 0 END) AS parados,
           COUNT(DISTINCT a.revenda_id) AS revendas
    FROM anuncio a
    WHERE a.status='ativo' AND a.marca IS NOT NULL AND a.modelo IS NOT NULL
      AND $anoModelo BETWEEN 1950 AND YEAR(CURDATE())+2
    GROUP BY a.marca, a.modelo, ano
    HAVING total >= " . OPER_RADAR_AMOSTRA_MINIMA . " AND parados >= " . OPER_HOJE_INSIGHT_PARADOS_MIN . "
    ORDER BY parados DESC LIMIT 10"));

$reducoesRevendas = [];
if ($temEventos) {
    $reducoesRevendas = $bloco('reducoes_revendas', oper_hoje_consulta($conn, "
        SELECT r.id, r.nome, r.cidade, r.uf, COUNT(*) AS reducoes,
               (SELECT COUNT(*) FROM anuncio x WHERE x.revenda_id=r.id AND x.status='ativo') AS ativos
        FROM anuncio_evento e
        JOIN anuncio a ON a.id=e.anuncio_id JOIN revenda r ON r.id=a.revenda_id
        WHERE $queda AND e.dia_referencia >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY r.id
        HAVING reducoes >= " . OPER_HOJE_INSIGHT_REDUCOES_MIN . "
        ORDER BY reducoes DESC LIMIT 5"));
} else {
    $parciais[] = 'reducoes_revendas';
}

// Modelo x FIPE: a mediana qualificada vem da mesma regra usada no restante da API.
$abaixoFipe = [];
$candidatosFipe = $bloco('abaixo_fipe', oper_hoje_consulta($conn, "
    SELECT a.fipe_preco_id, MIN(a.marca) AS marca, MIN(a.modelo) AS modelo,
           MIN($anoModelo) AS ano, MIN(f.preco) AS preco_fipe,
           COUNT(DISTINCT a.revenda_id) AS revendas, COUNT(*) AS n
    FROM anuncio a JOIN fipe_preco f ON f.id=a.fipe_preco_id
    WHERE a.status='ativo' AND a.fipe_match_confianca='alto' AND a.preco>0 AND f.preco>0
    GROUP BY a.fipe_preco_id
    HAVING n >= " . OPER_RADAR_AMOSTRA_MINIMA . "
    ORDER BY n DESC LIMIT 40"));
if ($candidatosFipe) {
    try {
        $estatisticas = mercado_estatisticas_por_fipe($conn, array_column($candidatosFipe, 'fipe_preco_id'));
        // Nome proprio: $c, $m e $l ainda sao referencias dos foreach acima.
        foreach ($candidatosFipe as $candidato) {
            $st = $estatisticas[(int)$candidato['fipe_preco_id']] ?? null;
            if (!$st || !$st['amostra_suficiente']) continue;
            $abaixoFipe[] = [
                'marca' => $candidato['marca'], 'modelo' => $candidato['modelo'], 'ano' => (int)$candidato['ano'],
                'mediana' => $st['mediana'], 'fipe' => (float)$candidato['preco_fipe'],
                'amostra' => (int)$st['amostra_qualificada'], 'revendas' => (int)$candidato['revendas'],
            ];
        }
    } catch (Throwable $e) {
        $parciais[] = 'abaixo_fipe';
    }
}

$insights = oper_hoje_insights([
    'atualizacao' => $agoraDb->format('d/m/Y H:i'),
    'saidas_total' => $saidasTotal,
    'saidas_por_uf' => $ufsSaidas,
    'parados' => $parados,
    'reducoes_revendas' => $reducoesRevendas,
    'abaixo_fipe' => $abaixoFipe,
]);

envia_json([
    'top_modelos' => $topModelos,
    'regioes_saidas' => $regioesSaidas,
    'top_lojas_novos' => $topLojasNovos,
    'top_lojas_saidas' => $topLojasSaidas,
    // Compatibilidade temporaria com bundles anteriores.
    'regioes_vendas' => $regioesSaidas,
    'top_lojas_vendas' => $topLojasSaidas,
    'feed' => $feed,
    'ufs_saidas' => $ufsSaidas,
    'insights' => $insights,
    'atualizado_em' => $agoraDb->format('Y-m-d H:i:s'),
    'parciais_indisponiveis' => array_values(array_unique($parciais)),
]);
