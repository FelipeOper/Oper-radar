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
  const link = (href, label, kind='secondary') => `<a class="or-btn or-btn--${kind}" href="${href}">${label} ${icon('arrow-right')}</a>`;
  const card = (title, sub, body) => `<section class="or-card"><div class="or-card__head"><div><h2 class="or-card__title">${title}</h2><p class="or-card__sub">${sub}</p></div></div>${body}</section>`;
  const row = (title, sub, href) => `<a class="or-listrow" href="${href}"><span class="or-listrow__body"><span class="or-listrow__t">${title}</span><span class="or-listrow__s">${sub}</span></span><span class="or-listrow__trail">${icon('arrow-right')}</span></a>`;
  const note = text => `<div class="or-alert or-alert--info"><span class="or-alert__ic">${icon('info')}</span><span class="or-alert__body"><strong class="or-alert__t">Como ler</strong><span class="or-alert__d">${text}</span></span></div>`;
  const evidence = (scope, period, value, base, sample, confidence, update, explanation, action) => card(scope, `${period} · ${update}`, `<div class="or-stat__value">${value}</div><p><strong>Base:</strong> ${base} · <strong>Amostra:</strong> ${sample} · <strong>Confiança:</strong> ${confidence}</p><p>${explanation}</p>${link(action[0],action[1])}`);
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
      ${card('Score regional preliminar','Proposta de explicação junto ao valor',`<div class="or-stat__value">6,4 / 10</div><p>Confiança baixa · 11 ofertas · 4 saídas observadas em 30 dias. Não calculado nesta simulação.</p>${link('plano-de-acao.html','Planejar revisão','primary')}`)}
      ${row('Ver anúncio concorrente','Rota Exemplo Caminhões · R$ 489.900','anuncio.html')}`],
    'anuncio.html': ['Oferta contextual','Volvo FH 540 · 2021 · EX-001', `
      ${card('Anúncio fictício','Rota Exemplo Caminhões · Curitiba/PR · placa CCC0C00',`<span class="or-badge or-badge--neutral">Ativo no mock</span><p>Preço atual R$ 489.900 · anterior R$ 499.900 em 21/09/2026. Histórico ilustrativo.</p>`)}
      ${evidence('Preço vs FIPE e mercado','30 dias · Curitiba/PR','R$ 489.900','FIPE R$ 505.000 · mediana qualificada R$ 498.000','11 ofertas · 9 válidas','Média','Atualizado em 22/09/2026 · cobertura PR','A queda de R$ 10.000 é um sinal de evento simulado; não é dado consumido de eventos.php.',['comparador.html','Comparar'])}
      ${card('Ligações de contexto','Da oferta para o concorrente, estoque e ação',row('Perfil do lojista','3 saídas observadas · venda não comprovada','lojista.html')+row('Meu veículo equivalente','Volvo FH 540 2021 · AAA0A00','veiculo.html')+row('Registrar decisão','Revisar preço próprio com evidências','plano-de-acao.html'))}`],
    'inteligencia.html': ['Inteligência','Sinais para investigar', `
      ${note('Insights aqui são curadoria visual sobre mocks. insights.php e analista.php ainda não recebem o recorte da tela.')}
      ${evidence('Diferença entre preço e referência','30 dias · Curitiba/PR · Volvo FH 540 2021','−1,6%','Mediana qualificada R$ 498.000 vs oferta R$ 489.900','11 ofertas · 9 válidas','Média','Atualizado em 22/09/2026 · cobertura PR','Preço abaixo da mediana é indício para análise, não recomendação automática.',['comparador.html','Ver evidências'])}
      ${card('Sinais de eventos','Exemplos locais; sem consumidor direto de eventos.php',row('Preço caiu · EX-001','R$ 499.900 → R$ 489.900 · 21/09','anuncio.html')+row('Saída observada · EX-002','Scania R 450 · venda não comprovada','lojista.html'))}
      ${card('Analista IA','Painel acessível em todas as telas',`<p>Abra o Analista IA no topo. A conversa mostrada é estática e não consulta serviços.</p><button class="or-btn or-btn--primary" type="button" data-analyst>Ver Analista IA</button>`)}`],
    'plano-de-acao.html': ['Plano de ação','Transformar evidência em decisão', `
      ${card('Revisar preço · Volvo FH 540 2021','Ação proposta · proprietário: equipe da loja · prazo fictício: 25/09/2026',`<span class="or-badge or-badge--warning">Pendente</span><p>Preço próprio R$ 515.000; FIPE R$ 505.000; mediana qualificada R$ 498.000; concorrente R$ 489.900. Curitiba/PR · 30 dias · 11 ofertas, 9 válidas · confiança média · atualizado em 22/09.</p><p>Verificar condição, quilometragem e versão FIPE antes de qualquer alteração.</p>${link('veiculo.html','Abrir veículo')}`)}
      ${card('Monitorar redução do concorrente','Ação proposta a partir de evento fictício',`<p>EX-001 caiu R$ 10.000 em 21/09. A visão atual de Oportunidades ainda usa placeholder para quedas de preço.</p>${link('anuncio.html','Ver anúncio')}`)}
      ${note('Esta página representa um fluxo de decisão. Nenhuma ação é gravada no backend pela simulação.')}`],
    'dados-e-fipe.html': ['Dados e FIPE','Origem, cobertura e qualidade', `
      ${card('Cobertura da amostra','Recorte fictício · caminhões pesados · Curitiba/PR · 30 dias',`<p>11 ofertas do grupo marca + modelo + ano; 9 com preço válido; 1 FIPE ambígua; 1 sem preço. Atualizado em 22/09/2026.</p><span class="or-badge or-badge--warning">Cobertura ilustrativa</span>`)}
      ${evidence('FIPE do Volvo FH 540 · 2021','Referência fictícia de setembro/2026','R$ 505.000','Preço anunciado R$ 489.900 · mediana qualificada R$ 498.000','1 vínculo FIPE ilustrativo · 11 ofertas','Média','Atualizado em 22/09/2026','FIPE é referência separada do mercado anunciado. Vínculo e versão devem ser conferidos.',['anuncio.html','Ver anúncio'])}
      ${card('Qualidade e estados','Contratos de dataState.js',`<p>Estados: loading, ready, empty, error, stale, forbidden e offline. Frescor: fresh, delayed, stale e unknown. Confiança: alta, média, baixa e insuficiente.</p><p>Sem amostra suficiente, o comparativo deve ser ocultado ou identificado como insuficiente.</p>`)}`],
    'configuracoes.html': ['Configurações','Preferências da interface', `
      ${card('Preferências','Representação visual, sem persistência',`<p>Tema escuro · densidade compacta · região preferida PR · período inicial 30 dias.</p><p>Densidade compacta é uma preferência de produto documentada.</p><span class="or-badge or-badge--neutral">Somente demonstração</span>`)}
      ${row('Minha conta','Identidade fictícia e acesso','conta.html')}`],
    'conta.html': ['Minha conta','Identidade de demonstração', `
      ${card('Conta de exemplo','Nenhuma credencial real ou sessão ativa',`<p>Usuário: Pessoa Exemplo · papel: demonstração · e-mail: exemplo@invalid.example.</p><span class="or-badge or-badge--neutral">Mock local</span>`)}
      ${row('Configurações','Voltar às preferências','configuracoes.html')}`]
  };
  const shell = (title, subtitle, body) => `<header class="or-topbar"><div class="or-topbar__title"><span class="or-topbar__crumb">OPER RADAR / SIMULAÇÃO BETA</span><h1 class="or-topbar__h">${title}</h1></div><div class="or-topbar__actions"><button class="or-btn or-btn--secondary" type="button" data-analyst>Analista IA</button></div></header><main class="or-card"><section class="or-card"><span class="or-sectiontag or-sectiontag--accent">PROPOSTA VISUAL BETA</span><h2>${subtitle}</h2><p>Dados inteiramente fictícios · nenhuma conexão com produção.</p><nav class="or-tabs" aria-label="Navegação principal">${nav.map(([label,href])=>`<a class="or-tab ${here===href?'or-tab--active':''}" href="${href}" ${here===href?'aria-current="page"':''}>${label}</a>`).join('')}</nav><p>${link('index.html','Mapa de telas')} ${link('configuracoes.html','Configurações')} ${link('conta.html','Conta')}</p></section>${body}${limits}</main><dialog class="or-dialog" id="analyst"><div class="or-dialog__head"><div><h2 class="or-dialog__t">Analista IA</h2><p class="or-dialog__d">Painel global persistente na proposta visual · resposta estática</p></div><button class="or-iconbtn or-iconbtn--ghost" type="button" data-close aria-label="Fechar">${icon('x')}</button></div><div class="or-alert or-alert--warning"><span class="or-alert__ic">${icon('warning')}</span><span class="or-alert__body"><strong class="or-alert__t">Contexto ainda não conectado</strong><span class="or-alert__d">analista.php e insights.php não recebem o recorte desta tela. Esta resposta não é gerada por IA.</span></span></div><p>Exemplo de pergunta: “O preço do FH 540 2021 em Curitiba está competitivo?”</p><p>Resposta demonstrativa: R$ 489.900 está abaixo da FIPE fictícia de R$ 505.000 e da mediana qualificada ilustrativa de R$ 498.000. Amostra: 11 ofertas, 9 válidas. Confiança média. Verifique versão e condição antes de decidir.</p>${link('comparador.html','Abrir evidências')}</dialog>`;
  if (common[here]) {
    const [title, subtitle, body] = common[here];
    document.getElementById('root').innerHTML = shell(title, subtitle, body);
  }
  document.addEventListener('click', event => {
    if (event.target.closest('[data-analyst]')) document.getElementById('analyst')?.showModal();
    if (event.target.closest('[data-close]')) document.getElementById('analyst')?.close();
  });
})();
