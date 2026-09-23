# Oper Radar — demonstração navegável

Demonstração interativa do Oper Radar com **dados fictícios** de um cenário de **22/09/2026**. Serve para explorar o fluxo de decisão do produto (preço × FIPE × concorrência × oportunidade). **Não é o app de produção** e nada aqui é uma medição real do mercado.

- Sem rede: nenhuma tela faz requisição a servidor; tudo é calculado no navegador.
- Sem login real, sem cookies e sem dados reais.
- O navegador guarda apenas preferências locais da demonstração: tema, ações do Plano de ação e histórico do Analista IA (`localStorage` e `sessionStorage`). Nada disso sai do seu computador.

## Como abrir

**Opção 1 — servidor local (recomendada).** Na raiz do repositório:

```
python -m http.server
```

Depois abra `http://localhost:8000/docs/design-simulation/index.html`.

**Opção 2 — direto no navegador.** Abra `docs/design-simulation/index.html` (`file://`). Funciona porque as telas não dependem de rede.

## Mapa de telas

| Tela | Arquivo | O que faz |
| --- | --- | --- |
| Mapa | `index.html` | Porta de entrada: explica a demonstração e leva às telas. |
| Login | `login.html` | Entrada de demonstração; não autentica. |
| Hoje | `hoje.html` | Visão do dia: KPIs, movimento do mercado, regiões com mais saídas, insights e alerta do monitor de dados. |
| Mercado | `mercado.html` | Filtros (UF, período, segmento, marca), onde há mais ofertas, oportunidade regional, modelos em destaque e detalhes do modelo. |
| Concorrência | `concorrencia.html` | Lista de revendas com estoque, saídas, reduções de preço, idade média e desvio vs FIPE. |
| Lojista | `lojista.html?id=` | Perfil de uma revenda: KPIs, estoque ordenável e alerta de reduções. |
| Comparador | `comparador.html` | Dois modelos lado a lado (padrão: Volvo FH 540 2021 × Scania R 450 2021). |
| Minha Loja | `minha-loja.html` | Seus 8 veículos contra a mediana do mercado e a FIPE, com "Criar ação" e "Comparar". |
| Inteligência | `inteligencia.html` | Insights com evidência, perguntas ao Analista e índice de oportunidade regional (preliminar). |
| Plano de ação | `plano-de-acao.html` | Ações pendentes e concluídas; cria, conclui e remove. |
| Dados e FIPE | `dados-e-fipe.html` | Monitor de qualidade: inconsistências, cobertura FIPE e frescor da coleta por estado. |
| Anúncio | `anuncio.html?id=` | Detalhe de uma oferta do mercado. |
| Veículo | `veiculo.html?id=` | Detalhe de um veículo da sua loja. |
| Configurações | `configuracoes.html` | Tema e reinício da demonstração. |
| Conta | `conta.html` | Identidade fictícia da demonstração. |
| Analista IA | botão no topo das telas | Painel de perguntas e respostas, aberto por `analyst.js`. |

Muitas telas aceitam parâmetros na URL para deep-link (por exemplo `mercado.html?uf=PR,SP&periodo=30d`, `comparador.html?a=Volvo|FH 540|2021`).

## O que é a "IA" aqui

**IA de demonstração: respostas calculadas localmente sobre o cenário fictício.** O Analista IA não é um modelo de linguagem e não consulta serviço externo: é um conjunto de regras (`OperDemo.answer`) que responde a alguns temas — preço do seu veículo, regiões, concorrentes, FIPE, qualidade dos dados, oportunidades e panorama do dia. Cada resposta traz fontes e confiança; perguntas fora desses temas recebem a lista do que ele sabe responder.

## Regras de produto aplicadas

- **Preço de referência = mediana qualificada**, nunca média bruta. Entram só preços válidos: com valor, dentro de 50%–150% da referência do modelo/ano e sem vínculo FIPE ambíguo.
- **Amostra mínima de 5 preços válidos.** Abaixo disso aparece "Amostra insuficiente" e não há comparação nem veredito.
- **Saída observada não é venda.** Significa anúncio ausente em verificações seguidas; não comprova negócio fechado.
- **Redução de preço é sinal, não prova.**
- **Índice de oportunidade regional é preliminar** e assim rotulado.
- **Toda métrica mostra evidência:** recorte, período, valor, base comparativa, amostra, confiança, atualização e explicação.
- **Confiança:** Alta (30+ preços válidos e 5+ revendas), Média (9+), Baixa, Insuficiente (menos de 5). A faixa "Média" a partir de 9 é uma calibração desta demonstração.
- **FIPE:** cobre só caminhões; implementos não têm FIPE e a comparação usa apenas o mercado anunciado.
- **Minha Loja:** "Acima do mercado" a partir de 5% acima da mediana; a base é o Paraná e, se houver menos de 5 preços válidos ali, o Brasil (sempre rotulado).

## Como reiniciar

Em **Configurações → Reiniciar demonstração**. Apaga as ações do Plano de ação, o histórico do Analista IA e o tema salvo, e volta ao estado inicial.

## Limitações conhecidas

- Todos os dados, revendas, placas e valores são fictícios; o cenário é determinístico e não representa o mercado real.
- Não é o app de produção. A migração das telas para o app real será feita em fases; esta demonstração não implica que as funções já existam lá.
- Não há coleta, banco de dados, autenticação nem envio de dados.
- Estado salvo só neste navegador: outro navegador ou aba anônima começa do zero.
- Layout pensado para desktop e 390 px, mas a verificação visual completa em todos os navegadores não foi feita.

## Estrutura de arquivos

| Arquivo | Papel |
| --- | --- |
| `demo-engine.js` | Motor de dados fictícios e cálculos (`window.OperDemo`): anúncios, filtros, medianas, insights, qualidade, Analista. |
| `demo-ui.js` | Biblioteca de UI compartilhada (`window.OperUI`), só com classes `or-*` e tokens do design system. |
| `demo-pages.js` | Núcleo: monta a tela atual, alterna o tema e renderiza Configurações. |
| `demo-p-mercado.js` | Hoje e Mercado. |
| `demo-p-concorrencia.js` | Concorrência, Lojista e Comparador. |
| `demo-p-intel.js` | Inteligência e Dados e FIPE. |
| `demo-p-loja.js` | Minha Loja e Plano de ação. |
| `demo-p-detalhe.js` | Anúncio e Veículo. |
| `analyst.js` | Painel do Analista IA e seu histórico de sessão. |
| `simulation.js` | Legado da primeira versão: shell de navegação (sidebar, topbar, bottom nav). |
| `*.html` | Uma página por tela; cada uma carrega os scripts na ordem acima. |

O visual vem do design system em `design-system/` (`styles.css`, `_ds_bundle.js`).
