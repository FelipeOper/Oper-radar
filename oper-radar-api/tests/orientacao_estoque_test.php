<?php
require_once __DIR__ . '/../lib/orientacao_estoque.php';

function verifica(bool $ok, string $mensagem): void {
    if (!$ok) throw new RuntimeException($mensagem);
}

$item = fn(array $extra = []) => array_merge(['preco_anunciado' => 450000, 'uf' => 'PR'], $extra);
$regiao = fn(string $uf, array $extra = []) => array_merge(['uf' => $uf, 'comparaveis' => 8, 'preco_mediano' => 450000, 'avaliacao' => ['publicavel' => true]], $extra);
$nacional = fn(array $extra = []) => array_merge(['amostra_suficiente' => true, 'preco_mediano' => 450000], $extra);

verifica(oper_loja_orienta_veiculo($item(['preco_anunciado' => 0]), $nacional(), [], null)['acao'] === 'sem_base', 'sem preco anunciado nao orienta');
verifica(oper_loja_orienta_veiculo($item(), null, [], null)['acao'] === 'sem_base', 'sem base nacional nem regional nao orienta');
verifica(oper_loja_orienta_veiculo($item(), $nacional(['amostra_suficiente' => false]), [], null)['acao'] === 'sem_base', 'amostra nacional insuficiente nao orienta');

$manterPropriaPraca = oper_loja_orienta_veiculo($item(), $nacional(['preco_mediano' => 999999]), [$regiao('PR')], null);
verifica($manterPropriaPraca['acao'] === 'manter', 'preco na faixa da propria praca: manter');
verifica($manterPropriaPraca['origem_base'] === 'propria_praca', 'usa a propria praca quando ela tem amostra, nao o nacional');
verifica($manterPropriaPraca['desvio_pct'] === 0.0, 'desvio zero quando preco == mediana');

verifica(oper_loja_orienta_veiculo($item(['preco_anunciado' => 420000]), $nacional(), [], null)['acao'] === 'manter', 'abaixo da faixa tambem e manter (competitivo)');

$semPropriaPraca = oper_loja_orienta_veiculo($item(), $nacional(['preco_mediano' => 450000]), [$regiao('PR', ['comparaveis' => 2])], null);
verifica($semPropriaPraca['origem_base'] === 'nacional', 'propria praca com amostra < 5 cai pro nacional');

$acimaSemAlternativa = oper_loja_orienta_veiculo($item(['preco_anunciado' => 500000]), $nacional(), [$regiao('PR')], null);
verifica($acimaSemAlternativa['acao'] === 'avaliar_reducao', 'acima da faixa sem praca melhor: avaliar reducao');
verifica($acimaSemAlternativa['desvio_pct'] === 11.1, 'desvio calculado corretamente');

$melhorOutraPraca = $regiao('SP', ['preco_mediano' => 495000]);
$acimaComAlternativa = oper_loja_orienta_veiculo($item(['preco_anunciado' => 500000]), $nacional(), [$regiao('PR'), $melhorOutraPraca], $melhorOutraPraca);
verifica($acimaComAlternativa['acao'] === 'avaliar_outra_praca', 'acima da faixa com praca melhor que sustenta preco proximo: avaliar outra praca');
verifica($acimaComAlternativa['uf_sugerida'] === 'SP', 'sugere a UF da melhor praca');

$melhorPracaFraca = $regiao('SP', ['preco_mediano' => 300000]); // sustenta preco bem menor: nao adianta mudar de praca
$acimaComAlternativaFraca = oper_loja_orienta_veiculo($item(['preco_anunciado' => 500000]), $nacional(), [$regiao('PR'), $melhorPracaFraca], $melhorPracaFraca);
verifica($acimaComAlternativaFraca['acao'] === 'avaliar_reducao', 'praca melhor que nao sustenta preco proximo nao vira sugestao de mudar de praca');

$melhorMesmaPraca = $regiao('PR');
$acimaMesmaPraca = oper_loja_orienta_veiculo($item(['preco_anunciado' => 500000]), $nacional(), [$regiao('PR')], $melhorMesmaPraca);
verifica($acimaMesmaPraca['acao'] === 'avaliar_reducao', 'melhor praca igual a propria nao vira sugestao de mudar de praca');

$melhorNaoPublicavel = $regiao('SP', ['preco_mediano' => 495000, 'avaliacao' => ['publicavel' => false]]);
$acimaSemPublicavel = oper_loja_orienta_veiculo($item(['preco_anunciado' => 500000]), $nacional(), [$regiao('PR'), $melhorNaoPublicavel], $melhorNaoPublicavel);
verifica($acimaSemPublicavel['acao'] === 'avaliar_reducao', 'praca melhor nao publicavel nao vira sugestao (sem amostra/historico suficiente)');

echo "orientacao_estoque_test=OK\n";
