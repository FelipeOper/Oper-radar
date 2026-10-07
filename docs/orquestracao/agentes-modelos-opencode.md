# Modelos OpenCode dos agentes

Aplicado em 07/10/2026 (autorizado pelo Felipe, plano Go). Todos os 13 agentes rodam como preset
"OpenCode" via `maestri recruit --preset "OpenCode" --command "...\opencode.cmd -m <id>" --replace`.
Confirmado ao vivo, lendo o rodapé de cada terminal (`Build · <modelo> OpenCode Zen`) depois do boot.
Claude continua só orquestrador — não recebe modelo de execução nesta tabela.

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
