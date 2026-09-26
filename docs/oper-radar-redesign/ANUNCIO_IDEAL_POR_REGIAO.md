# "O que comprar": anúncio ideal por região (proposta)

Ideia do Felipe (26/09/2026): a parte "o que comprar" (hoje a tela Oportunidades) deveria também indicar, para cada região,
qual é o anúncio ideal. Este documento é a proposta técnica; nada foi implementado.

## Hoje
- **Oportunidades** lista (a) anúncios observados há mais tempo e (b) anúncios abaixo da FIPE (`anuncios.php`, `ordem=desvio_fipe`),
  com filtro de UF/região. É uma lista por sinal isolado, sem dizer *por que aquele* e sem comparar regiões.
- **Índice de oportunidade regional** já existe por **modelo** (`lib/regional_insight.php`, `docs/ESPECIFICACAO_INSIGHT_REGIONAL.md`):
  movimento, concorrência, tempo até a saída, preço e qualidade da amostra, com confiança e selo só quando a cobertura basta.
  Aparece em "Detalhes do modelo" (Mercado) e no painel do veículo (Minha Loja); ainda não dirige a lista de compra.

## Proposta: duas camadas
1. **Onde e o quê**: para cada UF, os **modelos/anos** com melhor índice regional (liquidez observada alta, concorrência menor,
   preço mediano coerente), cada um com o índice decomposto e a confiança. Responde "o que comprar nessa região".
2. **Qual anúncio**: dentro do modelo/ano escolhido, os **anúncios candidatos** daquela região, ordenados por uma pontuação
   explicável. Responde "qual comprar".

### Pontuação do anúncio (0–100, decomposta na tela)
| Componente | Regra | Peso inicial |
|---|---|---:|
| Preço vs mediana qualificada do mesmo modelo e ano na região | quanto abaixo, melhor; só com 5+ preços válidos | 35 |
| Preço vs FIPE | só com vínculo confiável (`alta`), ano ≥ 2006, caminhão, cavalo/chassi/vazio (mesma regra do desvio agregado) | 20 |
| Sinal de negociação | redução de preço recente (`mudanca_preco`) e tempo observado; **sinal, não prova** de disposição | 20 |
| Liquidez do modelo na região | índice regional do modelo | 15 |
| Qualidade do anúncio | preço `valido`, sem FIPE ambígua, revenda com histórico | 10 |

Regras de honestidade (as mesmas do resto do produto): sem 5 preços válidos não há pontuação; anúncio com preço fora da faixa
esperada, sob consulta ou com FIPE incompatível fica fora; nada de "ideal" nem "melhor negócio" no texto, e sim "candidatos à
negociação"; toda linha mostra evidência (amostra, confiança, base) e o aviso de que preço é anunciado, não de venda.

## Entrega em fases
- **Fase 1 (sem backend novo)**: reordenar/filtrar Oportunidades com os campos que `anuncios.php` já devolve (`desvio_fipe_pct`,
  `desvio_mercado_pct`, `preco_qualidade_status`, `mercado_confianca`, dias observados) e mostrar o porquê de cada linha.
- **Fase 2 (endpoint novo)**: `oportunidades_compra.php` com lógica pura em `lib/` e testes PHP: por UF, top modelos pelo índice
  regional e, por modelo, top anúncios pela pontuação acima. Publicação por release de API com pré-checagem de hash.
- **Fase 3**: ligar ao Plano de ação ("Criar ação" já carrega a evidência) e, na Minha Loja, sugerir compras que preencham lacunas
  de estoque da revenda.

## Riscos
- Cobertura desigual entre UFs: regiões com pouca amostra devem aparecer como "sem base", não como oportunidade.
- Preço anunciado ≠ preço de venda: a ordenação prioriza candidatos a negociar, não garante margem.
- Frete/distância não estão no dado: a comparação é por região do anúncio, não por custo de trazer o veículo.

## Decisões pendentes do Felipe
1. "Anúncio ideal por região" = (a) **qual modelo comprar em cada região** (demanda), (b) **qual anúncio comprar dentro de cada região**
   (melhor candidato), ou (c) os dois em camadas, como proposto acima? Recomendação: (c).
2. Perfil de quem compra: só revenda de caminhão seminovo do segmento Pesado (padrão) ou também implementos rodoviários?
