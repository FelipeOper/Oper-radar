# Modelos OpenCode recomendados para os agentes

Proposta para revisão de Felipe e do Claude (orquestrador), em 07/10/2026. Todos os modelos abaixo pertencem à lista informada do plano Go. **Nenhum preset foi alterado.** Claude coordena o time e não recebe modelo de execução nesta tabela.

| Agente | Modelo no preset OpenCode | Motivo | Uso estimado |
| --- | --- | --- | --- |
| LUNA — backend PHP/Python | MiMo-V2.5 | Implementação e testes frequentes de regras de negócio com bom custo por iteração. | Pesado |
| TERRA — frontend React | DeepSeek V4 Flash | Iteração rápida de componentes, estados e correções de interface. | Pesado |
| ANCORA — Git, PRs e branches | DeepSeek V4 Flash | Tarefas operacionais curtas, com checagens explícitas de diff e CI. | Leve |
| CUSTODIA — portões e verificação | MiMo-V2.5-Pro | Revisões críticas de regressão e de evidências exigem análise mais forte; usar sob demanda. | Médio |
| NOVA — segurança | DeepSeek V4 Pro | Auditoria de superfícies de ataque e regras de bloqueio justifica modelo mais forte. | Médio |
| VELOX — performance, SQL e EXPLAIN | Kimi K2.7 Code | Diagnóstico técnico de consultas e planos, com leitura cuidadosa de código e evidências. | Médio |
| ATLAS — planejamento | Qwen3.7 Plus | Organiza dependências e critérios de aceite sem custo de modelo máximo. | Leve |
| Farol — backlog | DeepSeek V4 Flash | Triagem e acompanhamento recorrentes pedem respostas rápidas e baratas. | Leve |
| MARE — frontend DEMO | MiMo-V2.5 | Construção incremental de telas e componentes da demonstração. | Médio |
| RUMO — frontend DEMO | DeepSeek V4 Flash | Correções pontuais de navegação e fluxos de interface. | Médio |
| PRISMA — frontend DEMO | MiMo-V2.5 | Ajustes visuais iterativos com custo baixo por tentativa. | Médio |
| LASTRO — frontend DEMO | DeepSeek V4 Flash | Fixtures e validações de demonstração em tarefas delimitadas. | Leve |
| Orquestrador-GPT — fluxos de dados e FIPE | GLM-5.2 | Modelagem e revisão de fluxos críticos, matching e gates de dados; acionar só nesses marcos. | Médio |

**Uso estimado** descreve a frequência e o volume previstos para cada papel, não uma reserva de orçamento nem uma medição de consumo. A alocação privilegia DeepSeek V4 Flash e MiMo-V2.5 em 8 dos 13 agentes. Modelos de maior custo ficam restritos a verificação crítica, segurança e fluxos de dados; VELOX usa Kimi K2.7 Code quando a investigação de SQL justificar. Antes de aplicar, conferir consumo agregado do time nos limites do Go: **US$ 12 por 5 horas, US$ 30 por semana e US$ 60 por mês**. Se houver pressão no limite, executar tarefas rotineiras dos papéis críticos com DeepSeek V4 Flash ou MiMo-V2.5 e reservar o modelo indicado para a revisão decisiva.

Esta é a lista de **papéis-alvo**, não uma afirmação de que todos os terminais estão conectados agora. Na consulta ao Maestri em 07/10/2026, LUNA, ANCORA, CUSTODIA, NOVA, VELOX, ATLAS, Farol e Orquestrador-GPT apareciam conectados; TERRA, MARE, RUMO, PRISMA e LASTRO não apareciam. Conferir presença antes de qualquer futura aplicação de preset.

Referências para disponibilidade e limites: [OpenCode Go](https://opencode.ai/v2/docs/console/go) e [documentação de modelos Go](https://dev.opencode.ai/docs/go/). Preços, disponibilidade e estimativas de requisições podem mudar; revisar no momento da configuração.
