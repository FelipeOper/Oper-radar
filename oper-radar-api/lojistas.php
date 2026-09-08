<?php
/**
 * OPER RADAR — API: lista de lojistas com metricas honestas
 * A idade media do estoque só é confiavel quando ha pelo menos 14 dias
 * desde a primeira coleta (senao, todos os anuncios teriam "idade" recente
 * artificialmente — bug real detectado em 09/jul quando toda revenda mostrava "1d").
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/market_scope.php';
require_once __DIR__ . '/lib/competitor_history.php';
$conn = conecta();

$REGIOES = [
    'Sul' => ['PR','SC','RS'], 'Sudeste' => ['SP','RJ','MG','ES'],
    'Centro-Oeste' => ['MT','MS','GO','DF'],
    'Nordeste' => ['BA','PE','CE','MA','PB','RN','AL','PI','SE'],
    'Norte' => ['AM','PA','RO','RR','AC','AP','TO'],
];
$UF_REGIAO = [];
foreach ($REGIOES as $nomeRegiao => $ufsDaRegiao) foreach ($ufsDaRegiao as $sigla) $UF_REGIAO[$sigla] = $nomeRegiao;
$uf = $_GET['uf'] ?? null;
$regiao = $_GET['regiao'] ?? null;
$ufsRegiao = ($regiao && isset($REGIOES[$regiao])) ? $REGIOES[$regiao] : null;
// DAT03: mesma normalizacao de anuncios.php/mercado_painel.php, pra "uf=PR,SC" nao
// virar uma comparacao literal contra uma unica sigla (ver market_scope.php).
$ufsSelecionadas = $ufsRegiao ? null : painel_normaliza_ufs((string)($uf ?? ''), $UF_REGIAO);

$sql = "SELECT r.id, r.nome, r.cidade, r.uf, r.url_perfil, r.telefone, r.ativa_desde,
               COUNT(a.id) AS total_historico,
               SUM(CASE WHEN a.status = 'ativo' THEN 1 ELSE 0 END) AS ativos,
               SUM(CASE WHEN a.status = 'removido_confirmado' THEN 1 ELSE 0 END) AS saidas_detectadas,
               SUM(CASE WHEN a.status = 'removido_confirmado' AND a.data_remocao >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS saidas_30d,
               ROUND(AVG(CASE WHEN a.status='ativo' THEN DATEDIFF(NOW(), a.primeira_vez_visto) END), 1) AS idade_media_estoque,
               DATEDIFF(NOW(), (SELECT MIN(primeira_vez_visto) FROM anuncio WHERE revenda_id = r.id)) AS dias_de_coleta,
               MIN(a.primeira_vez_visto) AS primeiro_anuncio_visto,
               MAX(a.ultima_vez_ativo) AS ultima_atividade
        FROM revenda r
        LEFT JOIN anuncio a ON a.revenda_id = r.id";
$params = []; $types = '';
if ($ufsRegiao) {
    $ph = implode(',', array_fill(0, count($ufsRegiao), '?'));
    $sql .= " WHERE r.uf IN ($ph)";
    foreach ($ufsRegiao as $u) { $params[] = $u; $types .= 's'; }
} elseif ($ufsSelecionadas) {
    $ph = implode(',', array_fill(0, count($ufsSelecionadas), '?'));
    $sql .= " WHERE r.uf IN ($ph)";
    foreach ($ufsSelecionadas as $u) { $params[] = $u; $types .= 's'; }
}
$sql .= ' GROUP BY r.id ORDER BY ativos DESC, saidas_detectadas DESC';

$stmt = $conn->prepare($sql);
if ($params) $stmt->bind_param($types, ...$params);
$stmt->execute();
$res = $stmt->get_result();

$lojistas = []; $mapaId = [];
while ($row = $res->fetch_assoc()) {
    $row['total_historico'] = (int)$row['total_historico'];
    $row['ativos'] = (int)$row['ativos'];
    // Contagem por status atual (anuncio.status='removido_confirmado'); serve de base e,
    // para revendas sem cobertura de eventos, também de resultado final — ver reconciliação
    // com lojista_detalhe.php logo abaixo (DAT04, achado D03 da auditoria).
    $row['saidas_detectadas'] = (int)$row['saidas_detectadas'];
    $row['saidas_30d'] = (int)$row['saidas_30d'];
    $row['idade_media_estoque'] = $row['idade_media_estoque'] !== null ? (float)$row['idade_media_estoque'] : null;
    $row['dias_de_coleta'] = $row['dias_de_coleta'] !== null ? (int)$row['dias_de_coleta'] : 0;
    // A idade observada só é confiável após 14 dias de coleta acumulada.
    $row['idade_observada_confiavel'] = $row['dias_de_coleta'] >= 14;
    // Alias temporário para clientes antigos.
    $row['giro_confiavel'] = $row['idade_observada_confiavel'];
    $row['mix_categorias'] = [];
    $mapaId[$row['id']] = count($lojistas);
    $lojistas[] = $row;
}

if ($lojistas) {
    $ids = array_column($lojistas, 'id');
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $ts = $conn->prepare("SELECT revenda_id, tipo, COUNT(*) n FROM anuncio
                          WHERE revenda_id IN ($placeholders) AND status='ativo' AND tipo IS NOT NULL
                          GROUP BY revenda_id, tipo");
    $ts->bind_param(str_repeat('i', count($ids)), ...$ids);
    $ts->execute();
    $tr = $ts->get_result();
    while ($m = $tr->fetch_assoc()) {
        $idx = $mapaId[$m['revenda_id']] ?? null;
        if ($idx !== null) $lojistas[$idx]['mix_categorias'][$m['tipo']] = (int)$m['n'];
    }

    // DAT04 (auditoria 07/09, achado D03): a lista mostrava "saídas" pelo status atual do
    // anúncio (removido_confirmado) enquanto lojista_detalhe.php já usava o histórico de
    // eventos (saida_detectada) — o mesmo lojista (ex.: Lelo Caminhões) aparecia com números
    // diferentes no cartão e no detalhe. Agora a lista adota a mesma fonte do detalhe quando
    // há eventos registrados para a revenda; sem eventos, mantém o status atual como base e
    // marca a cobertura como zero, deixando a lacuna explícita em vez de forjar um valor.
    $eventosDisponiveis = oper_concorrente_tabela_eventos_disponivel($conn);
    $eventosPorRevenda = $eventosDisponiveis ? oper_concorrente_saidas_por_revenda($conn, $ids) : [];
    foreach ($lojistas as &$loja) {
        $eventosRevenda = $eventosPorRevenda[$loja['id']] ?? null;
        if ($eventosRevenda !== null && $eventosRevenda['cobertura_dias'] > 0) {
            $loja['saidas_detectadas'] = $eventosRevenda['saidas_observadas'];
            $loja['saidas_30d'] = $eventosRevenda['saidas_30d'];
            $loja['saidas_fonte'] = 'eventos';
            $loja['cobertura_inicio'] = $eventosRevenda['cobertura_inicio'];
            $loja['cobertura_fim'] = $eventosRevenda['cobertura_fim'];
            $loja['cobertura_dias'] = $eventosRevenda['cobertura_dias'];
        } else {
            // Sem nenhum evento registrado para esta revenda ainda: cobertura zero é
            // diferente de "zero saídas" com histórico completo.
            $loja['saidas_fonte'] = 'status_atual';
            $loja['cobertura_inicio'] = null;
            $loja['cobertura_fim'] = null;
            $loja['cobertura_dias'] = 0;
        }
        $loja['saidas_confianca'] = oper_concorrente_confianca(
            $eventosDisponiveis, $loja['cobertura_dias'], $loja['saidas_detectadas']
        );
        // Compatibilidade temporaria com bundles anteriores; recalculado após a reconciliação.
        $loja['vendidos'] = $loja['saidas_detectadas'];
        $loja['vendidos_30d'] = $loja['saidas_30d'];
    }
    unset($loja);
}

envia_json(['total' => count($lojistas), 'lojistas' => $lojistas]);
