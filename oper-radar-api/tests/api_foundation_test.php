<?php
require_once __DIR__ . '/../config.php';

function assert_true($condicao, string $mensagem): void {
    if (!$condicao) throw new RuntimeException($mensagem);
}

$primeiro = oper_request_id();
$segundo = oper_request_id();
assert_true($primeiro === $segundo, 'request_id deve ser estavel durante a requisicao');
assert_true((bool)preg_match('/^[A-Za-z0-9._:-]{8,80}$/', $primeiro), 'request_id deve ser seguro para header e log');

$meta = oper_api_meta(['amostra' => 42]);
assert_true($meta['request_id'] === $primeiro, 'meta deve reutilizar request_id');
assert_true($meta['api_version'] === '2026-08-31', 'versao da API deve estar explicita');
assert_true($meta['amostra'] === 42, 'meta adicional deve ser preservada');

assert_true(papel_tem_acesso('Admin', ['admin', 'gestor']), 'papel deve ser comparado sem diferenca de caixa');
assert_true(!papel_tem_acesso('visualizador', ['admin', 'gestor']), 'papel nao permitido deve ser recusado');

echo "api_foundation_test: ok\n";
