<?php
/** Informa apenas se o Analista opcional está habilitado; nunca expõe a chave. */
require_once __DIR__ . '/config.php';
envia_json([
    'ativo' => defined('ANTHROPIC_API_KEY') && trim((string)ANTHROPIC_API_KEY) !== '',
    'motivo' => defined('ANTHROPIC_API_KEY') && trim((string)ANTHROPIC_API_KEY) !== ''
        ? null : 'Analista opcional desativado',
]);
