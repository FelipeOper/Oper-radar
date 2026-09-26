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
| C | Telas, uma por vez (ordem abaixo) | Em andamento: **Hoje, Mercado e Concorrência/Lojista feitas** (24/09/2026); as demais a fazer |
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
| Minha Loja | `PageMinhaLoja` | `minha_loja.php`, `minha_loja_detalhe.php`, `minha_loja_xml.php` | estoque próprio (XML) | **Feita.** API entrega só mediana nacional (`mercado_escopo: Brasil`), rotulada na tela; recorte por UF fica como evolução |
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
- **Anúncio ideal por região ("o que comprar")**: proposta em `ANUNCIO_IDEAL_POR_REGIAO.md` (modelo por praça + anúncios candidatos, pontuação explicável).
- **Conferência de telas (CUSTODIA, 26/09/2026, `PARECER-CUSTODIA-CONFERENCIA-TELAS.md`)**: pendências a tratar antes de fechar o redesign: alvos de toque
  mobile abaixo de 44 px (botão Evidência 32 px, ajuda "?" 18×18), números incoerentes nas fixtures da DEMO (64 vs −21 em 48 h e 30 d; 9 preços válidos
  com "amostra insuficiente"), Hoje sem Analista IA / "Ver monitor" / "Ver todos", Mercado sem filtro de Marca. A baseline da TERRA usou o HTML estático da DEMO
  em vez da renderizada (12 sinais em Hoje; Volvo FH 540 2021 = 22 anúncios): usar a renderizada como referência.
- **Minha Loja com posição relativa**: percentil do seu preço dentro do grupo, não só "acima/abaixo da mediana".
- **Comparador de revendas** (lado a lado, como o de modelos).
- **Plano de ação ligado à evidência**: cada ação nasce de um insight e guarda a métrica de origem.

## Ordem de execução das telas

1. ~~Shell (Fase B)~~ — feito.
2. ~~Hoje~~ (feita) → ~~Mercado~~ (feito) → ~~Concorrência/Lojista~~ (feita) → ~~Minha Loja~~ (feita) → ~~Comparador~~ (feito) → Inteligência/Oportunidades
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

## Tela Mercado (feita em 24/09/2026)

O painel do Mercado já estava redesenhado e em produção (02/09); esta etapa acrescentou o que a demo
tem e faltava, sem reescrever a lógica de paginação do navegador de ofertas.

- **Evidência nos KPIs do Panorama** (`mercadoModel.js` → `Evidencia.jsx`): recorte, período, valor,
  base, amostra, confiança (só a do ticket, vinda de `resumo.confianca`), atualização e explicação.
- **Oportunidade regional do modelo** em "Detalhes do modelo": mesma regra da Minha Loja
  (`lib/regional_modelo.php`, pesos 30/20/20/15/15, confiança por amostra e histórico), calculada só
  para o recorte marca + modelo + ano, comparando UFs. UF sem amostra ou sem histórico não recebe nota.
  A demo calculava o índice sobre todos os caminhões juntos; a especificação
  (`docs/ESPECIFICACAO_INSIGHT_REGIONAL.md`) proíbe misturar recortes, então **não foi copiado**.
- **Cards de modelo** mostram amostra e confiança (`9 preços válidos · confiança média`).
- **Nomenclatura**: "Navegador de anúncios" virou "Ofertas disponíveis"; as etapas numeradas
  ("1. Região … 4. Ordenação") viram rótulos simples. A lógica de filtros e paginação não mudou.
- Servidor antigo (sem `oportunidade_regional`): o bloco simplesmente não aparece.
- **Pendente no Mercado**: o navegador de ofertas ainda usa o visual antigo (estilos inline) e mantém
  filtros próprios de região/estado/segmento, parcialmente sobrepostos à barra de contexto. Unificar
  exige mexer na paginação por cursor e na sincronia com o contexto; fica para uma etapa própria.
- Verificado: 15/15 testes PHP, 61/61 no app, SQL das 4 consultas novas em parser MySQL (não em MySQL
  real), navegador real com `agent-browser` em desktop e 390 px (achou e corrigiu quebra de texto na
  lista de componentes no celular).

