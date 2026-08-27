# Taxonomia de mercado

## Objetivo

Uma mesma classificação deve orientar o Mercado, Concorrentes, Minha Loja e Insights.
O tipo informado pelo portal é preservado; a categoria de negócio é uma camada derivada e
versionada pelo código.

## Categorias v1

| Categoria | Tipos do portal |
|---|---|
| Caminhões | Caminhão |
| Implementos | Implemento, carroceria sobre chassi e trailer |
| Ônibus, vans e motorhomes | Ônibus, micro-ônibus, vans e motorhome |
| Carros e utilitários leves | Carro e utilitários |
| Agrícolas | Tratores, colheita, plantio, pulverização e equipamentos florestais |
| Construção | Escavação, carga, compactação, elevação e equipamentos de obra |
| Peças | Peças à venda |
| Outros | Tipos sem enquadramento comercial nas categorias anteriores |

## Universos do produto

- **Mercado principal:** caminhões e implementos rodoviários. É o recorte aberto por
  padrão e concentra a leitura comercial do Oper Radar.
- **Outros mercados:** ônibus, vans, leves, agrícolas, construção, peças e demais tipos.
  Os dados continuam coletados e consultáveis, mas não se misturam ao foco principal.

O comparador bilateral opera sobre caminhões e aceita três escopos independentes em cada
lado: marca, modelo ou marca + modelo. Preços usam a mesma qualificação robusta dos demais
comparativos; valores especiais e extremos não entram na mediana.

Motorhome não é caminhão. Utilitário também não é ônibus ou van. Essas duas correções
evitam distorcer os comparativos por segmento.

## Dimensões independentes

- `tipo`: natureza do item recebida do portal;
- `categoria`: agrupamento comercial derivado do tipo;
- `marca` e `modelo`: identidade comercial;
- `carroceria`: configuração coletada, sem confundir com a categoria Implementos;
- `tracao`: configuração de eixos normalizada, por exemplo `6x4`;
- `porte`: leve, médio ou pesado, ainda não inferido na v1.

Porte de caminhão só será preenchido quando houver uma tabela verificável por modelo ou um
dado técnico de peso. Título, preço e quantidade de eixos não são suficientes para uma
classificação confiável.

## Filtros contextuais

- Todos: marca e filtros gerais;
- Caminhões: subtipo, marca, carroceria, tração e situação FIPE;
- Implementos, ônibus/vans/motorhomes e leves: subtipo, marca e carroceria;
- Agrícolas, construção, peças e outros: subtipo e marca.

Marca e carroceria são calculadas pela API dentro da categoria selecionada, evitando exibir
opções que produziriam uma busca vazia por pertencerem a outro segmento.
