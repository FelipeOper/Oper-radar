# Fase 3 — Séries temporais e consolidação mensal

Transforma o snapshot atual (o que está no mercado HOJE) em histórico dia-a-dia. Isso é
o que destrava:

- **Aging real** — quantos dias cada anúncio realmente ficou no mercado antes de vender
- **Quedas de preço detectadas** — mesmo anúncio, preço menor em coleta seguinte
- **Giro por marca/modelo/região por mês** — vendas ÷ estoque médio do período
- **Sazonalidade** — comparar meses ao longo do ano

## Peças

1. **`migrar_series.py`** — migrador idempotente para banco existente. Sem `--aplicar`,
   apenas inspeciona e informa o que falta; com `--aplicar`, cria e valida as tabelas.
   **`schema_series_mysql.sql`** preserva o desenho SQL original, mas não deve ser usado
   diretamente em produção porque não é idempotente.

   As 3 tabelas da fase são:
   - `anuncio_snapshot`: uma linha por anúncio × dia (materialização histórica)
   - `mudanca_preco`: log de cada queda/aumento detectado
   - `consolidacao_mensal`: agregações pré-computadas (mais rápidas de consultar no app)

2. **`snapshot_diario.py`** — já escrito e testado localmente, **ainda não agendado em
   produção**. Job noturno que:
   - Lê a tabela `anuncio` viva
   - Grava uma linha por anúncio na `anuncio_snapshot` com data de hoje
   - Detecta mudanças de preço vs. snapshot do dia anterior → grava em `mudanca_preco`
   - Agenda sugerida (ver cabeçalho do próprio arquivo): 23h, depois da última coleta do dia
     (07h/19h) — `0 23 * * * ... python3 snapshot_diario.py`

   **`executar_snapshot_job.sh`** carrega o ambiente protegido e impede concorrência com
   `flock`. **`instalar_cron_series.sh`** preserva e faz backup do crontab atual, substitui
   somente o bloco da Fase 3 e agenda o executor diariamente às 23h10.

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

1. Fazer e verificar backup do banco.
2. Carregar as variáveis protegidas e simular a migração:
   `python3 migrar_series.py`
3. Aplicar e validar a migração: `python3 migrar_series.py --aplicar`
4. Rodar `snapshot_diario.py` manualmente 1 vez contra o banco de produção para popular o
   "dia zero" e validar
5. Agendar no cron: `bash instalar_cron_series.sh`
6. Deixar rodando por 7-10 dias para acumular histórico mínimo
7. Só depois criar endpoints e telas do app — sem histórico acumulado, tela vazia

## Nota honesta

- Sem 30+ dias de histórico, aging e sazonalidade são estimativas fracas. Rodar o snapshot
  desde já é o que garante que daqui a 60 dias os dados fiquem confiáveis. É um investimento
  de "esperar dado nascer".
- `mudança de preço` funciona já na segunda coleta (só precisa de 2 dias de snapshot),
  então essa parte dá insight rápido.
