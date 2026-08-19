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

echo "xml_estoque_test=OK\n";
