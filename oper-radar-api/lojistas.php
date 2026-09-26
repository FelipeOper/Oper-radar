<?php
/**
 * OPER RADAR — API: lista de lojistas com metricas honestas
 * A idade media do estoque só é confiavel quando ha pelo menos 14 dias
 * desde a primeira coleta (senao, todos os anuncios teriam "idade" recente
 * artificialmente — bug real detectado em 09/jul quando toda revenda mostrava "1d").
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/market_scope.php';
require_once __DIR__ . '/lib/concorrencia_metricas.php';
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
    $row['saidas_detectadas'] = (int)$row['saidas_detectadas'];
    $row['saidas_30d'] = (int)$row['saidas_30d'];
    // Compatibilidade temporaria com bundles anteriores.
    $row['vendidos'] = $row['saidas_detectadas'];
    $row['vendidos_30d'] = $row['saidas_30d'];
    $row['idade_media_estoque'] = $row['idade_media_estoque'] !== null ? (float)$row['idade_media_estoque'] : null;
    $row['dias_de_coleta'] = $row['dias_de_coleta'] !== null ? (int)$row['dias_de_coleta'] : 0;
    // A idade observada só é confiável após 14 dias de coleta acumulada.
    $row['idade_observada_confiavel'] = $row['dias_de_coleta'] >= 14;
    // Alias temporário para clientes antigos.
    $row['giro_confiavel'] = $row['idade_observada_confiavel'];
    $row['mix_categorias'] = [];
    $row['reducoes_30d'] = null;
    $row['desvio_fipe_mediano_pct'] = null;
    $row['desvio_fipe_amostra'] = 0;
    $row['desvio_fipe_confianca'] = 'insuficiente';
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

    $precos = $conn->prepare("SELECT a.revenda_id, a.preco, a.titulo, a.preco_texto_bruto,
        a.fipe_match_status, COALESCE(a.ano_final,a.ano_inicial) ano, a.carroceria, a.tipo, f.preco preco_fipe FROM anuncio a
        JOIN fipe_preco f ON f.id=a.fipe_preco_id
        WHERE a.revenda_id IN ($placeholders) AND a.status='ativo'");
    $precos->bind_param(str_repeat('i', count($ids)), ...$ids);
    $precos->execute();
    $gruposPreco = [];
    $resultadoPrecos = $precos->get_result();
    while ($linha = $resultadoPrecos->fetch_assoc()) $gruposPreco[(int)$linha['revenda_id']][] = $linha;
    foreach ($ids as $id) {
        $idx = $mapaId[$id];
        $lojistas[$idx] = array_merge($lojistas[$idx], oper_concorrencia_desvio_fipe($gruposPreco[$id] ?? []));
    }
    $precos->close();

    $tabelaEventos = $conn->query("SELECT COUNT(*) total FROM information_schema.TABLES
        WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='anuncio_evento'");
    if ($tabelaEventos && (int)($tabelaEventos->fetch_assoc()['total'] ?? 0) > 0) {
        $reducoes = $conn->prepare("SELECT a.revenda_id, COUNT(DISTINCT e.anuncio_id) quantidade
            FROM anuncio_evento e JOIN anuncio a ON a.id=e.anuncio_id
            WHERE a.revenda_id IN ($placeholders) AND e.tipo_evento='mudanca_preco'
              AND e.dia_referencia>=DATE_SUB(CURDATE(), INTERVAL 30 DAY)
              AND e.valor_anterior_decimal>e.valor_novo_decimal
              AND e.valor_novo_decimal>=e.valor_anterior_decimal*0.5
            GROUP BY a.revenda_id");
        $reducoes->bind_param(str_repeat('i', count($ids)), ...$ids);
        $reducoes->execute();
        foreach ($lojistas as &$loja) $loja['reducoes_30d'] = 0;
        unset($loja);
        $resultadoReducoes = $reducoes->get_result();
        while ($linha = $resultadoReducoes->fetch_assoc()) {
            $lojistas[$mapaId[(int)$linha['revenda_id']]]['reducoes_30d'] = (int)$linha['quantidade'];
        }
        $reducoes->close();
    }
}

envia_json(['total' => count($lojistas), 'lojistas' => $lojistas]);
