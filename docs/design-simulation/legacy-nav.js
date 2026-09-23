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
  const metadata = current === 'hoje.html' ? [
    ['5 UFs · caminhões pesados','30 dias','48 revendas observadas','48 revendas','Baixa','22/09/2026 · 5 UFs','Cobertura fictícia de revendas.','concorrencia.html','Ver concorrência'],
    ['5 UFs · caminhões pesados','30 dias','48 revendas observadas','1.284 anúncios','Baixa','22/09/2026 · 5 UFs','Estoque revalidado no cenário ilustrativo.','mercado.html','Ver mercado'],
    ['5 UFs · caminhões pesados','Mês corrente ilustrativo','1.284 anúncios ativos','37 saídas observadas','Baixa','22/09/2026 · 5 UFs','Anúncio ausente não comprova venda.','inteligencia.html','Ver sinais'],
    ['5 UFs · caminhões pesados','48 h','Estoque anterior ilustrativo','85 eventos','Baixa','22/09/2026 · 5 UFs','Entradas e saídas são sinais observados.','inteligencia.html','Investigar']
  ] : [
    ['Paraná · caminhões e implementos','30 dias','48 lojistas fictícios','1.284 anúncios','Baixa','22/09/2026 · PR','Volume ativo do recorte demonstrativo.','comparador.html','Comparar'],
    ['Paraná · caminhões e implementos','30 dias','1.284 anúncios fictícios','48 lojistas','Baixa','22/09/2026 · PR','Revendas observadas no cenário.','concorrencia.html','Ver lojistas'],
    ['Paraná · caminhões e implementos','30 dias','48 lojistas fictícios','22 cidades','Baixa','22/09/2026 · PR','Cidades com ofertas no cenário.','dados-e-fipe.html','Ver cobertura'],
    ['Paraná · caminhões e implementos','30 dias','Preços anunciados, não FIPE','31 preços do grupo selecionado','Baixa','22/09/2026 · PR','Mediana ilustrativa; não é média bruta.','comparador.html','Ver preços']
  ];
  document.querySelectorAll('.kpis .stat').forEach((element, index) => {
    const [scope, period, base, sample, confidence, update, explanation, href, action] = metadata[index] || metadata[0];
    const value = element.querySelector('strong')?.textContent?.trim() || '—';
    element.insertAdjacentHTML('beforeend', `<p class="or-card__sub"><strong>Recorte:</strong> ${scope}<br><strong>Período:</strong> ${period}<br><strong>Valor:</strong> ${value}<br><strong>Base comparativa:</strong> ${base}<br><strong>Amostra:</strong> ${sample}<br><strong>Confiança:</strong> ${confidence}<br><strong>Atualização/cobertura:</strong> ${update}<br><strong>Explicação:</strong> ${explanation}<br><strong>Ação:</strong> <a href="${href}">${action} →</a></p>`);
  });
  if (current === 'mercado.html') document.querySelectorAll('.detail article').forEach((element, index) => {
    const value = element.querySelector('strong')?.textContent?.trim() || '—';
    const detail = [
      ['31 preços válidos','31 anúncios','Mediana anunciada, não média bruta.'],
      ['18 lojistas','42 anúncios','Oferta ativa no grupo exato.'],
      ['1 referência FIPE fictícia','1 vínculo ilustrativo','FIPE separada do preço anunciado.']
    ][index];
    element.insertAdjacentHTML('beforeend', `<p class="or-card__sub"><strong>Recorte:</strong> Volvo FH 540 2021 · Paraná<br><strong>Período:</strong> 30 dias<br><strong>Valor:</strong> ${value}<br><strong>Base comparativa:</strong> ${detail[0]}<br><strong>Amostra:</strong> ${detail[1]}<br><strong>Confiança:</strong> Baixa<br><strong>Atualização/cobertura:</strong> 22/09/2026 · PR<br><strong>Explicação:</strong> ${detail[2]}<br><strong>Ação:</strong> <a href="comparador.html">Comparar →</a></p>`);
  });
})();
