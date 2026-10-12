# F0 · inventário de paridade do app real

**Branch:** agent/ds-demo
**Baseline:** origin/main em `5afdf02d3444a53d513f8b14508c98e8a6162dfb`
**Escopo:** somente leitura/inventário. Nenhuma alteração em `app/src` ou integração do design system.

## Rotas e páginas

| Página | Path/estado real | Capacidades e comandos a preservar |
|---|---|---|
| Hoje | `/` | KPIs, feed de movimento, modelos/regiões e layout configurável por `dashboardLayout`; personalização em Configurações. |
| Comparador | `/comparador` | Comparação bilateral, facetas de marca/modelo/ano e contexto serializado na URL; exige ano-modelo nos dois lados. |
| Mercado | `/mercado` | Mercado/categoria, região, UF, cidade, revenda, preço, marca, carroceria, tração, FIPE, busca, ordenação, paginação e Refine/mais filtros; Voltar via histórico. |
| Oportunidades | `/oportunidades` | Região/UF, ranking por tempo e abaixo da FIPE, amostra suficiente e criação de ação. |
| Concorrentes | `/concorrencia` | Facetas nacionais, UF/região/cidade, busca/ordenação de lojistas e perfil/detalhe de revenda. |
| Ações | `/acoes` | Criar, concluir e persistir ações em `oper-radar-acoes`; contador na navegação. |
| FIPE | `/fipe` | Consulta por placa, status do provedor, cruzamento com mercado e referência FIPE. |
| FIPE Catálogo | subestado dentro de `/fipe` | Aba de catálogo por marca/modelo/ano/código, busca, ordenação e comparação com mercado; não há path separado. |
| Conta | `/conta` | Perfil, alteração de senha, sessão e logout via `auth.php`. |
| Minha Loja | `/minha-loja` | Estoque, detalhe de veículo, placa/UF, vínculo FIPE, preço/mercado, CRUD e XML com análise antes de confirmar. |
| Configurações | `/configuracoes` | `dashboardLayout`, tema radar/dark/white/auto, densidade compacta/padrão/confortável, redução de movimento, cobertura FIPE e reset. |
| Análise | `/analise` | Insights agregados, KPIs FIPE/cobertura e Analista IA; status em `analista_status.php`. |

Navegação desktop: sidebar inline própria do app. Mobile: Hoje, Mercado, Minha Loja e Oportunidades na barra principal; Comparador, FIPE, Concorrentes, Análise, Ações, Configurações e Conta no menu “Mais”.

## Contexto, filtros e comandos

- `navigation.js` normaliza `periodo` (7d/30d/90d/180d/12m), mercado, região, UF, cidade, segmento, grupo, marca, modelo, ano, busca e comparação; serializa apenas valores não padrão na query string.
- Regiões e UFs são multi-estado por facetas. Cidade e revenda dependem da UF.
- Refine é o agrupamento de filtros adicionais do Mercado; filtros de categoria determinam os campos disponíveis. Voltar usa `useBrowserRoute.goBack`, History API e restauração de scroll em `#app-scroll-container`.
- Comparador chama `comparador.php` com dois lados e bloqueia comparação incompleta.
- Detalhes de anúncio/veículo são diálogos laterais: `anuncio_detalhe.php` e `minha_loja.php`; os listeners de Escape fecham os diálogos.
- XML é analisado antes da confirmação, com opções de publicar no comparativo interno e marcar ausentes; limite de 20 MB.
- FIPE separa consulta por placa e catálogo; o catálogo aceita marca, modelo, ano e código.
- Analista IA fica em Análise, com `insights.php` e `analista_status.php`; depende de configuração de servidor.

## Arquitetura observada

- `App.jsx` compõe `RadarApp`, usa `useBrowserRoute(import.meta.env.BASE_URL)`, `useApi` e ações locais em `localStorage`.
- `useBrowserRoute.js` usa `pushState`/`replaceState`, `operRadarEntry`, `operRadarScrollTop`, query context e restauração de scroll.
- `dashboardLayout.js` define presets Executivo/Comercial/Enxuto, KPIs revendas/anúncios/saídas/movimento, seções e normalização.
- `theme.js` resolve radar/dark/white/auto, escreve `--or-*`, densidade e redução de movimento em `data-*` do root.
- `dataState.js` define loading/ready/empty/error/stale/forbidden/offline, freshness/confiança e bloqueia recomendação sem amostra/confiança.

## Colisões e limites para futura paridade DS

1. O app importa apenas `app/src/theme.css`; os componentes oficiais em `design-system/components/components.css` não entram no bundle atual.
2. `App.jsx` usa `.or-card`, `.or-zebra-list` e `.or-card-density` junto com estilos inline. Se o CSS oficial for importado sem mapeamento, `.or-card` aplicará padding/gap/background/radius do DS sobre cards já dimensionados pelo tema.
3. `theme.css` redefine `.or-card-density`, `.or-zebra-list` e variáveis `--or-*`; a paleta atual usa Radar laranja (`#F5A623`), enquanto o DS canônico usa verde radar.
4. Breakpoint real do app: `window.innerWidth <= 760` troca sidebar por header + bottom nav; `theme.css` também usa 760px e Mercado tem regra em 980px. O DS documenta rail 900–1199, topbar + bottom nav abaixo de 900px e tabelas empilhadas abaixo de 640px.
5. App usa Lucide React; o DS documenta Phosphor.
6. Diálogos existentes usam `role=dialog`, listener Escape e scrim/estilos inline. O DS prevê `.or-dialog-scrim` + `.or-dialog` e bottom-sheet abaixo de 640px; migração deve preservar Escape, foco e scroll-lock.

## Captura HTTP real

- Servidor: `npm run dev -- --host 127.0.0.1`; URL `http://127.0.0.1:5173/oper-radar/`.
- Desktop: captura real do login, aproximadamente 1536×864 no canvas do portal: marca OPER RADAR, formulário e CTA “Entrar no radar”.
- Mobile: abertura real por HTTP registrada; o conector exibiu login/carregamento, mas não permitiu persistir PNG nem aplicar override confiável de 390×844.
- Telas autenticadas exigem sessão via `auth.php`, indisponível no servidor Vite. Nenhuma credencial foi inventada ou enviada.
- Não há PNG fabricado no repositório. A limitação e os estados observados estão em `prints/README.md`.

## F0/F1

F0 é somente baseline/inventário. Nenhuma integração, alteração em `app/src` ou implementação F1 foi iniciada.