## Tela Concorrência/Lojista (feita em 24/09/2026)

- A lista segue a demo: UFs múltiplas, busca, ordenação por estoque, saídas, reduções e idade;
  KPIs com evidência e linhas de revenda com idade e desvio vs FIPE. O painel do lojista mostra
  indicadores, qualidade do histórico, estoque ordenável e episódios de saída, com limite
  explícito da API (150 por lista).
- `lojistas.php` e `lojista_detalhe.php` preservam o contrato antigo e acrescentam reduções de
  preço em 30 dias e desvio mediano vs FIPE. A lógica pura está em
  `lib/concorrencia_metricas.php`. Sem eventos, reduções são indisponíveis; desvio só aparece
  com cinco preços válidos com FIPE. Saída observada continua sem significar venda.
- Verificado: testes PHP, frontend e contratos Python; `php -l` nos três arquivos PHP; build
  normal e demo; navegador em desktop e 390 px, sem rolagem horizontal. As consultas novas
  ainda dependem de verificação com MySQL real na publicação do Release 1.

## Caminho de publicação (24/09/2026)

Estado em produção: **Release 1 da API** publicado (ver `docs/PRODUCAO.md`). O frontend de produção ainda é o antigo.

1. **Release 1.1 (API, 2 arquivos)**: corrige o que a conferência com dados reais achou (reduções contadas como eventos, feed sem saídas/quedas,
   insight FIPE com amostra de 5 preços, marca duplicada no rótulo). Pacote: `hoje_stats.php` + `lib/hoje_painel.php`.
2. **Release 2 beta (frontend em `/oper-radar-beta/`)**: `python scripts/empacotar_frontend.py --base oper-radar-beta --saida <pasta>`.
   Mesmo domínio, então sessão e dados reais funcionam; `/oper-radar/` fica intocado; sai com `noindex`.
3. **Validação do beta com dados reais** (Hoje, Mercado, Concorrência, tema claro/escuro, celular; as demais telas sob a nova identidade).
4. **Release 2 (produção)**: `--base oper-radar`, backup da pasta `oper-radar/`, upload por cima, registro em `docs/PRODUCAO.md`.
5. **Telas restantes**, uma por release: Comparador, Minha Loja, Inteligência (Oportunidades + Análise), Plano de ação, Dados e FIPE,
   Configurações, Conta. Hoje funcionam com o corpo antigo sob a nova identidade (as 11 rotas renderizam no build de demonstração).
6. **Mesclar o PR #63 no `main`** (decisão do Felipe): o `main` está atrás de produção desde 02/09; o PR reúne as duas linhas.

Achados da conferência ao vivo (24/09/2026) que viraram teste: feed sem mistura de tipos, contagem de reduções por anúncio distinto,
amostra mínima de 10 preços para destacar "abaixo da FIPE", rótulo sem marca repetida.
Pendências de dado: desvio FIPE por revenda chega a +90% (vínculos FIPE suspeitos, aparece com confiança; investigar em etapa própria).

## Correções da revisão Codex adversarial (24/09/2026, PR #63)

Veredito inicial `needs-attention`; três achados, todos confirmados no código e corrigidos:
1. Insight "abaixo da FIPE" misturava vínculos de confiança menor na mediana → filtro opt-in `alto`.
2. Desvio FIPE do Mercado sem amostra mínima → `null` abaixo de 5 preços, amostra e confiança expostas.
3. Concorrência sem filtros de cidade e segmento → restaurados (cidade dentro das UFs; segmento por
   `mix_categorias`; detalhe do lojista recebe `categoria`).
Depende de **Release 1.2 da API** (`lib/market_quality.php`, `hoje_stats.php`, `mercado_painel.php`) e de
novo pacote do beta. Sem a API nova o KPI de desvio FIPE não aparece ("Sem amostra verificável"): publicar a API 1.2 antes do frontend.
Reverificação Codex (2ª rodada) achou mais 2 pontos, também corrigidos: desvio sem amostra verificável não é mais exibido e a linha da revenda com segmento não mistura idade/desvio gerais.
