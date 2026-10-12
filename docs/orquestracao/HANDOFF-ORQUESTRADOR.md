# HANDOFF DO ORQUESTRADOR — Oper Radar (recriado em 06/10/2026)

> A pasta original (com QUADRO-TAREFAS.md, tarefas/*, evidencias/*, graphify-oper-radar/*) sumiu do
> disco entre 26/09 e 06/10/2026. Busca completa (disco C inteiro, Lixeira — 66 itens, OneDrive,
> armazenamento interno do Maestri) não encontrou nenhum rastro nem backup. Causa desconhecida.
> O trabalho de CÓDIGO sobreviveu inteiro no git (branches e commits abaixo); só o rastreamento
> (handoff, quadro de tarefas, formulários) se perdeu. Este arquivo é um recomeço mínimo.
>
> **07/10/2026:** o agente "Orquestrador-GPT" foi renomeado para **CORRENTE** (trocou de Codex
> para OpenCode/GLM-5.2). Qualquer referência a "Orquestrador-GPT" abaixo, ou em notas/documentos
> anteriores a essa data, significa CORRENTE.

## CARIMBO DE ESTADO (atualizado em 07/10/2026)
- Este arquivo foi movido pra dentro do repositório em 07/10/2026 (PR #69, commit `98dfc3a`,
  merge `a0fe09e`). A cópia solta em `Downloads\OperRadar-Orquestracao` foi removida — daqui pra
  frente qualquer edição é commit normal, nunca mais arquivo fora do git.
- `main` = `a0fe09e` (merge do PR #69). Antes disso, `18eb6e5` (merge do PR #67). Releases publicadas desde a última sessão registrada
  (26/09): 2.7 (Plano de ação), 2.8 (orientação de venda, API only), 2.9 (orientação de venda no
  frontend) — todas conferidas ao vivo segundo `docs/PRODUCAO.md`.
- PR #68 (`agent/fipe-p0-integracao`) aberto, MERGEABLE, CI verde — fila de vinculação FIPE por
  categoria (marca+modelo).
- PRs antigos ainda abertos e não mesclados: #66 (`agent/t09-url-segura`, CONFLITANTE — provavelmente
  por causa das releases 2.7-2.9 que mexeram em arquivos parecidos), #62, #60, #59, #58 (sem conflito,
  nunca mesclados), #57 (CI vermelho), #54 (conflitante).
- Branches de tarefa de 26/09 com commits preservados no git (não confirmado se os PRs ainda
  refletem esse trabalho): `agent/t02-oportunidades-mobile` (440581f, já mesclado via PR #64),
  `agent/t08-fixture-demo` (349ccd5, já mesclado via PR #65), `agent/t09-url-segura` (cc76689,
  PR #66 aberto mas conflitante), `agent/t03-criar-acao` (fb336b7), `agent/t14-docs` (4c96b9c),
  `agent/t21-url-backend` (b716c5b). Nenhum formulário de conclusão sobrou para dizer o que cada
  uma entregou — reconferir contra o diff antes de retomar.
- Frente FIPE ganhou várias branches P0 novas desde 26/09: `agent/fipe-p0-cabine`,
  `agent/fipe-p0-cf-uplift`, `agent/fipe-p0-daf-iveco`, `agent/fipe-p0-eixo-tracao`,
  `agent/fipe-p0-integracao` (PR #68), `agent/fipe-p0-serie-geracao`. Histórico do que cada uma faz
  não documentado aqui — ver commits de cada branch.
- Agentes do Maestri (`maestri list`) continuam conectados e vivos: Farol, ATLAS, ANCORA, CUSTODIA,
  NOVA, VELOX, MARE, RUMO, PRISMA, LASTRO, Orquestrador-GPT. LUNA e TERRA não aparecem na lista atual
  (verificar se ainda existem no canvas).

## Mudança de 06/10/2026 — OpenCode entra na equipe
Felipe assinou o OpenCode (plano Go). Decisão: Claude passa a ser SOMENTE o orquestrador — não
assume mais papéis de execução (LUNA/TERRA/etc rodando como Claude Code). Modelos do plano Go
disponíveis: GLM-5.2, GLM-5.1, Kimi K2.7 Code, Kimi K2.6, MiMo-V2.5, MiMo-V2.5-Pro, MiniMax M3,
MiniMax M2.7, Qwen3.7 Max, Qwen3.7 Plus, Qwen3.6 Plus, DeepSeek V4 Pro, DeepSeek V4 Flash. Felipe
pediu uso mais frequente de DeepSeek V4 Flash e MiMo-V2.5. Preset "OpenCode" confirmado disponível
no Maestri (`maestri preset list`). Pedido em andamento: Orquestrador-GPT monta a lista de agentes
x modelo recomendado — ver tarefa ativa.

## Mudança de 07/10/2026 — time migrado para OpenCode (aplicado)
Aplicado (não só recomendado): os 13 agentes de execução agora rodam no preset "OpenCode" da
Maestri, cada um com um modelo do plano Go. Claude segue só como orquestrador, sem modelo de
execução. Lista completa, motivo por agente e nota técnica (caminho completo do `opencode.cmd`
necessário no Windows, porque o PATH não tem `opencode` em todo terminal do Maestri) em
`docs/orquestracao/agentes-modelos-opencode.md`.

Renomeação: **Orquestrador-GPT → CORRENTE** (GLM-5.2), tema náutico como os demais nomes (ÂNCORA,
MARÉ, RUMO, FAROL, LASTRO). Mesmo nó do canvas, mesmas conexões; contexto de conversa não migra ao
trocar de agente (comportamento normal do Maestri — brief cada agente antes da próxima tarefa).

Confirmado ao vivo: os 13 terminais inicializaram com o modelo correto (lido no rodapé de cada
um, `Build · <modelo> OpenCode Zen`).

## Regras que continuam valendo
- Nunca digitar senha/token/credencial; login do radar e do cPanel é sempre do Felipe.
- Nunca push direto na main: branch + PR + CI verde.
- F4 da FIPE (escrita em massa nos vínculos) permanece bloqueada até nova decisão.
- Não gravar dado real em produção só para testar.
- Publicação em produção: pacote com backup e hash, comando colado pelo Felipe no Terminal do
  cPanel (ou sessão já logada por ele).
- Aprovações delegadas ao Claude (26/09, ainda valendo salvo o Felipe dizer o contrário).
