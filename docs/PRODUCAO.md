# OPER RADAR — estado verificado de produção

> Fonte operacional de verdade. Atualizar após cada publicação, migração ou mudança de cron.
> Não registrar senhas, tokens, cookies ou conteúdo do arquivo `.oper-radar.env`.

## Revisão Codex adversarial do PR #63 — 24/09/2026 (publicada: API 1.2 em produção; frontend só no beta)

- 1ª rodada `needs-attention` (3 achados: mediana do insight abaixo-FIPE sem filtro de confiança; desvio FIPE do Mercado sem amostra mínima; Concorrência sem filtros de cidade/segmento). 2ª rodada achou 2 furos nas correções (API antiga exibindo desvio sem amostra; segmento misturando métricas gerais). 3ª rodada: **approve**. Commits `da23dc5` e `62f36ef`.
- **Release 1.2 da API — PUBLICADA em 24/09/2026 ~16h43** (extração por Felipe no Terminal do cPanel, upload do zip por Claude). Zip `6b90b3f8a2c0292ce19a1fe2d732d6524bd26fefff5ae165006d1b1f3ec2b41c`. Pré-checagem ok (`hoje_stats` `811ee437…`, `mercado_painel` `aff3ef54…`). Backup: `/home1/pro93061/backups/api-release1.2-20260924-164255` (`lib/market_quality.php` anterior = `ebdd46cf8275f5f912d9eea04adb02b4112957827adb9901cb188d62727c1f28`). Publicados (SHA-256 no servidor, iguais ao pacote): `hoje_stats.php` `e932cfd6…`, `mercado_painel.php` `6e67a6d9…`, `lib/market_quality.php` `e69f9608…`; `php -l` sem erro nos 3. Sem banco, cron ou credencial. Reversão: copiar os 3 arquivos do backup.
- **Beta do frontend com filtros de segmento/cidade — PUBLICADO em `/oper-radar-beta/`** (zip `1299cbed968ffbc32c8a386d10eb70a8cbdf61fbb869720622502d8758db1caf`, bundle `index-DvJcyySi.js`; hashes no servidor iguais ao manifesto: `index.html` `54ff033a…`, JS `bbce0b2a…`). Login novo conferido ao vivo (layout do Beta, logo carregada). `/oper-radar/` (produção do frontend) intocado.
- **Conferido ao vivo, autenticado (24/09/2026, beta + API 1.2, sem erro de console):** Mercado — desvio FIPE `+10,8%` com "5.347 preços válidos com FIPE" (confiança alta); UFs sem anúncios (AC, RR) devolvem `desvio null`, amostra 0, confiança insuficiente. Hoje — `parciais_indisponiveis` vazio; insight abaixo-FIPE "SCANIA R540 2019" (mediana 16,7% abaixo da FIPE). Concorrência — segmento "Caminhões" (1.017 revendas), UF PR (204 com segmento), cidade Curitiba/PR (57), volta a "Todos os segmentos"/"Todas as UFs" (1.658); linha mostra "139 ativos em Caminhões (de 195 no total)"; idade e desvio ocultos com segmento; ordenação por idade desabilitada com segmento e reabilitada sem; o painel do lojista envia `categoria=caminhoes` e mostra os mesmos 139 ativos.
- **Achado da conferência (herdado da `main`) → decisão do Felipe em 24/09/2026 (código pronto, ainda NÃO publicado):** o tipo real `Carreta` (3.787 anúncios ativos) e `Implementos-agricolas` (4.893) não estavam no mapa de categorias e caíam em "Outros"; o mercado "Caminhões e implementos" (12.236) não incluía as carretas. Regra decidida: o segmento do Felipe é **Pesado = caminhão seminovo + implemento rodoviário**; tudo o mais fica em "Outros", incluindo o cenário agrícola, **sem misturar** com o real. Aplicado em `oper-radar-api/lib/market_taxonomy.php` e `app/src/marketTaxonomy.js`: `Carreta` → implementos rodoviários; `Implementos-agricolas` → agrícolas (mercado "Outros"); tipos não mapeados (`Aviao`, `Sementes`, `Trator-skidder`, `Manipulador-telescopico`) seguem em "Outros". Efeito esperado após publicar: o total de "Caminhões e implementos" passa de ~12,2 mil para ~16 mil anúncios; o ticket mediano do recorte "todos" passa a misturar caminhões e carretas (preços muito diferentes) — para comparar, usar o segmento Caminhões ou Implementos.

