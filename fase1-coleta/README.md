# OPER RADAR — Fase 1: Coleta e banco de dados

Pacote técnico da Fase 1 do roteiro de implementação (ver `OPER_RADAR_Roteiro_de_Implementacao.docx`).

## O que está aqui

- `schema.sql` — schema Postgres completo (revenda, anuncio, execucao_coleta, venda_estimada)
- `parser.py` — extração dos campos de cada anúncio (ID, título, tipo, marca, ano, preço)
- `diff_logic.py` — máquina de estados com a regra de 2 confirmações antes de marcar um anúncio como removido
- `scraper.py` — orquestrador: descobre as URLs reais das revendas, busca cada página, roda o parser e o diff, grava no banco
- `crontab.example` — agendamento das janelas 07h/19h
- `sample_page.md` — trecho real de uma página de revenda (SVD Seminovos, Curitiba/PR), usado para validar o parser

## Estrutura atualizada (catálogo de marcas/modelos do próprio portal)

Como o Caminhões e Carretas é o maior portal do nicho, ele funciona como o catálogo mais
completo e atualizado de marcas e modelos de pesados/extrapesados do Brasil — melhor fonte
do que manter uma lista fixa à mão. Por isso a extração de marca agora vem de dois lugares,
combinados:

1. **`taxonomia.py` / `taxonomia.json`** — discovery real rodado contra as páginas de filtro
   do portal (`/venda/<categoria>/marca/<id>`), com marcas E modelos (com os IDs internos
   do site). Rodar `python taxonomia.py` para atualizar sempre que o portal adicionar marcas novas
   (recomendo mensalmente).
2. **Fallback de segurança** (`MARCAS_CAMINHAO_FALLBACK` + `MARCAS_EXTRA_FALLBACK` em `parser.py`)
   — marcas confirmadas em anúncios reais que a primeira rodada de discovery ainda não
   capturou (ex: o discovery de carreta pegou 11 marcas mas anúncios reais mostraram também
   Pastre e Rodomoura, que foram adicionadas aqui manualmente até o próximo discovery completo).

- [x] **`parser.py`** testado com 8 anúncios reais (2 caminhões, 4 carretas de marcas diferentes, 1 trator) — todos com marca correta.
- [x] **`diff_logic.py`** testado com 5 ciclos simulados — confirma a regra de 2 confirmações.

## O que ainda não pode ser executado a partir daqui

Este ambiente de chat não tem acesso de rede ao portal (só a ferramentas de busca/leitura pontuais) nem um banco Postgres persistente rodando em segundo plano. Por isso, o que falta para o scraper rodar de verdade, 2x por dia, é:

1. **Hospedar** este código em um ambiente com acesso à internet e execução agendada — uma VPS simples, um serviço tipo Railway/Render, ou o Claude Code rodando localmente na sua máquina/servidor.
2. **Subir um Postgres** (gerenciado ou não) e rodar `schema.sql` nele.
3. **Instalar as dependências**: `pip install -r requirements.txt`
4. **Configurar o cron** com `crontab.example` (ajustando os caminhos).
5. **Rodar o primeiro ciclo manualmente** para validar contra o banco real: `python scraper.py --janela 07h --uf PR`

## Taxonomia (marcas e modelos) — direto do portal

Em vez de manter uma lista de marcas escrita à mão, `taxonomia.py` descobre a lista oficial
de marcas e modelos direto dos filtros do próprio portal (ex: a página de carreta/semi-reboque
lista as 70+ marcas de implemento que o portal reconhece, e os 28 tipos de carroceria).
Como é o maior marketplace do nicho no Brasil, essa lista tende a cobrir praticamente tudo
que se vende de pesados e extrapesados no país — e se atualiza sozinha rodando o discovery
de novo (recomendado: 1x por mês, junto com a atualização da FIPE).

Fluxo:
1. `python taxonomia.py` roda o discovery contra as categorias em `CATEGORIAS_RELEVANTES`
   e gera `taxonomia.json`.
2. `parser.py` carrega esse arquivo automaticamente (`_carrega_marcas_conhecidas()`) — se
   ainda não existir, cai num fallback pequeno só com as marcas de caminhão mais comuns.

**Testado nesta sessão**: a extração de marcas e modelos rodou contra uma página real
(carreta/semi-reboque) e encontrou corretamente 11 marcas e 10 modelos de exemplo.
Não rodei o discovery completo contra as 6 categorias de `CATEGORIAS_RELEVANTES` (isso
precisa do ambiente com rede livre — ver seção abaixo).

## Limitações conhecidas (documentadas, não escondidas)

- **Paginação**: não confirmei ainda se páginas de revendas com muitos anúncios paginam (a SVD Seminovos, com ~40 anúncios, veio inteira numa página só). Se houver revenda maior que pagine, o `scraper.py` precisa de um loop de páginas.
- **Descoberta de URL real** (`discover_revenda_urls`) substitui as URLs "adivinhadas" que estavam na planilha de mapeamento nacional — recomendo rodar essa descoberta para os 3 estados detalhados (PR/SC/SP) antes de confiar nos links da planilha para scraping.
- **Marcas não catalogadas**: a extração de marca em carretas/implementos/tratores depende de uma lista de marcas conhecidas (`MARCAS_CONHECIDAS` em `parser.py`). Uma marca fora dessa lista fica com `marca = None` em vez de errada — mais seguro, mas precisa de manutenção periódica da lista conforme aparecem marcas novas na base.


## Próximo passo sugerido

Rodar `discover_revenda_urls("PR")` contra o portal de verdade (fora deste chat) e comparar a contagem com as 363 revendas já mapeadas, para validar que a descoberta automática bate com o levantamento manual.
