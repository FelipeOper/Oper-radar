# Continuidade do orquestrador — docs/orquestracao/

Fonte de verdade da coordenação entre agentes (Claude orquestrador, Codex/Orquestrador-GPT,
LUNA/TERRA/ANCORA/CUSTODIA/NOVA/VELOX/ATLAS/Farol/MARE/RUMO/PRISMA/LASTRO e, a partir de
07/10/2026, agentes OpenCode).

**Movido para dentro do repositório em 07/10/2026.** Antes vivia em `Downloads\OperRadar-Orquestracao`,
fora do git — essa pasta sumiu do disco entre 26/09 e 06/10/2026 sem deixar rastro (não achada na
Lixeira, no OneDrive nem em nenhum backup do Maestri; causa nunca confirmada). Todo o trabalho de
código sobreviveu no git normalmente; só o rastreamento de coordenação, por estar fora de controle
de versão, se perdeu sem possibilidade de recuperação. A partir de agora esses arquivos são
versionados: cada mudança é um commit, com histórico completo no GitHub, imune a esse tipo de perda.

- `HANDOFF-ORQUESTRADOR.md` — carimbo de estado, regras e registro de blocos de trabalho.
- `ORQUESTRADOR-ATIVO.md` — quem é o orquestrador ativo agora (Claude ou GPT, ver regra de sucessão
  no handoff).

Qualquer agente que editar estes arquivos faz commit normal, na própria branch de trabalho, como
qualquer outro arquivo do repositório. Não voltar a manter cópia fora do git.
