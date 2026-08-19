# OPER RADAR — API PHP

API do painel autenticado. As credenciais permanecem no arquivo protegido do servidor e
nunca devem ser incluídas em pacotes de deploy.

## Comparativos de preço

`lib/market_quality.php` centraliza a regra usada por anúncios, detalhe, FIPE, placa, Minha
Loja e insights:

- exclui preço ausente, entrada, parcela, leilão, lance, consórcio e mensalidade;
- rejeita valores incompatíveis com a FIPE e extremos pelo intervalo interquartil;
- calcula P25, mediana, P75 e confiança;
- exige cinco ofertas qualificadas antes de autorizar comparação ou oportunidade;
- preserva o anúncio no banco e nas buscas comuns, marcando apenas que o preço precisa de
  revisão para fins comparativos.

Os testes independentes estão em `tests/market_quality_test.php`.

## Eventos

`eventos.php` exige autenticação. Sem a migração `fase3-series/migrar_eventos.py`, responde
com `EVENTOS_NAO_MIGRADOS` e não tenta improvisar uma série.

## Compatibilidade

Durante a publicação gradual, campos antigos como `preco_medio_mercado`,
`giro_por_revenda` e `giro_confiavel` continuam presentes como aliases. As telas novas
preferem mediana, `movimento_por_revenda` e `idade_observada_confiavel`.
