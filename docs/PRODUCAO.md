# OPER RADAR — estado verificado de produção

> Fonte operacional de verdade. Atualizar após cada publicação, migração ou mudança de cron.
> Não registrar senhas, tokens, cookies ou conteúdo do arquivo `.oper-radar.env`.

## Release 2.3 — API 1.6 + frontend (beta e produção) — 25/09/2026 (PUBLICADO ~10h12 e conferido ao vivo)

- Origem: commit `974998f` (PR #63). Codex adversarial em 5 rodadas; achados corrigidos: regra de ano falha fechada, estatística do insight "abaixo da FIPE" e `kpis.php` legado, carroceria por texto misto, tipo não-caminhão e, na última, curinga de carroceria → **lista exata** (`CAVALO MECÂNICO`/`CAVALO MECANICO`/`CHASSIS`/`CHASSI`, `IN` no SQL, mesma constante no PHP). Limitação aceita: sem MySQL local, a paridade PHP × SQL é testada por texto/constante; conferir ao vivo após o deploy. Frontend 91/91, PHP 16/16, contratos Python 68/68, lint limpo.
- **Regra de ano (F0c, `docs/fipe-saneamento/f0c-comparabilidade.md`, 5.400 vínculos):** mediana do desvio vs FIPE de +77,8% até 2005 (N=265), +10,9% em 2006–2015 e +1,0% de 2016 em diante. Modelos até 2005 (e ano desconhecido) saem dos desvios **agregados** da FIPE (`OPER_RADAR_ANO_MINIMO_FIPE = 2006`).
- **Regra de carroceria/tipo (F0d, `docs/fipe-saneamento/f0d-carroceria.md`, 5.135 vínculos de 2006+):** a FIPE precifica o veículo sem implemento; com implemento a cauda >+90% é 4,96% contra 0,40% em cavalo/chassi. O desvio agregado só considera `tipo='Caminhao'` e carroceria vazia/cavalo/chassi. Vale para Panorama do Mercado, desvio por revenda (Concorrência/Lojista), KPI da Análise, insight "abaixo da FIPE" e Hoje; `kpis.php` legado passa a devolver `desvio_medio_fipe: null` (descontinuado). Comparativo anúncio a anúncio e catálogo (`fipe_consulta.php`) não mudam. Textos de evidência avisam o usuário.
- Conclusão da frente FIPE: os vínculos das caudas estão **corretos** (F3: 235/236); a distorção vem de idade, implemento e preço errado no anúncio. F4 de re-vinculação em massa **não se justifica**.
- Pacote `Downloads\OperRadar-Release2.1` (mesma pasta liberada; conteúdo trocado): comando único API → beta → produção. Zips em `/home1/pro93061/backups/`: API `oper-radar-api-release1.6-974998f.zip` `40f601acc2625d9b8c50dc1d4e8b8ed48c42a271c1516194dd74ab07aec00ee2` (8 PHP: `lib/market_quality.php` `e90ccf6e…`, `lib/concorrencia_metricas.php`, `mercado_painel.php`, `lojistas.php`, `lojista_detalhe.php`, `insights.php`, `hoje_stats.php`, `kpis.php`); beta `3d7720951ef5f363c3c9123ab3fb445431e63704557bbc6318380b001bab155f` (`index.html` `009ad93c…`, `index-E1mx3g2d.js` `6abaf2dc…`); produção `e10dba00456c99dcb408c0f1c39f4696ed4eac08761f795536c86cfa0e510f09` (`index.html` `83b6e805…`, `index-Bm7DZnAd.js` `c2ec07bf…`). Pré-checagens: hashes publicados dos 7 PHP (Releases 1–2.2), `index.html` do beta `7e9bf446…` e da produção `e68b94e2…`; `kpis.php` sem hash registrado (só impresso e salvo no backup).
- **Publicado em 25/09/2026 ~10h12** (extração por Felipe no Terminal do cPanel; upload dos zips por Claude). Saída: `API_PRECHECK_OK`, `kpis.php` anterior `199b667f73ddc68c14d9a59a596baaec88dca264d9b6675495fc75feb5a56feb`, backup da API `/home1/pro93061/backups/api-release1.6-20260925-101241`, `php -l` ok nos 8, hashes finais iguais ao pacote, `API_OK`; `BETA_PRECHECK_OK`/`BETA_OK` (`index.html` `009ad93c…`, `index-E1mx3g2d.js` `6abaf2dc…`); `PROD_PRECHECK_OK`, `.htaccess` mantido (`14c69284…`), backup `/home1/pro93061/backups/oper-radar-frontend-release2.3-20260925-101242`, `REFS_NO_INDEX: 4`, `index.html` `83b6e805…`, `index-Bm7DZnAd.js` `c2ec07bf…`, `PROD_OK`.
- **Conferido ao vivo em produção (autenticado):** bundle `index-Bm7DZnAd.js`. Panorama do Mercado: **desvio mediano da FIPE −1,8%** (amostra 2.929, confiança alta; era +4,0% com 5.301 antes das regras de ano e carroceria) — a amostra bate com a F0d (cavalo/chassi 2.769 + vazio 130 = 2.899). `insights.php`: mediana −3,0%, 1.908 desvios (eram 3.614), confiança alta. `kpis.php`: `desvio_medio_fipe` = `null` (descontinuado). `lojistas.php`: 190 de 1.661 revendas com desvio publicado, menor amostra 5, as demais sem número (fail-closed). Texto da Concorrência com a regra "cavalos e chassis de modelos a partir de 2006". 10 rotas abertas sem erro de tela nem exceção (Hoje, Mercado, Concorrência, Análise, Oportunidades, Comparador, Minha Loja, FIPE, Configurações, Minha conta).

- Reversão: API — copiar os 8 arquivos de `api-release1.6-*`; produção — restaurar `index.html` de `oper-radar-frontend-release2.3-*`.

## Release 2.2 — API 1.5 + frontend (beta e produção) — 24/09/2026 (PUBLICADO ~21h01 e conferido ao vivo; substitui o "2.1")

- Origem: commit `bd54e85` (PR #63). Codex adversarial `approve` em todas as rodadas; frontend 88/88, PHP 16/16, contratos Python 68/68, lint limpo. Sem mudança de banco/cron/credencial.
- **Mediana do desvio FIPE** (Panorama do Mercado e KPI de Análise): a F0b da frente FIPE (24/09; `docs/fipe-saneamento`, branch `agent/fipe-saneamento`) mediu 5.417 vínculos comparáveis com histograma do desvio `<-50` 9, `-50..-20` 169, `-20..+20` 3.919, `+20..+50` 838, `+50..+90` 245, `+90..+150` 146, `>+150` 91: 237 (4,4%) acima de +90%, que inflam a média (+10,8%). `mercado_painel.php` devolve `desvio_fipe_mediano_pct`; `insights.php` exige 5 desvios agregados e devolve `desvio_amostra`/`desvio_confianca`, sem o alias legado `desvio_medio_pct`. `fipe_consulta.php` (catálogo FIPE) não foi alterado.
- **Correções da auditoria visual** (Concorrência, Hoje, Mercado): `docs/oper-radar-redesign/AUDITORIA_BETA_VS_DEMO.md`.
- Pacote `Downloads\OperRadar-Release2.1` (mesma pasta já liberada; conteúdo trocado): comando único API 1.5 → beta → produção. Zips: API `fba923f7d62b6bbd5ea0021a074badd6c9f62062412d24b36ffe5479a36e4de9`, beta `701152f1d1cdd0144ed580742d16e1e829142f3edc9a573d45372b07a07c6824`, produção `ffcee06358c30d814873ffba062d7f62193393fd5645013417669016cd9166b9`.
- Pré-checagens: `mercado_painel.php` `6bec5beb…` (API 1.3), `lib/market_quality.php` `e69f9608…` (API 1.2), `index.html` do beta `30906009…` e da produção `ae33b5fc…`. Depois: API `market_quality.php` `32d1b31b…`, `mercado_painel.php` `cac0b9bb…`, `insights.php` `6b92ef64…`; beta `index.html` `7e9bf446…` / `index-CMFbwT-B.js` `bb7d7c3d…`; produção `index.html` `e68b94e2…` / `index-DI-NjRfr.js` `db1e22d9…`.
- **Publicado em 24/09/2026 ~21h01** (extração por Felipe no Terminal do cPanel numa linha única; upload dos zips por Claude). Saída: `API_PRECHECK_OK`, `insights.php` anterior `e84c6b27c30eee9924811c4818a68397f3fa67b1190dab053caa1620dcf163c2`, backup da API `/home1/pro93061/backups/api-release1.5-20260924-210125`, `php -l` ok nos 3, hashes finais iguais ao pacote (`market_quality.php` `32d1b31b…`, `mercado_painel.php` `cac0b9bb…`, `insights.php` `6b92ef64…`), `API_OK`; `BETA_PRECHECK_OK`/`BETA_OK` (`index.html` `7e9bf446…`, `index-CMFbwT-B.js` `bb7d7c3d…`); `PROD_PRECHECK_OK`, `.htaccess` mantido (`14c69284…`), backup `/home1/pro93061/backups/oper-radar-frontend-release2.2-20260924-210125`, `REFS_NO_INDEX: 4`, `index.html` `e68b94e2…`, `index-DI-NjRfr.js` `db1e22d9…`, `PROD_OK`.
- **Conferido ao vivo em produção (autenticado):** bundle `index-DI-NjRfr.js`; Panorama do Mercado com **"Desvio mediano da FIPE" +4,0%** (amostra 5.301 preços válidos, confiança alta; a média anterior era +10,8%), UF sem dado (AC) devolve `null`; `insights.php` `fipe.desvio_mediano_pct` 1,8% (3.614 desvios, confiança alta), sem `desvio_medio_pct`; nenhum texto "Desvio médio da FIPE"; 10 telas abertas sem erro de console (Hoje, Mercado, Comparador, Minha Loja, FIPE, Oportunidades, Análise, Plano de ação, Configurações e Concorrência; Minha conta abriu na varredura anterior do ciclo); Concorrência com dados reais: 1.661 revendas, 22 chips de UF com contagem, e o chip "PR 206" com o segmento Caminhões abre exatamente 206 revendas (2.385 anúncios de caminhões); linha da revenda no vocabulário da DEMO ("142 anúncios em Caminhões (de 198 no total)").
- Reversão: API — copiar os 3 arquivos de `api-release1.5-*`; produção — restaurar `index.html` de `oper-radar-frontend-release2.2-*`.

## Release 2 — frontend novo em PRODUÇÃO (`/oper-radar/`) + API 1.4 — 24/09/2026 (PUBLICADO ~17h25, conferido ao vivo)

- Origem: commit `fb41d48` (PR #63, branch `agent/portar-demo-real`). Codex adversarial (revisão final do PR + 2 rodadas) → `approve`; testes: frontend 82/82, PHP 16/16, Python 68/68. As 11 telas foram abertas no beta com dados reais, sem erro de console. Achado da revisão final corrigido: "Ver N ofertas" abria lista mais ampla que a contagem (agora envia marca + modelo + `ano_modelo` exatos; `anuncios.php` ganhou os filtros `modelo` e `ano_modelo`). Ponto aceito e documentado: filtros próprios da lista (preço, revenda, carroceria, tração, fila FIPE) continuam somando ao recorte do modelo.
- **Estado de produção antes** (lido ao vivo): `/oper-radar/index.html` `6bdac4eedceb39ccddb7616bbb461c39db2967e99a1ff8e3f9030dae54b7906a`, bundle `index-C7TuDJX5.js`, Last-Modified 02/09/2026 23:15 GMT.
- **Passo 1 — API 1.4** (`Downloads\OperRadar-Release2-Producao\PASSO-1-API.txt`): zip `4bdbcf1727b8bb56538e935eaa1328a8845c566d96b53607429df9511decd5d0`; `anuncios.php` `97bfc0e984006aa8c46243286a443d09538438ac558dd12e32dd5ec30c97b92a` (antes: `f824cfc5…`, API 1.3).
- **Passo 2 — frontend de produção** (`PASSO-2-FRONTEND-PRODUCAO.txt`): zip `e2bd5e93474ed3cd30ea3fb78b1efb9f09867fe44f5cae5702e37d65fd80028a` (`--base oper-radar`, 17 arquivos, 0644, sem dados de demonstração, sem referência ao beta). `index.html` `ae33b5fc…`, `assets/index-BMzGdwBS.js` `57021b84…`. Pré-checagem no comando: `index.html` atual = `6bdac4ee…`. **Backup da pasta inteira** antes; **`.htaccess` de produção não é sobrescrito** (o hash atual é impresso); bundles antigos ficam em `assets/`.
- **Publicado em 24/09/2026 ~17h25** (extração por Felipe no Terminal do cPanel; upload dos zips por Claude, modo de aprovação). **API 1.4:** `PRECHECK_OK`, backup `/home1/pro93061/backups/api-release1.4-20260924-172543`, `php -l` sem erro, `anuncios.php` `97bfc0e9…` (igual ao pacote). **Frontend:** `PRECHECK_OK` (`index.html` anterior `6bdac4ee…`), backup da pasta inteira `/home1/pro93061/backups/oper-radar-frontend-release2-20260924-172558`, `.htaccess` de produção mantido (`14c692843671e832bc9a260ad86668dcb4d1a56ded0da65400569a08ec54f409`, igual ao do pacote), `REFS_NO_INDEX: 4`; publicados `index.html` `ae33b5fc27ebf2d3f64dce28db19ae123117cf17756f0d48603d34263316e2ef` e `assets/index-BMzGdwBS.js` `57021b842d7b0de4c7e4378d9d182cd8097328a8c80ae66fa3a5a2155f03b6cf` (iguais ao pacote). Bundles antigos permanecem em `assets/`; a pasta `oper-radar/` também guarda o repositório do servidor (`.git`, `assets.zip` de 02/09 etc.), intocados.
- **Conferido ao vivo em produção (autenticado):** bundle `index-BMzGdwBS.js` servido, `index.html` `ae33b5fc…`; as 11 telas (Hoje, Mercado, Comparador, Minha Loja, FIPE, Oportunidades, Concorrência, Análise, Plano de ação, Configurações, Minha conta) abrem sem erro de console; "Ver 92 ofertas disponíveis" (SCANIA R450 2019) abre a lista com "92 anúncios encontrados", todos SCANIA R450 2019/2019.
- Reversão do frontend: restaurar `index.html` (e o que mudar) do backup `/home1/pro93061/backups/oper-radar-frontend-release2-*`; da API: `anuncios.php` de `/home1/pro93061/backups/api-release1.4-*`. Banco, cron, credenciais: nenhum.

## Taxonomia do segmento Pesado — 24/09/2026 (PUBLICADA: API 1.3 em produção + beta; frontend de produção `/oper-radar/` intocado)

- Decisão do Felipe: Pesado = caminhão seminovo + implemento rodoviário; o resto (agrícola incluso) em "Outros", sem misturar. `Carreta` → implementos rodoviários; `Implementos-agricolas` → agrícola; `outros` = complemento (tipo não mapeado e anúncio sem tipo entram ao abrir a categoria, igual à contagem da faceta).
- Revisão Codex adversarial em 4 rodadas (achados: `outros` fechado nos filtros; faceta por UF com tipo NULL; `total_geral` sem os sem-tipo) → **approve**. Commits `b0236e6`, `8fcfd4d`, `664ba32`, `c519c0e`. Testes: PHP 16/16, frontend 81/81, Python 68/68.
- **Release 1.3 da API** (`Downloads\OperRadar-Release1.3-API-taxonomia`, zip `d121b58d7e3787ebfc0d25d1aa15a9f0b46a2f6f58dd072c16ffa39b2eb6096f`): `lib/market_taxonomy.php` `93b796b5…`, `anuncios.php` `f824cfc5…`, `facetas.php` `553b8839…`, `lojista_detalhe.php` `181c1cfc…`, `mercado_painel.php` `6bec5beb…`. Pré-checagem no comando: `mercado_painel` = `6e67a6d9…` (1.2) e `lojista_detalhe` = `554d69fb…` (Release 1). **Publicar antes do beta novo.**
- **Beta com a taxonomia**: zip `3e71e7fad83a6be58269b34258f2f31940bb6a57fa823ed80d2b5696bde5b3c6`, bundle `index-C2m3WyHa.js`.
- **Publicada em 24/09/2026 ~17h07** (extração por Felipe no Terminal do cPanel; upload dos zips por Claude). Pré-checagem `PRECHECK_OK` (`mercado_painel` `6e67a6d9…`, `lojista_detalhe` `554d69fb…`, zip `d121b58d…`). Backup: `/home1/pro93061/backups/api-release1.3-20260924-170727` (5 arquivos anteriores). Hashes anteriores dos que não tinham registro: `lib/market_taxonomy.php` `19fa6e7fe41e185789a07d304926b31394c98715c576c9d709bccbe1d568e564`, `anuncios.php` `06041bb337acec1145601f9163dec7ae4799279dcc22ec2a8627eaa006307205`, `facetas.php` `ae39e5fdeef72d1337b6001ce56cc69d02a3e627683c50218bca1d9ef4c6058d`. Publicados (SHA-256 no servidor, iguais ao pacote): `lib/market_taxonomy.php` `93b796b5…`, `anuncios.php` `f824cfc5…`, `facetas.php` `553b8839…`, `lojista_detalhe.php` `181c1cfc…`, `mercado_painel.php` `6bec5beb…`; `php -l` sem erro nos 5. Beta: `ZIP_OK`, `index.html` `30906009…`, `index-C2m3WyHa.js` `bd9c6978…`, permissões 644/755, `REFS_NO_INDEX: 4`. Reversão da API: copiar os 5 arquivos do backup de volta.
- **Conferência ao vivo dos números:** Mercado "Caminhões e implementos" = **16.023** anúncios (Caminhões 11.778 + Implementos rodoviários 4.245 = Carreta 3.787 + Carroceria-sobre-chassi 453 + Trailer 5); `desvio_fipe` inalterado (`+10,8%`, 5.347 preços). Facetas: soma das categorias = `total_geral` = 30.246 (agrícolas 12.375 com `Implementos-agricolas`; construção 1.129; "Outros" 84); mercado principal 16.023 + mercado outros 14.223 = 30.246. Consistência: faceta "Outros" (84) = total de `anuncios.php?categoria=outros` (84). Concorrência: segmento "Implementos rodoviários" 674 revendas (antes 157) com 4.245 ativos; "Outros" 48 revendas; Caminhões 1.017 (inalterado).
- Efeito esperado: "Caminhões e implementos" de ~12,2 mil para ~16 mil anúncios; o ticket mediano do recorte "todos" passa a misturar caminhão e carreta (usar segmento Caminhões ou Implementos para comparar preço). Risco aceito: a comparação de `tipo` no SQL segue a collation da coluna (o coletor grava o slug canônico do portal).

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
