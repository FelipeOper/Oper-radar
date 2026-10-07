# Modelos OpenCode dos agentes

Aplicado em 07/10/2026 (autorizado pelo Felipe, plano Go). Todos os 13 agentes rodam como preset
"OpenCode" via `maestri recruit --preset "OpenCode" --command "...\opencode.cmd -m <id>" --replace`.
Confirmado ao vivo, lendo o rodapé de cada terminal (`Build · <modelo> OpenCode Zen`) depois do boot.
Claude continua só orquestrador — não recebe modelo de execução nesta tabela.

## Estado real confirmado em 07/10/2026 (noite) — correção de provider Zen → Go

O boot inicial (tabela abaixo) tinha os 13 agentes no provider certo por modelo, mas todos
caindo por padrão em **"Personal / OpenCode" (Zen, pay-as-you-go, saldo $0)** em vez de
**"OpenCode Go"** (a assinatura de $10/mês). Sintoma: `Upstream request failed: Insufficient
account funds` em toda mensagem real (só `-m` direto no CLI mascarava o problema, por isso
passou despercebido até then). NOVA teve um segundo problema, só dela: mesmo já no provider Go
certo, batia em `This Go model requires Global regions` — causa raiz era
**Settings → Privacy → Regions** do workspace (console.opencode.ai) em "Europe & United States"
em vez de "Global"; corrigido lá (nível de workspace, vale para os 13).

Correção aplicada nos 13 (sem trocar o modelo em si, só o provider): `/models` → buscar
`<modelo atual> go` até sobrar 1 resultado com sufixo "OpenCode Go" → Enter → variante
"Default" → Enter. Resultado real, testado com mensagem de verdade (não `-m`) em todos:

| Agente | Modelo real hoje (confirmado) | Provider | Bate com a tabela "recomendada" abaixo? |
| --- | --- | --- | --- |
| NOVA | DeepSeek V4 Pro (New) | OpenCode Go | Sim (já era o recomendado) |
| LUNA | DeepSeek V4 Pro (New) | OpenCode Go | **Não** — recomendado era MiMo-V2.6-Flash Free |
| TERRA | DeepSeek V4 Pro (New) | OpenCode Go | **Não** — recomendado era DeepSeek V4 Flash |
| ANCORA | DeepSeek V4 Pro (New) | OpenCode Go | **Não** — recomendado era DeepSeek V4 Flash |
| CUSTODIA | DeepSeek V4 Pro (New) | OpenCode Go | **Não** — recomendado era Qwen3.8 Max |
| VELOX | Kimi K2.7 Code | OpenCode Go | Sim (já era o recomendado) |
| ATLAS | DeepSeek V4 Pro (New) | OpenCode Go | **Não** — recomendado era Qwen3.6 Plus |
| Farol | DeepSeek V4 Pro (New) | OpenCode Go | **Não** — recomendado era DeepSeek V4 Flash |
| MARE | DeepSeek V4 Pro (New) | OpenCode Go | **Não** — recomendado era MiMo-V2.6-Flash Free |
| RUMO | DeepSeek V4 Pro (New) | OpenCode Go | **Não** — recomendado era DeepSeek V4 Flash |
| PRISMA | DeepSeek V4 Pro (New) | OpenCode Go | **Não** — recomendado era MiMo-V2.6-Flash Free |
| LASTRO | DeepSeek V4 Pro (New) | OpenCode Go | **Não** — recomendado era DeepSeek V4 Flash |
| CORRENTE | DeepSeek V4 Pro (New) | OpenCode Go | **Não** — recomendado era GLM-5.2 |

