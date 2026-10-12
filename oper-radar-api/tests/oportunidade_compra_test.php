<?php
require_once __DIR__ . '/../lib/oportunidade_compra.php';

function verifica(bool $ok, string $mensagem): void {
    if (!$ok) throw new RuntimeException($mensagem);
}

$agora = new DateTimeImmutable('2026-09-26 12:00:00');
$base = fn(array $extra = []) => array_merge([
    'id' => 1, 'url' => 'https://exemplo/1', 'titulo' => 'Volvo FH 540', 'marca' => 'Volvo', 'modelo' => 'FH 540', 'ano' => 2021,
    'preco' => 440000, 'preco_texto_bruto' => '', 'carroceria' => '', 'tipo' => 'Caminhao', 'preco_fipe' => 480000,
    'fipe_match_confianca' => 'alto', 'revenda_id' => 1, 'revenda' => 'Rev', 'cidade' => 'Curitiba', 'uf' => 'PR',
    'primeira_vez_visto' => '2026-07-28 08:00:00', 'reduziu_30d' => 0,
], $extra);

// --- pontuação do anúncio ---
$p = oper_compra_pontua_anuncio($base(), 480000.0, 70.0, $agora);
verifica($p['elegivel'] === true, 'anuncio valido e elegivel');
verifica($p['desvio_mediana_pct'] === -8.3, 'desvio vs mediana da praca');
verifica($p['desvio_fipe_pct'] === -8.3, 'desvio vs FIPE');
verifica($p['componentes']['preco_mediana']['peso'] == 35, 'pesos originais com FIPE');
verifica($p['pontuacao'] > 50, 'abaixo da mediana e da FIPE pontua bem');

$acima = oper_compra_pontua_anuncio($base(['preco' => 520000]), 480000.0, 70.0, $agora);
verifica($acima['pontuacao'] < $p['pontuacao'], 'preco acima da mediana pontua menos');
verifica($acima['componentes']['preco_mediana']['indice'] == 0.0, 'acima de 5% da mediana zera o componente de preco');

// Sinal de negociacao: reducao e tempo observado sobem a pontuacao, mas sem virar prova.
$neg = oper_compra_pontua_anuncio($base(['reduziu_30d' => 1]), 480000.0, 70.0, $agora);
verifica($neg['pontuacao'] > $p['pontuacao'], 'reducao recente aumenta o sinal de negociacao');
verifica($neg['componentes']['negociacao']['indice'] > $p['componentes']['negociacao']['indice'], 'componente de negociacao reflete a reducao');

// FIPE nao utilizavel (confianca baixa / implemento / ano antigo / nao caminhao): peso redistribuido, sem desvio FIPE.
$casos = [
    'confianca' => ['fipe_match_confianca' => 'medio'],
    'implemento' => ['carroceria' => 'Baú'],
    'ano' => ['ano' => 2005],
    'tipo' => ['tipo' => 'Carreta'],
];
foreach ($casos as $nome => $extra) {
    $sem = oper_compra_pontua_anuncio($base($extra), 480000.0, 70.0, $agora);
    verifica($sem['elegivel'] === true, "FIPE inutilizavel ($nome) nao exclui o anuncio");
    verifica($sem['desvio_fipe_pct'] === null && $sem['componentes']['preco_fipe']['indice'] === null, "sem desvio FIPE ($nome)");
    $soma = 0;
    foreach ($sem['componentes'] as $c) $soma += $c['peso'];
    verifica(abs($soma - 100) < 0.2, "pesos redistribuidos somam 100 ($nome)");
}

// Inelegiveis: preco ausente, condicao comercial, muito abaixo da FIPE, sem mediana.
verifica(oper_compra_pontua_anuncio($base(['preco' => 0]), 480000.0, 70.0, $agora)['elegivel'] === false, 'sem preco');
verifica(oper_compra_pontua_anuncio($base(['titulo' => 'Volvo FH entrada + parcelas']), 480000.0, 70.0, $agora)['elegivel'] === false, 'condicao comercial');
verifica(oper_compra_pontua_anuncio($base(['preco' => 90000]), 480000.0, 70.0, $agora)['elegivel'] === false, 'preco muito abaixo da FIPE (provavel erro)');
verifica(oper_compra_pontua_anuncio($base(), null, 70.0, $agora)['elegivel'] === false, 'sem mediana regional');
verifica(oper_compra_pontua_anuncio($base(), 0.0, 70.0, $agora)['elegivel'] === false, 'mediana zero');

