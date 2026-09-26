# Auditoria visual: app (beta/produção) × DEMO aprovada

Data: 24/09/2026. Método: a DEMO (`agent/demo-final`, PR #62, `docs/design-simulation/`) e o app compilado com `VITE_DEMO=1` (mesmos dados fictícios de 22/09/2026) abertos lado a lado, mesma largura, com capturas de tela em 1440 px e 390 px (`agent-browser`; capturas em `.design-review/shots/`, não versionadas). Depois, conferência com dados reais no beta/produção. Critérios: layout, hierarquia, textos, filtros, estados vazios, dados e responsividade.

Legenda de status: **Corrigido** (nesta rodada) · **Decisão** (divergência intencional ou que depende do Felipe) · **Pendente** (tela ainda não portada para o layout da DEMO).

## Resumo
| Tela | Situação |
|---|---|
| Login | Alinhado (portado da DEMO, verificado em escuro/claro e 390 px) |
| Hoje | Corrigido (KPIs); 3 decisões |
| Mercado | Corrigido (KPIs); 4 decisões |
| Concorrência / Lojista | **Corrigido** (KPIs, chips de UF, textos, rótulos, vazio); 2 decisões |
| Comparador, Minha Loja, FIPE, Oportunidades/Análise, Plano de ação, Configurações, Minha conta | **Pendente**: visual novo, mas layout e lógica antigos |

Responsividade: sem rolagem horizontal (`scrollWidth = 390`) em Hoje, Mercado e Concorrência a 390 px, antes e depois das correções.

## Concorrência (foco pedido)
Divergências achadas e resolvidas:
1. **KPIs sem legenda e sem ícone.** A DEMO mostra, sob cada número, uma legenda ("Todas as UFs", "Estoque somado das revendas", "Saída observada não é venda", "Sinal, não prova") e um ícone. → Cartões `or-stat` com ícone, legenda e evidência recolhida (com segmento: "Estoque de caminhões somado").
2. **Texto dos chips de UF.** DEMO: "Sem UF marcada, mostra todas. O número em cada UF é a quantidade de revendas." O app dizia só "Selecione uma ou mais UFs…" e não explicava o número. → Texto da DEMO.
3. **Número do chip contradizia a lista.** O chip mostrava o total de revendas da UF mesmo com segmento ou busca ativos (ex.: "PR 365" e a lista, ao marcar PR com o segmento Caminhões, trazia 204). → O número de cada chip agora é a contagem de revendas da UF **no segmento e na busca atuais** (`contagemPorUf`), então marcar o chip mostra exatamente o número exibido; UF sem revenda no recorte fica desabilitada; o subtítulo avisa quando o número segue segmento/busca.
4. **Rótulo "SEGMENTO DE ATUAÇÃO" esticado** na largura toda (defeito de CSS visível em desktop e celular). → Ajustado.
5. **"Ordenar por" sem rótulo visível** (só `aria-label`); busca e cidade também. → Rótulos visíveis (padrão de campo do design system).
6. **Textos das linhas** ("3 saídas em 30 d · 2 reduções · desvio FIPE"). DEMO: "N saídas observadas · N reduções (30 d) · desvio FIPE (mediana) X", com singular/plural e "anúncios" no lugar de "ativos". → Igual à DEMO; idade sem base ("menos de 14 dias de coleta") e desvio sem amostra ("amostra insuficiente") ditos por extenso; com segmento a linha mostra só ativos do segmento e avisa que saídas/reduções são do estoque total.
7. **Estado vazio** genérico. → Cartão "Nenhuma revenda no recorte" com orientação, como na DEMO.
8. **Rodapé** sem título. → Bloco "Como ler" (explica o "amostra insuficiente" e "saída não é venda").

**Decisão dos chips de UF (registrada):** a DEMO decide (a) todas as UFs com dado, (b) seleção múltipla, (c) "Todas as UFs" primeiro, (d) número = quantidade de revendas da UF. O app segue as quatro. Duas diferenças conscientes: (i) com dados reais há ~22–27 UFs, então os chips **ordenam alfabeticamente** (a DEMO tem 5 UFs em ordem fixa PR, SC, SP, GO, MG); ordenar por número de revendas (maior primeiro) também seria coerente — **fica para o Felipe escolher**; (ii) o número passa a seguir segmento/busca (item 3), que é uma melhoria sobre a DEMO.

Diferenças mantidas: **segmento de atuação, busca por revenda e filtro de cidade** não existem na DEMO. Foram restaurados da `main` (a Concorrência antiga os tinha; o Codex apontou a perda) e são necessários com 1.658 revendas. **Decisão:** se o Felipe preferir a Concorrência estritamente como a DEMO, remover esses três; recomendação: manter.

## Hoje
- **Corrigido:** KPIs no formato da DEMO (ícone, legenda, cartão de destaque "Movimento em 48 h" com "+64 / −21" em vez das setas coloridas).
- **Decisão 1 — bloco de abertura:** a DEMO abre com etiqueta "VISÃO DO DIA", "Seu radar, hoje." e o botão "Explorar mercado". O app abre com "Visão: Executivo" + "Personalizar painel" (recurso herdado que a DEMO não tem). Recomendação: manter (uso diário, dado antes de narrativa).
- **Decisão 2 — alerta do monitor de dados:** na DEMO fica **abaixo** dos KPIs; no app, **acima**. Mantido acima de propósito: os números podem estar defasados e o aviso deve ser lido antes deles. Reversível.
- **Decisão 3 — "Analista IA":** botão do topo da DEMO; o app tem a tela "Análise" no menu. Sem mudança.

## Mercado
- **Corrigido:** Panorama em 4 cartões separados com ícone e legenda (antes um cartão único com divisórias).
- **Decisão 1 — filtros:** a DEMO mostra "Refinar resultados" sempre aberto (chips de UF com número, período segmentado, segmento e marca); o app usa a barra de contexto com chips e botão "Refinar resultados" (desenho validado pelo Felipe em 02/09, multisseleção de UF já verificada ao vivo). Sem mudança; o filtro de **marca** só existe no contexto/lista, não na barra.
- **Decisão 2 — "Onde há mais ofertas" × "Oportunidade regional":** a DEMO os coloca lado a lado (e marca o índice como "Preliminar"); no app a oportunidade regional aparece dentro de "Detalhes do modelo".
- **Decisão 3 — cabeçalhos de seção:** a DEMO usa título + subtítulo dentro do cartão; o app usa título com "?" de ajuda. Equivalente em conteúdo.
- **Decisão 4 — cabeçalho da página:** a DEMO tem etiqueta "PANORAMA" + título + descrição; o app vai direto à barra "Analisando".

## Telas não portadas (Pendente)
Abrem sem erro, com o visual novo, mas o layout e a lógica são os antigos:
| Tela | O que a DEMO tem e o app não |
|---|---|
| Comparador | Resultado já aberto (Volvo FH 540 × Scania R 450), veredito em linguagem natural, recorte de UF, mediana qualificada e preço vs FIPE. O app exige "Comparar mercados", tem 3 modos por lado e uma "Janela de movimento" (vazia no modo demo). |
| Minha Loja | Abertura "Seu estoque no mercado.", KPIs (veículos, acima do mercado, competitivos, sem amostra), alerta de veículos acima do mercado e cartões por veículo com mediana, vs FIPE, mais barato e confiança. O app mostra estoque, valor anunciado, idade e comparados, com lista simples. |
| FIPE / Dados e FIPE | A DEMO é um **monitor de qualidade** (resumo do monitor, pontos de atenção por severidade, cobertura FIPE, frescor por estado) — depende de backend novo. O app é consulta por placa + catálogo FIPE. |
| Oportunidades / Análise (Inteligência) | Insights com evidência e confiança, próximo passo por insight, perguntas ao Analista e índice regional. O app tem lista de anúncios observados há mais tempo, com região/estado. |
| Plano de ação | Abertura "O que fazer agora.", contadores Pendentes/Concluídas, formulário com origem, lista com evidência. O app tem campo de texto e lista vazia. |
| Configurações, Minha conta | Layout da DEMO com identidade fictícia; o app já mostra dados reais (nome, e-mail, papel, alterar senha, sair). Ajuste visual apenas. |

Recomendação de ordem para portar: Minha Loja → Comparador → Plano de ação → Oportunidades/Análise → Configurações/Conta → Dados e FIPE (por último: exige o monitor no backend e a frente de saneamento FIPE em curso).

## Verificações desta rodada
Frontend 85/85, contratos Python 68/68, lint limpo, build ok. Dados reais só podem ser conferidos depois do envio ao beta; o pacote de correção (frontend apenas, sem mudança de API) está descrito em `docs/PRODUCAO.md`.
