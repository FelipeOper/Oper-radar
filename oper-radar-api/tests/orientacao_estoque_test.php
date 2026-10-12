<?php
require_once __DIR__ . '/../lib/orientacao_estoque.php';

function verifica(bool $ok, string $mensagem): void {
    if (!$ok) throw new RuntimeException($mensagem);
}

$item = fn(array $extra = []) => array_merge(['preco_anunciado' => 450000, 'uf' => 'PR'], $extra);
$regiao = fn(string $uf, array $extra = []) => array_merge(['uf' => $uf, 'comparaveis' => 8, 'preco_mediano' => 450000, 'avaliacao' => ['publicavel' => true]], $extra);
$nacional = fn(array $extra = []) => array_merge(['amostra_suficiente' => true, 'preco_mediano' => 450000], $extra);

verifica(oper_loja_orienta_veiculo($item(['preco_anunciado' => 0]), $nacional(), [])['acao'] === 'sem_base', 'sem preco anunciado nao orienta');
verifica(oper_loja_orienta_veiculo($item(), null, [])['acao'] === 'sem_base', 'sem base nacional nem regional nao orienta');
verifica(oper_loja_orienta_veiculo($item(), $nacional(['amostra_suficiente' => false]), [])['acao'] === 'sem_base', 'amostra nacional insuficiente nao orienta');

$manterPropriaPraca = oper_loja_orienta_veiculo($item(), $nacional(['preco_mediano' => 999999]), [$regiao('PR')]);
verifica($manterPropriaPraca['acao'] === 'manter', 'preco na faixa da propria praca: manter');
verifica($manterPropriaPraca['origem_base'] === 'propria_praca', 'usa a propria praca quando ela tem amostra, nao o nacional');
verifica($manterPropriaPraca['desvio_pct'] === 0.0, 'desvio zero quando preco == mediana');

verifica(oper_loja_orienta_veiculo($item(['preco_anunciado' => 420000]), $nacional(), [])['acao'] === 'manter', 'abaixo da faixa tambem e manter (competitivo)');

$semPropriaPraca = oper_loja_orienta_veiculo($item(), $nacional(['preco_mediano' => 450000]), [$regiao('PR', ['comparaveis' => 2])]);
verifica($semPropriaPraca['origem_base'] === 'nacional', 'propria praca com amostra < 5 cai pro nacional');

$acimaSemAlternativa = oper_loja_orienta_veiculo($item(['preco_anunciado' => 500000]), $nacional(), [$regiao('PR')]);
verifica($acimaSemAlternativa['acao'] === 'avaliar_reducao', 'acima da faixa sem praca melhor: avaliar reducao');
verifica($acimaSemAlternativa['desvio_pct'] === 11.1, 'desvio calculado corretamente');

$acimaComAlternativa = oper_loja_orienta_veiculo($item(['preco_anunciado' => 500000]), $nacional(), [$regiao('PR'), $regiao('SP', ['preco_mediano' => 495000])]);
verifica($acimaComAlternativa['acao'] === 'avaliar_outra_praca', 'acima da faixa com praca melhor que sustenta preco proximo: avaliar outra praca');
verifica($acimaComAlternativa['uf_sugerida'] === 'SP', 'sugere a UF da melhor praca');

$acimaComAlternativaFraca = oper_loja_orienta_veiculo($item(['preco_anunciado' => 500000]), $nacional(), [$regiao('PR'), $regiao('SP', ['preco_mediano' => 300000])]);
verifica($acimaComAlternativaFraca['acao'] === 'avaliar_reducao', 'praca melhor que nao sustenta preco proximo nao vira sugestao de mudar de praca');

$acimaMesmaPraca = oper_loja_orienta_veiculo($item(['preco_anunciado' => 500000]), $nacional(), [$regiao('PR')]);
verifica($acimaMesmaPraca['acao'] === 'avaliar_reducao', 'unica regiao e a propria praca: nao vira sugestao de mudar de praca');

$acimaSemPublicavel = oper_loja_orienta_veiculo($item(['preco_anunciado' => 500000]), $nacional(), [$regiao('PR'), $regiao('SP', ['preco_mediano' => 495000, 'avaliacao' => ['publicavel' => false]])]);
verifica($acimaSemPublicavel['acao'] === 'avaliar_reducao', 'praca melhor nao publicavel nao vira sugestao (sem amostra/historico suficiente)');

// Achado do Codex: a #1 do ranking geral pode ser a propria praca (ou nao sustentar o preco) enquanto OUTRA
// regiao mais abaixo no ranking, mas ainda elegivel, sustenta o preco. A funcao precisa olhar todas, nao so a #1.
$rankingComPropriaNoTopo = [
    $regiao('PR', ['avaliacao' => ['publicavel' => true, 'pontuacao' => 90]]), // #1 do ranking geral: a propria praca
    $regiao('MG', ['preco_mediano' => 300000, 'avaliacao' => ['publicavel' => true, 'pontuacao' => 60]]), // #2: nao sustenta o preco
    $regiao('SP', ['preco_mediano' => 495000, 'avaliacao' => ['publicavel' => true, 'pontuacao' => 40]]), // #3: sustenta, mas nao e a #1
];
$comMelhorGeralInutil = oper_loja_orienta_veiculo($item(['preco_anunciado' => 500000]), $nacional(), $rankingComPropriaNoTopo);
verifica($comMelhorGeralInutil['acao'] === 'avaliar_outra_praca', 'olha alem da #1 do ranking geral quando ela nao serve');
verifica($comMelhorGeralInutil['uf_sugerida'] === 'SP', 'acha a regiao elegivel mesmo nao sendo a #1 do ranking');

echo "orientacao_estoque_test=OK\n";
