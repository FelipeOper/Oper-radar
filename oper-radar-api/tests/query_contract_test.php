<?php
require_once __DIR__ . '/../lib/query_contract.php';

function confirma_query_contract($condicao, string $mensagem): void {
    if (!$condicao) throw new RuntimeException($mensagem);
}

$periodo = oper_periodo_contrato('90D');
confirma_query_contract($periodo === ['codigo' => '90d', 'dias' => 90, 'rotulo' => '90 dias'], 'periodo conhecido');
confirma_query_contract(oper_periodo_contrato('invalido')['codigo'] === '30d', 'fallback de periodo');

$fonte = ['ordem' => 'recente', 'uf' => 'PR', 'limit' => 60, 'offset' => 120];
$fingerprint = oper_query_fingerprint($fonte);
$cursor = oper_cursor_encode($fingerprint, 'recente', '2026-08-31 10:00:00', 123);
confirma_query_contract(oper_cursor_decode($cursor, $fingerprint, 'recente') === [
    'valor' => '2026-08-31 10:00:00', 'id' => 123,
], 'cursor valido');
confirma_query_contract(oper_cursor_decode($cursor, oper_query_fingerprint(['uf' => 'SC']), 'recente') === null, 'cursor nao cruza filtros');
confirma_query_contract(oper_cursor_decode($cursor, $fingerprint, 'movimento') === null, 'cursor nao cruza ordenacao');
confirma_query_contract(oper_cursor_decode('invalido!', $fingerprint, 'recente') === null, 'cursor malformado');

echo "query_contract_test=OK\n";
