# OPER RADAR — Estado atual e próximos passos

*Documento de continuidade — Julho/2026*

## O que está funcionando em produção

| Peça | URL / Local | Status |
|---|---|---|
| Coletor 2×/dia | Cron 07h e 19h em `/home1/pro93061/agenciaoper.com.br/oper-radar/fase1-coleta/` | ✅ Rodando (caminho corrigido em 08/jul) |
| Banco MySQL | `pro93061_radar_oper` no HostGator | ✅ 337 revendas, 7.344 anúncios ativos (07/jul) |
| API PHP | `agenciaoper.com.br/oper-radar-api/` (`kpis`, `anuncios`, `lojistas`, `insights`, `analista`) | ✅ No ar |
| App React (frontend) | `agenciaoper.com.br/oper-radar/` | ✅ Publicado, sem senha por enquanto |
| Repositório | github.com/FelipeOper/Oper-radar | ✅ Sincronizado |

## Diretório de senhas e credenciais (guardar em cofre)

- **cPanel HostGator**: usuário `pro93061`
- **Banco MySQL**: usuário `pro93061_pro93061`, banco `pro93061_radar_oper`, senha guardada no `config.php` da API e nas tarefas cron
- **Chave Anthropic** (Analista IA): configurada no `config.php` da API (`ANTHROPIC_API_KEY`) — deixar limite de gasto baixo no billing enquanto não houver autenticação

## Fases do roteiro — status

- ✅ **Fase 1** — Coleta e banco (Postgres → MySQL adaptado)
- ✅ **Fase 2** — FIPE (código pronto em `fase2-fipe/`; falta rodar `fipe_sync.py` no servidor pela primeira vez)
- 🔨 **Fase 3** — Consolidação mensal (próxima; ver seção abaixo)
- ⏳ **Fase 4** — Autenticação/permissões (URGENTE — o Directory Privacy do cPanel quebra o app; caminho será login dentro do próprio React + endpoint PHP validando sessão)
- ⏳ **Fase 5** — Geolocalização (mapa de calor)
- ⏳ **Fase 6** — Indicadores externos (SELIC, câmbio) + insights automáticos
- ⏳ **Fase 7** — Frontend produção (parcialmente feito)
- ⏳ **Fase 8** — Calibração dos matchings FIPE
- ⏳ **Fase 9** — Negócio/jurídico (LGPD, ToS do portal fonte)

## Pendências imediatas quando retomar

1. **Confirmar que o cron rodou** — depois das 07h do próximo dia, ver:
   ```
   tail -20 /home1/pro93061/agenciaoper.com.br/oper-radar/fase1-coleta/coleta.log
   ```
2. **Rodar `fipe_sync.py` pela primeira vez** — precisa antes:
   - Importar `fase2-fipe/schema_fipe_mysql.sql` no phpMyAdmin
   - Rodar `pip3 install --user "mysql-connector-python==8.0.33"` no terminal (mesma versão do scraper)
   - Executar o script conforme README daquela pasta
3. **Fase 4 (autenticação)** — sem isso, o `analista.php` fica exposto (qualquer um pode consumir créditos da Anthropic)

## Fase 3 — o que planejar

**Objetivo**: transformar o snapshot atual (o que está no ar HOJE) em séries temporais (o que está no ar dia após dia, semana após semana). Isso destrava:

- **Curvas de aging real** (quantos dias cada anúncio ficou no mercado antes de vender)
- **Quedas de preço detectadas** (mesmo anúncio, preço menor em coleta seguinte)
- **Giro por marca/modelo/região por mês** (vendas confirmadas ÷ estoque médio do período)
- **Sazonalidade** (o mercado de dezembro é diferente de junho?)

**Estrutura técnica sugerida** (não implementada ainda):

- Nova tabela `anuncio_snapshot`: uma linha por anúncio × dia, guardando `preco_do_dia` + `status_do_dia`. Preenchida por um job noturno que lê a tabela `anuncio` atual e materializa "o estado de hoje".
- Nova tabela `consolidacao_mensal`: agregações pré-computadas (média de aging por modelo, mediana de preço por marca × cidade, taxa de giro por revenda) atualizadas 1×/dia.
- Endpoints novos na API: `historico.php?anuncio_id=X` (série de preço) e `consolidado.php?ano_mes=2026-07` (agregados prontos).
- No app: uma nova aba "Séries" (ou expansão da "Análise") com gráficos de linha temporais reais, não os placeholders atuais.

**Trabalho estimado**: ~4-6h de codificação e teste. Nada bloqueia — pode ser feito enquanto o coletor continua rodando normalmente.

## Diferenciais que ainda não implementamos (do documento de estratégia)

- **Preço vs FIPE nos cards** (Fase 2 termina de rodar)
- **Alertas automáticos** ("Scania R450 caiu 8% em Maringá") — depende da Fase 3
- **Mapa de calor geográfico** — depende de mais estados coletando (hoje só PR)
- **Comparação com veículos leves fora do nicho** — se algum dia expandir escopo

## O que aprendemos durante o processo (registro pra evitar repetir)

- **Directory Privacy do cPanel + SPA React não combinam**. O cPanel injeta um `.htaccess` que confunde o roteamento do React. Solução real é login dentro do app (Fase 4).
- **Tarefas cron do cPanel exigem caminho absoluto sempre com `/` inicial**. Sem a barra, dá "no such file".
- **MySQL 5.7.44 (versão do HostGator) ignora `CHECK` constraints silenciosamente**. Todas as validações de status são feitas no código Python/PHP, não no banco.
- **API pública do FIPE (parallelum) tem limite de 500 req/dia gratuito**. O `fipe_sync.py` foi feito incremental pra respeitar isso.
- **Portal Caminhões e Carretas usa links relativos** (`href="cidade/uf/loja/..."`) e bloqueia User-Agents que se identificam como bot (Cloudflare). Config atual usa UA de Chrome real.
- **Ônibus tem duas dimensões de marca**: encarroçadora (Busscar, Marcopolo) e chassi (Mercedes, Scania). O parser trata isso.
