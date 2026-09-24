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

$semPreco = ['preco' => null, 'titulo' => 'Sem preco', 'preco_texto_bruto' => null];
mercado_aplica_estatisticas($semPreco, null);
verifica($semPreco['preco_qualidade_status'] === 'revisar', 'status sem preco');
verifica($semPreco['preco_qualidade_motivo'] === 'preco ausente', 'motivo sem preco');
verifica(array_key_exists('desvio_mercado_pct', $semPreco) && $semPreco['desvio_mercado_pct'] === null, 'desvio sem preco');

// mercado_desvio_fipe_medio_pct: media percentual do desvio de preco vs. FIPE, so entre
// registros validos (mesmo filtro do mercado_motivo_preco).
verifica(mercado_desvio_fipe_medio_pct([]) === null, 'desvio fipe sem registros');
$semFipe = [['preco' => 100000, 'preco_fipe' => 0, 'titulo' => '', 'preco_texto_bruto' => '']];
verifica(mercado_desvio_fipe_medio_pct($semFipe) === null, 'desvio fipe ignora registro sem fipe');
$reg = fn($preco) => ['preco' => $preco, 'preco_fipe' => 100000, 'titulo' => '', 'preco_texto_bruto' => ''];
$extremo = ['preco' => 19900, 'preco_fipe' => 315000, 'titulo' => 'MB 1017', 'preco_texto_bruto' => 'R$ 19.900']; // rejeitado (extremo FIPE)

// Abaixo da amostra minima (5 precos validos) o desvio nao e exibido: uma observacao nao representa o recorte.
$poucos = [$reg(110000), $reg(90000), $extremo];
verifica(mercado_desvio_fipe_amostra($poucos) === 2, 'amostra do desvio ignora extremo rejeitado');
verifica(mercado_desvio_fipe_medio_pct($poucos) === null, 'desvio fipe abaixo da amostra minima e null');
verifica(mercado_desvio_fipe_medio_pct([$reg(110000)]) === null, 'desvio fipe com 1 preco e null');
$quatro = [$reg(110000), $reg(90000), $reg(105000), $reg(95000)];
verifica(mercado_desvio_fipe_medio_pct($quatro) === null, 'desvio fipe com 4 precos ainda e null');

$suficientes = [$reg(110000), $reg(90000), $reg(105000), $reg(95000), $reg(100000), $extremo];
verifica(mercado_desvio_fipe_amostra($suficientes) === 5, 'amostra do desvio conta so precos validos');
verifica(mercado_desvio_fipe_medio_pct($suficientes) === 0.0, 'desvio fipe media com amostra minima ignora extremo');
verifica(mercado_desvio_fipe_medio_pct([$reg(110000), $reg(110000), $reg(110000), $reg(110000), $reg(110000)]) === 10.0, 'desvio fipe media com 5 precos');

// Vinculo FIPE de confianca alta: o filtro de SQL so entra quando pedido, sem mudar os demais endpoints.
verifica(mercado_sql_confianca_fipe(false) === '', 'sql confianca fipe desligado nao filtra');
verifica(mercado_sql_confianca_fipe(true) === " AND a.fipe_match_confianca='alto'", 'sql confianca fipe ligado exige alto');

echo "market_quality_test=OK\n";
