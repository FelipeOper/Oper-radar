<?php
require_once __DIR__ . '/../lib/analista_contexto.php';

function verifica($condicao, string $mensagem): void {
    if (!$condicao) throw new RuntimeException($mensagem);
}

$marcas = ['VOLVO', 'SCANIA', 'MERCEDES BENZ', 'VOLKSWAGEN', 'DAF', 'IVECO'];

// marca da pergunta
verifica(analista_marca_da_pergunta('Quero vender um VOLVO fh 540 2026', $marcas) === 'VOLVO', 'volvo');
verifica(analista_marca_da_pergunta('quanto vale um MB 2651?', $marcas) === 'MERCEDES BENZ', 'apelido MB');
verifica(analista_marca_da_pergunta('preço do Mercedes-Benz Actros', $marcas) === 'MERCEDES BENZ', 'mercedes-benz');
verifica(analista_marca_da_pergunta('vw constellation 24280', $marcas) === 'VOLKSWAGEN', 'apelido VW');
verifica(analista_marca_da_pergunta('como estão as vendas?', $marcas) === null, 'sem marca');
verifica(analista_marca_da_pergunta('tem scanias baratas?', $marcas) === null, 'plural nao e a marca (evita falso positivo)');

// tokens
$t = analista_tokens_pergunta('Quero vender um VOLVO fh 540 2026');
verifica($t['ano'] === 2026 && $t['numeros'] === ['540'], 'ano e numero separados');
verifica(in_array('FH', $t['palavras'], true) && in_array('VOLVO', $t['palavras'], true), 'palavras');
$t = analista_tokens_pergunta('Scania R450 2019 ou R-440?');
verifica($t['ano'] === 2019 && $t['numeros'] === ['440'] || $t['numeros'] === ['440', '450'] || $t['numeros'] === ['450', '440'], 'numeros com letra colada');

// vocabulario e filtro: so palavras que existem como modelo da marca
$vocab = analista_vocabulario_modelo(['FH 540', 'FH 460', 'FM 370', 'VM 270']);
$f = analista_filtro_modelo(analista_tokens_pergunta('Quero vender um VOLVO fh 540 2026'), $vocab);
verifica($f['numeros'] === ['540'] && $f['palavras'] === ['FH'], 'VOLVO e QUERO nao entram no filtro; FH entra');

// casamento por palavra inteira
verifica(analista_casa_modelo('VOLVO FH 540 6X4 2024/2025', 'FH 540', $f), 'casa FH 540');
verifica(!analista_casa_modelo('VOLVO FH 460 6X2 2024', 'FH 460', $f), 'nao casa FH 460');
verifica(!analista_casa_modelo('VOLVO FM 540 8X4', 'FM 540', $f), 'nao casa FM 540');
verifica(analista_casa_modelo('SCANIA R450 A 6X2', 'R450', ['numeros' => ['450'], 'palavras' => ['R']]), 'R450 casa R + 450');
verifica(!analista_casa_modelo('SCANIA ROAD 450', '', ['numeros' => ['450'], 'palavras' => ['R']]), 'R nao casa ROAD');
verifica(!analista_casa_modelo('X', 'Y', ['numeros' => [], 'palavras' => []]), 'filtro vazio nao casa nada');

// estatisticas
$e = analista_estatisticas([100, 200, 300, 400, 500, 0, null]);
verifica($e['n'] === 5 && $e['min'] == 100 && $e['mediana'] == 300 && $e['max'] == 500 && $e['p25'] == 200 && $e['p75'] == 400, 'quartis');
verifica(analista_estatisticas([0, null]) === null, 'sem preco');
verifica(analista_estatisticas([123456])['mediana'] == 123456, 'um valor so');

// bloco
$ativo = fn($ano, $preco, $fipe = null, $uf = 'SP') => ['status' => 'ativo', 'ano' => $ano, 'preco' => $preco, 'preco_fipe' => $fipe, 'dias' => 20, 'uf' => $uf, 'cidade' => 'X', 'titulo' => 'VOLVO FH 540'];
$anuncios = [$ativo(2024, 800000, 780000), $ativo(2024, 820000, 780000, 'PR'), $ativo(2023, 700000), ['status' => 'removido_confirmado', 'saida_90d' => 1, 'ano' => 2022, 'preco' => 600000, 'dias' => 40, 'uf' => 'SP', 'cidade' => 'X', 'titulo' => 'VOLVO FH 540']];
$b = analista_bloco_modelo('VOLVO FH 540', 2026, $anuncios);
verifica(str_contains($b, 'ativos no Radar com esse modelo: 3'), 'conta so ativos');
verifica(str_contains($b, 'Nao ha anuncio desse ano-modelo no Radar'), 'avisa que nao ha o ano pedido (2026)');
verifica(str_contains($b, 'ano-modelo 2024: 2 anuncio'), 'estatistica por ano');
verifica(str_contains($b, 'FIPE: 2 anuncio'), 'fipe');
verifica(str_contains($b, 'Saidas detectadas em 90 dias: 1'), 'saidas');
$vazio = analista_bloco_modelo('VOLVO FH 999', null, []);
verifica(str_contains($vazio, 'Nenhum anuncio ativo encontrado'), 'sem dados diz que nao ha');

echo "analista_contexto_test ok\n";
