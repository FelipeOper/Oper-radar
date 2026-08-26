<?php
/**
 * Qualidade de preços e estatísticas robustas para anúncios vinculados à mesma FIPE.
 *
 * Um anúncio rejeitado aqui continua no banco e nas buscas comuns. Ele apenas deixa de
 * participar de comparativos e rankings até revisão.
 */

const OPER_RADAR_AMOSTRA_MINIMA = 5;
const OPER_RADAR_RAZAO_MIN_FIPE = 0.35;
const OPER_RADAR_RAZAO_MAX_FIPE = 2.50;

function mercado_texto_normalizado(string $texto): string {
    if (function_exists('iconv')) {
        $ascii = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $texto);
        if ($ascii !== false) $texto = $ascii;
    }
    return strtoupper(preg_replace('/\s+/u', ' ', trim($texto)) ?? '');
}

function mercado_motivo_preco($preco, $precoFipe, string $titulo = '', string $precoBruto = ''): ?string {
    $valor = (float)$preco;
    if ($valor <= 0) return 'preco ausente ou zero';

    $texto = mercado_texto_normalizado($titulo . ' ' . $precoBruto);
    $texto = preg_replace('/\bSEM\s+ENTRADA\b/', '', $texto) ?? $texto;
    if (preg_match('/\b(ENTRADA|PARCELAS?|LEILAO|LANCE|CONSORCIO|MENSALIDADE)\b|\bA\s+PARTIR\s+DE\b/', $texto)) {
        return 'condicao comercial especial';
    }

    $fipe = (float)$precoFipe;
    if ($fipe > 0) {
        $razao = $valor / $fipe;
        if ($razao < OPER_RADAR_RAZAO_MIN_FIPE) return 'preco muito abaixo da FIPE';
        if ($razao > OPER_RADAR_RAZAO_MAX_FIPE) return 'preco muito acima da FIPE';
    }
    return null;
}

function mercado_percentil(array $valores, float $percentil): ?float {
    if (!$valores) return null;
    sort($valores, SORT_NUMERIC);
    $n = count($valores);
    if ($n === 1) return (float)$valores[0];
    $posicao = max(0.0, min(1.0, $percentil)) * ($n - 1);
    $inferior = (int)floor($posicao);
    $superior = (int)ceil($posicao);
    if ($inferior === $superior) return (float)$valores[$inferior];
    $peso = $posicao - $inferior;
    return (float)$valores[$inferior] + ((float)$valores[$superior] - (float)$valores[$inferior]) * $peso;
}

function mercado_confianca(int $amostra): string {
    if ($amostra < OPER_RADAR_AMOSTRA_MINIMA) return 'insuficiente';
    if ($amostra < 10) return 'baixa';
    if ($amostra < 20) return 'media';
    return 'alta';
}

function mercado_calcula_estatisticas(array $registros): array {
    $precos = [];
    $abaixoFipe = 0;
    $rejeitadosIniciais = 0;
    foreach ($registros as $registro) {
        $motivo = mercado_motivo_preco(
            $registro['preco'] ?? null,
            $registro['preco_fipe'] ?? null,
            (string)($registro['titulo'] ?? ''),
            (string)($registro['preco_texto_bruto'] ?? '')
        );
        if ($motivo !== null) {
            $rejeitadosIniciais++;
            continue;
        }
        $valor = (float)$registro['preco'];
        $precos[] = $valor;
    }

    sort($precos, SORT_NUMERIC);
    $limiteInferior = null;
    $limiteSuperior = null;
    $robustos = $precos;
    if (count($precos) >= 4) {
        $p25Inicial = mercado_percentil($precos, 0.25);
        $p75Inicial = mercado_percentil($precos, 0.75);
        $iqr = $p75Inicial - $p25Inicial;
        if ($iqr > 0) {
            $limiteInferior = max(0, $p25Inicial - 1.5 * $iqr);
            $limiteSuperior = $p75Inicial + 1.5 * $iqr;
            $robustos = array_values(array_filter(
                $precos,
                fn($valor) => $valor >= $limiteInferior && $valor <= $limiteSuperior
            ));
        }
    }

    $amostra = count($robustos);
    $fipe = null;
    foreach ($registros as $registro) {
        if ((float)($registro['preco_fipe'] ?? 0) > 0) {
            $fipe = (float)$registro['preco_fipe'];
            break;
        }
    }
    if ($fipe !== null) {
        foreach ($robustos as $valor) if ($valor < $fipe) $abaixoFipe++;
    }

    return [
        'amostra_total' => count($registros),
        'amostra_qualificada' => $amostra,
        'amostra_suficiente' => $amostra >= OPER_RADAR_AMOSTRA_MINIMA,
        'excluidos' => $rejeitadosIniciais + count($precos) - $amostra,
        'confianca' => mercado_confianca($amostra),
        'menor' => $amostra ? (float)min($robustos) : null,
        'p25' => mercado_percentil($robustos, 0.25),
        'mediana' => mercado_percentil($robustos, 0.50),
        'p75' => mercado_percentil($robustos, 0.75),
        'maior' => $amostra ? (float)max($robustos) : null,
        'media' => $amostra ? array_sum($robustos) / $amostra : null,
        'abaixo_fipe' => $abaixoFipe,
        'limite_inferior' => $limiteInferior,
        'limite_superior' => $limiteSuperior,
    ];
}

