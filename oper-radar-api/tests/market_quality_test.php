<?php
require_once __DIR__ . '/../lib/market_quality.php';

function verifica($condicao, string $mensagem): void {
    if (!$condicao) throw new RuntimeException($mensagem);
}

verifica(mercado_motivo_preco(19900, 315000, 'MB 1017', 'R$ 19.900') === 'preco muito abaixo da FIPE', 'extremo FIPE');
verifica(mercado_motivo_preco(90000, 300000, 'Entrada + parcelas', 'R$ 90.000') === 'condicao comercial especial', 'entrada');
verifica(mercado_motivo_preco(300000, 300000, 'Sem entrada aceita troca', 'R$ 300.000') === null, 'sem entrada');

$registros = [];
foreach ([100, 110, 120, 130, 140, 999] as $preco) {
    $registros[] = ['preco' => $preco, 'preco_fipe' => null, 'titulo' => '', 'preco_texto_bruto' => ''];
}
$stats = mercado_calcula_estatisticas($registros);
verifica($stats['amostra_qualificada'] === 5, 'IQR remove extremo');
verifica(abs($stats['mediana'] - 120.0) < 0.001, 'mediana');
verifica($stats['amostra_suficiente'] === true, 'amostra minima');
verifica(mercado_confianca(4) === 'insuficiente' && mercado_confianca(10) === 'media', 'confianca');

echo "market_quality_test=OK\n";
