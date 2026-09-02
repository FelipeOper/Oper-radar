<?php
/**
 * Normalizacao de UF/regiao para o escopo do painel de Mercado.
 * Funcoes puras (sem banco), extraidas de mercado_painel.php para permitir teste unitario.
 */

/**
 * Recebe o parametro bruto "uf" da querystring ("todas", "PR" ou "PR,SC") e devolve a
 * lista de siglas validas e unicas. Siglas desconhecidas (fora de $ufRegiao) sao ignoradas
 * silenciosamente -- o mesmo tratamento que o codigo anterior dava a uma UF invalida.
 */
function painel_normaliza_ufs(string $ufParametro, array $ufRegiao): array {
    $ufParametro = trim($ufParametro);
    if ($ufParametro === '' || strtolower($ufParametro) === 'todas') return [];
    $ufs = [];
    foreach (explode(',', $ufParametro) as $pedaco) {
        $sigla = strtoupper(trim($pedaco));
        if (preg_match('/^[A-Z]{2}$/', $sigla) && isset($ufRegiao[$sigla])) $ufs[] = $sigla;
    }
    return array_values(array_unique($ufs));
}

/**
 * Se todas as UFs selecionadas pertencerem a mesma regiao, devolve o nome dela; caso
 * contrario (ou lista vazia), devolve 'todas' -- nao ha regiao unica para representar o
 * escopo.
 */
function painel_regiao_unica(array $ufsSelecionadas, array $ufRegiao): string {
    if (!$ufsSelecionadas) return 'todas';
    $regioes = array_values(array_unique(array_map(fn($sigla) => $ufRegiao[$sigla] ?? null, $ufsSelecionadas)));
    return count($regioes) === 1 && $regioes[0] !== null ? $regioes[0] : 'todas';
}
