<?php
/** Regras puras para resumir histórico observado de concorrentes. */

function oper_mediana_numerica(array $valores): ?float {
    $numericos = array_values(array_filter(array_map(
        fn($valor) => is_numeric($valor) ? (float)$valor : null,
        $valores
    ), fn($valor) => $valor !== null));
    if (!$numericos) return null;
    sort($numericos, SORT_NUMERIC);
    $n = count($numericos);
    $meio = intdiv($n, 2);
    return $n % 2 ? $numericos[$meio] : ($numericos[$meio - 1] + $numericos[$meio]) / 2;
}

function oper_concorrente_confianca(bool $eventosDisponiveis, int $coberturaDias, int $saidas): array {
    if (!$eventosDisponiveis) {
        return [
            'nivel' => 'parcial',
            'motivo' => 'histórico de eventos ainda não materializado; usando o status atual',
        ];
    }
    if ($coberturaDias >= 90 && $saidas >= 10) {
        return ['nivel' => 'alta', 'motivo' => '90+ dias de eventos e saídas observadas suficientes'];
    }
    if ($coberturaDias >= 30 && $saidas >= 3) {
        return ['nivel' => 'media', 'motivo' => '30+ dias de eventos com movimento observável'];
    }
    return ['nivel' => 'baixa', 'motivo' => 'histórico recente ou poucas saídas observadas'];
}

/**
 * DAT04 (auditoria 07/09, achado D03): existência da tabela de eventos, usada tanto
 * pela lista de lojistas (lojistas.php) quanto pelo detalhe (lojista_detalhe.php) para
 * que as duas telas decidam a mesma fonte de "saídas" — sem isso, a lista caía sempre
 * no status atual mesmo quando o histórico de eventos já existia.
 */
function oper_concorrente_tabela_eventos_disponivel(mysqli $conn): bool {
    $res = $conn->query("SELECT COUNT(*) total FROM information_schema.TABLES
        WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='anuncio_evento'");
    return $res && (int)($res->fetch_assoc()['total'] ?? 0) > 0;
}

/**
 * DAT04: saídas observadas + cobertura por revenda, em lote, na mesma definição usada
 * por lojista_detalhe.php (contagem de eventos tipo_evento='saida_detectada', janela de
 * 30 dias por dia_referencia, cobertura pelo intervalo de TODOS os tipos de evento
 * observados — não só saída). Uma revenda ausente do retorno não tem nenhum evento
 * registrado ainda (cobertura zero), o que é diferente de "zero saídas com cobertura
 * cheia"; o chamador deve tratar os dois casos como métricas distintas, não como zero.
 *
 * @param int[] $revendaIds
 * @return array<int, array{saidas_observadas:int, saidas_30d:int, cobertura_inicio:?string, cobertura_fim:?string, cobertura_dias:int}>
 */
function oper_concorrente_saidas_por_revenda(mysqli $conn, array $revendaIds): array {
    $revendaIds = array_values(array_unique(array_map('intval', $revendaIds)));
    if (!$revendaIds) return [];
    $placeholders = implode(',', array_fill(0, count($revendaIds), '?'));
    $stmt = $conn->prepare("SELECT a.revenda_id,
        SUM(CASE WHEN e.tipo_evento='saida_detectada' THEN 1 ELSE 0 END) saidas_observadas,
        SUM(CASE WHEN e.tipo_evento='saida_detectada'
                  AND e.dia_referencia>=DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) saidas_30d,
        MIN(e.dia_referencia) cobertura_inicio, MAX(e.dia_referencia) cobertura_fim
        FROM anuncio_evento e JOIN anuncio a ON a.id=e.anuncio_id
        WHERE a.revenda_id IN ($placeholders)
        GROUP BY a.revenda_id");
    if (!$stmt) throw new RuntimeException('Não foi possível preparar a agregação de saídas por revenda.');
    $stmt->bind_param(str_repeat('i', count($revendaIds)), ...$revendaIds);
    $stmt->execute();
    $res = $stmt->get_result();
    $mapa = [];
    while ($row = $res->fetch_assoc()) {
        $inicio = $row['cobertura_inicio'];
        $fim = $row['cobertura_fim'];
        $dias = ($inicio && $fim) ? max(1, (int)((strtotime($fim) - strtotime($inicio)) / 86400) + 1) : 0;
        $mapa[(int)$row['revenda_id']] = [
            'saidas_observadas' => (int)$row['saidas_observadas'],
            'saidas_30d' => (int)$row['saidas_30d'],
            'cobertura_inicio' => $inicio,
            'cobertura_fim' => $fim,
            'cobertura_dias' => $dias,
        ];
    }
    $stmt->close();
    return $mapa;
}
