# Estoque próprio por XML

O XML é importado em **Minha Loja > Importar XML**. O fluxo tem duas etapas:

1. o Radar analisa o arquivo e mostra uma amostra, sem alterar o banco;
2. o usuário confirma e os veículos são inseridos ou atualizados.

## Comportamento da sincronização

- A referência do veículo, o ID do integrador ou a placa identifica o mesmo item entre duas cargas.
- Reimportar o XML atualiza preço, status, localização e quilometragem sem duplicar o estoque.
- `Marcar ausentes como vendidos` vem desligado. Use somente quando o XML contiver todo o estoque atual.
- `Publicar no comparativo` inclui o veículo na comparação interna com FIPE e anúncios equivalentes.
- Placa e dados do feed permanecem atrás do login e não são expostos nas APIs públicas.
- DTD e entidades externas são recusadas; o limite por arquivo é de 20 MB e 10 mil veículos.

## Campos reconhecidos

O leitor aceita tags de registro como `veiculo`, `vehicle`, `anuncio`, `listing`, `produto` e `item`.
Também reconhece equivalentes em português e inglês:

| Dado | Exemplos de tags |
|---|---|
| Identificador | `referenciaInterna`, `codigoEstoque`, `stockId`, `vehicleId`, `id` |
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
