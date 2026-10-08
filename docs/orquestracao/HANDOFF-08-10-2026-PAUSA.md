# Handoff de pausa — onda de 08/10/2026

> Escrito pelo Claude (orquestrador) ao pausar a sessão. Complementa `HANDOFF-ORQUESTRADOR.md`
> (estado geral do projeto) e `PAINEL-AGENTES.md` (quadro de tarefas). Sem credenciais.
> Antes de agir em qualquer item, confirme o estado real (git, `maestri list`, `maestri check`):
> este texto envelhece a cada hora.

## Resumo em cinco linhas

1. A onda "mapeamento + segurança + consistência de frontend + FIPE/DAF" foi aberta e está
   parcialmente entregue. Nada foi publicado em produção; nada foi mesclado hoje além do PR #75.
2. O mapa de pendências da ATLAS foi aprovado pela CUSTODIA e virou o PR #76 (aberto, CI verde).
3. A auditoria de segurança da NOVA foi **devolvida** pela CUSTODIA: o achado crítico C1 estava errado.
   A NOVA está corrigindo.
4. O frontend de produção da TERRA está pronto e aguarda o gate B da CUSTODIA.
5. A FIPE/DAF é a prioridade do Felipe. A CORRENTE está produzindo o plano; o PR #68 segue aberto.

## Estado do repositório (conferido em 08/10/2026)

