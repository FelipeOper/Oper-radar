/* Integração visual das páginas preservadas à navegação BETA. */
(() => {
  const pages = [
    ['Hoje','hoje.html','radar'],['Mercado','mercado.html','chart-bar'],
    ['Concorrência','concorrencia.html','buildings'],['Minha Loja','minha-loja.html','storefront'],
    ['Inteligência','inteligencia.html','brain'],['Plano de ação','plano-de-acao.html','list-checks'],
    ['Dados e FIPE','dados-e-fipe.html','database']
  ];
  const current = location.pathname.split('/').pop();
  const side = document.querySelector('.side');
  if (side) side.innerHTML = `<a class="brand" href="index.html"><img src="../../design-system/assets/mark-dark.png" alt=""><strong>OPER RADAR</strong></a><span class="side-label">WORKSPACES</span>${pages.map(([label,href,icon]) => `<a class="or-navitem ${current===href?'or-navitem--active':''}" ${current===href?'aria-current="page"':''} href="${href}"><i class="ph ph-${icon}" aria-hidden="true"></i><span class="or-navitem__label">${label}</span></a>`).join('')}<span class="side-label">PREFERÊNCIAS</span><a class="or-navitem" href="configuracoes.html"><i class="ph ph-gear" aria-hidden="true"></i><span class="or-navitem__label">Configurações</span></a><a class="or-navitem" href="conta.html"><i class="ph ph-user-circle" aria-hidden="true"></i><span class="or-navitem__label">Conta</span></a><span class="sidefoot">Proposta visual BETA · dados fictícios</span>`;
  const main = document.querySelector('main.main');
  if (main) {
    main.insertAdjacentHTML('afterbegin', `<nav class="or-tabs" aria-label="Navegação principal">${pages.map(([label,href]) => `<a class="or-tab ${current===href?'or-tab--active':''}" href="${href}">${label}</a>`).join('')}</nav>`);
    main.insertAdjacentHTML('beforeend', `<section class="or-card"><h2 class="or-card__title">Explorar no mesmo recorte</h2><p>Visões contextuais da proposta BETA: ofertas, comparador, lojistas e oportunidades regionais.</p><nav class="or-tabs" aria-label="Visões contextuais"><a class="or-tab" href="comparador.html">Comparador</a><a class="or-tab" href="anuncio.html">Oferta</a><a class="or-tab" href="lojista.html">Lojista</a><a class="or-tab" href="minha-loja.html">Oportunidade regional</a></nav><p>Score regional preliminar só em Minha Loja; eventos.php sem consumidor; queda de preço em Oportunidades placeholder; insights.php e analista.php sem contexto de tela; equivalent_group.php ainda não calculável. Saída observada não comprova venda. Média bruta e mediana qualificada são distintas.</p></section>`);
  }
  const bottom = document.querySelector('.bottom');
  if (bottom) bottom.innerHTML = `<a href="hoje.html" class="${current==='hoje.html'?'active':''}"><i class="ph ph-radar"></i>Hoje</a><a href="mercado.html" class="${current==='mercado.html'?'active':''}"><i class="ph ph-chart-bar"></i>Mercado</a><a href="index.html"><i class="ph ph-squares-four"></i>Telas</a><a href="inteligencia.html"><i class="ph ph-brain"></i>Inteligência</a>`;
})();
