<?php
/**
 * Dados reais do modelo que o gestor perguntou, para o Analista IA responder com numeros do banco e nao com achismo.
 * As funcoes de interpretar a pergunta e calcular estatisticas sao puras (testaveis sem banco).
 */

function analista_normaliza(string $texto): string {
    $texto = strtr($texto, ['á'=>'a','à'=>'a','â'=>'a','ã'=>'a','ä'=>'a','é'=>'e','è'=>'e','ê'=>'e','í'=>'i','ì'=>'i','ó'=>'o','ò'=>'o','ô'=>'o','õ'=>'o','ú'=>'u','ù'=>'u','ç'=>'c',
        'Á'=>'A','À'=>'A','Â'=>'A','Ã'=>'A','É'=>'E','Ê'=>'E','Í'=>'I','Ó'=>'O','Ô'=>'O','Õ'=>'O','Ú'=>'U','Ç'=>'C']);
    return strtoupper(preg_replace('/\s+/', ' ', trim($texto)));
}

/** Apelidos de marca que o gestor usa na conversa. */
const ANALISTA_APELIDOS_MARCA = ['MB' => 'MERCEDES BENZ', 'MERCEDES' => 'MERCEDES BENZ', 'VW' => 'VOLKSWAGEN', 'MERCEDES-BENZ' => 'MERCEDES BENZ'];

/** Marca citada na pergunta, entre as marcas que existem no banco. null quando nao cita nenhuma. */
function analista_marca_da_pergunta(string $pergunta, array $marcas): ?string {
    $texto = ' ' . analista_normaliza($pergunta) . ' ';
    foreach (ANALISTA_APELIDOS_MARCA as $apelido => $marca) {
        if (preg_match('/[^A-Z0-9]' . preg_quote($apelido, '/') . '[^A-Z0-9]/', $texto)) {
            foreach ($marcas as $m) if (analista_normaliza($m) === $marca) return $m;
        }
    }
    foreach ($marcas as $m) {
        $n = analista_normaliza($m);
        if ($n !== '' && preg_match('/[^A-Z0-9]' . preg_quote($n, '/') . '[^A-Z0-9]/', $texto)) return $m;
    }
    return null;
}

/** Ano-modelo citado (1990-2035), numeros do modelo (3 a 5 digitos, fora o ano) e palavras da pergunta. */
function analista_tokens_pergunta(string $pergunta): array {
    $texto = analista_normaliza($pergunta);
    preg_match_all('/[A-Z0-9]+(?:-[A-Z0-9]+)?/', $texto, $m);
    $ano = null;
    $numeros = [];
    $palavras = [];
    foreach ($m[0] as $t) {
        $limpo = str_replace('-', '', $t);
        if (ctype_digit($limpo) && strlen($limpo) === 4 && (int)$limpo >= 1990 && (int)$limpo <= 2035) { $ano = $ano ?? (int)$limpo; continue; }
        if (ctype_digit($limpo) && strlen($limpo) >= 3 && strlen($limpo) <= 5) { $numeros[] = $limpo; continue; }
        if (preg_match('/^([A-Z]{1,3})(\d{3,5})$/', $limpo, $junto)) { $palavras[] = $junto[1]; $numeros[] = $junto[2]; continue; } // R450 -> R + 450
        if (preg_match('/^[A-Z]{1,8}$/', $limpo)) $palavras[] = $limpo;
    }
    return ['ano' => $ano, 'numeros' => array_values(array_unique($numeros)), 'palavras' => array_values(array_unique($palavras))];
}

/** Vocabulario de modelo: palavras (so letras) que aparecem nos modelos da marca. */
function analista_vocabulario_modelo(array $modelos): array {
    $vocab = [];
    foreach ($modelos as $modelo) {
        preg_match_all('/[A-Z]{1,8}/', analista_normaliza((string)$modelo), $m);
        foreach ($m[0] as $p) $vocab[$p] = true;
    }
    return array_keys($vocab);
}

/** Filtro do modelo: todos os numeros citados e as palavras que existem no vocabulario de modelo da marca. */
function analista_filtro_modelo(array $tokens, array $vocabulario): array {
    $mapa = array_flip($vocabulario);
    return ['numeros' => $tokens['numeros'], 'palavras' => array_values(array_filter($tokens['palavras'], fn($p) => isset($mapa[$p])))];
}

/** O anuncio (titulo + modelo) satisfaz o filtro? Palavra inteira, para 'R' nao casar com 'ROAD'. */
function analista_casa_modelo(string $titulo, string $modelo, array $filtro): bool {
    if (!$filtro['numeros'] && !$filtro['palavras']) return false;
    $alvo = ' ' . preg_replace('/[^A-Z0-9]+/', ' ', analista_normaliza($titulo . ' ' . $modelo)) . ' ';
    foreach ($filtro['numeros'] as $n) if (!str_contains($alvo, ' ' . $n . ' ') && !preg_match('/ [A-Z]{0,2}' . preg_quote($n, '/') . ' /', $alvo)) return false;
    foreach ($filtro['palavras'] as $p) if (!str_contains($alvo, ' ' . $p . ' ') && !preg_match('/ ' . preg_quote($p, '/') . '\d/', $alvo)) return false;
    return true;
}

function analista_percentil(array $ordenados, float $p): float {
    $n = count($ordenados);
    if ($n === 1) return (float)$ordenados[0];
    $pos = ($n - 1) * $p;
    $baixo = (int)floor($pos);
    $alto = (int)ceil($pos);
    return $ordenados[$baixo] + ($ordenados[$alto] - $ordenados[$baixo]) * ($pos - $baixo);
}

