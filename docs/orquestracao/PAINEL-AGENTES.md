# Painel de acompanhamento dos agentes — Oper Radar

> Atualizado pelo Claude (orquestrador) conforme os agentes reportam. Fonte de verdade sobre
> quem está fazendo o quê agora. Não é handoff de estado do projeto (isso é
> `HANDOFF-ORQUESTRADOR.md`) — é o quadro de tarefas ativas.

Última atualização: 08/10/2026 (abertura da onda de mapeamento + correção de frontend)

## Legenda de status
`PENDENTE` → não iniciado · `EM ANDAMENTO` → trabalhando agora · `AGUARDANDO REVISÃO` →
entregou, falta CUSTODIA ou Claude conferir · `CONCLUÍDO` → revisado e ok · `BLOQUEADO` →
parado, precisa de decisão do Felipe

## Onda ativa: mapeamento geral + segurança + consistência de frontend (aberta 08/10/2026)

| Agente | Tarefa | Entregável | Status |
| --- | --- | --- | --- |
| ATLAS | Mapear o que falta para finalizar o app (features, bugs, PRs abertos, débito técnico), priorizado P0/P1/P2 | `docs/orquestracao/mapa-pendencias-08-10-2026.md` | PENDENTE |
| NOVA | Auditoria de segurança + criptografia (dados em trânsito e em repouso, endpoints sem auth, segredos versionados) | `docs/orquestracao/auditoria-seguranca-08-10-2026.md` | PENDENTE |
| TERRA | Consistência visual do app de produção (`app/src`): corrigir bug/desalinhamento tela a tela, padronizar containers, eliminar listas gigantes | commits em `agent/frontend-design-workspace` | PENDENTE |
| MARE | Consistência visual DEMO: `MercadoBlocos.jsx`, `HojeBlocos.jsx` | commits em `agent/demo-final` | PENDENTE |
| RUMO | Consistência visual DEMO: `ComparadorBlocos.jsx`, `ConcorrenciaBlocos.jsx` | commits em `agent/demo-final` | PENDENTE |
| PRISMA | Consistência visual DEMO: `MinhaLojaBlocos.jsx`, `ComprarBlocos.jsx` | commits em `agent/demo-final` | PENDENTE |
| LASTRO | Consistência visual DEMO: `PlanoAcaoBlocos.jsx`, `Shell.jsx`, `Login.jsx` | commits em `agent/demo-final` | PENDENTE |
| CUSTODIA | Portão de verificação: revisa os 2 relatórios (ATLAS/NOVA) e os diffs de frontend antes de irem ao Felipe | aprovação ou devolução com motivo | PENDENTE |
| ANCORA | Fica de prontidão para abrir PRs quando CUSTODIA aprovar os lotes de frontend | PRs | PENDENTE |
| VELOX, CUSTODIA (gate), CORRENTE | Sem tarefa nesta onda (reserva) | — | — |

## Skills de orquestração — estado em 08/10/2026
- **Superpowers** `6.4.1` (instalado 24/09/2026) — em uso nesta sessão (writing-plans acionado
  para esta onda).
- **Caveman** `2.7.0` (instalado 24/09/2026) — ativo, modo `full`.
- **Graphify** `0.9.69` — **desatualizado em relação ao código**: último grafo gerado em
  26/09/2026 (`C:\Users\aline\gfy\oper-radar\graphify-out\`), app/src tinha 28 arquivos; hoje
  tem 31 (entrou um refator grande — `*Blocos.jsx`, `*Model.js`, `Shell.jsx`, `Login.jsx`,
  `demoFixtures.js` etc., ver commit `1ea728a`). Re-rodar `/graphify` fica registrado como
  tarefa própria (ver mapa de pendências do ATLAS).

## Como ler este painel
Cada linha vira `CONCLUÍDO` só depois do Claude (ou CUSTODIA, quando for o gate) conferir o
entregável de verdade — não só porque o agente disse que terminou. Itens errados voltam pro
agente com o motivo, não vão pro Felipe sem correção.
