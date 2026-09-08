<?php
/**
 * Compatibilidade entre um item (Minha Loja) e o vínculo FIPE selecionado para ele.
 *
 * DAT01 (auditoria 07/09/2026, achado D01): "Minha Loja" aceitava qualquer
 * fipe_preco_id enviado pelo cliente, sem validar se ele correspondia ao veículo
 * cadastrado. Casos reais confirmados na auditoria:
 *   - item #8252633: DAF XF 480 6x2 2024 vinculado a uma referência FIPE de outro ano.
 *   - item #8318650: DAF XF105 460 8x2 2016 vinculado a "DAF 410 6x2" ano 2018.
 *
 * Este arquivo NÃO decide qual é o vínculo certo (isso é o algoritmo completo de
 * fase2-fipe/fipe_sync.py, que roda em lote). Ele faz apenas duas checagens baratas e
 * fortes, com o mesmo espírito de market_quality.php: um vínculo reprovado aqui
 * continua gravado no banco, mas deixa de alimentar comparativos até revisão.
 *
 *   1) Ano-modelo do item vs. ano_codigo da referência FIPE (fipe_preco.ano_codigo vem
 *      no formato "AAAA-N", ex. "2024-3" — N é o código de combustível da API FIPE).
 *   2) Para a marca DAF, o número de potência (ex. "480", "460") extraído do
 *      texto do item comparado ao nome do modelo FIPE — mesma regra usada pelo
 *      matching automático (fipe_sync.py: potencia_daf), reimplementada aqui em PHP
 *      só para esta validação pontual de leitura/gravação.
 */

/** Normaliza texto livre pra comparação: maiúsculas, sem acento, sem pontuação entre dígitos. */
function oper_fipe_normaliza(?string $s): string {
    $s = trim((string)$s);
    if ($s === '') return '';
    if (function_exists('iconv')) {
        $ascii = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s);
        if ($ascii !== false) $s = $ascii;
    }
    $s = strtoupper($s);
    $s = preg_replace('/(?<=\d)[.,-](?=\d)/', '', $s) ?? $s; // "11.180" -> "11180"
    $s = preg_replace('/[^A-Z0-9]+/', ' ', $s) ?? $s;
    return trim($s);
}

/** Remove trechos de ano-modelo/fabricação (ex. "2023/2024") pra não confundir com potência. */
function oper_fipe_texto_sem_anos(?string $s): string {
    $s = (string)$s;
    return preg_replace(
        '/\b(?:19|20)\d{2}\s*\/\s*(?:\d{2}|(?:19|20)\d{2})\b(?:\s*\(\s*(?:19|20)\d{2}\s*\))?/',
        ' ',
        $s
    ) ?? $s;
}

/**
 * Último número de três dígitos do texto (ignora "105", que identifica a geração XF105,
 * não a potência). Espelha fase2-fipe/fipe_sync.py:potencia_daf — mesma regra, mesma
 * ressalva do 105, pra não divergir do que o matching automático já usa em lote.
 */
function oper_fipe_potencia_daf(?string $s): ?string {
    if (!$s) return null;
    $texto = oper_fipe_normaliza(oper_fipe_texto_sem_anos($s));
    if (!preg_match_all('/(?<!\d)(\d{3})(?!\d)/', $texto, $m)) return null;
    $encontradas = array_values(array_filter($m[1], fn($n) => $n !== '105'));
    return $encontradas ? end($encontradas) : null;
}

/** Extrai o ano da referência FIPE a partir de "ano_codigo" (formato "AAAA-N"). */
function oper_fipe_ano_da_referencia(?string $anoCodigo): ?int {
    if (!$anoCodigo) return null;
    if (!preg_match('/^(\d{4})/', trim($anoCodigo), $m)) return null;
    return (int)$m[1];
}

/**
 * Avalia se o vínculo FIPE (marca/modelo/ano_codigo já buscados no banco) é compatível
 * com o item informado (marca/modelo/titulo/ano, no formato de meu_estoque ou anuncio).
 * Devolve ['compativel' => bool, 'motivos' => string[]]. Ausência de dado em qualquer
 * lado NUNCA é tratada como incompatibilidade — só divergência explícita bloqueia.
 */
function oper_fipe_vinculo_compativel(array $item, ?string $anoCodigoFipe, ?string $marcaFipe, ?string $modeloFipe): array {
    $motivos = [];

    $anoItem = isset($item['ano']) && $item['ano'] !== null && $item['ano'] !== ''
        ? (int)$item['ano'] : null;
    $anoFipe = oper_fipe_ano_da_referencia($anoCodigoFipe);
    if ($anoItem && $anoFipe && $anoItem !== $anoFipe) {
        $motivos[] = "ano-modelo do item ({$anoItem}) diverge do ano da referência FIPE vinculada ({$anoFipe})";
    }

    $marcaItem = oper_fipe_normaliza($item['marca'] ?? '');
    if ($marcaItem === 'DAF') {
        $textoItem = trim((string)($item['titulo'] ?? '') . ' ' . (string)($item['modelo'] ?? ''));
        $potItem = oper_fipe_potencia_daf($textoItem);
        $potFipe = oper_fipe_potencia_daf($modeloFipe);
        if ($potItem && $potFipe && $potItem !== $potFipe) {
            $motivos[] = "potência do item ({$potItem}) diverge do modelo FIPE vinculado ({$potFipe}: {$modeloFipe})";
        }
    }

    return ['compativel' => empty($motivos), 'motivos' => $motivos];
}