**Como isso aconteceu:** em algum ponto anterior a esta sessão (não documentado), 11 dos 13
agentes já tinham sido trocados manualmente para DeepSeek V4 Pro (motivo não registrado). Esta
correção de 07/10 resolveu só o problema imediato pedido pelo Felipe — provider Zen → Go, sem
mexer no modelo em si (instrução explícita: "selecionar entrada com sufixo OpenCode Go, nao
Personal/OpenCode nem provider direto" nos *mesmos* modelos já ativos) — então o desalinhamento
com a tabela de custo original **não foi corrigido**, só preservado.

**Pendência sinalizada, sem ação tomada:** DeepSeek V4 Pro é o nível mais caro usado nesta
tabela (tier "Médio"/"Pesado" conforme o agente). Com 11 dos 13 agentes nele — inclusive os de
uso "Pesado" como LUNA e os de frontend DEMO (MARE/RUMO/PRISMA/LASTRO) que deveriam estar nos
modelos gratuitos/baratos — o consumo do plano Go ($12/5h, $30/semana, $60/mês) tende a ser bem
maior que o planejado. Decisão de rebalancear de volta para a tabela recomendada (ou manter
DeepSeek V4 Pro em todos, se for escolha consciente) fica para o Felipe.

**Correção em relação à proposta original (mesma data):** o levantamento inicial do então
Orquestrador-GPT citava "MiMo-V2.5", "MiMo-V2.5-Pro" e "Qwen3.7 Plus" a partir de busca na web.
O catálogo real desta conta (`opencode models`) não tem essas versões exatas — tem
`mimo-v2.6-flash-free` (mais novo, de graça) e `qwen3.6-plus`/`qwen3.8-max`. Os demais (DeepSeek V4
Flash/Pro, Kimi K2.7 Code, GLM-5.2) bateram exatamente com o catálogo.

| Agente | Modelo aplicado (`opencode/<id>`) | Motivo | Uso estimado |
| --- | --- | --- | --- |
| LUNA — backend PHP/Python | `mimo-v2.6-flash-free` | Implementação e testes frequentes, custo zero. | Pesado |
| TERRA — frontend React | `deepseek-v4-flash` | Iteração rápida de componentes e correções de UI. | Pesado |
| ANCORA — Git, PRs e branches | `deepseek-v4-flash` | Tarefas operacionais curtas, com diff e CI explícitos. | Leve |
| CUSTODIA — portões e verificação | `qwen3.8-max` | Sem "MiMo-V2.5-Pro" no catálogo; Qwen3.8 Max é o flagship disponível para revisão crítica de regressão/evidências. | Médio |
| NOVA — segurança | `deepseek-v4-pro` | Auditoria de superfícies de ataque e regras de bloqueio. | Médio |
| VELOX — performance, SQL e EXPLAIN | `kimi-k2.7-code` | Diagnóstico técnico de consultas e planos. | Médio |
| ATLAS — planejamento | `qwen3.6-plus` | "Qwen3.7 Plus" não existe no catálogo; 3.6 Plus é o nível "Plus" real disponível. | Leve |
| Farol — backlog | `deepseek-v4-flash` | Triagem e acompanhamento recorrentes. | Leve |
| MARE — frontend DEMO | `mimo-v2.6-flash-free` | Construção incremental de telas, custo zero. | Médio |
| RUMO — frontend DEMO | `deepseek-v4-flash` | Correções pontuais de navegação e fluxos. | Médio |
| PRISMA — frontend DEMO | `mimo-v2.6-flash-free` | Ajustes visuais iterativos, custo zero. | Médio |
| LASTRO — frontend DEMO | `deepseek-v4-flash` | Fixtures e validações de demonstração. | Leve |
| **CORRENTE** (ex-Orquestrador-GPT) — fluxos de dados e FIPE | `glm-5.2` | Modelagem e revisão de fluxos críticos, matching e gates de dados. | Médio |

## Renomeação: Orquestrador-GPT → CORRENTE

O agente que fazia fluxos de dados/FIPE rodava em Codex (GPT-6-Sol) e se chamava
"Orquestrador-GPT" — nome que fazia sentido quando o modelo era literalmente GPT. Trocado o preset
para OpenCode/GLM-5.2, o Felipe pediu para também trocar o nome, já que não é mais GPT. Escolhido
**CORRENTE**, seguindo o tema náutico já usado nos outros nomes (ÂNCORA, MARÉ, RUMO, FAROL, LASTRO)
— corrente de água carrega o sentido de "fluxo", o papel do agente. Trocado via
`maestri recruit "CORRENTE" --preset "OpenCode" --command "...opencode.cmd -m opencode/glm-5.2" --replace "Orquestrador-GPT"`:
mesmo nó do canvas, mesmas conexões e posição, histórico de conversa não migrou (comportamento
normal de troca de agente). Qualquer referência antiga a "Orquestrador-GPT" em notas ou documentos
passados passa a significar CORRENTE.

## Nota operacional (troca em si)

No Windows, o `opencode` do npm global não está no PATH de todo terminal do Maestri — a primeira
tentativa com `--command "opencode -m ..."` falhou com `CommandNotFoundException` em 5 dos 13
terminais. Corrigido usando o caminho completo:
`C:\Users\aline\AppData\Roaming\npm\opencode.cmd -m <modelo>`. Guardar esse caminho para qualquer
troca futura de preset/modelo nesta máquina.

## Limites do plano Go (lembrete)
US$ 12 por 5 horas, US$ 30 por semana, US$ 60 por mês. Se o time pressionar o limite, preferir os
agentes de custo zero/baixo (MiMo-V2.6-Flash Free, DeepSeek V4 Flash) nas tarefas rotineiras e
reservar Qwen3.8 Max, DeepSeek V4 Pro, Kimi K2.7 Code e GLM-5.2 para os marcos que realmente
exigem o modelo mais forte.
