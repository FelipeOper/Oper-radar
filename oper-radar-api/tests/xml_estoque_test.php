<?php
require_once __DIR__ . '/../lib/xml_estoque.php';

function confirma_xml($condicao, string $mensagem): void {
    if (!$condicao) throw new RuntimeException("Falhou: $mensagem");
}

$primeiro = simplexml_load_string('<veiculo><id>8451</id><titulo>DAF XF 530 6x4</titulo><marca>DAF</marca><modelo>XF FTT 530</modelo><anoModelo>2023</anoModelo><placa>ABC1D23</placa></veiculo>');
$segundo = simplexml_load_string('<veiculo><titulo>Novo título comercial</titulo><modelo>XF FTT 530</modelo><marca>DAF</marca><id>8451</id><anoModelo>2023</anoModelo></veiculo>');
$somentePlacaA = simplexml_load_string('<veiculo><placa>DEF-4G56</placa><modelo>R 450</modelo><marca>Scania</marca><preco>800000</preco></veiculo>');
$somentePlacaB = simplexml_load_string('<veiculo><placa>DEF4G56</placa><modelo>R 450</modelo><marca>Scania</marca><preco>790000</preco></veiculo>');
$itemA = xml_estoque_registro($primeiro, 0);
$itemB = xml_estoque_registro($segundo, 99);
$itemPlacaA = xml_estoque_registro($somentePlacaA, 2);
$itemPlacaB = xml_estoque_registro($somentePlacaB, 3);

confirma_xml($itemA['referencia_interna'] === '8451', 'ID do estoque');
confirma_xml($itemA['titulo'] === 'DAF XF 530 6x4', 'título separado');
confirma_xml($itemA['placa'] === 'ABC1D23', 'placa normalizada e preservada');
confirma_xml($itemA['modelo'] === 'XF FTT 530', 'modelo original preservado');
confirma_xml($itemA['identidade_origem'] === 'codigo_referencia', 'origem estável');
confirma_xml($itemA['origem_chave'] === $itemB['origem_chave'], 'mesmo ID mantém a mesma chave');
confirma_xml($itemA['data_entrada'] === null, 'data ausente não vira hoje');
confirma_xml($itemPlacaA['identidade_origem'] === 'placa', 'placa é a segunda identidade estável');
confirma_xml($itemPlacaA['origem_chave'] === $itemPlacaB['origem_chave'], 'mesma placa mantém a chave mesmo com mudança de preço');

$placaAntiga = xml_estoque_registro(simplexml_load_string('<veiculo><placa>GHI1234</placa><modelo>FH 540</modelo></veiculo>'), 4);
confirma_xml($placaAntiga['placa'] === 'GHI1234', 'placa antiga também é aceita');

// T21: allowlist http/https para url_anuncio e imagem_url (xml_estoque_url_http).
// URLs aceitas: devolve o valor aparado, sem normalizar (HTTP:// continua HTTP://).
$urlsBoas = [
    'https://a.com/x?y=1' => 'https://a.com/x?y=1',
    'HTTP://a.com/x' => 'HTTP://a.com/x',
    'HtTpS://a.com/x' => 'HtTpS://a.com/x',
    '  https://a.com/x  ' => 'https://a.com/x',
    "\thttps://a.com/x\n" => 'https://a.com/x',
    'https://a.com:8080/x#y' => 'https://a.com:8080/x#y',
    'https://a.com/javascript://x' => 'https://a.com/javascript://x', // esquema só vale no começo
];
foreach ($urlsBoas as $entrada => $esperada) {
    confirma_xml(xml_estoque_url_http($entrada) === $esperada, 'URL http/https aceita: ' . json_encode($entrada));
}
$limite = XML_ESTOQUE_URL_MAX;
$urlNoLimite = 'https://a.com/' . str_repeat('a', $limite - strlen('https://a.com/'));
confirma_xml(strlen($urlNoLimite) === $limite && xml_estoque_url_http($urlNoLimite) === $urlNoLimite, 'URL com exatamente 500 caracteres é aceita');

// URLs rejeitadas: esquemas perigosos ou não permitidos, relativas, credencial, controle e tamanho.
$urlsRuins = [
    'javascript://x.com/%0Aalert(1)', 'JaVaScRiPt://x.com/a', ' javascript://x.com/a',
    'data:text/html,x', 'data:image/png;base64,AAA', 'vbscript:x',
    'file:///etc/passwd', 'ftp://a.com/x', 'mailto:a@b.co',
    '//a.com', '/relativo', 'www.a.com/x', 'a.com/x', 'https:x.com', 'https:/a.com', 'https://', 'http://',
    'https://u:p@a.com/x', 'https://u@a.com/x', 'https://:@a.com/x', 'https://:p@a.com/x',
    'https://a.com/x y', "https://a.com/x\ty", "https://a.com/x\ny", "https://a.com/x\ry",
    "https://a.com/x\0y", "https://a.com/x\x7fy", "https://a.com/\0", "\0https://a.com/x", "https://a.com/x\x0b",
    'https://a.com/' . str_repeat('a', $limite), // 514 caracteres: descarta, não trunca
    '', '   ', 'texto qualquer',
];
foreach ($urlsRuins as $entrada) {
    confirma_xml(xml_estoque_url_http($entrada) === null, 'URL rejeitada: ' . json_encode($entrada));
}
foreach ([null, 123, 1.5, true, [], ['https://a.com/x']] as $naoTexto) {
    confirma_xml(xml_estoque_url_http($naoTexto) === null, 'valor que não é texto é rejeitado: ' . json_encode($naoTexto));
}

