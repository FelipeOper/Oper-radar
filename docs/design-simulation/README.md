# Oper Radar — proposta visual BETA

Abra [index.html](index.html) diretamente no navegador. As telas são HTML estático com dados fictícios locais, sem build, servidor, autenticação, API ou acesso a produção. Esta é uma proposta de arquitetura visual, **não** uma implementação do backend nem uma medição válida do mercado.

## Mapa de telas

| Nível | Telas | Papel |
| --- | --- | --- |
| Acesso | `login.html` | Entrada preservada da primeira leva. |
| Navegação principal | `hoje.html`, `mercado.html`, `concorrencia.html`, `minha-loja.html`, `inteligencia.html`, `plano-de-acao.html`, `dados-e-fipe.html` | Sete destinos: Hoje, Mercado, Concorrência, Minha Loja, Inteligência, Plano de ação, Dados e FIPE. |
| Contexto | `lojista.html`, `comparador.html`, `anuncio.html`, `veiculo.html` | Perfil de lojista, comparador, oferta e veículo vinculados ao recorte. Oportunidades fica no cruzamento contextual, não na navegação principal. |
| Conta | `configuracoes.html`, `conta.html` | Preferências e identidade fictícias. |

`index.html` apresenta todas as telas. Hoje e Mercado mantêm sua composição anterior e recebem a nova navegação pelo `legacy-nav.js`. As telas novas são renderizadas com dados locais por `simulation.js`; cada arquivo HTML é aberto diretamente por `file://`. O shell novo reutiliza exatamente `.shell`, `.side`, `.brand`, `.side-label`, `.or-navitem`, `.content`, `.top`, `.main`, `.bottom` e as medidas/padding da sidebar de Hoje/Mercado, mantendo a mesma navegação lateral no desktop e a mesma bottom nav fixa no mobile. `analyst.js` mantém o painel do Analista IA aberto na navegação simulada por estado de sessão e parâmetro local de URL. O painel usa `or-dialog-scrim` e `or-dialog` do design system; resposta e ressalva de contexto são estáticas.

## Fluxos de navegação

1. Concorrência → perfil do lojista → comparador com caminhão, Curitiba/PR e 30 dias já preenchidos → anúncio → Minha Loja/veículo → Plano de ação.
2. Mercado → comparador e oferta contextual; Inteligência → evidências → anúncio ou comparador.
3. Minha Loja → veículo → FIPE, mediana qualificada, concorrente e ação.
4. Dados e FIPE → anúncio com referência separada do preço de mercado.

O grupo exemplificado é **marca + modelo + ano**. A densidade compacta das telas preservadas é preferência documentada. A navegação proposta reorganiza destinos; não declara que as rotas atuais do app já foram alteradas.

## Mock-data e leitura de números

Tudo é ilustrativo: R$ 489.900 para uma oferta Volvo FH 540 2021, FIPE fictícia de R$ 505.000, mediana qualificada fictícia de R$ 498.000, 11 ofertas (9 com preço válido), Curitiba/PR, janela de 30 dias, lojistas inventados e placas placeholder `AAA0A00`, `BBB0B00`, `CCC0C00`. As datas 21–22/09/2026 são marcas de atualização do cenário fictício, não de coleta real. Não há identificador, segredo ou credencial de produção.

Em todos os cartões de KPI das telas novas e preservadas aparecem recorte, período, valor, base comparativa, amostra, confiança, atualização/cobertura, explicação e ação. A média bruta ilustrativa de R$ 512.400 é separada da mediana qualificada. Saída observada significa anúncio ausente em verificações posteriores; **não comprova venda**.

## Limites conhecidos, expostos nas telas

- Score regional ainda é preliminar e hoje é exposto apenas em Minha Loja. Scores e explicações adicionais nesta proposta não são calculados.
- `eventos.php` ainda não tem consumidor direto na SPA. Eventos mostrados são locais e fictícios.
- Quedas de preço em Oportunidades ainda são placeholder.
- `insights.php` e `analista.php` ainda não recebem o contexto da tela. A resposta do Analista IA é estática.
- `equivalent_group.php` ainda não é calculável. O recorte de grupo exato no mock não representa esse cálculo.
- Referência FIPE, preço anunciado, média bruta e mediana qualificada têm significados diferentes; amostras insuficientes não sustentam recomendação.

As capacidades atuais foram conferidas em `origin/main:app/src/App.jsx`, `navigation.js`, `useBrowserRoute.js` e `dataState.js`, com o inventário Farol consolidado pelo ATLAS como limite de capacidades reais. O design visual usa somente `../../design-system/styles.css`, `../../design-system/_ds_bundle.js`, classes, tokens, fontes, ícones e logos locais do design system. As telas preservadas mantêm seu CSS de composição original; as novas não adicionam CSS.

## Verificação

Conferir links e assets relativos, ausência de `fetch`/`XMLHttpRequest` e URLs externas, diff restrito a `docs/design-simulation/`, `git diff --check` e, quando o ambiente permitir, abrir `index.html` por `file://` em desktop e 390 px para confirmar ausência de rolagem horizontal.
