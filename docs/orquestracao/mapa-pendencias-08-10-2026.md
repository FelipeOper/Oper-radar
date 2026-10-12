# Mapa de pendências — o que falta para finalizar o Oper Radar

> Entregável da onda de 08/10/2026 (ver `docs/orquestracao/PAINEL-AGENTES.md`). Autor: **ATLAS**
> (Planejador). Priorização P0/P1/P2 com evidência verificada em 08/10/2026 entre ~13h50 e ~15h20
> (horário local). Cada afirmação abaixo tem fonte; o que não pôde ser confirmado está dito como
> tal. Número errado é pior que nenhum número.

**Base de leitura:** `origin/main` @ `e277802` (merge do PR #75, 08/10 ~14h21 UTC), CI verde
(run 37791785092). Produção afirmada apenas pelo registrado em `docs/PRODUCAO.md` (último release:
**2.9, 01/10/2026**, frontend do cartão "O que fazer com este veículo", origem `9d1af97`).

## Como este mapa foi verificado (método)

- Git: `git fetch origin`; leituras via `git show/ls-tree/grep/log` **contra `origin/main`**, não
  contra o worktree sujo do andar térreo (que segue intocado, só leitura, como manda o papel).
- PRs: `gh pr list --state all`, `gh pr view N`, `gh pr checks N`, `gh api repos/FelipeOper/Oper-radar/pulls/N`
  (estado oficial de merge).
- Docs: `CLAUDE.md` (registro 08/09), `docs/PRODUCAO.md` (releases 1–2.9), `docs/orquestracao/`
  (`PAINEL-AGENTES.md`, `HANDOFF-ORQUESTRADOR.md`), `docs/oper-radar-redesign/MIGRACAO_DEMO_PARA_REAL.md`.
- Batedor **Farol**: nota `Backlog-Oper-Radar-Pacote1` (relatório 22/09, lido inteiro) + parecer
  oral de 08/10 (verificou PR #54 com PHP 8.3.35 oficial, zip SHA-256 `25a8e2ac…`).
- Graphify: leitura direta de `C:\Users\aline\gfy\oper-radar\graphify-out\` (timestamps).
- **Sem acesso ao cPanel/SSH/produção ao vivo** — tudo que depende disso está marcado como
  pendência do Felipe, não como tarefa de agente.
- **Limitação declarada:** o Plano Mestre de Evolução v1.0 e o Mapa Funcional são DOCX no projeto
  Claude externo ("OPER RADAR - PROJETO"), inacessíveis nesta sessão. A leitura do Pacote 1 abaixo
  foi reconstruída por evidência (CLAUDE.md 08/09 + PRs #53/#54/#57), não pela lista original —
  nem eu nem o Farol lemos os DOCX nesta onda.

## Resumo executivo

O produto está publicado e funcional em produção (release 2.9), com `main` verde. Faltam quatro
blocos para "finalizar": **(1)** destravar a fila de 7 PRs abertos (3 conflitantes, 1 com CI
vermelho, todos com código pronto); **(2)** terminar a portação do design system nas telas que
ainda vivem no corpo antigo do `App.jsx` (~3.000 linhas, 602 blocos de estilo inline) — Dados e
FIPE, Anúncio/Veículo, Configurações/Conta, e conferir Análise; **(3)** publicar em produção o que
já está mesclado no `main` mas saiu depois do release 2.9 (fila de vinculação FIPE por categoria,
commit `5b7d779`); e **(4)** as pendências que só o Felipe resolve (GOV01/OPS01, auditoria de
vínculos no banco, CSVs do F3, definições de DAT02 e F4, sessões de deploy). Graphify está
desatualizado (grafo de 26/09 vs. código de 08/10) e fica registrado como tarefa própria.

---

## P0 — caminho crítico (sem isso o app não fica "finalizado")

### P0.1 — Destravar a fila de 7 PRs abertos (todos com código pronto)

Estado real dos PRs em 08/10 ~15h UTC (detalhe na tabela no fim do documento):

| PR | Tema | Estado | Ação | Dono sugerido |
| --- | --- | --- | --- | --- |
| #66 | T09 links externos seguros | OPEN, **CONFLICTING**, CI verde | **rebase sobre `main`** (App.jsx/*Blocos mudaram nas releases 2.7–2.9) e seguir para o gate | TERRA (é tudo `app/src`) |
| #54 | DAT04 saídas de lojista | OPEN, **CONFLICTING**, CI verde | **rebase** — Farol (08/10, verificado com PHP oficial): "aprovo merge após rebase, sem sobreposição; só `lojistas.php` conflita" | LUNA |
| #57 | DAT05/DAT06 período + confiança | OPEN, **CONFLICTING**, CI **vermelho** | **rebase maior** (`lib/market_quality.php` e `mercado_painel.php` foram reescritos no `main`) + corrigir o contrato Python que falha (AssertionError sobre `query_contract.php`, run 35801214309) | LUNA |
| #68 | FIPE P0 série/eixo/cabine/DAF-IVECO + uplift CF | OPEN, **MERGEABLE**, CI verde | **pronto para merge** — só falta decisão; 80/80 testes, aprovado por CUSTODIA/VELOX em revisão cruzada (corpo do PR) | Orquestrador/Felipe decidem |
| #62 | demo navegável (`docs/design-simulation/`) | OPEN, MERGEABLE, CI verde | **esperar a onda visual** — a branch `agent/demo-final` é a branch ativa de MARE/RUMO/PRISMA/LASTRO agora (PAINEL-AGENTES.md); atualizar o PR quando a onda fechar | ANCORA abre/atualiza após gate |
| #58 | docs fase1-coleta-php (fallback) | OPEN, MERGEABLE, CI verde | decidir merge ou close — o lado "confirmado" já entrou via PR #59 (merged hoje) | Orquestrador |
| #60 | simulação visual BETA | OPEN, MERGEABLE, CI verde, parado desde 23/09 | decidir: candidato a close — o app real já superou a simulação como produto (PR #63/#67), o BETA fica como referência | Orquestrador/Felipe |

- Merges no `main` seguem a regra do projeto: PR + CI verde + gate CUSTODIA, decisão do
  Orquestrador/Felipe (`HANDOFF-ORQUESTRADOR.md` §Regras).
- Correção de premissa da onda: a tarefa listava 8 PRs abertos incluindo o **#59** — ele **estava
  aberto quando a onda abriu e foi marcado MERGED hoje 08/10 14h21:27 UTC** (gh api: `merged_at`
  2026-10-08T14:21:27Z, `merge_commit_sha` `35ee668`): o conteúdo da branch dele
  (`docs/fase1-coleta-hostgator-confirmado`) entrou no `main` via PR #75, que foi criado a partir
  dela. Hoje restam **7 PRs abertos**. O PR #56 foi CLOSED sem merge em 22/09 (incidente do floor
  antigo); o roteamento hoje vive em `app/src/navigation.js` + `app/src/useBrowserRoute.js`
  (presentes no `main`).

### P0.2 — Terminar a portação do design system (telas ainda no corpo antigo)

Evidência: `App.jsx` tem ~3.000 linhas (contagem bruta 3.084; 2.890 não-vazias) com **602 blocos
`style={{…}}`**; as páginas `PageFipe` (App.jsx:1730), `PageFipeFila` (:1856), `PageFipeCatalogo`
(:1904), `PageConta` (:2083), `PageConfiguracoes` (:2656) e `PageAnalise` (:2815, com o chat
Analista IA) ainda usam o corpo antigo, além dos painéis de detalhe de anúncio/veículo (:428,
:560, :1608). A ordem oficial (`MIGRACAO_DEMO_PARA_REAL.md` §"Ordem de execução") riscou até
"Plano de ação (feito)" e deixa aberto: **Dados e FIPE → Anúncio/Veículo → Configurações/Conta**.
Nota honesta: o documento dá "Inteligência/Oportunidades" como feito (Release 2.6 =
Oportunidades), mas `PageAnalise` não foi portada — conferir com TERRA se Análise entrou no
escopo dela antes de fechar este item.

- É exatamente a tarefa da onda atual (TERRA: "consistência visual do app de produção, tela a
  tela", PAINEL-AGENTES.md). Regras da migração que valem aqui: mediana qualificada, amostra
  mínima 5, evidência em cada número, um commit por tela, verificação visual real (build
  `VITE_DEMO=1` + `agent-browser`, desktop e 390 px).

### P0.3 — Publicar em produção o que o `main` já tem e a produção não

- **Fila de vinculação FIPE por categoria** (commit `5b7d779`, entrou no `main` via PR #67 em
  01/10 15:58 UTC): cria `oper-radar-api/fipe_fila_categorias.php` (81 linhas) + a fila no
  frontend (`App.jsx` +64 linhas). O release 2.9 saiu ~12h05 UTC **do commit `9d1af97`** —
  `5b7d779` é **posterior** a `9d1af97` (verificado: `git merge-base --is-ancestor` falso) e
  `docs/PRODUCAO.md` nos releases 2.8/2.9 **não lista** `fipe_fila_categorias.php` entre os
  publicados. Ou seja: feature mesclada, **nunca publicada** (nem API nem frontend).
- Ação: próximo release (frontend + o PHP novo) pelo fluxo padrão de `docs/PRODUCAO.md` (backup,
  hashes, pré-checagem, registro). **Depende de sessão/confirmação do Felipe** (cPanel) — não é
  executável por agente sozinho.
- Enquanto isso, produção e `main` divergem: quem testar a fila FIPE no ar não a verá.

---

## P1 — importantes, executáveis agora ou aguardando decisão pontual

### P1.1 — Segurança: links externos (T09) e defesa em profundidade na API [bug/débito]

- `main` ainda renderiza URL raspada de terceiros direto em `href` em **7 pontos**:
  `App.jsx:428`, `App.jsx:560`, `App.jsx:1608`, `ConcorrenciaBlocos.jsx:73/82/87`,
  `HojeBlocos.jsx:82` (só `ComprarBlocos.jsx:47` usa `urlSegura`). Vetor: `javascript:`/`data:`
  vindos de anúncio raspado. Fix pronto no PR #66 (`urlSegura.js` + `LinkExterno.js`, 151/151
  testes, CI verde) — conflitou com as releases 2.7–2.9; o rebase é a primeira ação da fila (P0.1).
- Débito complementar (T09b, corpo do PR #66): a API PHP continua devolvendo `url`/`url_perfil`
  crus e `xml_estoque.php` usa só `FILTER_VALIDATE_URL`. O branch órfã `agent/t21-url-backend`
  (`b716c5b`) já valida URL no backend (`lib/xml_estoque.php` +79 linhas de teste) — reconferir
  e decidir se vira PR (ver P2.8).
- A auditoria de segurança completa (endpoints sem auth, segredos, criptografia em trânsito/
  repouso) é a tarefa da **NOVA** nesta onda (`docs/orquestracao/auditoria-seguranca-08-10-2026.md`,
  PENDENTE no painel) — este mapa não a substitui.

### P1.2 — Qualidade FIPE: merge do #68 e sincronizar o sync no servidor [bug ativo em produção]

- O PR #68 corrige, em `fase2-fipe/fipe_sync.py`, **dois bugs de aceitação indevida** (cabine DAF
  e bônus de score IVECO que burrava os portões de confiança) + série/geração, eixo/tração e
  uplift CF. Enquanto não for mesclado **e sincronizado no servidor**, o cron de FIPE em produção
  segue capaz de criar vínculos errados (mitigado pela curadoria manual por categoria).
- Ação: merge (decisão do Orquestrador/Felipe — código pronto, CI verde, aprovado em revisão
  cruzada por CUSTODIA/VELOX) e depois **sincronizar `fase2-fipe/` no servidor** (deploys de
  Python não têm fluxo de release como o PHP — combinar com Felipe como isso roda hoje).
- Consequência declarada no PR: vínculos automáticos DAF/IVECO/CF podem **reduzir** com a regra
  mais estrita — comunicar ao Felipe antes do merge.

### P1.3 — Acessibilidade mobile: alvos de toque < 44 px fora de Oportunidades [bug/débito]

- O parecer da CUSTODIA (26/09, citado em `MIGRACAO_DEMO_PARA_REAL.md` §"Expansão") apontou
  botão Evidência com 32 px e ajuda "?" com 18×18. O T02 (PR #64, merged) corrigiu **só
  Oportunidades** (`app/src/theme.css` + `comprarMobile.test.js`); `Evidencia.jsx` e
  `HojeBlocos.jsx` seguem **sem nenhuma regra min-height/min-width** (git grep em `main` sem
  matches). Ação: varredura de alvos ≥ 44 px no restante do app — encaixa na onda da TERRA.
- Verificação mobile real segue sem registro de fechamento: PRODUCAO.md registra 390 px em
  telas pontuais (Mercado, 24/09), mas o "mobile real"/320 px recomendado desde 01/09
  (CLAUDE.md §"Publicação registrada") e o login deslogado do beta (24/09) não têm registro
  de conferência posterior.

### P1.4 — Consistência de dados: DAT04 (bug), DAT05/DAT06 (débito de contrato)

- **DAT04 (bug conhecido, ainda no `main`):** `lojistas.php` conta "saídas" pelo status atual e
  `lojista_detalhe.php` por eventos — mesma revenda, números diferentes na lista e no detalhe
  (caso Lelo Caminhões: 56/30d e 128 no cartão vs. 35/30d e 47 no detalhe; corpo do PR #54). Fix
  pronto no #54 (CI verde; testes revalidados pelo Farol com PHP 8.3.35 oficial) — rebase e merge
  (P0.1).
- **DAT05/DAT06:** confiança de preço vs. volume misturadas num número único e whitelist de
  períodos duplicada — fix no #57 (rebase maior + CI). `lib/market_period.php` **não existe no
  `main`** (git ls-tree), ou seja, nada disso foi superado por outro trabalho.

---

## P2 — validações, paridade, débito e backlog (não travam o lançamento)

1. **Validações pendentes de produção (PRODUCAO.md, sem registro de fechamento posterior):**
   Comparador com dados reais autenticado (2.5 ficou pendente por sessão expirada); botões
   "Por que esta nota" com dados reais e mobile (2.6 "não testado"); duplas de anúncios com
   mesmo título/preço/revenda em Oportunidades — 11 grupos (2.6: "decidir se agrupa"); FIPE
   zero-km com ano `32000` (baseline 31/08: "normalizar antes de exibir" — conferir se persiste).
2. **Crons/operacional (PRODUCAO.md §"Componentes ativos" e §"Evidência dos logs", leituras de
   31/08 — desatualizadas):** fila de detalhe de 30 min com "capacidade ainda precisa ser medida";
   `fipe-mensal.log` sem leitura desde 10/08; "chechagem curta obrigatória na próxima sessão
   estável" ainda vale. Precisa de uma sessão de leitura de logs (Felipe/Orquestrador).
3. **Paridade com a demo (parecer CUSTODIA 26/09, confirmado por grep no `main` de hoje):** Hoje
   sem "Analista IA" / "Ver monitor" / "Ver todos" (0 matches em `HojeBlocos.jsx`); Mercado sem
   filtro de Marca (0 matches em `MercadoBlocos.jsx`). Decidir com o Felipe se são desejados.
4. **Endpoints planejados nunca feitos** (`MIGRACAO_DEMO_PARA_REAL.md` §"Novos endpoints"):
   `qualidade_dados.php` (monitor de qualidade) e `reducoes_preco.php` (agregado por período/
   UF/revenda/modelo). Sem schema novo; padrão atual: lógica pura em `lib/` + teste PHP (18
   arquivos de teste hoje).
5. **Expansões propostas (mesma doc, §"Expansão"):** giro/tempo-até-saída por modelo
   (`consolidacao_mensal` já tem `taxa_giro`/`aging_medio_dias`); série histórica de mediana por
   modelo (`anuncio_snapshot`); alerta acionável ("abaixo da FIPE" + revenda que reduziu + tempo
   no ar); percentil de preço na Minha Loja; comparador de revendas. Priorizar com o Felipe.
6. **Integrações desativadas de propósito** (PRODUCAO.md §"Integrações"): Analista IA
   (`ANTHROPIC_API_KEY` ausente — evitar custo não autorizado) e consulta por placa (token do
   provedor ausente). Ligar é decisão de custo/credencial do Felipe.
7. **Navegador de ofertas do Mercado ainda no visual antigo** com filtros próprios parcialmente
   sobrepostos à barra de contexto (`MIGRACAO_DEMO_PARA_REAL.md` §"Tela Mercado" — "etapa
   própria", envolve paginação por cursor).
8. **Branches órfãs sem PR e sem formulário** (pasta de orquestração sumiu 26/09–06/10; ver
   HANDOFF §"Carimbo"): `agent/t03-criar-acao` (`fb336b7`; `acoesModel.js` — provavelmente
   sobreposto pelo `planoAcaoModel.js` do PR #67), `agent/t14-docs` (`4c96b9c`; tweaks de README
   provavelmente superados), `agent/t21-url-backend` (`b716c5b`; valida URL no backend — ver
   P1.1). Reconferir diff contra `main` e decidir PR ou descarte.
9. **Graphify desatualizado (seção própria pedida pelo painel):** último grafo gerado em
   **26/09/2026 18h12** (`C:\Users\aline\gfy\oper-radar\graphify-out\graph.json`/`graph.html`,
   timestamps conferidos); `app/src` tinha 28 arquivos e hoje tem **31** (entrou o refator
   `*Blocos.jsx`/`*Model.js`/`Shell.jsx`/`Login.jsx`/`demoFixtures.js`, commit `1ea728a` em
   diante). Re-rodar `/graphify` é tarefa própria — melhor **depois** da onda visual assentar
   (App.jsx e `*Blocos.jsx` estão em movimento agora, grafo viraria obsoleto de novo).
10. **Riscos de repositório (não limpar sem autorização):** servidor de produção com 2 rastreados
    modificados + 72 não rastreados (PRODUCAO.md §"Risco de reprodutibilidade"); worktree do
    andar térreo local suja (CLAUDE.md, `docs/CONTINUIDADE_PROJETO.md`,
    `docs/oper-radar-redesign/auditoria-pre-implementacao.md` modificados + untracked) — segue
    só-leitura até o dono decidir.
11. **Painel do Comparador/"Por que esta nota" e mobile:** coberto no item 1 (não duplicar
    esforço).

---

## Pendências SÓ do Felipe (bloqueadas para qualquer agente — não distribuir como tarefa)

1. **GOV01 (residual):** releases 1–2.9 já publicam com pré-checagem de hash e backup (o "falta
   TUDO" do relatório do Farol de 22/09 está superado em parte), mas schema e crons ao vivo não
   são lidos desde 31/08 (PRODUCAO.md §"Componentes ativos").
2. **OPS01:** procedimento de rollback documentado por release, mas **teste real de restore nunca
   registrado** — ~15 min no cPanel.
3. **Auditoria de vínculos FIPE incompatíveis no banco:** o bloqueio DAT01 está em produção
   (publicado no release 2.8, 01/10), mas listar **todos** os vínculos ruins existentes no
   `meu_estoque` (não só os 2 conhecidos) exige consulta no banco — só o Felipe.
4. **F3:** validação de cobertura por `anuncio_id` contra CSVs — pacote read-only pronto em
   `agent/f3-offline-ensaio` (`af1d9c2`, 11/11 testes), **aguardando os 5 CSVs**.
5. **DAT02 (equivalência de grupos):** não iniciado; depende de definição formal do Felipe
   (que variáveis tornam dois anúncios comparáveis).
6. **F4 (escrita em massa nos vínculos):** bloqueada por decisão; branch de preparação existe
   (`agent/f4-preparacao-nova`, `f8d9bf4`) — não usar sem ordem.
7. **Sessões de deploy:** publicar o P0.3 (`5b7d779`) e, pós-merge do #68, sincronizar o
   `fase2-fipe/` no servidor.
8. **Decisões de merge** dos PRs da fila (via Orquestrador/gate CUSTODIA) e credenciais/custo das
   integrações desativadas (P2.6).

## Em andamento nesta onda (08/10 — para não duplicar trabalho)

PAINEL-AGENTES.md: NOVA (auditoria de segurança, entregável irmão deste), TERRA (consistência
visual `app/src` — inclui P0.2/P1.3), MARE/RUMO/PRISMA/LASTRO (consistência da DEMO em
`agent/demo-final`, os arquivos `*Blocos.jsx`/`Shell.jsx`/`Login.jsx` da simulação), CUSTODIA
(gate dos relatórios ATLAS/NOVA e dos diffs de frontend), ANCORA (PRs quando o gate aprovar).
Este mapa é insumo do gate — nada aqui foi "concluído" além do mapeamento.

## Estado real dos PRs citados pela onda (verificado 08/10 ~15h UTC)

| PR | Título (resumo) | Estado | Mergeable | CI (Python 3.9/3.13) |
| --- | --- | --- | --- | --- |
| #54 | DAT04 — reconcilia saídas de lojista lista×detalhe | OPEN | CONFLICTING | verde |
| #57 | DAT05/DAT06 — período único + confiança preço/volume | OPEN | CONFLICTING | **vermelho** (1 AssertionError, contrato sobre `query_contract.php`) |
| #58 | docs fase1-coleta-php como fallback | OPEN | MERGEABLE | verde |
| #59 | docs fase1-coleta (SSH/Python confirmado) | **MERGED 08/10 14h21 UTC** (via PR #75) | — | — |
| #60 | Simulação visual BETA | OPEN (parado desde 23/09) | MERGEABLE | verde |
| #62 | Demo navegável com design system | OPEN (branch ativa da onda) | MERGEABLE | verde |
| #66 | T09 — links externos só http/https (`LinkExterno`) | OPEN | CONFLICTING | verde |
| #68 | FIPE P0 série/eixo/cabine/DAF-IVECO + uplift CF | OPEN | MERGEABLE | verde |

Recentes mesclados de referência: #63 (design system + migração, 24/09), #64 (T02 mobile),
#65 (T08 fixtures), #67 (Plano de ação + orientação de venda, 01/10), #75 (painel, 08/10).
Fechado sem merge: #56 (22/09, incidente do floor antigo — roteamento atual vive em
`navigation.js`/`useBrowserRoute.js`).

## Fontes primárias

- `docs/PRODUCAO.md` (em `origin/main`): releases 1–2.9 com hashes, backups e pendências.
- `CLAUDE.md` (em `origin/main`): registro 08/09 (Pacote 1, GOV01/OPS01 limitados, DAT01/DAT03).
- `docs/orquestracao/PAINEL-AGENTES.md` e `HANDOFF-ORQUESTRADOR.md` (estado da onda e regras).
- `docs/oper-radar-redesign/MIGRACAO_DEMO_PARA_REAL.md` (mapa de telas, ordem, pendências).
- Nota `Backlog-Oper-Radar-Pacote1` (Farol, 22/09) + parecer oral de 08/10 (PR #54/#57/#59).
- `gh pr view/checks` + `gh api pulls/N` (08/10); `git grep/ls-tree/show` contra `origin/main`.
- `C:\Users\aline\gfy\oper-radar\graphify-out\` (timestamps do último grafo, 26/09 18h12).