function mercado_estatisticas_por_fipe(mysqli $conn, array $fipeIds): array {
    $ids = array_values(array_unique(array_filter(array_map('intval', $fipeIds), fn($id) => $id > 0)));
    if (!$ids) return [];

    $marcadores = implode(',', array_fill(0, count($ids), '?'));
    $st = $conn->prepare("SELECT a.fipe_preco_id, a.preco, a.titulo, a.preco_texto_bruto,
                                fp.preco AS preco_fipe
                         FROM anuncio a
                         JOIN fipe_preco fp ON fp.id=a.fipe_preco_id
                         WHERE a.status='ativo' AND a.preco IS NOT NULL AND a.preco>0
                           AND a.fipe_preco_id IN ($marcadores)");
    $tipos = str_repeat('i', count($ids));
    $st->bind_param($tipos, ...$ids);
    $st->execute();
    $res = $st->get_result();
    $grupos = array_fill_keys($ids, []);
    while ($row = $res->fetch_assoc()) {
        $grupos[(int)$row['fipe_preco_id']][] = $row;
    }
    $st->close();

    $saida = [];
    foreach ($grupos as $id => $registros) $saida[(int)$id] = mercado_calcula_estatisticas($registros);
    return $saida;
}

function mercado_aplica_estatisticas(array &$linha, ?array $stats, ?float $precoFipe = null): void {
    $stats = $stats ?: mercado_calcula_estatisticas([]);
    $linha['anuncios_comparaveis'] = (int)$stats['amostra_qualificada'];
    $linha['mercado_amostra_total'] = (int)$stats['amostra_total'];
    $linha['mercado_excluidos'] = (int)$stats['excluidos'];
    $linha['mercado_amostra_suficiente'] = (bool)$stats['amostra_suficiente'];
    $linha['mercado_confianca'] = $stats['confianca'];
    $linha['mercado_escopo'] = 'Brasil';
    $linha['preco_medio_mercado'] = $stats['media'];
    $linha['preco_mediana_mercado'] = $stats['mediana'];
    $linha['preco_p25_mercado'] = $stats['p25'];
    $linha['preco_p75_mercado'] = $stats['p75'];
    $linha['menor_preco_mercado'] = $stats['menor'];
    $linha['maior_preco_mercado'] = $stats['maior'];
    $linha['abaixo_fipe'] = (int)$stats['abaixo_fipe'];

    // Consumidores da API tratam estes campos como parte fixa do contrato. Anuncios
    // sem preco tambem precisam recebe-los para nao gerar warnings nem entrar em
    // comparativos como se o valor fosse valido.
    $linha['preco_qualidade_status'] = 'revisar';
    $linha['preco_qualidade_motivo'] = 'preco ausente';
    $linha['desvio_mercado_pct'] = null;

    $preco = isset($linha['preco']) ? (float)$linha['preco'] : null;
    $fipe = $precoFipe ?? (isset($linha['preco_fipe']) ? (float)$linha['preco_fipe'] : null);
    if ($preco !== null) {
        $motivo = mercado_motivo_preco(
            $preco,
            $fipe,
            (string)($linha['titulo'] ?? ''),
            (string)($linha['preco_texto_bruto'] ?? '')
        );
        if ($motivo === null && $stats['limite_inferior'] !== null
            && ($preco < $stats['limite_inferior'] || $preco > $stats['limite_superior'])) {
            $motivo = 'valor extremo na amostra equivalente';
        }
        $linha['preco_qualidade_status'] = $motivo === null ? 'valido' : 'revisar';
        $linha['preco_qualidade_motivo'] = $motivo;
        $linha['desvio_mercado_pct'] = $stats['mediana'] > 0
            ? round(($preco - $stats['mediana']) / $stats['mediana'] * 100, 1)
            : null;
    }
}
