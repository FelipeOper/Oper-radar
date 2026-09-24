# OPER RADAR — API PHP

API do painel autenticado. As credenciais permanecem no arquivo protegido do servidor e
nunca devem ser incluídas em pacotes de deploy.

`comparador.php` compara dois recortes de caminhões por marca, modelo ou marca + modelo.
Retorna estoque, revendas, entradas/saídas em 30 dias, tempo observado e estatísticas de
preço qualificadas. `anuncios.php` e `facetas.php` aceitam `mercado=principal|outros` para
isolar caminhões/implementos rodoviários dos segmentos secundários.

Todas as respostas produzidas por `envia_json()` preservam os campos legados e acrescentam
`_meta.request_id`, `_meta.api_version` e `_meta.generated_at`. O `request_id` também é
devolvido no header `X-Request-ID`. Operações restritas devem usar `exige_papel()` em vez de
repetir comparações de papel em cada endpoint.

`mercado_painel.php` é a API do painel analítico do Mercado. Aceita `periodo`, `regiao`,
`uf`, `cidade`, `segmento`, `marca`, `modelo` e `ano`; devolve resumo, geografia, grupos de
modelo e uma série por modelo selecionado. Nesta versão, um grupo é estritamente factual:
marca + modelo + ano-modelo exatos. O endpoint declara isso em `tipo_recorte` e nunca infere
equivalência comercial nem publica recomendação numérica com confiança insuficiente.

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

## Atualidade do estoque

`kpis.php` mantém `anuncios_ativos` para compatibilidade e expõe também o total, os ativos
revalidados e os herdados no ciclo de referência (`07h` ou `19h`). Um anúncio só conta como
revalidado quando sua revenda possui execução bem-sucedida naquele ciclo; a interface usa
essa parcela como número principal e declara separadamente qualquer estoque herdado.

## Tela "Hoje": movimento, insights e frescor da coleta

As regras vivem em `lib/hoje_painel.php` (funções puras, testadas em
`tests/hoje_painel_test.php`); os endpoints só consultam e orquestram.

- `hoje_stats.php` mantém todas as chaves antigas e acrescenta `feed` (entradas em 48 h,
  quedas de preço em 3 dias e saídas em 72 h, do mais recente ao mais antigo; entradas ficam
  limitadas à metade do feed), `ufs_saidas`, `insights` e `atualizado_em`. Cada insight traz
  `evidencia` (recorte, período, valor, base, amostra, confiança, atualização, explicação) e uma
  `acao` de navegação. Só existe insight que passa do mínimo de amostra da sua regra, e a
  confiança usa `mercado_confianca` (a regra real: 5/10/20 preços).
- Quedas de preço vêm dos eventos `mudanca_preco` de `anuncio_evento`; queda maior que 50% é
  descartada como provável erro de coleta. Sem a migração de eventos, o bloco fica em
  `parciais_indisponiveis` e o restante da tela continua.
- `frescor_coleta.php` (novo) classifica cada UF em `em_dia`, `parcial` (dentro do prazo, mas
  menos de 80% das revendas coletadas em 24 h), `atrasada` (mais de 24 h sem execução
  bem-sucedida) ou `sem_coleta` (nenhuma nos últimos 30 dias). Responde 503 se a consulta falhar;
  o cliente não deve interpretar a ausência de resposta como "coleta em dia".

Consultas novas são tolerantes: em PHP 8.1+ um erro de SQL lança exceção, então
`oper_hoje_consulta()` devolve `null` e o bloco é listado em `parciais_indisponiveis`.

Para rodar os testes PHP sem instalar nada: baixe o zip oficial de PHP 8.3 (NTS x64) de
`downloads.php.net`, confira o SHA-256 publicado em `releases.json` e execute
`php -d extension_dir=ext -d extension=mbstring tests/<nome>_test.php`.

## Mercado: oportunidade regional do modelo

`mercado_painel.php` devolve, dentro de `selecionado`, o bloco `oportunidade_regional` (só quando há
modelo selecionado). Ele compara as UFs onde aquele marca + modelo + ano aparece, com a regra de
`lib/regional_modelo.php` (a mesma da Minha Loja: pesos 30/20/20/15/15, confiança por amostra,
revendas, saídas e cobertura de eventos). UF com menos de 5 comparáveis, sem trilha de eventos ou com
menos de 7 dias de cobertura fica sem nota (`publicavel: false`). Se a consulta falhar, o campo vem
`null` e o restante do painel continua. Testes: `tests/regional_modelo_test.php`.

## Concorrência e lojista

`lojistas.php` preserva os campos anteriores e acrescenta `reducoes_30d` (quantidade de
anúncios com queda válida nos últimos 30 dias), `desvio_fipe_mediano_pct`,
`desvio_fipe_amostra` e `desvio_fipe_confianca`. `lojista_detalhe.php` acrescenta esses
campos ao `resumo`, além de `idade_media_estoque` e `idade_observada_confiavel`.
As quedas vêm de `anuncio_evento`, descartando reduções acima de 50% como provável erro;
sem a tabela de eventos, o valor é `null`, nunca zero. O desvio é a mediana dos desvios
individuais de preços válidos com FIPE inequívoca, publicado só com cinco ou mais preços.
As regras puras ficam em `lib/concorrencia_metricas.php`, cobertas por
`tests/concorrencia_metricas_test.php`. Saída observada continua sem comprovar venda.

## Regras de confiança da FIPE (revisão adversarial de 24/09/2026)

- `mercado_estatisticas_por_fipe($conn, $ids, $apenasConfiancaAlta = false)`: com `true`, a mediana e a
  amostra contam só anúncios com `fipe_match_confianca='alto'`. O insight "abaixo da FIPE" de
  `hoje_stats.php` usa `true`, para a mediana obedecer ao mesmo critério dos candidatos. Os demais
  chamadores mantêm o comportamento anterior (o filtro é opt-in via `mercado_sql_confianca_fipe`).
- `mercado_desvio_fipe_medio_pct` devolve `null` com menos de 5 preços válidos
  (`OPER_RADAR_AMOSTRA_MINIMA`); `mercado_desvio_fipe_amostra` conta esses preços.
  `mercado_painel.php` expõe `resumo.desvio_fipe_amostra` e `resumo.desvio_fipe_confianca`.
  Testes: `tests/market_quality_test.php`.

## Taxonomia do segmento Pesado (decisão de 24/09/2026)

`lib/market_taxonomy.php`: o mercado `principal` é só caminhão + implemento rodoviário (`Caminhao`, `Carreta`,
`Carroceria-sobre-chassi`, `Trailer`, `Implemento`); o resto forma o mercado `outros`, sem mistura (o cenário
agrícola fica separado). `Implementos-agricolas` é categoria agrícola. A categoria `outros` é o **complemento** das
demais (`oper_taxonomia_filtro_categoria` devolve `NOT IN`, e `oper_taxonomia_sql_categoria` inclui anúncio sem tipo): tipo não mapeado (ex.: `Aviao`) aparece em "outros"
tanto na contagem da faceta quanto ao abrir a categoria (`anuncios.php`, `facetas.php`, `lojista_detalhe.php`,
`mercado_painel.php?segmento=`). Ao surgir um tipo novo relevante, mapeie-o aqui e em `app/src/marketTaxonomy.js`. A comparação de tipo no SQL segue a collation da coluna (o coletor grava o slug canônico do portal).
Testes: `tests/market_taxonomy_test.php`. O espelho no frontend é `app/src/marketTaxonomy.js`.
