/* BETA visual: somente dados fictícios locais. Nenhuma chamada de rede. */
(() => {
  const nav = [
    ['Hoje','hoje.html','radar'],['Mercado','mercado.html','chart-bar'],
    ['Concorrência','concorrencia.html','buildings'],['Minha Loja','minha-loja.html','storefront'],
    ['Inteligência','inteligencia.html','brain'],['Plano de ação','plano-de-acao.html','list-checks'],
    ['Dados e FIPE','dados-e-fipe.html','database']
  ];
  const here = location.pathname.split('/').pop() || 'index.html';
  const icon = name => `<i class="ph ph-${name}" aria-hidden="true"></i>`;
  const sidebar = () => `<nav class="or-sidebar" aria-label="Principal"><div class="or-sidebar__brand"><img class="mark" src="../../design-system/assets/mark-dark.png" alt=""><strong>OPER RADAR</strong></div><div class="or-sidebar__section">Inteligência</div>${nav.map(([label, href, iconName]) => `<a class="or-navitem ${here === href ? 'or-navitem--active' : ''}" href="${href}" ${here === href ? 'aria-current="page"' : ''}>${icon(iconName)}<span class="or-navitem__label">${label}</span></a>`).join('')}<div class="or-sidebar__section">Preferências</div><a class="or-navitem" href="configuracoes.html">${icon('gear')}<span class="or-navitem__label">Configurações</span></a><a class="or-navitem" href="conta.html">${icon('user-circle')}<span class="or-navitem__label">Conta</span></a><div class="or-sidebar__foot"><span class="or-badge or-badge--neutral">Simulação BETA</span><small>Dados fictícios · sem produção</small></div></nav>`;
  const mobileNav = () => `<nav class="or-bottomnav" aria-label="Principal"><a class="or-bottomnav__item ${here === 'hoje.html' ? 'or-bottomnav__item--active' : ''}" href="hoje.html" aria-current="${here === 'hoje.html' ? 'page' : 'false'}"><span class="or-bottomnav__ic">${icon('radar')}</span><span>Hoje</span></a><a class="or-bottomnav__item ${here === 'mercado.html' ? 'or-bottomnav__item--active' : ''}" href="mercado.html" aria-current="${here === 'mercado.html' ? 'page' : 'false'}"><span class="or-bottomnav__ic">${icon('chart-bar')}</span><span>Mercado</span></a><a class="or-bottomnav__item" href="index.html"><span class="or-bottomnav__ic">${icon('squares-four')}</span><span>Telas</span></a><a class="or-bottomnav__item ${here === 'inteligencia.html' ? 'or-bottomnav__item--active' : ''}" href="inteligencia.html" aria-current="${here === 'inteligencia.html' ? 'page' : 'false'}"><span class="or-bottomnav__ic">${icon('brain')}</span><span>Inteligência</span></a></nav>`;
  const link = (href, label, kind='secondary') => `<a class="or-btn or-btn--${kind}" href="${href}">${label} ${icon('arrow-right')}</a>`;
  const card = (title, sub, body) => `<section class="or-card"><div class="or-card__head"><div><h2 class="or-card__title">${title}</h2><p class="or-card__sub">${sub}</p></div></div>${body}</section>`;
  const row = (title, sub, href) => `<a class="or-listrow" href="${href}"><span class="or-listrow__body"><span class="or-listrow__t">${title}</span><span class="or-listrow__s">${sub}</span></span><span class="or-listrow__trail">${icon('arrow-right')}</span></a>`;
  const note = text => `<div class="or-alert or-alert--info"><span class="or-alert__ic">${icon('info')}</span><span class="or-alert__body"><strong class="or-alert__t">Como ler</strong><span class="or-alert__d">${text}</span></span></div>`;
  const evidence = (scope, period, value, base, sample, confidence, update, explanation, action) => card(scope, 'Indicador ilustrativo · evidência para decisão', `<div class="or-stat__value">${value}</div><p><strong>Recorte:</strong> ${scope}<br><strong>Período:</strong> ${period}<br><strong>Valor:</strong> ${value}<br><strong>Base comparativa:</strong> ${base}<br><strong>Amostra:</strong> ${sample}<br><strong>Confiança:</strong> ${confidence}<br><strong>Atualização/cobertura:</strong> ${update}</p><p><strong>Explicação:</strong> ${explanation}</p><p><strong>Ação:</strong> ${link(action[0],action[1])}</p>`);
  const limits = card('Estado da implementação', 'Limites reais para orientar a revisão de Felipe', `<ul><li>Score regional preliminar: hoje exposto apenas em Minha Loja. Confiança e evidências desta tela são uma proposta visual.</li><li><code>eventos.php</code> ainda não tem consumidor direto na SPA; a linha de eventos aqui é ilustrativa.</li><li>Quedas de preço em Oportunidades ainda são placeholder.</li><li><code>insights.php</code> e <code>analista.php</code> ainda não recebem contexto da tela.</li><li><code>equivalent_group.php</code> ainda não é calculável. O grupo exato mostrado no mock não é resultado de backend.</li><li>Saída observada de anúncio não comprova venda. Média bruta não substitui mediana qualificada.</li></ul>`);
  const common = {
    'concorrencia.html': ['Concorrência','Lojistas no recorte', `
      ${note('Revendas, estoque e saídas observadas são sinais. Não inferir vendas confirmadas.')}
      ${evidence('Revendas comparáveis · PR e SP','Últimos 30 dias','12','48 revendas monitoradas no cenário fictício','12 revendas','Média','Atualizado em 22/09/2026 · cobertura ilustrativa de 2 UFs','Recorte usado para abrir o perfil e manter contexto.',['lojista.html','Ver lojista'])}
      ${card('Lojistas no recorte','Caminhões pesados · PR e SP · 30 dias',row('Rota Exemplo Caminhões · Curitiba/PR','18 anúncios ativos · 3 saídas observadas · 2 reduções de preço','lojista.html')+row('Pátio Demonstração · Campinas/SP','14 anúncios ativos · 2 saídas observadas','comparador.html'))}
      ${card('Cruzamentos disponíveis','Acompanhe uma oferta até a decisão',row('Volvo FH 540 · 2021 · R$ 489.900','Preço vs FIPE vs mediana qualificada vs oportunidade regional','comparador.html'))}`],
    'lojista.html': ['Perfil de lojista','Rota Exemplo Caminhões', `
      ${note('Nome, valores e estoque são fictícios. Saída detectada significa anúncio ausente em novas verificações, não venda.')}
      ${evidence('Estoque ativo · Curitiba/PR','Últimos 30 dias','18','12 lojistas comparáveis no mesmo recorte','18 anúncios','Média','Coleta fictícia em 22/09/2026 · Curitiba/PR','O perfil reúne oferta, mudança de preço e saída observada para investigação.',['comparador.html','Comparar oferta'])}
      ${card('Sinais de eventos','Sequência ilustrativa; eventos.php sem consumidor direto na SPA',row('21/09 · Preço caiu · Volvo FH 540 2021','R$ 499.900 → R$ 489.900 · anúncio EX-001','anuncio.html')+row('18/09 · Saída observada · Scania R 450 2020','Anúncio não revalidado · venda não comprovada','anuncio.html'))}
      ${card('Próximos passos','Mesmo recorte preservado',row('Comparar Volvo FH 540 2021','Curitiba/PR · 30 dias · grupo marca + modelo + ano','comparador.html')+row('Criar ação de monitoramento','Acompanhar nova mudança de preço','plano-de-acao.html'))}`],
    'comparador.html': ['Comparador contextual','Volvo FH 540 · 2021', `
      ${card('Recorte já preenchido','Recebido do perfil do lojista · grupo marca + modelo + ano',`<span class="or-tag or-tag--selected">Caminhões</span> <span class="or-tag or-tag--selected">Curitiba/PR</span> <span class="or-tag or-tag--selected">30 dias</span> <span class="or-tag or-tag--selected">Volvo FH 540 · 2021</span>`)}
      ${evidence('Preço anunciado · Volvo FH 540 2021','30 dias · Curitiba/PR','R$ 489.900','FIPE fictícia R$ 505.000 · mediana qualificada fictícia R$ 498.000','11 ofertas equivalentes','Média','Atualizado em 22/09/2026 · 9/11 preços válidos','R$ 15.100 abaixo da FIPE e R$ 8.100 abaixo da mediana. Comparação ilustrativa; sem cálculo equivalente em backend.',['anuncio.html','Ver anúncio'])}
      ${evidence('Oportunidade regional preliminar','30 dias · Curitiba/PR','7,2 / 10','11 ofertas do grupo exato · 4 saídas observadas','11 ofertas','Baixa','Cobertura ilustrativa · PR','Score proposto para estudo visual; o score real ainda aparece apenas em Minha Loja.',['minha-loja.html','Ver Minha Loja'])}
      ${note('Média bruta do grupo: R$ 512.400, sujeita a extremos. Mediana qualificada ilustrativa: R$ 498.000 após exclusões explícitas. Não apresentar as duas como equivalentes.')}`],
    'minha-loja.html': ['Minha Loja','Seu estoque no contexto do mercado', `
      ${note('Placas são placeholders. Score regional existente é preliminar; o cruzamento proposto abaixo é apenas visual.')}
      ${evidence('Estoque próprio · Curitiba/PR','Últimos 30 dias','8','11 ofertas concorrentes comparáveis','8 veículos','Média','Atualizado em 22/09/2026 · 7/8 preços válidos','Dois veículos pedem revisão de preço ou referência FIPE.',['veiculo.html','Ver veículo'])}
      ${card('Veículos com decisão pendente','Estoque fictício',row('Volvo FH 540 · 2021 · placa AAA0A00','R$ 515.000 · FIPE R$ 505.000 · concorrência R$ 498.000','veiculo.html')+row('Scania R 450 · 2020 · placa BBB0B00','R$ 428.000 · referência FIPE a validar','dados-e-fipe.html'))}
      ${row('Criar ação para revisar preço','Volvo FH 540 · Curitiba/PR', 'plano-de-acao.html')}`],
    'veiculo.html': ['Detalhe do veículo','Volvo FH 540 · 2021 · AAA0A00', `
      ${card('Recorte do veículo','Minha Loja · Curitiba/PR · caminhão pesado · 30 dias',`<span class="or-badge or-badge--neutral">Placa placeholder</span><p>Anúncio próprio fictício · R$ 515.000 · 312.000 km · 2021.</p>`)}
      ${evidence('Preço próprio vs referências','30 dias · Curitiba/PR','R$ 515.000','FIPE fictícia R$ 505.000 · mediana qualificada R$ 498.000 · oferta concorrente R$ 489.900','11 ofertas · 9 válidas','Média','Atualizado em 22/09/2026 · cobertura PR','Preço próprio acima da mediana e da oferta concorrente; investigar estado e especificação antes de agir.',['comparador.html','Abrir comparador'])}
      ${evidence('Score regional preliminar · Volvo FH 540 2021 · Curitiba/PR','30 dias','6,4 / 10','11 ofertas concorrentes · 4 saídas observadas','11 ofertas','Baixa','22/09/2026 · PR ilustrativo','Valor demonstrativo, não calculado nesta simulação. O score real ainda é preliminar e só aparece em Minha Loja.',['plano-de-acao.html','Planejar revisão'])}
      ${row('Ver anúncio concorrente','Rota Exemplo Caminhões · R$ 489.900','anuncio.html')}`],
    'anuncio.html': ['Oferta contextual','Volvo FH 540 · 2021 · EX-001', `
      ${card('Anúncio fictício','Rota Exemplo Caminhões · Curitiba/PR · placa CCC0C00',`<span class="or-badge or-badge--neutral">Ativo no mock</span><p>Preço atual R$ 489.900 · anterior R$ 499.900 em 21/09/2026. Histórico ilustrativo.</p>`)}
      ${evidence('Preço vs FIPE e mercado','30 dias · Curitiba/PR','R$ 489.900','FIPE R$ 505.000 · mediana qualificada R$ 498.000','11 ofertas · 9 válidas','Média','Atualizado em 22/09/2026 · cobertura PR','A queda de R$ 10.000 é um sinal de evento simulado; não é dado consumido de eventos.php.',['comparador.html','Comparar'])}
      ${card('Ligações de contexto','Da oferta para o concorrente, estoque e ação',row('Perfil do lojista','3 saídas observadas · venda não comprovada','lojista.html')+row('Meu veículo equivalente','Volvo FH 540 2021 · AAA0A00','veiculo.html')+row('Registrar decisão','Revisar preço próprio com evidências','plano-de-acao.html'))}`],
    'inteligencia.html': ['Inteligência','Sinais para investigar', `
      ${note('Insights aqui são curadoria visual sobre mocks. insights.php e analista.php ainda não recebem o recorte da tela.')}
      ${evidence('Diferença entre preço e referência','30 dias · Curitiba/PR · Volvo FH 540 2021','1,6%','Mediana qualificada R$ 498.000 vs oferta R$ 489.900','11 ofertas · 9 válidas','Média','Atualizado em 22/09/2026 · cobertura PR','Preço abaixo da mediana é indício para análise, não recomendação automática.',['comparador.html','Ver evidências'])}
      ${card('Sinais de eventos','Exemplos locais; sem consumidor direto de eventos.php',row('Preço caiu · EX-001','R$ 499.900 → R$ 489.900 · 21/09','anuncio.html')+row('Saída observada · EX-002','Scania R 450 · venda não comprovada','lojista.html'))}
      ${card('Analista IA','Painel acessível em todas as telas',`<p>Abra o Analista IA no topo. A conversa mostrada é estática e não consulta serviços.</p><button class="or-btn or-btn--primary" type="button" data-analyst>Ver Analista IA</button>`)}`],
    'plano-de-acao.html': ['Plano de ação','Transformar evidência em decisão', `
      ${card('Revisar preço · Volvo FH 540 2021','Ação proposta · proprietário: equipe da loja · prazo fictício: 25/09/2026',`<span class="or-badge or-badge--warning">Pendente</span><p>Preço próprio R$ 515.000; FIPE R$ 505.000; mediana qualificada R$ 498.000; concorrente R$ 489.900. Curitiba/PR · 30 dias · 11 ofertas, 9 válidas · confiança média · atualizado em 22/09.</p><p>Verificar condição, quilometragem e versão FIPE antes de qualquer alteração.</p>${link('veiculo.html','Abrir veículo')}`)}
      ${card('Monitorar redução do concorrente','Ação proposta a partir de evento fictício',`<p>EX-001 caiu R$ 10.000 em 21/09. A visão atual de Oportunidades ainda usa placeholder para quedas de preço.</p>${link('anuncio.html','Ver anúncio')}`)}
      ${note('Esta página representa um fluxo de decisão. Nenhuma ação é gravada no backend pela simulação.')}`],
    'dados-e-fipe.html': ['Dados e FIPE','Origem, cobertura e qualidade', `
      ${evidence('Cobertura da amostra · caminhões pesados · Curitiba/PR','30 dias','11 ofertas','9 preços válidos · 1 FIPE ambígua · 1 sem preço','11 ofertas','Média','22/09/2026 · PR ilustrativo','Qualidade do recorte fictício para orientar a leitura de FIPE e mercado.',['comparador.html','Ver comparador'])}
      ${evidence('FIPE do Volvo FH 540 · 2021','Referência fictícia de setembro/2026','R$ 505.000','Preço anunciado R$ 489.900 · mediana qualificada R$ 498.000','1 vínculo FIPE ilustrativo · 11 ofertas','Média','Atualizado em 22/09/2026','FIPE é referência separada do mercado anunciado. Vínculo e versão devem ser conferidos.',['anuncio.html','Ver anúncio'])}
      ${card('Qualidade e estados','Contratos de dataState.js',`<p>Estados: loading, ready, empty, error, stale, forbidden e offline. Frescor: fresh, delayed, stale e unknown. Confiança: alta, média, baixa e insuficiente.</p><p>Sem amostra suficiente, o comparativo deve ser ocultado ou identificado como insuficiente.</p>`)}`],
    'configuracoes.html': ['Configurações','Preferências da interface', `
      ${card('Preferências','Representação visual, sem persistência',`<p>Tema escuro · densidade compacta · região preferida PR · período inicial 30 dias.</p><p>Densidade compacta é uma preferência de produto documentada.</p><span class="or-badge or-badge--neutral">Somente demonstração</span>`)}
      ${row('Minha conta','Identidade fictícia e acesso','conta.html')}`],
    'conta.html': ['Minha conta','Identidade de demonstração', `
      ${card('Conta de exemplo','Nenhuma credencial real ou sessão ativa',`<p>Usuário: Pessoa Exemplo · papel: demonstração · e-mail: exemplo@invalid.example.</p><span class="or-badge or-badge--neutral">Mock local</span>`)}
      ${row('Configurações','Voltar às preferências','configuracoes.html')}`]
  };
  const preservedTitles = { 'hoje.html': 'Hoje', 'mercado.html': 'Mercado' };
  const enhancePreserved = () => {
    const current = here;
    const pages = nav;
    const main = document.querySelector('#root main');
    if (!main) return;
    main.insertAdjacentHTML('beforeend', `<section class="or-card"><h2 class="or-card__title">Explorar no mesmo recorte</h2><p>Visões contextuais da proposta BETA: ofertas, comparador, lojistas e oportunidades regionais.</p><nav class="or-tabs" aria-label="Visões contextuais"><a class="or-tab" href="comparador.html">Comparador</a><a class="or-tab" href="anuncio.html">Oferta</a><a class="or-tab" href="lojista.html">Lojista</a><a class="or-tab" href="minha-loja.html">Oportunidade regional</a></nav><p>Score regional preliminar só em Minha Loja; eventos.php sem consumidor; queda de preço em Oportunidades placeholder; insights.php e analista.php sem contexto de tela; equivalent_group.php ainda não calculável.</p></section>`);
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
    main.querySelectorAll('.kpis .stat').forEach((element, index) => {
      const [scope, period, base, sample, confidence, update, explanation, href, action] = metadata[index] || metadata[0];
      const value = element.querySelector('strong')?.textContent?.trim() || '';
      element.insertAdjacentHTML('beforeend', `<p class="or-card__sub"><strong>Recorte:</strong> ${scope}<br><strong>Período:</strong> ${period}<br><strong>Valor:</strong> ${value}<br><strong>Base comparativa:</strong> ${base}<br><strong>Amostra:</strong> ${sample}<br><strong>Confiança:</strong> ${confidence}<br><strong>Atualização/cobertura:</strong> ${update}<br><strong>Explicação:</strong> ${explanation}<br><strong>Ação:</strong> <a href="${href}">${action} →</a></p>`);
    });
    const kpis = main.querySelector('.kpis');
    if (kpis) {
      kpis.style.display = 'grid';
      kpis.style.gridTemplateColumns = 'repeat(4,minmax(0,1fr))';
      kpis.style.gap = 'var(--space-4)';
      kpis.querySelectorAll('.stat').forEach((element) => {
        element.classList.add('or-card');
        element.querySelector('.label')?.classList.add('or-stat__label');
        element.querySelector('strong')?.classList.add('or-stat__value');
        element.querySelector('.sub')?.classList.add('or-card__sub');
      });
    }
    main.querySelectorAll('.card').forEach((element) => element.classList.add('or-card'));
    main.querySelectorAll('.grid').forEach((element) => { element.style.display = 'grid'; element.style.gridTemplateColumns = 'minmax(0,1.35fr) minmax(0,.9fr)'; element.style.gap = 'var(--space-4)'; element.style.marginBottom = 'var(--space-4)'; });
    main.querySelectorAll('.split').forEach((element) => { element.style.display = 'grid'; element.style.gridTemplateColumns = 'minmax(0,.82fr) minmax(0,1.18fr)'; element.style.gap = 'var(--space-4)'; });
    main.querySelectorAll('.detail').forEach((element) => { element.style.display = 'grid'; element.style.gridTemplateColumns = 'repeat(3,minmax(0,1fr))'; element.style.gap = 'var(--space-4)'; });
    if (current === 'mercado.html') main.querySelectorAll('.detail article').forEach((element, index) => {
      const value = element.querySelector('strong')?.textContent?.trim() || '';
      const detail = [['31 preços válidos','31 anúncios','Mediana anunciada, não média bruta.'],['18 lojistas','42 anúncios','Oferta ativa no grupo exato.'],['1 referência FIPE fictícia','1 vínculo ilustrativo','FIPE separada do preço anunciado.']][index];
      if (!detail) return;
      element.insertAdjacentHTML('beforeend', `<p class="or-card__sub"><strong>Recorte:</strong> Volvo FH 540 2021 · Paraná<br><strong>Período:</strong> 30 dias<br><strong>Valor:</strong> ${value}<br><strong>Base comparativa:</strong> ${detail[0]}<br><strong>Amostra:</strong> ${detail[1]}<br><strong>Confiança:</strong> Baixa<br><strong>Atualização/cobertura:</strong> 22/09/2026 · PR<br><strong>Explicação:</strong> ${detail[2]}<br><strong>Ação:</strong> <a href="comparador.html">Comparar →</a></p>`);
    });
  };
  const shell = (title, subtitle, body, includeIntro = true) => `<div style="display:flex;min-height:100vh;overflow-x:hidden">${sidebar()}<div style="flex:1;min-width:0"><header class="or-topbar"><div class="or-topbar__title"><span class="or-topbar__crumb">OPER RADAR / SIMULAÇÃO BETA</span><h1 class="or-topbar__h">${title}</h1></div><div class="or-topbar__actions"><button class="or-btn or-btn--secondary" type="button" data-analyst>Analista IA</button></div></header><main class="main" style="max-width:1440px;margin:auto;padding:32px var(--gutter) 80px">${includeIntro ? `<section class="or-card simulation-intro"><span class="or-sectiontag or-sectiontag--accent">PROPOSTA VISUAL BETA</span><h2>${subtitle}</h2><p>Dados inteiramente fictícios · nenhuma conexão com produção.</p><p>${link('index.html','Mapa de telas')} ${link('configuracoes.html','Configurações')} ${link('conta.html','Conta')}</p></section>` : ''}${body}${limits}</main></div></div>${mobileNav()}`;
  if (common[here]) {
    const [title, subtitle, body] = common[here];
    document.getElementById('root').innerHTML = shell(title, subtitle, body);
  } else if (preservedTitles[here]) {
    const source = document.querySelector('[data-preserved-content]');
    document.getElementById('root').innerHTML = shell(preservedTitles[here], preservedTitles[here], source?.innerHTML || '', false);
    enhancePreserved();
  }
  const side = document.querySelector('.or-sidebar');
  const bottom = document.querySelector('.or-bottomnav');
  const adaptOfficialNavigation = () => {
    if (!side || !bottom) return;
    const compact = window.matchMedia('(max-width: 899px)').matches;
    side.style.display = compact ? 'none' : '';
    bottom.style.display = compact ? 'flex' : 'none';
    bottom.style.position = compact ? 'fixed' : '';
    bottom.style.left = compact ? '0' : '';
    bottom.style.right = compact ? '0' : '';
    bottom.style.bottom = compact ? '0' : '';
    bottom.style.zIndex = compact ? 'var(--z-topbar)' : '';
    const main = document.querySelector('#root main');
    if (main) main.style.paddingBottom = compact ? 'calc(var(--gutter-mobile) + var(--bottomnav-h))' : '80px';
    const introCard = document.querySelector('#root main .simulation-intro');
    if (introCard) { introCard.style.padding = compact ? 'var(--space-3)' : ''; const links = introCard.querySelector('p:last-child'); if (links) links.style.display = compact ? 'none' : ''; }
    const kpis = document.querySelector('#root main .kpis');
    if (kpis) kpis.style.gridTemplateColumns = compact ? (window.innerWidth < 590 ? '1fr' : 'repeat(2,minmax(0,1fr))') : 'repeat(4,minmax(0,1fr))';
    document.querySelectorAll('#root main .grid').forEach((element) => { element.style.gridTemplateColumns = compact ? '1fr' : 'minmax(0,1.35fr) minmax(0,.9fr)'; });
    document.querySelectorAll('#root main .split').forEach((element) => { element.style.gridTemplateColumns = compact ? '1fr' : 'minmax(0,.82fr) minmax(0,1.18fr)'; });
    document.querySelectorAll('#root main .detail').forEach((element) => { element.style.gridTemplateColumns = compact ? '1fr' : 'repeat(3,minmax(0,1fr))'; });
  };
  adaptOfficialNavigation();
  window.addEventListener('resize', adaptOfficialNavigation, { passive: true });
})();
