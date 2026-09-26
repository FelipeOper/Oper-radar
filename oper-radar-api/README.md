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

`oportunidades_compra.php` ("o que comprar" por região) monta duas camadas: por UF, os modelos (marca + modelo + ano) com melhor
índice regional (`lib/regional_modelo.php`) e, em cada um, os anúncios candidatos da UF com pontuação explicável (`lib/oportunidade_compra.php`,
testada em `tests/oportunidade_compra_test.php`). Aceita `uf` (lista), `modelos_por_uf` (1–10) e `anuncios_por_modelo` (1–20). Universo: caminhões
ativos **sem implemento** (carroceria vazia, cavalo ou chassi) de **2006 em diante** (com implemento o preço inclui o equipamento; até 2005 o preço
anunciado e a FIPE divergem demais: F0c/F0d), aplicado no SQL e de novo na lib, de modo que a amostra mínima só conta anúncios comparáveis. Resposta
em cache de arquivo por 10 minutos (o dado é o mesmo para todos e a montagem varre o estoque). O link do anúncio só sai se for http/https. Só entram grupos com 10+ anúncios no Brasil e praças publicáveis (5+ preços válidos e histórico de eventos); preço fora da faixa esperada,
condição comercial especial ou sem mediana da UF ficam de fora. Pesos: preço vs mediana da UF 35, vs FIPE 20 (só ano ≥ 2006, caminhão,
cavalo/chassi/vazio e vínculo `alto`; sem isso o peso é redistribuído), sinal de negociação 20 (redução de preço em 30 dias e tempo no radar), liquidez do
modelo na UF 15, qualidade 10. São candidatos à negociação, não "ideais": preço é anunciado e redução/tempo são sinais. Somente leitura.

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

## Importação de XML de estoque (Minha Loja)

`minha_loja_xml.php` lê o feed do lojista com `lib/xml_estoque.php`. Os links `url_anuncio` e
`imagem_url` vêm de terceiros e só são gravados se passarem por `xml_estoque_url_http()`:

- só `http` e `https` (esquema em qualquer caixa), com host, sem credencial embutida
  (`https://usuario:senha@host`, inclusive usuário ou senha vazios), sem espaço nem caractere de
  controle no meio e com no máximo 500 caracteres. Acima disso o link é descartado, nunca
  truncado, porque um link cortado aponta para outro lugar;
- `FILTER_VALIDATE_URL` sozinho não serve: aceita `javascript://host/...`, `file:///...`,
  `ftp://` e `mailto:`. Ele só entra como segunda checagem, depois do esquema;
- link inválido vira `null` e o veículo continua válido (a linha do feed não é rejeitada). O item
  ganha `avisos` (`url_anuncio` e/ou `imagem_url`, com texto genérico, sem o motivo detalhado) e a
  pré-visualização traz `resumo.urls_descartadas`, a contagem desses campos anulados nos veículos
  que seriam importados. `xml_estoque_ler()` devolve o mesmo total do arquivo inteiro, antes de
  descartar duplicados;
- o valor não é normalizado nem ganha `https://` na frente, e a API nunca busca a URL: link
  seguro para exibir não significa destino confiável;
- a identidade do veículo (`origem_chave`, usada quando não há referência nem placa) continua
  derivada do valor cru do XML, mesmo quando o link não é gravado. Trocar isso faria o próximo
  import duplicar os itens;
- registros já gravados em `meu_estoque` não são alterados por esta regra. Limpar ou filtrar na
  saída os links antigos é tarefa separada, primeiro só de leitura.

O front tem a própria checagem de href (`urlSegura` em `app/src/comprarModel.js`; a T09 a consolida em
um helper único). As duas regras seguem a mesma ideia, sem equivalência literal: o JavaScript
normaliza a URL e o PHP rejeita alguns formatos a mais.

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

## Recorte exato de modelo e ano em `anuncios.php`

`modelo` (comparação exata, sem caixa/espaços) e `ano_modelo` (`COALESCE(ano_final, ano_inicial)`, a mesma chave que
`mercado_painel.php` usa para agrupar) filtram a lista. O botão "Ver N ofertas" do Mercado envia marca + modelo +
ano_modelo para a lista bater com a contagem anunciada. Ambos entram no fingerprint do cursor (`$_GET` inteiro).

`mercado_painel.php` também devolve `resumo.desvio_fipe_mediano_pct` (mediana dos desvios, mesma amostra mínima de 5). O app do Mercado
mostra a **mediana**: a média (`desvio_fipe_medio_pct`, mantida por compatibilidade) é puxada pelos vínculos FIPE suspeitos que a
frente de saneamento mediu (4,4% dos comparáveis acima de +90%, 24/09/2026).

`insights.php` (KPI de FIPE da tela Análise) devolve `fipe.desvio_mediano_pct`, `desvio_amostra` e `desvio_confianca`; a mediana só existe com
5 ou mais desvios agregados (`mercado_mediana_com_amostra_minima`). O alias legado `desvio_medio_pct` foi removido (carregava a mediana sob nome de média).

**Ano-modelo mínimo para o desvio da FIPE** (`OPER_RADAR_ANO_MINIMO_FIPE = 2006`, `mercado_ano_comparavel_fipe`): a medição F0c (24/09/2026,
5.400 vinculados) mostrou mediana do desvio de +77,8% para modelos até 2005, +10,9% em 2006–2015 e +1,0% de 2016 em diante; até 2005 a FIPE
não é referência confiável do preço anunciado. Esses anúncios ficam fora dos desvios **agregados** (Panorama do Mercado, desvio por revenda,
KPI da Análise e o insight "abaixo da FIPE"); o comparativo anúncio a anúncio segue disponível. Consultas que alimentam essas contas passam `ano`.

**Só cavalo/chassi no desvio da FIPE** (`mercado_carroceria_comparavel_fipe`, `mercado_sql_carroceria_comparavel`): a F0d (25/09/2026, 5.135 vinculados de 2006+)
mostrou que a FIPE precifica o veículo sem implemento; com implemento (baú, caçamba, munck, tanque…) o desvio desloca para cima (36% entre +20% e +90%
contra 5% em cavalo/chassi; cauda >+90% de 4,96% contra 0,40%). Carroceria vazia também entra (0,77% de cauda). Lista **exata** de valores canônicos (`Cavalo Mecânico`, `Chassis`, `Chassi`; texto misto como "Cavalo com Baú" não entra) e só `tipo='Caminhao'`
(universo da F0d). Falha fechada: consulta sem `carroceria` ou `tipo` não é comparável. Aplica nos mesmos agregadores da regra de ano-modelo.

`kpis.php`: o campo `desvio_medio_fipe` foi descontinuado (sempre `null`); o desvio da FIPE vem só de `mercado_painel.php`/`insights.php`/`lojistas.php`, com as mesmas regras de qualidade e comparabilidade.