// --- ranking por praça ---
function gera_anuncios(string $marca, string $modelo, int $ano, string $uf, int $n, int $precoBase, int &$id, int $revendaBase): array {
    $out = [];
    for ($i = 0; $i < $n; $i++) {
        $id++;
        $out[] = ['id' => $id, 'url' => "https://exemplo/$id", 'titulo' => "$marca $modelo", 'marca' => $marca, 'modelo' => $modelo, 'ano' => $ano,
            'preco' => $precoBase + $i * 2000, 'preco_texto_bruto' => '', 'carroceria' => '', 'tipo' => 'Caminhao', 'preco_fipe' => 480000,
            'fipe_match_confianca' => 'alto', 'revenda_id' => $revendaBase + ($i % 6), 'revenda' => 'Rev ' . ($revendaBase + ($i % 6)),
            'cidade' => 'Cidade', 'uf' => $uf, 'primeira_vez_visto' => '2026-08-15 08:00:00', 'reduziu_30d' => $i === 0 ? 1 : 0];
    }
    return $out;
}
$id = 0;
$anuncios = array_merge(
    gera_anuncios('Volvo', 'FH 540', 2021, 'PR', 12, 430000, $id, 100),
    gera_anuncios('Volvo', 'FH 540', 2021, 'SP', 20, 470000, $id, 200),
    gera_anuncios('Scania', 'R 450', 2020, 'PR', 12, 410000, $id, 300),
    gera_anuncios('DAF', 'XF 530', 2022, 'GO', 3, 500000, $id, 400) // grupo pequeno demais no Brasil
);
$saidas = [];
$saidas["VOLVO\0FH 540\0" . 2021] = ['PR' => [20, 25, 30, 40, 50, 60, 15, 18], 'SP' => [30, 35]];
$saidas["SCANIA\0R 450\0" . 2020] = ['PR' => [40, 45, 50, 55]];
$r = oper_compra_monta($anuncios, $saidas, true, 120, ['modelos_por_uf' => 2, 'anuncios_por_modelo' => 3], $agora);
$ufs = array_column($r, 'uf');
verifica(in_array('PR', $ufs, true) && in_array('SP', $ufs, true), 'PR e SP com recomendacao');
verifica(!in_array('GO', $ufs, true), 'grupo pequeno no Brasil nao entra no ranking');
$pr = array_values(array_filter($r, fn($x) => $x['uf'] === 'PR'))[0];
verifica(count($pr['modelos']) === 2, 'limite de modelos por UF');
verifica(count($pr['modelos'][0]['anuncios']) <= 3, 'limite de anuncios por modelo');
verifica($pr['modelos'][0]['indice']['publicavel'] === true, 'so praca publicavel');
foreach ($pr['modelos'] as $m) {
    verifica($m['comparaveis'] >= 5, 'amostra minima na praca');
    $pont = array_column($m['anuncios'], 'pontuacao');
    $ordenado = $pont;
    rsort($ordenado);
    verifica($pont === $ordenado, 'anuncios em ordem decrescente de pontuacao');
    foreach ($m['anuncios'] as $a) verifica($a['uf'] === 'PR', 'anuncio da propria praca');
}

// Filtro de UF nao muda o indice, so o recorte exibido.
$soSp = oper_compra_monta($anuncios, $saidas, true, 120, ['ufs' => ['SP']], $agora);
verifica(array_column($soSp, 'uf') === ['SP'], 'filtro por UF');

// Sem historico de eventos nao ha praca publicavel: nada de recomendacao inventada.
verifica(oper_compra_monta($anuncios, $saidas, false, 0, [], $agora) === [], 'sem trilha de eventos nao ha recomendacao');

// Universo fechado: 5 anuncios com implemento/ano antigo + 4 validos NAO formam praca publicavel (a amostra minima so conta comparaveis).
$id2 = 0;
$mistos = array_merge(
    gera_anuncios('Volvo', 'FH 460', 2020, 'MG', 4, 400000, $id2, 500),
    array_map(fn($a) => array_merge($a, ['carroceria' => 'Baú']), gera_anuncios('Volvo', 'FH 460', 2020, 'MG', 3, 400000, $id2, 510)),
    array_map(fn($a) => array_merge($a, ['ano' => 2004]), gera_anuncios('Volvo', 'FH 460', 2020, 'MG', 2, 400000, $id2, 520)),
    gera_anuncios('Volvo', 'FH 460', 2020, 'SP', 12, 405000, $id2, 530)
);
$saidas2 = ["VOLVO\0FH 460\0" . 2020 => ['MG' => [30, 40, 50, 60], 'SP' => [30, 35, 40, 45, 50]]];
$rm = oper_compra_monta($mistos, $saidas2, true, 120, [], $agora);
verifica(!in_array('MG', array_column($rm, 'uf'), true), 'MG com 4 validos + 5 fora do universo nao e publicavel');
verifica(in_array('SP', array_column($rm, 'uf'), true), 'SP com 12 validos publica');
// Carreta e outros tipos ficam fora.
verifica(oper_compra_monta(array_map(fn($a) => array_merge($a, ['tipo' => 'Carreta']), $anuncios), $saidas, true, 120, [], $agora) === [], 'so caminhao');

// URL do anuncio: so http/https chega ao link.
verifica(oper_compra_url_segura('https://exemplo.com/a') === 'https://exemplo.com/a', 'https passa');
verifica(oper_compra_url_segura('HTTP://exemplo.com/a') === 'HTTP://exemplo.com/a', 'http passa');
foreach (['javascript:alert(1)', 'data:text/html;base64,AAAA', '//exemplo.com', '', null, 'ftp://x'] as $ruim) {
    verifica(oper_compra_url_segura($ruim) === null, 'esquema nao permitido: ' . var_export($ruim, true));
}
$comUrlRuim = array_map(fn($a) => array_merge($a, ['url' => 'javascript:alert(1)']), $anuncios);
$rr = oper_compra_monta($comUrlRuim, $saidas, true, 120, [], $agora);
foreach ($rr as $u) foreach ($u['modelos'] as $m) foreach ($m['anuncios'] as $a) verifica($a['url'] === null, 'url insegura descartada na saida');

echo "oportunidade_compra_test=OK\n";
