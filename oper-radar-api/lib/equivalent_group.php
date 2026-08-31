<?php
/** Estrutura opaca para grupos equivalentes enquanto a regra de negocio nao estiver aprovada. */

const OPER_GRUPO_EQUIVALENTE_VERSAO = 'rascunho-1';

function oper_grupo_equivalente_id($valor): ?string {
    $id = trim((string)$valor);
    if ($id === '' || strlen($id) > 120 || !preg_match('/^[A-Za-z0-9._:-]+$/', $id)) return null;
    return $id;
}

function oper_grupo_equivalente_contrato($id = null): array {
    return [
        'versao' => OPER_GRUPO_EQUIVALENTE_VERSAO,
        'id' => oper_grupo_equivalente_id($id),
        'status' => 'aguarda_definicao_negocio',
        'regras' => null,
        'calculavel' => false,
        'apto_para_recomendacao' => false,
    ];
}
