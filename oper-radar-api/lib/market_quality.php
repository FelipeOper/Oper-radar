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
// F0c (24/09/2026, 5.400 vinculados): mediana do desvio vs FIPE = +77,8% (<=2005), +10,9% (2006-2015), +1,0% (>=2016).
// Para modelos ate 2005 a FIPE nao e referencia confiavel do preco anunciado; ficam fora dos desvios AGREGADOS
// (o comparativo anuncio a anuncio continua disponivel). Ano desconhecido tambem fica de fora.
const OPER_RADAR_ANO_MINIMO_FIPE = 2006;
// F0d (25/09/2026, 5.135 vinculados de 2006+): a FIPE precifica o veiculo SEM implemento. Com implemento (bau, cacamba, munck,
// tanque...) o desvio fica deslocado para cima (36% entre +20% e +90% contra 5% em cavalo/chassi; cauda >+90% de 4,96% contra 0,40%).
// So cavalo/chassi (ou carroceria nao informada) entra no desvio AGREGADO da FIPE.

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

/**
 * Trecho SQL que restringe as estatisticas aos vinculos FIPE de confianca alta.
 * Usado por comparativos que ja selecionam candidatos so com vinculo alto: sem isso a mediana
 * misturaria vinculos fracos e a amostra exibida nao corresponderia ao criterio do insight.
 */
function mercado_sql_confianca_fipe(bool $apenasConfiancaAlta): string {
    return $apenasConfiancaAlta ? " AND a.fipe_match_confianca='alto'" : '';
}

