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

1. Banco novo: importar `schema_fipe_mysql.sql`. Banco que ja tem FIPE: importar uma unica
   vez `migracao_fipe_fila_mysql.sql`.
2. Guardar as credenciais fora do repositorio, por exemplo em
   `/home1/USUARIO/.oper-radar.env`, com permissao `600`:
   ```bash
   export OPER_RADAR_DB_HOST='localhost'
   export OPER_RADAR_DB_USER='USUARIO_MYSQL'
   export OPER_RADAR_DB_PASS='SENHA_MYSQL'
   export OPER_RADAR_DB_NAME='BANCO_MYSQL'
   ```
3. Fazer primeiro um diagnostico sem consumir a API:
   ```bash
   set -a; source /home1/USUARIO/.oper-radar.env; set +a
   cd /home1/USUARIO/agenciaoper.com.br/oper-radar/fase2-fipe
   python3 fipe_sync.py --debug
   ```
4. Rodar um piloto pequeno:
   ```bash
   python3 fipe_sync.py --lote=20 --max-req=50 --max-refresh=10
   ```
5. Depois da auditoria do piloto, agendar 1x/dia fora dos horarios do scraper:
   ```cron
   0 13 * * * bash -lc 'set -a; source /home1/USUARIO/.oper-radar.env; set +a; cd /home1/USUARIO/agenciaoper.com.br/oper-radar/fase2-fipe && python3 fipe_sync.py --lote=200 --max-req=400 --max-refresh=100 >> fipe.log 2>&1'
   ```

Cada rodada vincula até ~100-150 anúncios (dentro do limite diário); em poucos dias a base
inteira de caminhões fica coberta e o app passa a mostrar o desvio vs FIPE automaticamente.

Anuncios sem match, ambiguos ou sem ano recebem motivo auditavel e saem da frente da fila.
Eles podem ser tentados novamente depois de 30 dias; erros de rede voltam em 1 dia. Precos de
meses anteriores sao atualizados gradualmente a cada rodada.

## Limitações honestas
- A FIPE cobre caminhões; **carretas/implementos não têm FIPE** — esses anúncios seguem sem
  referência (a alternativa futura é uma referência própria por mediana regional de mercado).
- O matching automático pode errar em modelos muito parecidos; o nível `medio` existe pra
  ser auditável. Ajustes finos entram na Fase 8 (calibração).
