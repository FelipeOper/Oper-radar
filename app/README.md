# OPER RADAR — frontend

Aplicação React/Vite publicada em `agenciaoper.com.br/oper-radar/` e conectada à API PHP
em `agenciaoper.com.br/oper-radar-api/`.

O Mercado abre no universo principal de caminhões e implementos rodoviários; os demais
segmentos ficam na aba "Outros mercados". A página Comparador cruza dois recortes de
caminhões por marca, modelo ou marca + modelo usando métricas calculadas no servidor.

## Identidade visual (design system)

O app usa o design system em `../design-system/` como única identidade: `src/main.jsx` importa
`design-system/styles.css` (tokens, fontes Inter/Manjari, ícones Phosphor, classes `.or-*`) e
`src/theme.js` espelha os tokens semânticos em dois temas, `dark` (padrão) e `light`. Preferências
salvas antes da troca migram sozinhas (`radar` → `dark`, `white` → `light`). O `Card` do app usa a
classe `.oc-card` para não colidir com `.or-card` do design system. A casca do app (menu lateral, topbar, barra
inferior no celular) está em `src/Shell.jsx`, com as classes `.or-sidebar`/`.or-topbar`/`.or-bottomnav`; a troca
entre desktop e celular é por CSS (899px), sem largura em JS. Os ícones vêm de `src/icons.jsx`, um adaptador
para a fonte Phosphor do design system (o `lucide-react` foi removido). A migração tela a tela está em
`../docs/oper-radar-redesign/MIGRACAO_DEMO_PARA_REAL.md`.

O Mercado usa `src/mercadoModel.js` (evidência e leitura da oportunidade regional) e `src/MercadoBlocos.jsx`.
A tela Hoje usa `src/HojeBlocos.jsx`, `src/Evidencia.jsx` e `src/hojeModel.js` (regras puras, com
testes). No modo demo, `localStorage['oper-demo-api-antiga']='1'` simula um servidor sem os campos novos.

`VITE_DEMO=1 npm run build` gera um build com dados fictícios (`src/demoFixtures.js`) só para
verificação visual; sem a variável o app usa a API real.

## Desenvolvimento

```text
npm install
npm test
npm run build
```

O build final fica em `app/dist/`. O HostGator hospeda somente os arquivos estáticos; não
é necessário executar Node.js no servidor.

O Vite usa `base: /oper-radar/` e publica `public/.htaccess` no build. As áreas possuem
rotas reais; o contexto de período, mercado e filtros geográficos é sanitizado e serializado
na URL por `src/navigation.js`. `src/useBrowserRoute.js` integra refresh, compartilhamento,
Voltar/Avançar e restauração da rolagem sem adicionar uma dependência de roteamento.

No mercado principal, o painel analítico usa `mercado_painel.php` para apresentar o resumo
nacional ou estadual, ranking geográfico, modelos por recorte factual (marca + modelo + ano)
e série observada. O navegador de anúncios abaixo dele continua sendo a evidência navegável;
não são inferidos grupos equivalentes comerciais nem recomendações de preço.

## Regras de confiabilidade da interface

- Busca principal do Mercado aparece antes dos filtros geográficos no celular.
- Tração/configuração de eixos coletada aparece nos cards e pode ser filtrada por valores
  normalizados como `4x2`, `6x2`, `6x4` e `8x2`.
- E5/E6 só aparece em caminhão, ônibus e micro-ônibus. O ano de fabricação 2022 permanece
  como transição quando a norma não estiver explícita no anúncio.
- Tempo no Radar é apresentado como tempo observado, nunca como data garantida de publicação.
- Mercado equivalente usa mediana e faixa central somente com pelo menos cinco ofertas
  qualificadas; amostras menores são identificadas como insuficientes.
- Minha Loja possui busca, filtro, ordenação, salvamento otimista com reversão em erro e
  ação de desfazer a última mudança de status.

As regras puras ficam em `src/domainRules.js`, `src/dataState.js` e `src/navigation.js`, com
testes independentes na pasta `tests/`.

## Publicação

Publicar exige uma decisão separada: este repositório não envia o build automaticamente ao
servidor. Antes de copiar `dist/`, execute os testes, gere backup dos arquivos publicados e
valide a API correspondente. O conteúdo deve ser enviado para
`/home1/pro93061/agenciaoper.com.br/oper-radar/`, não para a raiz genérica de `public_html`.

O KPI de estoque mostra anúncios ativos revalidados no ciclo atual. Registros herdados de
revendas ainda não coletadas aparecem separados e nunca são apresentados como atuais.