function mercado_estatisticas_por_fipe(mysqli $conn, array $fipeIds, bool $apenasConfiancaAlta = false, ?int $anoMinimo = null, bool $semImplemento = false): array {
    $ids = array_values(array_unique(array_filter(array_map('intval', $fipeIds), fn($id) => $id > 0)));
    if (!$ids) return [];

    $marcadores = implode(',', array_fill(0, count($ids), '?'));
    $st = $conn->prepare("SELECT a.fipe_preco_id, a.preco, a.titulo, a.preco_texto_bruto,
                                fp.preco AS preco_fipe
                         FROM anuncio a
                         JOIN fipe_preco fp ON fp.id=a.fipe_preco_id
                         WHERE a.status='ativo' AND a.preco IS NOT NULL AND a.preco>0
                           AND a.fipe_preco_id IN ($marcadores)" . mercado_sql_confianca_fipe($apenasConfiancaAlta) . mercado_sql_ano_minimo($anoMinimo) . ($semImplemento ? mercado_sql_carroceria_comparavel() : ''));
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

/** O ano-modelo permite comparar com a FIPE? Falha FECHADA: sem a chave 'ano', ano nulo ou <= 2005 nao e comparavel. */
function mercado_ano_comparavel_fipe(array $registro): bool {
    $ano = (int)($registro['ano'] ?? 0);
    return $ano >= OPER_RADAR_ANO_MINIMO_FIPE;
}

/**
 * Carrocerias canonicas comparaveis com a FIPE (valores do portal): o veiculo SEM implemento. Lista EXATA de proposito:
 * texto misto ("Cavalo Mecanico com Bau", "Chassi + Munck") nao entra. Sem iconv/translit (varia por servidor): o acento de
 * "Mecanico" e coberto por um caractere curinga, como no LIKE do SQL equivalente.
 */
const OPER_RADAR_CARROCERIAS_FIPE = ['CHASSIS', 'CHASSI'];

/** A carroceria permite comparar com a FIPE? Falha FECHADA: sem a chave 'carroceria' nao e comparavel. Vazio ou valor canonico e. */
function mercado_carroceria_comparavel_fipe(array $registro): bool {
    if (!array_key_exists('carroceria', $registro)) return false;
    $valor = trim((string)($registro['carroceria'] ?? ''));
    if ($valor === '') return true;
    $valor = function_exists('mb_strtoupper') ? mb_strtoupper($valor, 'UTF-8') : strtoupper($valor);
    if (in_array($valor, OPER_RADAR_CARROCERIAS_FIPE, true)) return true;
    return preg_match('/^CAVALO MEC.{1,2}NICO$/u', $valor) === 1;
}

/** Universo validado pela F0d: so caminhao. Falha FECHADA: sem a chave 'tipo' nao e comparavel. */
function mercado_tipo_comparavel_fipe(array $registro): bool {
    return ($registro['tipo'] ?? null) === 'Caminhao';
}

/** Trecho SQL equivalente (alias a): tipo Caminhao e carroceria vazia ou canonica. O '%' cobre o acento de "Mecânico" em qualquer collation. */
function mercado_sql_carroceria_comparavel(): string {
    return " AND a.tipo='Caminhao' AND (a.carroceria IS NULL OR TRIM(a.carroceria)='' OR UPPER(TRIM(a.carroceria)) LIKE 'CAVALO MEC%NICO'"
        . " OR UPPER(TRIM(a.carroceria)) IN ('CHASSIS','CHASSI'))";
}

/** Trecho SQL que restringe estatisticas a anuncios de ano-modelo >= $anoMinimo (null = sem restricao). $anoMinimo e int do codigo. */
function mercado_sql_ano_minimo(?int $anoMinimo): string {
    return $anoMinimo === null ? '' : ' AND COALESCE(a.ano_final,a.ano_inicial) >= ' . (int)$anoMinimo;
}

/** Desvios percentuais (preco anunciado vs. FIPE) dos registros validos: mesmo filtro de mercado_motivo_preco. */
function mercado_desvios_fipe(array $registros): array {
    $desvios = [];
    foreach ($registros as $registro) {
        $preco = (float)($registro['preco'] ?? 0);
        $fipe = (float)($registro['preco_fipe'] ?? 0);
        if ($fipe <= 0 || !mercado_ano_comparavel_fipe($registro) || !mercado_carroceria_comparavel_fipe($registro) || !mercado_tipo_comparavel_fipe($registro)) continue;
        $motivo = mercado_motivo_preco(
            $registro['preco'] ?? null, $registro['preco_fipe'] ?? null,
            (string)($registro['titulo'] ?? ''), (string)($registro['preco_texto_bruto'] ?? '')
        );
        if ($motivo !== null) continue;
        $desvios[] = ($preco - $fipe) / $fipe * 100;
    }
    return $desvios;
}

/** Quantos precos validos com FIPE sustentam o desvio medio. */
function mercado_desvio_fipe_amostra(array $registros): int {
    return count(mercado_desvios_fipe($registros));
}

/** Media dos desvios; null abaixo da amostra minima (uma unica observacao nao representa o recorte). */
function mercado_desvio_fipe_medio_pct(array $registros): ?float {
    $desvios = mercado_desvios_fipe($registros);
    if (count($desvios) < OPER_RADAR_AMOSTRA_MINIMA) return null;
    return round(array_sum($desvios) / count($desvios), 1);
}

/**
 * Mediana dos desvios (preco anunciado vs. FIPE). Robusta a vinculos FIPE suspeitos: a medicao F0b de 24/09/2026 achou
 * 4,4% dos comparaveis acima de +90%, o que inflava a media. null abaixo da amostra minima.
 */
function mercado_desvio_fipe_mediano_pct(array $registros): ?float {
    return mercado_mediana_com_amostra_minima(mercado_desvios_fipe($registros));
}

/** Mediana (1 casa) so com a amostra minima de 5 observacoes; abaixo disso null. Uma unica regra para todo desvio agregado. */
function mercado_mediana_com_amostra_minima(array $valores): ?float {
    if (count($valores) < OPER_RADAR_AMOSTRA_MINIMA) return null;
    $mediana = mercado_percentil($valores, 0.5);
    return $mediana === null ? null : round($mediana, 1);
}
