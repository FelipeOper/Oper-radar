<?php
/** Informa se o Analista esta habilitado e por qual provedor; nunca expoe a chave. */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/ia_provedores.php';
$cfg = ia_config_ativa(conecta());
envia_json([
    'ativo' => $cfg !== null,
    'provedor' => $cfg['provedor'] ?? null,
    'modelo' => $cfg['modelo'] ?? null,
    'motivo' => $cfg !== null ? null : 'Nenhum provedor de IA configurado',
]);
