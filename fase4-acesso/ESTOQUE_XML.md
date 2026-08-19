# Estoque próprio por XML

O XML é importado em **Minha Loja > Importar XML**. O fluxo tem duas etapas:

1. o Radar analisa o arquivo e mostra uma amostra, sem alterar o banco;
2. o usuário confirma e os veículos são inseridos ou atualizados.

## Comportamento da sincronização

- A referência do veículo ou o ID do integrador é a identidade principal; a placa reconcilia o mesmo veículo se o ID mudar entre duas cargas.
- Reimportar o XML atualiza título, preço, status, localização e quilometragem sem duplicar o estoque.
- A data de entrada nunca é avançada na atualização do mesmo ID: o Radar preserva a data mais antiga
  e, portanto, o tempo acumulado em estoque.
- Um vínculo FIPE escolhido manualmente é preservado nas próximas cargas do mesmo ID.
- `Marcar ausentes como vendidos` vem desligado. Use somente quando o XML contiver todo o estoque atual.
- `Publicar no comparativo` inclui o veículo na comparação interna com FIPE e anúncios equivalentes.
- Placa e dados do feed permanecem atrás do login e não são expostos nas APIs públicas.
- DTD e entidades externas são recusadas; o limite por arquivo é de 20 MB e 10 mil veículos.

## Campos reconhecidos

O leitor aceita tags de registro como `veiculo`, `vehicle`, `anuncio`, `listing`, `produto`, `item` e `ad`.
Também reconhece equivalentes em português e inglês:

O formato atual da loja (`ADS > AD`) é reconhecido diretamente, incluindo `ID`, `TITLE`, `PLATE`, `MAKE`, `MODEL`, `YEAR`, `FIPE`, `PRICE`, `MILEAGE`, localização e imagens. Placas antigas (`ABC1234`) e Mercosul (`ABC1D23`) são aceitas.

| Dado | Exemplos de tags |
|---|---|
| Identificador | `referenciaInterna`, `codigoEstoque`, `stockId`, `vehicleId`, `id` |
| Título | `titulo`, `title`, `descricao`, `description`, `nome` |
| Veículo | `marca`, `fabricante`, `make`, `modelo`, `model`, `versao` |
| Ano | `anoModelo`, `modelYear`, `ano` |
| Preço | `precoVenda`, `salePrice`, `preco`, `price`, `valor` |
| Local | `cidade`, `municipio`, `city`, `uf`, `estadoSigla` |
| Complementos | `placa`, `quilometragem`, `urlAnuncio`, `imagemPrincipal`, `codigoFipe` |

Se o feed usar nomes diferentes, inclua um pequeno exemplo anonimizado para acrescentar o mapeamento.

## Publicação no HostGator

Antes dos novos arquivos da API, execute uma vez:

```bash
cd /home1/pro93061/agenciaoper.com.br/oper-radar
set -a
. /home1/pro93061/.oper-radar.env
set +a
php fase4-acesso/migrar_xml_estoque.php
```

Depois publique `minha_loja.php`, `minha_loja_xml.php` e a pasta `oper-radar-api/lib`, além do frontend.
