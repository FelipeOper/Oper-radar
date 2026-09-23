# Simulação visual — Oper Radar

Primeira leva de telas estáticas: [índice](index.html), [Login](login.html), [Hoje](hoje.html) e [Mercado](mercado.html). Abra `index.html` diretamente no navegador. Não há build, servidor, autenticação nem chamadas de API. Os links navegam entre os quatro arquivos; filtros, buscas e indicadores representam apenas o estado mostrado.

As páginas usam `../../design-system/styles.css`, `../../design-system/_ds_bundle.js`, fontes, ícones Phosphor e logo locais. O HTML inclui apenas o CSS de composição necessário à simulação.

Estrutura e linguagem das telas foram conferidas em `origin/main:app/src/App.jsx`, `navigation.js`, `useBrowserRoute.js` e `dataState.js`. Em Hoje, a composição cobre indicadores, movimento do mercado, modelos e regiões. Em Mercado, cobre panorama, geografia, ranking por **marca + modelo + ano**, detalhe de modelo e navegador de anúncios. Login segue os campos e a proposta de valor reais. O layout visual segue `design-system/README.md` e `design-system/reference/`.

Todos os números, preços, referências FIPE, placas e eventos são **fictícios e ilustrativos**. Nenhum dado de produção, sessão, credencial ou endpoint é usado. A simulação não representa coleta ao vivo, venda confirmada nem cálculo de mercado válido. Em especial, FIPE e mediana anunciada aparecem como referências distintas.

Conferência sugerida: abrir em viewport desktop e mobile (390 px), percorrer os links e inspecionar ausência de rolagem horizontal.
