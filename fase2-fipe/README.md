# Fase 2 — Referência FIPE

Cruza os anúncios coletados (Fase 1) com o preço médio da tabela FIPE, habilitando:
desvio vs FIPE por anúncio, oportunidades "abaixo da FIPE" e o desvio médio regional.

**Fonte**: API pública https://fipe.parallelum.com.br/api/v2 (endpoint `trucks`), gratuita,
com limite de 500 requisições/dia (1.000 com token gratuito de fipe.online).

## Como funciona (estratégia incremental)
O sync NÃO baixa a tabela FIPE inteira. Ele olha os anúncios reais do banco e busca preço
só para os modelos/anos que existem na coleta — cacheando tudo (`fipe_modelo`, `fipe_preco`)
para nunca repetir requisição. O matching título→modelo FIPE é por tokens com peso dobrado
em números (530, 6x4...) e guarda o nível de confiança (`alto`/`medio`); match fraco (<0.5)
fica sem FIPE — melhor sem referência do que com referência errada.

## Passos no servidor
1. Rodar `schema_fipe_mysql.sql` no banco (phpMyAdmin > Importar).
2. No terminal:
   ```
   cd ~/Oper-radar/fase2-fipe
   python3 fipe_sync.py --db-user=... --db-pass='...' --db-name=... --max-req=400
   ```
3. Agendar 1x/dia no cron (fora dos horários do scraper), ex às 13h:
   `0 13 * * * cd /home1/SEUUSUARIO/Oper-radar/fase2-fipe && python3 fipe_sync.py --db-user=... --db-pass='...' --db-name=... --max-req=400 >> fipe.log 2>&1`

Cada rodada vincula até ~100-150 anúncios (dentro do limite diário); em poucos dias a base
inteira de caminhões fica coberta e o app passa a mostrar o desvio vs FIPE automaticamente.

## Limitações honestas
- A FIPE cobre caminhões; **carretas/implementos não têm FIPE** — esses anúncios seguem sem
  referência (a alternativa futura é uma referência própria por mediana regional de mercado).
- O matching automático pode errar em modelos muito parecidos; o nível `medio` existe pra
  ser auditável. Ajustes finos entram na Fase 8 (calibração).