- `origin/main` = `e277802` (merge do PR #75). Nada novo foi mesclado depois.
- O worktree principal estava na branch `docs/painel-agentes-08-10` com mudanças não commitadas em
  `CLAUDE.md`, `docs/CONTINUIDADE_PROJETO.md`, `docs/oper-radar-redesign/auditoria-pre-implementacao.md`
  e `docs/orquestracao/PAINEL-AGENTES.md` (a última é minha: linhas de ATLAS e NOVA). Não foram
  tocadas por agentes; decidir o que fazer com elas é do Felipe.
- Branches desta onda (todas locais, **nenhuma enviada ao GitHub**, exceto a do PR #76):

| Branch | Commit | Dono | Situação |
| --- | --- | --- | --- |
| `docs/mapa-pendencias-08-10` | `007bbe2` | ATLAS | PR #76 aberto, CI verde, gate aprovado |
| `docs/auditoria-seguranca-08-10` | `7f8e752` | NOVA | Devolvida pela CUSTODIA; NOVA corrigindo (novo commit esperado) |
| `agent/frontend-consistencia-08-10` | `baf3dbe` (4 commits) | TERRA | Aguarda gate B da CUSTODIA |
| `agent/demo-final-prisma` | `3043781` (3 commits) | PRISMA | Em andamento, parada num pedido de permissão |
| `agent/demo-final-mare` | `abe8581` (base) | MARE | Em andamento, sem commit novo |
| `agent/demo-final-rumo` | `abe8581` (base) | RUMO | Parada num pedido de permissão |
| `agent/demo-final-lastro` | `abe8581` (base) | LASTRO | Parada num pedido de permissão |
| `docs/plano-fipe-daf-08-10` | (ainda não criada) | CORRENTE | Em andamento |

- A branch antiga `agent/frontend-design-workspace` (`e7f7343`) foi **preservada de propósito**: ela
  divergiu da main em ~2 meses e dá conflito em `App.jsx`, `main.jsx` e `app/README.md`. A TERRA
  trabalhou numa branch nova a partir da main em vez de resetá-la.
- Os worktrees das frentes de demo ficam na pasta de scratchpad de uma sessão anterior
  (`...\scratchpad\demo-mare`, `demo-rumo`, `demo-prisma`, `demo-lastro`). O worktree `demo-wt` dessa
  pasta tem ~350 arquivos apagados no working tree e **não deve ser usado**.

## Pull requests

- **#76** (mapa de pendências, só docs): aberto, mergeable, CI verde, gate aprovado. Merge é do Felipe.
- **#68** (`agent/fipe-p0-integracao`, fila de vinculação FIPE): mergeable, CI verde. Corrige dois
  bugs de aceitação indevida que estão **ativos no main** (cabine DAF em `fipe_sync.py` ~794-803 e
  IVECO em `avalia()` ~426-434). Depois do merge é preciso sincronizar o `fipe_sync.py` no servidor.
- #54, #57, #66: conflitantes (#57 também com CI vermelho). #58, #60, #62: mergeable, sem decisão.
  #59 foi mesclado hoje. Detalhe no mapa da ATLAS.
- Deploy pendente: o commit `5b7d779` (fila FIPE por categoria, PR #67) está no main e nunca foi
  publicado. Confirmado pela CUSTODIA contra `docs/PRODUCAO.md`.

## Agentes, modelos e situação

Todos rodam no preset OpenCode do Maestri, provedor **OpenCode Go** (nunca "Personal/OpenCode"/Zen,
que está com saldo $0). Os modelos foram trocados hoje para sair do GLM-5.2 (o mais caro), depois do
limite de 5 horas do plano.

| Agente | Modelo | Situação ao pausar |
| --- | --- | --- |
| ATLAS | Qwen3.7 Plus | Ociosa. Mapa entregue. |
| NOVA | DeepSeek V4 Pro | Corrigindo a auditoria devolvida. |
| TERRA | DeepSeek V4.1 Flash | Entregou; aparece ocupada sem atividade clara. |
| MARE | MiMo-V2.6-Flash | Validando o visual com capturas. Sem commit novo. |
| RUMO | DeepSeek V4.1 Flash | Parada num pedido de permissão. |
| PRISMA | MiMo-V2.6-Flash | Parada num pedido de permissão (3 commits feitos). |
| LASTRO | DeepSeek V4.1 Flash | Parada num pedido de permissão. |
| CORRENTE | DeepSeek V4 Pro | Plano FIPE/DAF em andamento. |
| CUSTODIA | Qwen3.8 Max | Gate B em andamento; ficou com um pedido de permissão pendente. |
| ANCORA | (modelo original) | De prontidão para abrir PRs. |
| Farol, VELOX, LUNA | — | Sem tarefa nesta onda (LUNA fora do ar). |

Trocar o modelo de um agente reinicia a sessão e **apaga o histórico da conversa**. O trabalho em
disco continua; o agente precisa de um briefing de retomada ("olhe `git status`/`git diff` no seu
worktree e continue"). Forma de trocar, em PowerShell:
`maestri recruit "<NOME>" --preset "OpenCode" --command "C:\Users\aline\AppData\Roaming\npm\opencode.cmd -m opencode-go/<modelo>" --replace "<NOME>"`.
No Git Bash, `/models` vira caminho de arquivo; use PowerShell.

## Tarefas por agente (o que cada um deve entregar)

- **NOVA:** reescrever o C1 como registro histórico e fundir com o M1 (acrescentando
  `docs/ESTADO_ATUAL.md:23-24`), refazer a verificação nas linhas reais e rebaixar a ação nº 1 para
  higiene opcional. Manter I1 e o resto. Novo commit, sem amend, sem push.
- **CUSTODIA:** concluir o gate B (frontend da TERRA: `npm test` 160/160, build, nada de regra de
  negócio alterada, `PainelMercadoAnalitico` intocado) e revisar de novo a auditoria da NOVA quando
  ela reentregar. Veredito por `maestri ask "Orquestrador"`.
- **TERRA:** só corrigir o que a CUSTODIA devolver.
- **MARE / RUMO / PRISMA / LASTRO:** consistência visual da DEMO, cada uma nos seus arquivos, em
  worktree e branch próprios, sem editar `theme.css` nem `App.jsx`, sem push. Planos aprovados:
  MARE (`MercadoBlocos`, `HojeBlocos`: 8 feed, 8 UFs, 6 insights, Ver mais), RUMO (`ComparadorBlocos`,
  `ConcorrenciaBlocos`: limite 20 + Ver mais na lista de revendas, que renderiza até 1.658 linhas),
  PRISMA (`ComprarBlocos`: 6 modelos por UF; `MinhaLojaBlocos`), LASTRO (`PlanoAcaoBlocos`: 8 ações
  por grupo; `Shell`; `Login` sem tocar em autenticação).
- **CORRENTE (prioridade do Felipe):** plano FIPE/DAF, **somente leitura**: revisar o PR #68, listar as
  classes de inconsistência DAF (família/variante, cabine, eixo/tração, série/geração, ano) com
  evidência `arquivo:linha`, cruzar as branches `agent/fipe-p0-*` e `fipe-saneamento`, definir a ordem
  segura de merge e escrever `SELECT`s read-only para o Felipe rodar no banco. Entregável:
  `docs/orquestracao/plano-fipe-daf-08-10-2026.md`.
- **ANCORA:** abrir PRs só depois do gate da CUSTODIA. Nunca push na main, nunca merge.

## Decisões em aberto do Felipe

1. **Merge do PR #76** (mapa).
2. **PR #68 e sync do `fipe_sync.py`:** esperar o parecer da CORRENTE ou decidir antes.
3. **Teto de largura (`--content-max`, 1440px) na DEMO:** o app de produção já usa; a demo aprovada
   não. A RUMO sugere uma única regra no bloco do Shell do `theme.css`. Ninguém mexe nisso até a decisão.
4. **Permissões do OpenCode:** ver a próxima seção.
5. **Limite do plano Go:** ver a seção seguinte.
6. Sessão de deploy da fila FIPE (`5b7d779`) e a decisão sobre o Graphify desatualizado (último grafo
   de 26/09; re-rodar depois que a onda visual assentar).

## Lições desta sessão (leia antes de continuar)

- **Verifique o conteúdo, nunca a mensagem do commit.** O C1 da NOVA nasceu de confiar na mensagem
  "Corrige chave versionada" e em `ESTADO_ATUAL.md:25`. A CUSTODIA mostrou que a chave nunca esteve
  no histórico e que a senha lá é o placeholder `SUA_SENHA_AQUI`. Eu repassei o C1 ao Felipe como
  crítico sem conferir; corrigi depois. Antes de repassar um achado grave, conferir primeiro.
- **O sistema bloqueia que o orquestrador aprove permissões de outros agentes.** Aprovar pedidos
  "Allow once/always" dos agentes, sozinho ou por um aprovador automático, foi negado
  ("Create Unsafe Agents"). Isso vale mesmo com o Felipe tendo dito para não pedir autorização.
  Quem aprova é o Felipe, no terminal de cada agente (Enter). Alternativa que é decisão dele: uma
  regra de permissão no `opencode.json` para as pastas do projeto.
- **Limite de 5 horas do plano Go.** Bateu em vários agentes ao mesmo tempo. Não ficou claro se o teto
  é por modelo ou da conta; agentes em modelos baratos seguiram trabalhando. Reset ocorreu em ~1 hora.
  Não há alternativa paga funcionando: DeepSeek direto devolve "Insufficient Balance", o Zen tem saldo
  $0. O único modelo gratuito que respondeu foi `opencode/big-pickle` (qualidade desconhecida; não
  usar na FIPE/DAF). Chave da OpenAI existe no ambiente e não foi testada. **Nunca usar Fable nem
  Astra** (regra do Felipe).
- **Vigia de failover** (`failover.ps1`, na pasta de scratchpad da sessão, fora do repositório): checa
  os agentes a cada 2 minutos e, se um bater o limite com reset > 10 min, troca para `big-pickle` e
  reenvia o briefing. Nunca disparou. Roda como processo oculto do PowerShell e **não sobrevive a
  reinício da máquina**. Se for retomar a ideia, recriar versionado em `scripts/` depois de decidir.
- **Briefing de agente:** confirmar que o terminal tem um agente rodando antes de mandar tarefa. A MARE
  estava num PowerShell comum e recebeu o briefing como comandos (só erros, nada executado).
- Em `maestri ask`, o campo de prompt não aceita `--raw ""`; use `--raw` só para teclas.

## Painel ao vivo

Artifact "Painel da Frota": https://claude.ai/artifact/WQQYxJ3Y6vydyp53VCWnxN (privado). Lê as coleções
`agents`, `decisions` e `deliverables` do banco do artifact; o orquestrador atualiza as linhas com a
ferramenta `ArtifactData` a cada conferência, sem republicar a página. Os gastos mostrados são o
último valor lido no terminal de cada agente, não um total exato. O repositório guarda o registro
versionado em `PAINEL-AGENTES.md`.

## Como retomar

1. Ler este arquivo, `HANDOFF-ORQUESTRADOR.md`, `PAINEL-AGENTES.md` e o mapa da ATLAS
   (`mapa-pendencias-08-10-2026.md`, no PR #76).
2. `maestri list` e `maestri check <agente>` em cada um; ver quem está com limite, com permissão
   pendente ou ocioso. `git fetch` e `gh pr list` para o estado real das branches e PRs.
3. Pedir ao Felipe os Enters pendentes (RUMO, PRISMA, LASTRO, CUSTODIA) ou a regra de permissão.
4. Receber a correção da NOVA, mandar para o gate da CUSTODIA, e o gate B da TERRA.
5. Só com os gates aprovados pedir à ANCORA para abrir os PRs (um por lote, só branch, sem merge).
6. Priorizar a FIPE/DAF: ler o plano da CORRENTE e levar ao Felipe a ordem de merge e as consultas
   para o banco.
7. Atualizar `PAINEL-AGENTES.md` e o painel ao vivo a cada conferência.

## Regras que continuam valendo

Sem push na main (sempre branch + PR + merge do Felipe). Sem credenciais em arquivos ou mensagens.
Sem escrever dado real nem tocar produção. Sem F4. Número errado é pior que nenhum. READMEs atualizados
junto do código. Claude é só orquestrador; execução é dos agentes.
