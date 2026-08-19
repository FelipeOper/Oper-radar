# Insight regional explicável

## Resultado esperado

O painel deve comparar regiões para um recorte explícito de veículo e explicar por que uma
praça aparece antes de outra. Ele não promete venda e não trata retirada do portal como
transação concluída.

Exemplo de narrativa:

> Goiás combina concorrência menor, saídas observadas relativamente frequentes e preço
> mediano de R$ 675 mil. A amostra contém 34 veículos comparáveis em 9 revendas, com
> confiança média. Paraná tem mais liquidez observada, mas também maior concorrência.

## Formação da amostra comparável

1. mesma categoria, marca, família/modelo, ano-modelo, tração e carroceria;
2. se a amostra for insuficiente, aceitar uma faixa de ano configurada;
3. depois ampliar da cidade para estado, região e Brasil;
4. nunca misturar categorias, trações conflitantes ou tipos incompatíveis para aumentar a
   amostra artificialmente.

Cada ampliação deve aparecer no painel: `comparação exata`, `ano ampliado` ou
`família ampliada`.

## Métricas por praça

- estoque ativo e número de revendas concorrentes;
- entradas e saídas observadas em 30, 90 e 180 dias;
- reaparecimentos após saída;
- razão de movimento: saídas observadas divididas pela exposição observável no período;
- mediana de dias observados até a saída e intervalo interquartil;
- preço anunciado mediano, percentis 25 e 75 e dispersão;
- diferença para FIPE quando houver vínculo confiável;
- cobertura do monitoramento e tamanho da amostra.

Média simples de preço não deve orientar a recomendação. Parcelas, leilões, condições
especiais e valores extremos são removidos pelas regras de qualidade já existentes.

## Índice de oportunidade

O índice de 0 a 100 deve ser decomposto na interface:

| Componente | Peso inicial |
|---|---:|
| Movimento relativo observado | 30 |
| Concorrência relativa | 20 |
| Tempo observado até saída | 20 |
| Posicionamento de preço | 15 |
| Qualidade e cobertura da amostra | 15 |

Os componentes são normalizados entre as praças comparadas. Uma região não recebe selo de
oportunidade quando a cobertura é insuficiente, mesmo que a pontuação matemática seja alta.

## Confiança

- insuficiente: menos de 5 comparáveis ou monitoramento incompleto;
- baixa: 5 a 9 comparáveis, menos de 3 revendas ou poucas saídas observadas;
- média: 10 a 29 comparáveis, pelo menos 3 revendas e cobertura contínua;
- alta: 30 ou mais comparáveis, pelo menos 5 revendas, cobertura contínua de 90 dias e
  histórico suficiente de saídas e reaparecimentos.

O número de comparáveis, de revendas, a janela usada e os motivos da confiança devem ficar
visíveis.

## Contrato inicial da API

Para cada praça, o backend deverá devolver identificação do recorte, métricas brutas,
componentes normalizados, pontuação total, confiança, alertas de qualidade e frases-fato.
O frontend monta a narrativa apenas com esses fatos estruturados; não inventa causalidade.

## Dependências

1. taxonomia compartilhada;
2. histórico de eventos com entradas, saídas e reaparecimentos;
3. cobertura diária validada;
4. amostra mínima e filtros estatísticos;
5. só então ranking regional e recomendação explicável.
