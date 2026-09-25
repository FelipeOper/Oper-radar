<?php
require_once __DIR__ . '/../lib/concorrencia_metricas.php';

function confere(bool $ok, string $mensagem): void {
    if (!$ok) throw new RuntimeException($mensagem);
}

$linhas = [];
foreach ([-10, -5, 0, 5, 10] as $pct) {
    $linhas[] = ['preco' => 100000 * (1 + $pct / 100), 'preco_fipe' => 100000,
        'titulo' => 'Caminhao', 'preco_texto_bruto' => '', 'fipe_match_status' => 'confirmado'];
}
$resultado = oper_concorrencia_desvio_fipe($linhas);
confere($resultado['desvio_fipe_mediano_pct'] === 0.0, 'mediana dos desvios');
confere($resultado['desvio_fipe_amostra'] === 5, 'amostra');
confere($resultado['desvio_fipe_confianca'] === 'baixa', 'confianca real');
confere(oper_concorrencia_desvio_fipe(array_slice($linhas, 0, 4))['desvio_fipe_mediano_pct'] === null,
    'nao publicar com menos de cinco precos');
$linhas[] = ['preco' => 20000, 'preco_fipe' => 100000, 'titulo' => 'Entrada de caminhao'];
$linhas[] = ['preco' => 100000, 'preco_fipe' => 100000, 'titulo' => 'Caminhao', 'fipe_match_status' => 'ambiguo'];
confere(oper_concorrencia_desvio_fipe($linhas)['desvio_fipe_amostra'] === 5,
    'excluir condicao comercial e FIPE ambigua');
// F0c: revenda com estoque antigo (<=2005) nao ganha desvio inflado; so os modelos recentes contam.
$antiga = [];
foreach ([1990, 1995, 2000, 2004, 2005] as $ano) $antiga[] = ['preco' => 300000, 'preco_fipe' => 100000, 'titulo' => 'VW', 'ano' => $ano, 'fipe_match_status' => 'confirmado'];
$r0 = oper_concorrencia_desvio_fipe($antiga);
confere($r0['desvio_fipe_amostra'] === 0 && $r0['desvio_fipe_mediano_pct'] === null, 'estoque so de modelos antigos nao publica desvio');
foreach ([2016, 2017, 2018, 2019, 2020] as $ano) $antiga[] = ['preco' => 101000, 'preco_fipe' => 100000, 'titulo' => 'VW', 'ano' => $ano, 'fipe_match_status' => 'confirmado'];
$r1 = oper_concorrencia_desvio_fipe($antiga);
confere($r1['desvio_fipe_amostra'] === 5 && $r1['desvio_fipe_mediano_pct'] === 1.0, 'so modelos recentes entram na mediana');
echo "concorrencia_metricas_test=OK\n";
