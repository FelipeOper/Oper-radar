# T02 — Oportunidades ("O que comprar por região") em 390 px

Autora: TERRA (FrontEnd Design), 26/09/2026. Base: `origin/main` a9d9fd4, branch `agent/t02-oportunidades-mobile`.

## Método

- Build `VITE_DEMO=1 VITE_BASE=/` (fixture local, nenhum dado real, nenhum clique em "Criar ação") servido em `localhost` por um servidor estático com fallback de SPA.
- A rota `/oportunidades` abre num `<iframe>` de largura fixa (redimensionar a janela do Chrome não muda `window.innerWidth` neste ambiente). Medidas por `getBoundingClientRect()` e `document.documentElement.scrollWidth`, sempre dentro de `.oc-compra`.
- Teste de estresse: título de anúncio de 97 caracteres, rótulo longo em "Por que esta nota" e todos os `<details>` abertos.
- Fonte da medida: DEMO renderizada. Não substitui a conferência em produção, que só o Claude/Felipe fazem.

## Resultado antes × depois (altura em px)

| Alvo | 390 antes | 390 depois | 1280 antes | 1280 depois |
|---|---|---|---|---|
| Aba de UF (`button.oc-cmp__modo`) | 34 | **44** | 34 | 34 |
| Botão de evidência (`.oc-evidencia__botao`) | 32 | **44** | 32 | 32 |
| "Por que esta nota" (`summary`) | 18,9 | **45** | 19 | 19 |
| "Ver anúncio" (`a.or-btn`) | 40 | **44** | 40 | 40 |
| "Criar ação" (`button.or-btn`) | 44 | 44 | 42 | 42 |

- `scrollWidth` do documento: 390 antes e depois; 360 depois (com estresse): 360; 1280: 1280. Nenhum elemento com `right` além do viewport, nem com o título e o rótulo longos.
- Abas de UF: `scrollWidth/clientWidth` = 100/100 (sem estouro de texto; `flex-wrap` mantido).
- Largura mínima dos alvos no mobile: 101,6 px (todas as larguras passam de 44).
- Desktop (1280): alturas idênticas antes e depois.
- Comparador (390): `.oc-cmp__modo` continua 34 px, porque a regra nova tem escopo `.oc-compra`. Vira item da T04.

## Causas

- `.oc-cmp__modo { min-height: 34px }` (classe) vence `button { min-height: var(--or-control-min-height) }` (elemento), então o `@media` que sobe a variável para 44 px não alcançava as abas.
- `.oc-evidencia__botao { min-height: 32px }` e `.or-btn { height: var(--control-md) }` (40 px) e o `<summary>` sem altura mínima nunca dependeram da variável.

## Correção

`app/src/theme.css`, fim do bloco `.oc-compra*`, `@media (max-width: 760px)`: `min-height: var(--hit-min)` nas abas de UF, no botão de evidência e nos `.or-btn` dentro de `.oc-compra`; `padding-block: 13px` no `<summary>` (não uso `display:flex` porque esconderia o marcador do `<details>`). Teste de contrato: `app/tests/comprarMobile.test.js`.

## Limites

- Não medido em aparelho real nem em produção; `resize_window` não muda o viewport, por isso o iframe.
- Fixture tem 2 UFs e 1 modelo por UF; UFs demais só quebram linha (`flex-wrap`), não medido com 5+ abas.
- "Ver anúncio" apareceu na medição porque a URL da fixture (`https://exemplo.local/…`) passa em `urlSegura`.
- Padrão global (Hoje, Mercado, Concorrência, Minha Loja, Comparador) fica na T04.