/** min, p25, mediana, p75, max e n de uma lista de precos (ignora vazio e <= 0). null sem dados. */
function analista_estatisticas(array $precos): ?array {
    $v = array_values(array_filter(array_map('floatval', $precos), fn($x) => $x > 0));
    if (!$v) return null;
    sort($v);
    return ['n' => count($v), 'min' => $v[0], 'p25' => analista_percentil($v, 0.25), 'mediana' => analista_percentil($v, 0.5),
            'p75' => analista_percentil($v, 0.75), 'max' => $v[count($v) - 1]];
}

function analista_brl(float $v): string { return 'R$ ' . number_format($v, 0, ',', '.'); }

function analista_faixa(?array $e): string {
    return $e ? analista_brl($e['min']) . ' a ' . analista_brl($e['max']) . ' (mediana ' . analista_brl($e['mediana']) . ', amostra ' . $e['n'] . ')' : 'sem preco informado';
}

/**
 * Monta o bloco de texto com os dados do modelo. $anuncios: linhas ja filtradas por marca+modelo, cada uma com
 * preco, ano, status, dias (observado), uf, cidade, titulo, preco_fipe (pode ser null), saida_90d (0/1).
 * Quando o gestor pergunta um ano-modelo, preco, FIPE, tempo, saidas, estados e exemplos so olham ESSE ano:
 * misturar anos produziria uma conta (ex.: FIPE de 2021 aplicada a um 2026) que nao existe.
 */
function analista_bloco_modelo(string $rotulo, ?int $ano, array $anuncios): string {
    $ativos = array_values(array_filter($anuncios, fn($a) => $a['status'] === 'ativo'));
    $txt = "DADOS DO MODELO ($rotulo" . ($ano ? ", ano-modelo $ano" : '') . "):\n";
    if (!$ativos && !array_filter($anuncios, fn($a) => !empty($a['saida_90d']))) {
        return $txt . "- Nenhum anuncio no Radar para esse recorte (ativo ou saido nos ultimos 90 dias).\n";
    }
    $porAno = [];
    foreach ($ativos as $a) $porAno[(int)$a['ano']][] = $a['preco'];
    krsort($porAno);
    $txt .= '- Ativos no Radar: ' . count($ativos) . ' no total'
        . ($porAno ? ' (' . implode(', ', array_map(fn($y, $p) => "$y: " . count($p), array_keys($porAno), $porAno)) . ')' : '') . ".\n";

    $recorte = $ano ? array_values(array_filter($anuncios, fn($a) => (int)$a['ano'] === $ano)) : $anuncios;
    $recAtivos = array_values(array_filter($recorte, fn($a) => $a['status'] === 'ativo'));
    $rotuloRec = $ano ? "ano-modelo $ano" : 'todos os anos';
    if ($ano && !$recAtivos) {
        $txt .= "- Ano-modelo $ano: NENHUM anuncio ativo no Radar. Nao ha preco de mercado observado para esse ano; so existe para os outros anos acima.\n";
        $outros = [];
        foreach ($porAno as $y => $p) { $e = analista_estatisticas($p); if ($e) $outros[] = "$y: mediana " . analista_brl($e['mediana']) . " (amostra {$e['n']})"; }
        if ($outros) $txt .= '- Referencia de OUTROS anos (nao serve como preco do ' . $ano . '): ' . implode('; ', array_slice($outros, 0, 4)) . ".\n";
    } else {
        $txt .= "- Preco ($rotuloRec): " . analista_faixa(analista_estatisticas(array_column($recAtivos, 'preco'))) . ".\n";
        $comFipe = array_values(array_filter($recAtivos, fn($a) => !empty($a['preco_fipe']) && $a['preco'] > 0));
        if ($comFipe) {
            $desvios = array_map(fn($a) => ($a['preco'] / $a['preco_fipe'] - 1) * 100, $comFipe);
            sort($desvios);
            $fipes = analista_estatisticas(array_column($comFipe, 'preco_fipe'));
            $txt .= "- FIPE ($rotuloRec): " . count($comFipe) . ' anuncio(s) com vinculo, FIPE ' . analista_brl($fipes['mediana']) . '; preco anunciado fica '
                . number_format(analista_percentil($desvios, 0.5), 1, ',', '.') . "% em relacao a FIPE (mediana). Vinculo pode ser aproximado.\n";
        } else {
            $txt .= "- FIPE ($rotuloRec): nenhum anuncio com vinculo FIPE; sem referencia FIPE confiavel.\n";
        }
        $dias = array_map('floatval', array_column($recAtivos, 'dias'));
        sort($dias);
        $txt .= "- Tempo no Radar ($rotuloRec): mediana " . (int)analista_percentil($dias, 0.5) . ' dias.';
        $ufs = [];
        foreach ($recAtivos as $a) $ufs[$a['uf'] ?? '?'] = ($ufs[$a['uf'] ?? '?'] ?? 0) + 1;
        arsort($ufs);
        $txt .= ' Estados: ' . implode(', ', array_map(fn($u, $n) => "$u $n", array_keys(array_slice($ufs, 0, 5, true)), array_slice($ufs, 0, 5, true))) . ".\n";
        usort($recAtivos, fn($a, $b) => ($a['preco'] <=> $b['preco']));
        foreach (array_slice($recAtivos, 0, 4) as $a) {
            $txt .= '  * ' . mb_substr((string)$a['titulo'], 0, 50) . ' | ' . ($a['preco'] > 0 ? analista_brl((float)$a['preco']) : 'sem preco') . ' | ' . ($a['cidade'] ?? '?') . '/' . ($a['uf'] ?? '?') . "\n";
        }
    }
    $saidas = count(array_filter($recorte, fn($a) => !empty($a['saida_90d'])));
    $txt .= "- Saidas detectadas em 90 dias ($rotuloRec): $saidas (ausencia confirmada em duas coletas; nao prova venda).\n";
    return $txt;
}