## Beta do frontend (`/oper-radar-beta/`) — 24/09/2026 (NÃO é produção; `/oper-radar/` intocado)

- Pasta paralela `/home1/pro93061/agenciaoper.com.br/oper-radar-beta/`, mesma API e mesmo login de produção; `.htaccess` com `RewriteBase /oper-radar-beta/` e `X-Robots-Tag: noindex`.
- Pacote: `python scripts/empacotar_frontend.py --base oper-radar-beta --saida <pasta>`; zip `f946b7433cfb76734c6d1575a1a8ba2c36d0510ea5d3ff4efb7f08ac23d864ae`, extraído por Felipe no Terminal do cPanel (upload do zip por Claude).
- Commit fonte: `34a8a3e` (branch `agent/portar-demo-real`, PR #63). Inclui o novo login (layout do projeto Beta).
- Bug pego na validação ao vivo e corrigido nesta rodada: tela Mercado quebrava com `fmtDataObservada is not defined` (helper removido junto com a Concorrência antiga). Teste de regressão `app/tests/helpersDefinidos.test.js`.
- Conferido ao vivo após a instalação: bundle `index-CzYmM2XN.js`; SHA-256 servidos batem com o manifesto — `index.html` `e49d9820…`, `index-CzYmM2XN.js` `3d141f5d…`, `index-Dm0X-5Mu.css` `7966ec56…`. Hoje, Mercado e Concorrência renderizam com dados reais, sem erro de console.
- Pendente: conferir visualmente a tela de login deslogado e o mobile real.

## Release 1.1 da API — 24/09/2026 (correção, 2 arquivos PHP)

- Responsável: Felipe Hilario (extração no Terminal do cPanel); upload do zip e conferência: Claude (upload pelo Gerenciador de Arquivos, no Chrome logado pelo Felipe).
- Origem: commit `1e7ed64` (PR #63), CI verde. Corrige o que a conferência ao vivo do Release 1 mostrou com dados reais: reduções por revenda contadas como eventos (271 num revenda de 39 anúncios; agora anúncios distintos), feed sem saídas nem quedas de preço (agora os tipos se revezam), insight "abaixo da FIPE" com amostra de 5 preços (agora exige 10) e rótulo com marca repetida.
- Pré-checagem automática (falha interrompe tudo): `hoje_stats.php` e `lib/hoje_painel.php` = hashes do Release 1 (`aa29b414…`, `b86a4ab5…`) — ok.
- Backup: `/home1/pro93061/backups/api-release1.1-20260924-153206` (os 2 arquivos anteriores).
- Publicados (SHA-256 no servidor, iguais ao pacote): `hoje_stats.php` `811ee437994775e10d6eca99d018df83bc2cdfd05fd996d9195933f8d6867549`; `lib/hoje_painel.php` `cbca256b088743ca6e59ab3b45340d58bb628f80beeb17c3fd084fa41e2420dd`.
- Validação: `php -l` sem erro nos 2 (PHP 8.3.33). Migrações, cron, banco, credenciais: nenhum. Frontend: não publicado.
- **Pendente:** conferência ao vivo de `hoje_stats.php` (feed com `saida`/`preco`, contagem de reduções menor que os ativos, sem "abaixo da FIPE" com amostra < 10). Reversão: copiar os 2 arquivos do backup acima.

## Release 1 da API — 24/09/2026 (só PHP, aditivo)

- Responsável: Felipe Hilario (upload e extração manuais pelo cPanel); conferência: Claude.
- Origem: branch `agent/portar-demo-real` (PR #63), commit `40b49b2`; CI Python 3.9 e 3.13 verde. Testes: 16/16 PHP, 63/63 app, 62/62 contratos.
- Backup anterior: `/home1/pro93061/backups/oper-radar-api-20260924-115707` (29 itens).
- Conferência antes (leitura): `hoje_stats.php` = commit `662c93a`, `mercado_painel.php` = `57bbe6e`, `lojistas.php` = `a7e66fe`, `lojista_detalhe.php` = `1b89814` (todos versões conhecidas do Git); os 4 arquivos novos não existiam; as 16 funções das bibliotecas usadas existiam (`market_quality`, `regional_insight`, `store_market`, `competitor_history`, `market_scope`).
- Publicados (SHA-256 no servidor, conferidos contra o pacote):

| Arquivo (`oper-radar-api/`) | Situação | SHA-256 |
|---|---|---|
| `frescor_coleta.php` | novo | `be20ff6e5cd53f450f26e8860e1e9bf7688022257898129a4bcdae3c19f906a1` |
| `lib/hoje_painel.php` | novo | `b86a4ab55489b67f366a029b99026d64344d39212fcc745a177465193ed87ffc` |
| `lib/regional_modelo.php` | novo | `20fb0ba06791d43ea98d9b2735e056ce7a4e9d5a0ba63d3e78f5648cfd856f20` |
| `lib/concorrencia_metricas.php` | novo | `29c50321988f69b80e613f451129dcb817c4e449ec577176a1a89eda547cfa16` |
| `hoje_stats.php` | alterado | `aa29b41469f9130c37e92797b0de6657258c3a9921a5721173c8a770f73d89b5` |
| `mercado_painel.php` | alterado | `aff3ef54fd27073d6e4c5b735cb15b2236e916cd92892ec345f870467ad869d1` |
| `lojistas.php` | alterado | `827e1a10e5c118cc84d9d551d7411edd508e91d14080a7b4505dc3163c4c330d` |
| `lojista_detalhe.php` | alterado | `554d69fba980655e38c53a513c9b3b1e60064fda7c37fba381cca6079d7dcfce` |

- Validação no servidor (PHP 8.3.33): `php -l` sem erro nos 8 arquivos; os 8 hashes idênticos aos do pacote.
- Migrações: nenhuma. Cron: nenhuma alteração. Banco e credenciais: não tocados. Frontend: **não publicado** (o app em produção ignora os campos novos; nenhuma mudança visível).
- **Pendente:** conferir ao vivo `hoje_stats.php` (esperado `parciais_indisponiveis` vazio), `frescor_coleta.php`, `mercado_painel.php` com modelo selecionado (`selecionado.oportunidade_regional`) e `lojistas.php` (`reducoes_30d`, `desvio_fipe_mediano_pct`); as consultas novas ainda não foram executadas em MySQL real até essa conferência.
- Reversão: restaurar do backup acima os 4 arquivos alterados e apagar os 4 novos (roteiro em `Downloads\OperRadar-Release1-API-v2\LEIA-ME.md`).

## Release de 01/09/2026 às 07h35

- Origem funcional: branch `redesign-oper-radar-20260831`, commit `165333b`.
- Transporte do build: branch técnica `deploy/redesign-oper-radar-20260901`, commit `fbed7ec`.
- Backup anterior: `/home1/pro93061/backups/oper-radar-20260901-073526`.
- Frontend publicado com bundle principal `index-De1rp-Rm.js`.
- API publicada: `mercado_painel.php`.
- Migrações de banco: nenhuma.
- Cron e credenciais: não alterados.
- O repositório operacional sujo do servidor não foi alterado; a publicação partiu do worktree
  isolado `/home1/pro93061/agenciaoper.com.br/oper-radar-redesign-painel`.
- O terminal do cPanel não dispõe de `node` ou `npm`. O build foi gerado localmente depois de
  33 testes aprovados e transferido pela branch técnica de artefato.
- Validação PHP antes da cópia: sem erros de sintaxe.
- Smoke test autenticado: painel carregado com dados reais; recortes de 30 e 7 dias; Brasil,
  Minas Gerais e retorno a Brasil; seleção de modelo e abertura do navegador de anúncios.
- Inspeção visual desktop: aprovada. A revisão específica em viewport de 320 px permanece
  recomendada porque o controle remoto do Chrome não oferece emulação de viewport.

| Artefato | SHA-256 |
|---|---|
| `index.html` | `0626C91472A7F62AD8F0BF1482276EB0FD4F19FFD67CDF711F0531332C89F9D5` |
| `assets/index-De1rp-Rm.js` | `2CE75955D4D699CF2DBA0F9D882738DED695E126FBB3249399D3BFD1ED98906E` |
| `mercado_painel.php` | `7958CD09D7F1A7CF9B80595227314DF5CB239B606C2302F024D9A500B3D2F300` |

## Release de 31/08/2026 às 17h36

- Origem: branch `redesign-oper-radar-20260831`, commit local `21cdc68`.
- Backup anterior: `/home1/pro93061/backups/oper-radar-20260831-173618`.
- Frontend publicado com bundle `index-BQgXZzch.js`.
- API publicada: `anuncios.php`, `comparador.php`, `lib/market_comparator.php`,
  `lib/query_contract.php` e `lib/equivalent_group.php`.
- Migrações de banco: nenhuma.
- Cron e credenciais: não alterados.
- Smoke test externo: início HTTP 200, rota `/comparador` HTTP 200, bundle HTTP 200
  com 197.529 bytes e API HTTP 401 sem sessão, como esperado para endpoint privado.
- Validação PHP no staging e após a cópia: sem erros de sintaxe.
- Teste visual autenticado: pendente de confirmação pelo usuário.

| Artefato | SHA-256 |
|---|---|
| `index.html` | `4F2FF834165341CC514670D0DC9BD999C5D281808CA7D476B9AAD1ED8B05D9B1` |
| `assets/index-BQgXZzch.js` | `E09DE2F2167C46ED0358306BA7101A05FEB47BD50E37743C5B9B611B3ED4920E` |
| `anuncios.php` | `06041BB337ACEC1145601F9163DEC7AE4799279DCC22EC2A8627EAA006307205` |
| `comparador.php` | `57573D25AE0391AD01752C50ED2F8D491A2E70B76CD68EDA929E1B3D5B8E35E5` |
| `lib/market_comparator.php` | `1F590696553C7F53E293524F4BEC5D53BFF803D1814B522C3C031D3018C82FC0` |
| `lib/query_contract.php` | `506C2E04984998144CBD27D5605E558672545100287FB7C821C7590728F3C580` |
| `lib/equivalent_group.php` | `09E43E146B2F3249B99904DB3BBFB5E4A1FFE5FB1A75C8144279DC2E591A3778` |

## Última verificação

- Data: 31/08/2026, entre 09h00 e 09h15 (America/Sao_Paulo)
- Repositório no servidor: branch `main`, commit `1e9b7a1ed0987573dc12f6b3f30b41c980252baa`
- Hospedagem: HostGator, PHP 8.3, Python 3.9 e MySQL 5.7.44-48
- Banco: `pro93061_radar_oper`
- Frontend público: `assets/index-BwVttcZm.js`
- SHA-256 do `index.html`: `386f61055793339dd1178dd10de7976a347dc3ec1e1ca924a12cf2aff0f57955`
- SHA-256 do bundle principal: `af6eaa03ea94160ba2295a9a00976032f45dcf1317c374c98ffb6a3d78f792ab`
- API pública: 21 PHPs no nível principal; SHA-256 do manifesto agregado e ordenado: `35cc7c58631864eb0bb7820196419754448a3835ac0baa38e693dd016938d6b3`

O commit do repositório no servidor não identifica sozinho a versão do frontend ou dos PHPs
públicos. Essas peças são copiadas manualmente para diretórios web separados e precisam ser
registradas individualmente em cada release.

## Componentes ativos

| Componente | Estado verificado | Evidência operacional |
|---|---|---|
| Frontend React | OK | sessão administrativa carregada; bundle `index-BwVttcZm.js` |
| API PHP | Ativa e privada | `auth.php` HTTP 200; endpoints de dados HTTP 401 sem sessão |
| Autenticação | Ativa | 1 usuário Admin ativo; cookie Secure, HttpOnly e SameSite=Lax |
| Coleta PR | OK, 07h/19h | cadência preservada na configuração conhecida; dados do ciclo 07h refletidos na interface |
| Coleta nacional | OK por cadência, 08h/20h | cron ao vivo confirmado; `coleta-expansao.log` atualizado às 08h57 de 31/08; conteúdo final pendente de releitura |
| Detalhes de caminhões | ATENÇÃO, a cada 30 min | cron ao vivo com lote 80, pausa 4s e `flock`; `detalhe.log` atualizado às 09h00; conteúdo e capacidade da fila ainda precisam ser medidos |
| FIPE local | ATENÇÃO, 12h45/23h45 | `fipe-local.log` atualizado às 23h47 de 30/08; última amostra debug registrada: 16/20, ou 80% |
| FIPE mensal | Ativa, dias 1–10 às 13h15 | referência 336 em atualização incremental |
| FIPE bootstrap | Ativa, dias 11–31 às 14h30 | marcador de conclusão habilitado |
| Séries temporais | OK, 23h10 | `snapshot-diario.log` atualizado às 23h10 e `eventos-diario.log` às 23h35 de 30/08 |
| Monitoramento | OK por cadência | `monitoramento.log` atualizado às 23h30 de 30/08 |
| Minha Loja/XML | Ativa no banco/API | tabelas presentes e com registros na auditoria inicial |
| Curadoria FIPE/KM | Ativa no banco/API | logs e sugestões presentes |

## Baseline nacional de 31/08/2026

- 1.583 revendas monitoradas.
- 30.395 anúncios ativos revalidados no ciclo 07h, em 21 UFs, 5 regiões e duas leituras diárias.
- 12.275 anúncios no mercado principal: 11.823 caminhões e 452 implementos rodoviários.
- 18.120 anúncios nos demais mercados: 111 ônibus/vans, 211 leves, 7.607 agrícolas, 1.135 construção, 301 peças e 8.755 outros.
- Conciliação de volume: `12.275 + 18.120 = 30.395`; a soma das facetas bate exatamente com o total ativo exibido.
- Distribuição do mercado principal: Sul 5.217, Sudeste 5.578, Centro-Oeste 1.234, Nordeste 202 e Norte 44.
- Movimento em 48 horas: 136 entradas e 75 saídas. Saídas no mês: 2.755.

## Baseline FIPE de 31/08/2026

- Catálogo local: 1.974 modelos de caminhão, 29 marcas e 11.381 preços/referências.
- Referência vigente: agosto de 2026, código 336.
- DAF: 112 modelos no catálogo.
- Busca `DAF XF 530`: 57 referências FIPE e 168 anúncios de mercado.
- O comparador oferece recortes por marca, modelo e marca + modelo, com ano-modelo independente nos dois lados.
- DAF 530 está disponível no comparador nas famílias XF FT 530, XF FTS 530, XF FTT 530, XF FTT OFF-ROAD 530 e XF105 530.
- Conclusão: o DAF XF 530 não está mais ausente. A lacuna atual é a correspondência automática; muitos anúncios exibem várias sugestões e permanecem em validação, processamento ou sem referência segura.
- Última amostra debug documentada: 16 vínculos em 20 pendentes, taxa de 80%. Ela é o baseline comparável até uma nova execução do `--modo=debug` no servidor.
- Inconsistência visual encontrada: registros FIPE zero-km aparecem com ano `32000` em alguns resultados; normalizar antes de exibir.

## Evidência dos logs em 31/08/2026

| Log | Última modificação observada | Situação |
|---|---:|---|
| `coleta-expansao.log` | 31/08 08h57 | compatível com a coleta nacional das 08h |
| `detalhe.log` | 31/08 09h00 | compatível com a cadência de 30 minutos |
| `monitoramento.log` | 30/08 23h30 | compatível com o cron noturno |
| `snapshot-diario.log` | 30/08 23h10 | compatível com o cron diário |
| `eventos-diario.log` | 30/08 23h35 | compatível com o cron diário |
| `fipe-local.log` | 30/08 23h47 | compatível com o ciclo das 23h45 |
| `fipe-mensal.log` | 10/08 13h15 | compatível com a janela mensal dos dias 1–10 |
| `fipe-bootstrap.log` | 25/08 14h35 | arquivo existe; o marcador de conclusão pode encerrar ciclos sem nova saída |

Os horários e tamanhos foram lidos diretamente no cPanel. A conexão do navegador foi interrompida antes da releitura das últimas linhas; portanto esta verificação confirma cadência/freshness, mas não autoriza afirmar “zero erros no conteúdo” dos arquivos. Esse ponto permanece como checagem curta obrigatória na próxima sessão estável.

## Risco de reprodutibilidade do servidor

- O repositório do servidor está no commit correto, mas não está limpo: 2 arquivos rastreados modificados e 72 itens não rastreados.
- Rastreado e modificado: `fase3-series/executar_snapshot_job.sh` e `fase3-series/instalar_cron_series.sh`.
- Os não rastreados incluem bundles antigos, arquivos de deploy, backups e artefatos operacionais.
- Não apagar nem sobrescrever esses itens sem inventário, backup e comparação; o estado publicado não é reproduzível apenas pelo commit Git.

## Baseline histórico de 27/08/2026

- 30.279 anúncios ativos em 21 UFs com revendas cadastradas no portal.
- 12.270 anúncios no mercado principal de caminhões e implementos rodoviários.
- 18.009 anúncios em outros mercados.
- AC, AL, AM, AP, MA e RR concluíram como `sem_revendas`.
- Primeira leitura de SC, RS, SP, RJ, MG e ES: 931 revendas, 17.673 ativos e zero erros.
- Detalhe: 7.871 caminhões ativos aguardavam enriquecimento antes da cadência de 30 minutos.
- FIPE: 1.787 de 11.810 caminhões ativos vinculados; debug local vinculou 16 de 20 pendentes.

## Integrações intencionalmente desativadas

| Integração | Motivo |
|---|---|
| Analista IA | `ANTHROPIC_API_KEY` ausente; evita custo e uso não autorizado |
| Consulta por placa | token do provedor veicular ausente |

## Banco na ativação da Fase 3

- 597 revendas em 15 UFs.
- 14.727 anúncios materializados no primeiro snapshot.
- 12.799 anúncios ativos no primeiro snapshot.
- 11.381 preços FIPE no catálogo local.
- Referência 336: 4.387 preços atualizados em 03/08.
- Referência 335: 6.994 preços aguardando retomada automática.
- Apenas 2 anúncios ativos ainda estavam ligados à referência anterior.
- Banco com aproximadamente 15,1 MB antes do início das séries.
- Cota da conta: 100 GB; aproximadamente 5,5 GB usados na verificação.

## Validações pendentes

1. Após 04/08 às 13h15, confirmar que o lote FIPE de 2.500 terminou com resumo final e
   reduziu a fila da referência 335.
2. Após 04/08 às 23h10, confirmar uma segunda data em `anuncio_snapshot` e verificar as
   primeiras mudanças de preço.
3. Registrar o hash ou commit de cada futura publicação do frontend e da API.
4. Não remover bundles antigos da pasta pública até existir backup e confirmação de quais
   arquivos são referenciados pelo `index.html` ativo.

## Registro mínimo de release

Cada publicação deve registrar:

- data e responsável;
- commit Git do servidor;
- nome e SHA-256 do bundle principal do frontend;
- SHA-256 de cada PHP publicado;
- migrações aplicadas;
- alterações de cron;
- validações HTTP, banco e logs realizadas;
- caminho do backup utilizado para reversão.
