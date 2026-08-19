# OPER RADAR — API PHP

API do painel autenticado. As credenciais permanecem no arquivo protegido do servidor e
nunca devem ser incluídas em pacotes de deploy.

## Comparativos de preço

`lib/market_quality.php` centraliza a regra usada por anúncios, detalhe, FIPE, placa, Minha
Loja e insights:

- `minha_loja_detalhe.php?id=...`: detalhe pertencente ao usuário autenticado, edição pelo
  fluxo existente e comparação nacional/estadual somente com a mesma referência FIPE;
- a análise regional combina ofertas qualificadas, revendas, saídas observadas e tempo
  observado. Recomendações ficam indisponíveis quando a amostra ou o histórico não sustentam
  o nível mínimo de confiança;
- “saída observada” é ausência confirmada no portal, não venda comprovada, e os preços são
  anunciados, não valores de transação;

- exclui preço ausente, entrada, parcela, leilão, lance, consórcio e mensalidade;
- rejeita valores incompatíveis com a FIPE e extremos pelo intervalo interquartil;
- calcula P25, mediana, P75 e confiança;
- exige cinco ofertas qualificadas antes de autorizar comparação ou oportunidade;
- preserva o anúncio no banco e nas buscas comuns, marcando apenas que o preço precisa de
  revisão para fins comparativos.

Os testes independentes estão em `tests/market_quality_test.php`.

`lib/vehicle_taxonomy.php` normaliza a tração/configuração de eixos coletada e mantém o
mesmo contrato entre as facetas e a busca por `4x2`, `6x2`, `6x4`, `8x2` e demais valores
presentes no banco. A normalização possui teste independente em
`tests/vehicle_taxonomy_test.php`.

## Eventos

`eventos.php` exige autenticação. Sem a migração `fase3-series/migrar_eventos.py`, responde
com `EVENTOS_NAO_MIGRADOS` e não tenta improvisar uma série.

`lojista_detalhe.php` alimenta o painel de concorrentes. Quando `anuncio_evento` existe,
lista episódios de saída e reaparecimento; antes da migração, retorna um modo parcial usando
somente o status atual. Em ambos os casos a resposta declara que saída observada não comprova
venda. Preços resumidos passam pelas regras de qualidade de `lib/market_quality.php`.

## Compatibilidade

Durante a publicação gradual, campos antigos como `preco_medio_mercado`,
`giro_por_revenda` e `giro_confiavel` continuam presentes como aliases. As telas novas
preferem mediana, `movimento_por_revenda` e `idade_observada_confiavel`.
