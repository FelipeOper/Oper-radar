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

echo "xml_estoque_test=OK\n";
