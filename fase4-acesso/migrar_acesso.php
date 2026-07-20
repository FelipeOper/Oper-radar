<?php
/** Execute no terminal do servidor: php migrar_acesso.php */
if (PHP_SAPI !== 'cli') exit("Somente terminal.\n");
require_once dirname(__DIR__) . '/oper-radar-api/config.php';
$conn = conecta();
$sql = file_get_contents(__DIR__ . '/migracao_acesso_minha_loja_mysql.sql');
if ($sql === false || !$conn->multi_query($sql)) {
    fwrite(STDERR, "Falha na migração: {$conn->error}\n");
    exit(1);
}
do {
    if ($res = $conn->store_result()) $res->free();
    if (!$conn->more_results()) break;
} while ($conn->next_result());
if ($conn->errno) {
    fwrite(STDERR, "Falha na migração: {$conn->error}\n");
    exit(1);
}
echo "Autenticação e Minha Loja: banco preparado.\n";
