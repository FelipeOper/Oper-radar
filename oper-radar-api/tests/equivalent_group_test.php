<?php
require_once __DIR__ . '/../lib/equivalent_group.php';

function confirma_grupo_equivalente($condicao, string $mensagem): void {
    if (!$condicao) throw new RuntimeException($mensagem);
}

$contrato = oper_grupo_equivalente_contrato('pesados:540-530');
confirma_grupo_equivalente($contrato['id'] === 'pesados:540-530', 'preserva identificador opaco valido');
confirma_grupo_equivalente($contrato['regras'] === null, 'nao inventa regra de equivalencia');
confirma_grupo_equivalente(!$contrato['calculavel'] && !$contrato['apto_para_recomendacao'], 'bloqueia calculo e recomendacao');
confirma_grupo_equivalente(oper_grupo_equivalente_id('../invalido') === null, 'rejeita identificador inseguro');

echo "equivalent_group_test=OK\n";
