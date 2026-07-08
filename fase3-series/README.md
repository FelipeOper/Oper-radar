# Fase 3 — Séries temporais e consolidação mensal

Transforma o snapshot atual (o que está no mercado HOJE) em histórico dia-a-dia. Isso é
o que destrava:

- **Aging real** — quantos dias cada anúncio realmente ficou no mercado antes de vender
- **Quedas de preço detectadas** — mesmo anúncio, preço menor em coleta seguinte
- **Giro por marca/modelo/região por mês** — vendas ÷ estoque médio do período
- **Sazonalidade** — comparar meses ao longo do ano

## Peças

1. **`schema_series_mysql.sql`** — 3 tabelas novas:
   - `anuncio_snapshot`: uma linha por anúncio × dia (materialização histórica)
   - `mudanca_preco`: log de cada queda/aumento detectado
   - `consolidacao_mensal`: agregações pré-computadas (mais rápidas de consultar no app)

2. **`snapshot_diario.py`** (a criar) — job noturno que:
   - Lê a tabela `anuncio` viva
   - Grava uma linha por anúncio na `anuncio_snapshot` com data de hoje
   - Detecta mudanças de preço vs. snapshot do dia anterior → grava em `mudanca_preco`
   - Agenda: 1×/dia, depois da última coleta do scraper (ex: 23h)

3. **`consolida_mensal.py`** (a criar) — job semanal que reagrega o mês corrente e
   os 2 meses anteriores, atualizando `consolidacao_mensal`.

4. **API novos endpoints** (a criar):
   - `historico.php?anuncio_id=X` — série de preço/status de um anúncio
   - `consolidado.php?ano_mes=2026-07` — agregados prontos pro app

5. **App nova aba** — "Séries" (ou expansão da "Análise") com:
   - Gráfico de linha: anúncios ativos por dia (últimos 90 dias)
   - Feed de quedas de preço detectadas
   - Aging médio por marca × mês (heatmap)
   - Comparação mês-a-mês do giro por revenda

## Ordem sugerida

1. Rodar `schema_series_mysql.sql`
2. Criar e testar `snapshot_diario.py` — rodar manualmente 1 vez para popular o "dia zero"
3. Agendar no cron (23h todo dia)
4. Deixar rodando por 7-10 dias para acumular histórico mínimo
5. Só depois criar endpoints e telas do app — sem histórico acumulado, tela vazia

## Nota honesta

- Sem 30+ dias de histórico, aging e sazonalidade são estimativas fracas. Rodar o snapshot
  desde já é o que garante que daqui a 60 dias os dados fiquem confiáveis. É um investimento
  de "esperar dado nascer".
- `mudança de preço` funciona já na segunda coleta (só precisa de 2 dias de snapshot),
  então essa parte dá insight rápido.
