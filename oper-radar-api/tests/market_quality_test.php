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
verifica($stats['confianca_preco'] === 'baixa', 'confianca de preco usa amostra qualificada');
verifica($stats['confianca_volume'] === 'baixa', 'confianca de volume usa todas as observacoes');

$muitosSemPreco = array_fill(0, 20, ['preco' => null, 'preco_fipe' => null, 'titulo' => '', 'preco_texto_bruto' => '']);
$statsSemPreco = mercado_calcula_estatisticas($muitosSemPreco);
verifica($statsSemPreco['confianca_preco'] === 'insuficiente', 'volume nao cria confianca de preco');
verifica($statsSemPreco['confianca_volume'] === 'alta', 'volume tem confianca independente do preco');
verifica($statsSemPreco['mediana'] === null, 'sem preco confiavel permanece sem referencia');

$semPreco = ['preco' => null, 'titulo' => 'Sem preco', 'preco_texto_bruto' => null];
mercado_aplica_estatisticas($semPreco, null);
verifica($semPreco['preco_qualidade_status'] === 'revisar', 'status sem preco');
verifica($semPreco['preco_qualidade_motivo'] === 'preco ausente', 'motivo sem preco');
verifica(array_key_exists('desvio_mercado_pct', $semPreco) && $semPreco['desvio_mercado_pct'] === null, 'desvio sem preco');
verifica($semPreco['mercado_confianca_preco'] === 'insuficiente', 'contrato de confianca de preco');
verifica($semPreco['mercado_confianca_volume'] === 'insuficiente', 'contrato de confianca de volume');

echo "market_quality_test=OK\n";
