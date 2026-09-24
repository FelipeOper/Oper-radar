# Migração da demo para o Oper Radar real

Branch de trabalho: `agent/portar-demo-real` (base = `main` + redesign do Mercado já em produção).
Referência visual e de regras: demo navegável (`agent/demo-final`, PR #62, `docs/design-simulation/`).
Decisões do Felipe (24/09/2026): (1) portar **todas** as telas, em sequência; (2) o design system
**substitui** a identidade atual; (3) dados e cruzamentos podem ser alterados/criados, e a organização
segue a demo — podendo ir além dela onde houver potencial.

Nada aqui foi publicado. Produção só muda com aprovação explícita e o fluxo de release já documentado
(backup, hashes, `docs/PRODUCAO.md`).

## Estado

| Fase | O quê | Estado |
| --- | --- | --- |
| A | Identidade do design system (tokens, Inter/Manjari, tema escuro e claro), migração de preferências salvas | **Feita** (`797c95c`), verificada no navegador |
| A+ | Modo demo `VITE_DEMO=1` (PR #61) trazido só para verificação visual | Feita (`82f476f`) |
| B | Shell (sidebar/topbar/bottom nav) e ícones Phosphor no lugar de lucide | **Feita**: `Shell.jsx` (classes do design system, troca desktop/celular por CSS em 899px, alternância de tema na topbar) e `icons.jsx` (adaptador Phosphor; lucide removido). Menu: Concorrentes→Concorrência, Ações→Plano de ação |
| C | Telas, uma por vez (ordem abaixo) | Em andamento: **Hoje feita** (24/09/2026); as demais a fazer |
| D | Backend: novos cruzamentos e endpoints | Junto com cada tela. Feito para a Hoje: `hoje_stats.php` estendido e `frescor_coleta.php` |
| E | Release | Só com aprovação |

## Regras que valem para todas as fases

- Número errado é pior que nenhum número (regra do projeto). Toda métrica nova mostra recorte, período,
  base comparativa, amostra e confiança, como na demo.
- Preço de referência = **mediana qualificada** (preço válido, 50%–150% da referência, sem vínculo FIPE
  ambíguo), mínimo de 5 preços. Abaixo disso: "Amostra insuficiente", sem veredito.
- Saída observada não é venda. Redução de preço é sinal, não prova.
- Sem mock em produção: a demo usa dados fictícios; o app real só mostra o que a API entrega.
- Banco: qualquer migração de schema é um arquivo SQL versionado, aplicado só com aprovação do Felipe
  (HostGator sem SSH). Nada de alterar banco de produção por conta própria.
- Ao alterar código, atualizar o README da pasta afetada na mesma tarefa.

## Mapa demo → app real

Endpoints e tabelas abaixo foram lidos no código; a coluna "Cobertura" é hipótese até o payload real
ser conferido tela a tela (marcado **a verificar**).

| Demo | Página real | Endpoints existentes | Dados no banco | Cobertura / lacuna |
| --- | --- | --- | --- | --- |
| Hoje | `PageHoje` | `hoje_stats.php`, `kpis.php`, `insights.php`, `eventos.php` | `anuncio`, `mudanca_preco`, `execucao_coleta` | Feed de movimento e KPIs de 48 h: **a verificar** em `eventos.php` |
| Mercado | `PageMercado` | `mercado_painel.php` | `anuncio`, FIPE | Já redesenhado; falta alinhar ao shell novo |
| Concorrência | `PageConcorrentes` | `lojistas.php`, `lojista_detalhe.php` | `revenda`, `mudanca_preco` | Idade média, reduções e desvio FIPE por revenda: **a verificar** |
| Lojista | painel do lojista | `lojista_detalhe.php` | idem | idem |
| Comparador | `PageComparador` | `comparador.php` | `anuncio` | Existe; demo compara dois modelos com mediana qualificada |
| Minha Loja | `PageMinhaLoja` | `minha_loja.php`, `minha_loja_detalhe.php`, `minha_loja_xml.php` | estoque próprio (XML) | Base PR→Brasil com rótulo explícito: **a verificar** |
| Inteligência | `PageAnalise` / `PageOportunidades` | `insights.php`, `analista.php` | `lib/regional_insight.php` | Índice regional já tem pesos em `docs/ESPECIFICACAO_INSIGHT_REGIONAL.md` |
| Plano de ação | `PageAcoes` | (ações do usuário) | **a verificar** | Persistência atual das ações |
| Dados e FIPE | `PageFipe`, `PageFipeCatalogo` | `fipe_status.php`, `fipe_consulta.php` | `execucao_coleta` | Monitor de qualidade da demo é **novo** (ver abaixo) |
| Anúncio / Veículo | painéis de detalhe | `anuncio_detalhe.php`, `minha_loja_detalhe.php` | `anuncio_snapshot` | Existe |
| Configurações / Conta | `PageConfiguracoes`, `PageConta` | `auth.php` | — | Só visual |

## Cruzamentos da demo e de onde vêm no dado real

| Cruzamento da demo | Fonte real | Situação |
| --- | --- | --- |
| Mediana qualificada + confiança (Alta/Média/Baixa/Insuficiente) | `lib/market_quality.php` (`mercado_confianca`, `mercado_calcula_estatisticas`) | Existe. A demo calibra "Média" em 9 preços; a regra real usa 10 — **manter a real** |
| Desvio médio vs FIPE | `mercado_desvio_fipe_medio_pct` | Existe |
| Reduções de preço | eventos `mudanca_preco` em `anuncio_evento` (a tabela `mudanca_preco` do schema antigo não é usada pela API) | Feito para a Hoje (feed e insight por revenda); falta agregado por período/UF/modelo |
| Idade do estoque / tempo no ar | `anuncio.primeira_vez_visto`, `anuncio_snapshot.dias_no_ar` | Dado existe; falta agregação |
| Saídas observadas (2ª confirmação) | `anuncio.status` (`removido_candidato` → `removido_confirmado`), `data_remocao` | O status de 2ª confirmação existe e entra no feed da Hoje |
| Frescor da coleta por UF | `execucao_coleta` (janelas 07h/19h) | **Feito**: `frescor_coleta.php` (em dia, parcial, atrasada, sem coleta) |
| Índice de oportunidade regional | `lib/regional_insight.php` | Existe; conferir se os 5 componentes da demo batem com a especificação |
| Monitor de qualidade (outliers, duplicados, FIPE ambígua, sem preço, coleta atrasada) | `lib/fipe_compat.php`, `mercado_motivo_preco` | **Novo endpoint** (`qualidade_dados.php`) |
| Giro / tempo até a saída por modelo | `consolidacao_mensal` (`taxa_giro`, `aging_medio_dias`) | Dado existe; não aparece na demo — ver expansão |

## Novos endpoints previstos (sem tocar no schema)

1. `qualidade_dados.php` — itens do monitor com severidade, contagem, exemplos e ação sugerida.
2. `reducoes_preco.php` — reduções por período/UF/revenda/modelo a partir dos eventos `mudanca_preco`.
3. ~~`frescor_coleta.php`~~ — feito (Hoje).
4. ~~Extensão de `hoje_stats.php`~~ — feito (Hoje): `feed`, `ufs_saidas`, `insights`.

Cada um ganha teste PHP em `oper-radar-api/tests/` no padrão atual (lógica pura em `lib/`, endpoint só orquestra).

## Expansão além da demo (propostas, a priorizar com o Felipe)

- **Giro por modelo/UF** (`consolidacao_mensal`): "quanto tempo um FH 540 2021 leva para sair em Goiás".
  Responde a pergunta central de quem compra e vende — hoje só existe nos dados, não na tela.
- **Série histórica de preço mediano por modelo** (`anuncio_snapshot`): tendência de 30/90/180 dias no
  Detalhes do modelo, com a lacuna de cobertura sinalizada.
- **Alerta de oportunidade acionável**: cruzar "abaixo da FIPE" + "revenda que reduziu preço" + "tempo
  no ar alto" numa lista priorizada de compra, com evidência por linha.
- **Minha Loja com posição relativa**: percentil do seu preço dentro do grupo, não só "acima/abaixo da mediana".
- **Comparador de revendas** (lado a lado, como o de modelos).
- **Plano de ação ligado à evidência**: cada ação nasce de um insight e guarda a métrica de origem.

## Ordem de execução das telas

1. ~~Shell (Fase B)~~ — feito.
2. ~~Hoje~~ (feita) → Mercado → Concorrência/Lojista → Comparador → Minha Loja → Inteligência/Oportunidades
   → Plano de ação → Dados e FIPE → Anúncio/Veículo → Configurações/Conta.

Cada tela: portar visual, ligar ao dado real, testes, verificação no navegador (build `VITE_DEMO=1`
para layout e build normal para o contrato de dados), commit próprio.

## Riscos conhecidos

- `App.jsx` tem ~3.800 linhas com estilos inline; migrar tela a tela evita quebrar as que ainda não foram portadas.
- O modo demo (PR #61) não entra no build normal: conferido em 24/09/2026, `demoFixtures` tem 0 ocorrências no bundle sem `VITE_DEMO`.
- Fixtures da demo do app real ainda são rasas; para layout serve, para validar números não serve.
- `main` está atrás de produção (o redesign do Mercado só existe em branch); este PR corrige isso ao mesclar as duas linhas.

## Tela Hoje (feita em 24/09/2026)

- Frontend: `app/src/HojeBlocos.jsx` (alerta do monitor, feed, regiões, insights), `Evidencia.jsx`
  (evidência reutilizável), `hojeModel.js` (regras puras, testadas). A seção "Insights do dia"
  entrou no layout personalizável; layouts salvos antes ganham a seção uma única vez, sem perder a
  ordem escolhida (`DASHBOARD_LAYOUT_VERSION`).
- Backend: `lib/hoje_painel.php` (regras puras, `tests/hoje_painel_test.php`), `hoje_stats.php` e
  `frescor_coleta.php`. Detalhes em `oper-radar-api/README.md`.
- Implantação: backend e frontend sobem separados. O frontend degrada se o servidor ainda for o
  antigo (sem `feed`, `insights`, `ufs_saidas` ou `frescor_coleta.php`): usa os sinais da lista de
  anúncios, a lista antiga de regiões e não mostra alerta nem insights. Publicar primeiro o PHP.
- Verificado: 14/14 testes PHP (PHP 8.3.35 oficial), 55/55 testes do app, as 13 consultas SQL novas
  passam em parser MySQL. **Não executado em MySQL real**: desempenho e resultado dos dados só se
  confirmam em produção. Consultas são tolerantes e o que falhar aparece em `parciais_indisponiveis`.
- Limiares dos insights (conservadores, ajustáveis em `lib/hoje_painel.php`): 5 saídas na UF, 4
  anúncios parados há mais de 90 dias, 3 reduções na revenda, mediana 4% abaixo da FIPE com amostra
  mínima de 5 preços. Confiança usa a regra real (5/10/20 preços), não a calibração da demo.
