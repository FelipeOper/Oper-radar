<?php
require_once __DIR__ . '/../lib/competitor_history.php';

function confirma_concorrente($condicao, string $mensagem): void {
    if (!$condicao) throw new RuntimeException($mensagem);
}

confirma_concorrente(oper_mediana_numerica([]) === null, 'mediana vazia');
confirma_concorrente(oper_mediana_numerica([10, 30, 20]) === 20.0, 'mediana ímpar');
confirma_concorrente(oper_mediana_numerica([10, 20, 30, 40]) === 25.0, 'mediana par');

$parcial = oper_concorrente_confianca(false, 120, 30);
confirma_concorrente($parcial['nivel'] === 'parcial', 'sem eventos não é alta');
$media = oper_concorrente_confianca(true, 45, 5);
confirma_concorrente($media['nivel'] === 'media', 'confiança média');
$alta = oper_concorrente_confianca(true, 100, 12);
confirma_concorrente($alta['nivel'] === 'alta', 'confiança alta');

echo "competitor_history_test=OK\n";
