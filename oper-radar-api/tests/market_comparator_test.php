<?php
require_once __DIR__ . '/../lib/market_quality.php';
require_once __DIR__ . '/../lib/market_comparator.php';

function confirma_comparador($condicao, string $mensagem): void {
    if (!$condicao) throw new RuntimeException($mensagem);
}

$marca = comparador_seletor(['a_modo' => 'marca', 'a_marca' => ' volvo ', 'a_modelo' => 'FH 540', 'a_ano' => '2023'], 'a');
confirma_comparador($marca === ['modo' => 'marca', 'marca' => 'VOLVO', 'modelo' => null, 'ano' => 2023], 'seletor por marca e ano');
$modelo = comparador_seletor(['b_modo' => 'modelo', 'b_modelo' => ' xf 530 ', 'b_ano' => '2022'], 'b');
confirma_comparador($modelo['marca'] === null && $modelo['modelo'] === 'XF 530', 'seletor por modelo');
$completo = comparador_seletor(['a_modo' => 'marca_modelo', 'a_marca' => 'DAF', 'a_modelo' => 'XF 530', 'a_ano' => '2021'], 'a');
[$where, $types, $params] = comparador_condicao($completo);
confirma_comparador(str_contains($where, "a.tipo='Caminhao'") && str_contains($where, 'COALESCE(a.ano_final,a.ano_inicial)=?') && $types === 'ssi', 'condicao segura com ano-modelo');
confirma_comparador($params === ['DAF', 'XF 530', 2021], 'parametros exatos');
confirma_comparador(comparador_rotulo(['marca' => 'VOLVO', 'modelo' => 'VOLVO FH 540', 'ano' => 2023]) === 'VOLVO FH 540 · 2023', 'nao duplica marca no rotulo');
confirma_comparador(comparador_rotulo(['marca' => 'DAF', 'modelo' => 'XF 530', 'ano' => 2021]) === 'DAF XF 530 · 2021', 'completa rotulo com ano');
confirma_comparador(comparador_seletor(['a_modo' => 'marca_modelo', 'a_marca' => 'DAF', 'a_modelo' => 'XF 530'], 'a') === null, 'ano obrigatorio');

$registros = [];
foreach ([400000, 450000, 500000, 550000, 600000, 9999999] as $i => $preco) {
    $registros[] = ['preco' => $preco, 'preco_fipe' => null, 'titulo' => '', 'preco_texto_bruto' => '',
        'revenda_id' => $i % 2 + 1, 'uf' => $i % 2 ? 'SC' : 'PR', 'dias_observados' => 10 + $i,
        'entrada_30d' => $i < 2, 'modelo' => $i % 2 ? 'FH 540' : 'FM 500'];
}
$resumo = comparador_resumo($registros, 3);
confirma_comparador($resumo['ativos'] === 6 && $resumo['revendas'] === 2 && $resumo['ufs'] === 2, 'volume');
confirma_comparador($resumo['precos']['amostra_qualificada'] === 5, 'remove extremo');
confirma_comparador($resumo['entradas_30d'] === 2 && $resumo['saidas_30d'] === 3, 'movimento');
$resumo90d = comparador_resumo([
    ['preco' => 500000, 'titulo' => '', 'preco_texto_bruto' => '', 'entrada_periodo' => 1],
], 4, ['codigo' => '90d', 'dias' => 90, 'rotulo' => '90 dias']);
confirma_comparador($resumo90d['periodo']['codigo'] === '90d', 'preserva periodo consultado');
confirma_comparador($resumo90d['entradas_periodo'] === 1 && $resumo90d['saidas_periodo'] === 4, 'movimento acompanha periodo');
confirma_comparador(comparador_diferenca(550000, 500000) === 10.0, 'diferenca percentual');

echo "market_comparator_test=OK\n";
