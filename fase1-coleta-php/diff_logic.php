<?php
/**
 * OPER RADAR — Fase 1 (versão PHP)
 * Lógica de diff entre coletas — porta 1:1 de diff_logic.py.
 *
 * Regra: ausente 1x -> removido_candidato (nao conta ainda);
 *        ausente 2x consecutivas -> removido_confirmado;
 *        reaparece entre a 1a e a 2a checagem -> volta pra ativo, contador zera.
 */

/**
 * @param array $estado_anterior [anuncio_portal_id => ['status'=>, 'misses_consecutivos'=>,
 *                                 'primeira_vez_visto'=>, 'ultima_vez_ativo'=>, 'data_remocao'=>]]
 * @param array $ids_ativos_agora IDs vistos na coleta atual (int[])
 * @param string $agora timestamp ISO8601 da coleta atual
 * @return array novo estado, mesmo formato de $estado_anterior
 */
function processa_diff(array $estado_anterior, array $ids_ativos_agora, string $agora): array {
    $novo_estado = [];

    // 1) IDs que continuam ou voltaram a aparecer
    foreach ($ids_ativos_agora as $anuncio_id) {
        $anterior = $estado_anterior[$anuncio_id] ?? null;
        if ($anterior === null) {
            $novo_estado[$anuncio_id] = [
                'status' => 'ativo', 'misses_consecutivos' => 0,
                'primeira_vez_visto' => $agora, 'ultima_vez_ativo' => $agora, 'data_remocao' => null,
            ];
        } else {
            // ativo de novo, mesmo que estivesse candidato a remoção — evita falso positivo
            $novo_estado[$anuncio_id] = [
                'status' => 'ativo', 'misses_consecutivos' => 0,
                'primeira_vez_visto' => $anterior['primeira_vez_visto'], 'ultima_vez_ativo' => $agora,
                'data_remocao' => null,
            ];
        }
    }

    // 2) IDs que sumiram desta coleta
    foreach ($estado_anterior as $anuncio_id => $anterior) {
        if (in_array($anuncio_id, $ids_ativos_agora, true)) {
            continue; // já tratado acima
        }
        if ($anterior['status'] === 'removido_confirmado') {
            $novo_estado[$anuncio_id] = $anterior; // já fechado
            continue;
        }

        $misses = $anterior['misses_consecutivos'] + 1;
        if ($misses >= 2) {
            $novo_estado[$anuncio_id] = [
                'status' => 'removido_confirmado', 'misses_consecutivos' => $misses,
                'primeira_vez_visto' => $anterior['primeira_vez_visto'],
                'ultima_vez_ativo' => $anterior['ultima_vez_ativo'],
                'data_remocao' => $anterior['ultima_vez_ativo'],
            ];
        } else {
            $novo_estado[$anuncio_id] = [
                'status' => 'removido_candidato', 'misses_consecutivos' => $misses,
                'primeira_vez_visto' => $anterior['primeira_vez_visto'],
                'ultima_vez_ativo' => $anterior['ultima_vez_ativo'], 'data_remocao' => null,
            ];
        }
    }
    return $novo_estado;
}

// ---- teste local, roda com: php diff_logic.php ----
if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    function resumo(array $estado): string {
        $partes = [];
        foreach ($estado as $id => $e) {
            $partes[] = "$id: {$e['status']}";
        }
        return '{' . implode(', ', $partes) . '}';
    }

    $t0 = strtotime('2026-07-01 07:00:00');

    $estado = processa_diff([], [100, 101, 102], date('c', $t0));
    echo "Coleta 1: " . resumo($estado) . "\n";

    $estado = processa_diff($estado, [100, 102], date('c', $t0 + 12 * 3600));
    echo "Coleta 2: " . resumo($estado) . "\n";

    $estado = processa_diff($estado, [100, 101, 102], date('c', $t0 + 24 * 3600));
    echo "Coleta 3 (101 reaparece): " . resumo($estado) . "\n";

    $estado = processa_diff($estado, [100, 101], date('c', $t0 + 36 * 3600));
    echo "Coleta 4 (102 some): " . resumo($estado) . "\n";

    $estado = processa_diff($estado, [100, 101], date('c', $t0 + 48 * 3600));
    echo "Coleta 5 (102 confirmado removido): " . resumo($estado) . "\n";
}