// T21 pelo caminho do XML: o valor passa por xml_estoque_texto (entidades decodificadas, espaço colapsado) antes da allowlist.
$comUrlRuim = xml_estoque_registro(simplexml_load_string('<veiculo><id>9001</id><modelo>FH 540</modelo><url>javascript://x.com/%0Aalert(1)</url><imagem>data:image/png;base64,AAA</imagem></veiculo>'), 5);
confirma_xml($comUrlRuim !== null && $comUrlRuim['url_anuncio'] === null && $comUrlRuim['imagem_url'] === null, 'link e imagem inválidos viram null e o veículo continua válido');
confirma_xml(array_keys($comUrlRuim['avisos']) === ['url_anuncio', 'imagem_url'], 'aviso para os dois campos descartados');
confirma_xml($comUrlRuim['referencia_interna'] === '9001' && $comUrlRuim['modelo'] === 'FH 540', 'demais campos do item ficam intactos');

$entidade = xml_estoque_registro(simplexml_load_string('<veiculo><id>9002</id><modelo>FH 540</modelo><url>&#106;avascript://x.com/a</url><foto>&#x6A;avascript://x.com/b</foto></veiculo>'), 6);
confirma_xml($entidade['url_anuncio'] === null && $entidade['imagem_url'] === null, 'entidade numérica que forma javascript:// também é descartada');

$comUrlBoa = xml_estoque_registro(simplexml_load_string('<veiculo><id>9003</id><modelo>FH 540</modelo><urlAnuncio>  HTTPS://exemplo.invalid/veiculo/3  </urlAnuncio><imagemPrincipal>https://exemplo.invalid/foto/3.jpg</imagemPrincipal></veiculo>'), 7);
confirma_xml($comUrlBoa['url_anuncio'] === 'HTTPS://exemplo.invalid/veiculo/3' && $comUrlBoa['imagem_url'] === 'https://exemplo.invalid/foto/3.jpg', 'links http/https válidos são gravados aparados');
confirma_xml($comUrlBoa['avisos'] === [], 'sem aviso quando os links são válidos');

$semLink = xml_estoque_registro(simplexml_load_string('<veiculo><id>9004</id><modelo>FH 540</modelo></veiculo>'), 8);
confirma_xml($semLink['url_anuncio'] === null && $semLink['imagem_url'] === null && $semLink['avisos'] === [], 'campo ausente não gera aviso');

$semEsquema = xml_estoque_registro(simplexml_load_string('<veiculo><id>9005</id><modelo>FH 540</modelo><link>www.exemplo.invalid/veiculo/5</link></veiculo>'), 9);
confirma_xml($semEsquema['url_anuncio'] === null && isset($semEsquema['avisos']['url_anuncio']), 'link sem esquema não ganha https:// e é descartado com aviso');

$comLimite = 'https://exemplo.invalid/' . str_repeat('a', 600);
$longo = xml_estoque_registro(simplexml_load_string('<veiculo><id>9006</id><modelo>FH 540</modelo><url>' . $comLimite . '</url></veiculo>'), 10);
confirma_xml($longo['url_anuncio'] === null && isset($longo['avisos']['url_anuncio']), 'link acima de 500 caracteres é descartado, não truncado');

// A identidade do item NÃO muda: continua vindo do $url cru, mesmo quando o link não é gravado (evita duplicar itens no próximo import).
$soUrlBoa = xml_estoque_registro(simplexml_load_string('<veiculo><modelo>FH 540</modelo><url>https://exemplo.invalid/veiculo/1</url></veiculo>'), 11);
confirma_xml($soUrlBoa['identidade_origem'] === 'url', 'sem referência nem placa, a URL é a identidade');
confirma_xml($soUrlBoa['origem_chave'] === hash('sha256', xml_estoque_chave('https://exemplo.invalid/veiculo/1')), 'origem_chave por URL boa igual à de antes da allowlist');
$soUrlRuim = xml_estoque_registro(simplexml_load_string('<veiculo><modelo>FH 540</modelo><url>javascript://x.com/a</url></veiculo>'), 12);
confirma_xml($soUrlRuim['identidade_origem'] === 'url' && $soUrlRuim['url_anuncio'] === null, 'URL rejeitada continua sendo a identidade, mas não é gravada');
confirma_xml($soUrlRuim['origem_chave'] === hash('sha256', xml_estoque_chave('javascript://x.com/a')), 'origem_chave por URL rejeitada continua derivada do valor cru (não muda)');

// Feed inteiro: urls_descartadas conta os campos anulados; o item com link ruim entra sem o link.
$feed = '<estoque><veiculo><id>1</id><modelo>FH 540</modelo><url>javascript://x.com/a</url></veiculo>'
    . '<veiculo><id>2</id><modelo>R 450</modelo><url>https://exemplo.invalid/veiculo/2</url></veiculo>'
    . '<veiculo><id>3</id><modelo>Actros</modelo><url>ftp://exemplo.invalid/3</url><imagem>mailto:a@b.co</imagem></veiculo></estoque>';
$leitura = xml_estoque_ler($feed);
confirma_xml(count($leitura['itens']) === 3 && $leitura['ignorados'] === 0, 'os três veículos entram, nenhum é ignorado por causa do link');
confirma_xml($leitura['urls_descartadas'] === 3, 'urls_descartadas conta os campos anulados (javascript, ftp e mailto)');
confirma_xml($leitura['itens'][0]['url_anuncio'] === null && $leitura['itens'][1]['url_anuncio'] === 'https://exemplo.invalid/veiculo/2', 'só o link válido é gravado');
$limpo = xml_estoque_ler('<estoque><veiculo><id>1</id><modelo>FH 540</modelo><url>https://exemplo.invalid/1</url></veiculo></estoque>');
confirma_xml($limpo['urls_descartadas'] === 0, 'feed sem link ruim tem urls_descartadas igual a 0');

echo "xml_estoque_test=OK\n";
