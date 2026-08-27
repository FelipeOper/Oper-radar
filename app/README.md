# OPER RADAR — frontend

Aplicação React/Vite publicada em `agenciaoper.com.br/oper-radar/` e conectada à API PHP
em `agenciaoper.com.br/oper-radar-api/`.

O Mercado abre no universo principal de caminhões e implementos rodoviários; os demais
segmentos ficam na aba "Outros mercados". A página Comparador cruza dois recortes de
caminhões por marca, modelo ou marca + modelo usando métricas calculadas no servidor.

## Desenvolvimento

```text
npm install
npm test
npm run build
```

O build final fica em `app/dist/`. O HostGator hospeda somente os arquivos estáticos; não
é necessário executar Node.js no servidor.

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

As regras puras ficam em `src/domainRules.js` e têm testes em `tests/domainRules.test.js`.

## Publicação

Publicar exige uma decisão separada: este repositório não envia o build automaticamente ao
servidor. Antes de copiar `dist/`, execute os testes, gere backup dos arquivos publicados e
valide a API correspondente. O conteúdo deve ser enviado para
`/home1/pro93061/agenciaoper.com.br/oper-radar/`, não para a raiz genérica de `public_html`.

O KPI de estoque mostra anúncios ativos revalidados no ciclo atual. Registros herdados de
revendas ainda não coletadas aparecem separados e nunca são apresentados como atuais.
