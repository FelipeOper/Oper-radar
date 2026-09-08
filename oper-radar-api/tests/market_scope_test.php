<?php
require_once __DIR__ . '/../lib/market_scope.php';

function confirma_escopo($condicao, string $mensagem): void {
    if (!$condicao) throw new RuntimeException($mensagem);
}

$ufRegiao = [
    'PR' => 'Sul', 'SC' => 'Sul', 'RS' => 'Sul',
    'SP' => 'Sudeste', 'RJ' => 'Sudeste',
];

confirma_escopo(painel_normaliza_ufs('todas', $ufRegiao) === [], 'todas vira lista vazia');
confirma_escopo(painel_normaliza_ufs('', $ufRegiao) === [], 'vazio vira lista vazia');
confirma_escopo(painel_normaliza_ufs('PR', $ufRegiao) === ['PR'], 'uf unica');
confirma_escopo(painel_normaliza_ufs('pr, sc', $ufRegiao) === ['PR', 'SC'], 'multiplas ufs, minuscula e espaco');
confirma_escopo(painel_normaliza_ufs('PR,PR,SC', $ufRegiao) === ['PR', 'SC'], 'remove duplicata');
confirma_escopo(painel_normaliza_ufs('PR,XX,SC', $ufRegiao) === ['PR', 'SC'], 'ignora sigla desconhecida');
confirma_escopo(painel_normaliza_ufs('123,PR', $ufRegiao) === ['PR'], 'ignora entrada invalida');

confirma_escopo(painel_regiao_unica([], $ufRegiao) === 'todas', 'lista vazia vira todas');
confirma_escopo(painel_regiao_unica(['PR'], $ufRegiao) === 'Sul', 'uma uf, uma regiao');
confirma_escopo(painel_regiao_unica(['PR', 'SC'], $ufRegiao) === 'Sul', 'duas ufs, mesma regiao');
confirma_escopo(painel_regiao_unica(['PR', 'SP'], $ufRegiao) === 'todas', 'ufs de regioes diferentes');

echo "market_scope_test=OK\n";
