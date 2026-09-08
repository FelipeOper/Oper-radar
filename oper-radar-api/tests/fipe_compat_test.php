<?php
require_once __DIR__ . '/../lib/fipe_compat.php';

function verifica_fipe_compat($condicao, string $mensagem): void {
    if (!$condicao) throw new RuntimeException($mensagem);
}

// Extração de potência DAF (mesma regra de fase2-fipe/fipe_sync.py:potencia_daf).
verifica_fipe_compat(oper_fipe_potencia_daf('DAF XF 480 6x2 2024') === '480', 'potencia 480');
verifica_fipe_compat(oper_fipe_potencia_daf('DAF XF105 460 8x2') === '460', 'potencia 460, ignora 105');
verifica_fipe_compat(oper_fipe_potencia_daf('DAF XF105 FTS') === null, 'sem numero de potencia');
verifica_fipe_compat(oper_fipe_potencia_daf(null) === null, 'texto nulo');

// Ano embutido no ano_codigo da FIPE ("AAAA-N").
verifica_fipe_compat(oper_fipe_ano_da_referencia('2024-3') === 2024, 'ano codigo com combustivel');
verifica_fipe_compat(oper_fipe_ano_da_referencia('2018-1') === 2018, 'ano codigo diferente');
verifica_fipe_compat(oper_fipe_ano_da_referencia(null) === null, 'ano codigo ausente');

// Caso real da auditoria (D01, item #8252633): DAF XF 480 6x2 2024 vinculado a uma
// referencia FIPE de outro ano-modelo.
$item8252633 = ['marca' => 'DAF', 'modelo' => 'XF 480 6x2', 'titulo' => 'DAF XF 480 6x2', 'ano' => 2024];
$r1 = oper_fipe_vinculo_compativel($item8252633, '2026-3', 'DAF', 'XF 480 FTT');
verifica_fipe_compat($r1['compativel'] === false, 'D01/#8252633: ano diferente deve reprovar');

// Caso real da auditoria (D01, item #8318650): DAF XF105 460 8x2 2016 vinculado a
// "DAF 410 6x2" ano 2018 — potencia E ano divergem.
$item8318650 = ['marca' => 'DAF', 'modelo' => 'XF105 460 8x2', 'titulo' => 'DAF XF105 460 8x2', 'ano' => 2016];
$r2 = oper_fipe_vinculo_compativel($item8318650, '2018-3', 'DAF', 'XF105 FTS 410');
verifica_fipe_compat($r2['compativel'] === false, 'D01/#8318650: potencia e ano devem reprovar');
verifica_fipe_compat(count($r2['motivos']) === 2, 'D01/#8318650: duas divergencias registradas');

// Vinculo coerente: mesma potencia, mesmo ano -> aprovado.
$itemOk = ['marca' => 'DAF', 'modelo' => 'XF 480 6x2', 'titulo' => 'DAF XF 480 6x2', 'ano' => 2024];
$r3 = oper_fipe_vinculo_compativel($itemOk, '2024-3', 'DAF', 'XF 480 FTT');
verifica_fipe_compat($r3['compativel'] === true, 'vinculo coerente deve aprovar');
verifica_fipe_compat($r3['motivos'] === [], 'vinculo coerente nao tem motivos');

// Dado ausente nunca vira incompatibilidade (evita falso positivo por falta de info).
$itemSemAno = ['marca' => 'DAF', 'modelo' => 'XF 480 6x2', 'titulo' => 'DAF XF 480 6x2', 'ano' => null];
$r4 = oper_fipe_vinculo_compativel($itemSemAno, null, 'DAF', 'XF 480 FTT');
verifica_fipe_compat($r4['compativel'] === true, 'sem ano do item nao reprova');

// Marca fora do escopo DAF: so a checagem de ano se aplica.
$itemVolvo = ['marca' => 'VOLVO', 'modelo' => 'FH 540', 'titulo' => 'VOLVO FH 540', 'ano' => 2020];
$r5 = oper_fipe_vinculo_compativel($itemVolvo, '2020-1', 'VOLVO', 'FH 540');
verifica_fipe_compat($r5['compativel'] === true, 'volvo com ano igual aprova sem checar potencia DAF');

echo "fipe_compat_test=OK\n";
