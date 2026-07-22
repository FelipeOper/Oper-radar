# Auditoria UX — FIPE, comparativos e experiência responsiva

Data: 20/07/2026  
Escopo: aplicação React, APIs PHP, navegação desktop/mobile e consistência das informações.

## Resultado desta entrega

- A área **FIPE** passa a ter dois fluxos claros: **consulta por placa** e **catálogo FIPE**.
- A consulta por placa fica isolada no backend. A chave do provedor nunca é enviada ao navegador.
- FIPE e média de anúncios equivalentes passam a aparecer juntas nos cards de anúncios do Mercado, no feed expandido da tela Hoje e nas Oportunidades.
- Estados de vínculo pendente ou ambíguo deixam de aparecer apenas como “FIPE não vinculada” e passam a explicar o motivo.
- A interface mantém controles com no mínimo 44 px no mobile, grades fluidas e nenhum novo eixo horizontal de rolagem.

## Auditoria por área

| Área | Situação atual | Próxima melhoria recomendada | Prioridade |
|---|---|---|---|
| Hoje | Boa leitura executiva e feed de movimento. | Abrir modelo por região, abrir região por lojista e criar bloco “voltaram ao portal”. | Alta |
| Mercado | Filtros geográficos e rolagem infinita estão adequados; comparativo agora é permanente. | Criar modo lista compacto no desktop e salvar filtros favoritos por usuário. | Média |
| Minha Loja | Já compara estoque próprio com FIPE e mercado. | Usar a placa para preencher marca/modelo/ano e exigir confirmação da versão FIPE antes de salvar. | Alta |
| FIPE | Catálogo local completo; agora possui consulta por placa separada. | Ativar o conector veicular e adicionar histórico mensal do valor FIPE por versão. | Alta |
| Oportunidades | Boa separação entre maturidade e preço abaixo da FIPE; comparativo foi ampliado. | Criar score único (preço, idade, giro regional e confiança FIPE). | Alta |
| Concorrentes | Cobertura e filtros são fortes. | No mobile, resumir cada loja e abrir detalhes progressivamente; incluir tendência de 7/30/90 dias. | Média |
| Análise | Há dados calculados e Analista opcional. | Organizar em Mercado, Macroeconomia e Notícias; mostrar fonte, horário e impacto provável. | Alta |
| Ações | Funciona, porém fica somente no navegador atual. | Persistir no banco por usuário, com responsável, prazo e origem do insight. | Alta |
| Configurações | Temas, densidade e movimento reduzido já são úteis. | Incluir alertas, região padrão, moeda/unidades, preferências de dashboard e integrações. | Média |
| Conta e acesso | Login, sessão, perfil e troca de senha estão presentes. | Registrar log de acesso e permitir administração de membros e papéis. | Média |

## Princípios usados

1. **Visão executiva primeiro:** valor, diferença e tamanho da amostra aparecem antes de detalhes técnicos.
2. **Divulgação progressiva:** o mobile mostra o essencial e mantém detalhes sob interação, sem tabelas largas.
3. **Confiança explícita:** dado ausente, ambíguo ou ainda em processamento tem estado próprio.
4. **Uma fonte de verdade:** cards de anúncios consomem o mesmo comparativo calculado pelo backend.
5. **Ação próxima do insight:** oportunidades e feed mantêm o acesso à ação e ao anúncio de origem.

## Referências de produto

- Stripe Dashboard: hierarquia forte de métricas, detalhes progressivos e estados claros.
- Linear: navegação rápida, densidade controlada e atalhos previsíveis.
- Datadog: visão executiva com aprofundamento por dimensão.
- Shopify Admin: experiência consistente entre catálogo, análise e operação.

As referências são direcionais; o OPER RADAR mantém identidade visual própria e vocabulário do transporte pesado.

## Dependência da consulta por placa

A assinatura da FIPE Online mantém o catálogo nacional atualizado, mas não identifica veículo pela placa. O conector implementado aceita um provedor veicular separado e cruza o código FIPE retornado com o catálogo e o mercado já armazenados pelo OPER RADAR.

Ativação prevista no arquivo protegido do servidor:

```ini
OPER_RADAR_PLACA_PROVIDER=webxcar
OPER_RADAR_PLACA_API_TOKEN="CHAVE_DO_PROVEDOR"
```

Até essa chave ser configurada, o catálogo FIPE continua funcionando normalmente e a interface informa que o conector de placa está aguardando ativação.
