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
echo "concorrencia_metricas_test=OK\n";
