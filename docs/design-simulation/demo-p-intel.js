/* DEMO Oper Radar — módulo PRISMA: inteligencia.html e dados-e-fipe.html.
   Só motor local (window.OperDemo) e componentes oficiais (window.OperUI). Sem rede. */
(() => {
  const U = window.OperUI, D = window.OperDemo;
  if (!U || !D) return;
  const { esc } = U;

  // ---------- Auxiliares ----------
  const head = (tag, titleHtml, sub, trail = '') =>
    `<header style="display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:var(--space-3);min-width:0"><div style="display:flex;flex-direction:column;gap:var(--space-2);min-width:0"><span class="or-sectiontag or-sectiontag--accent" style="align-self:flex-start">${esc(tag)}</span><h1>${titleHtml}</h1><p class="or-card__sub" style="margin:0">${esc(sub)}</p></div>${trail}</header>`;
  const em = t => `<em style="font-style:italic;color:var(--text-accent)">${esc(t)}</em>`;
  const p1 = n => n.toFixed(1).replace('.', ',');
  const confTone = c => ({ 'Alta': 'success', 'Média': 'info', 'Baixa': 'warning', 'Insuficiente': 'neutral' }[c] || 'neutral');
  const confBadge = c => (c && c !== '—') ? U.badge(confTone(c), 'Confiança ' + c.toLowerCase()) : '';
  const small = html => `<p class="or-card__sub" style="margin:0;line-height:1.5">${html}</p>`;

  // =====================================================================
  // INTELIGÊNCIA
  // =====================================================================
  U.page('inteligencia.html', (main) => {
    const PERIODS = ['7d', '30d', '90d'];
    const qp = U.params().periodo;
    let per = PERIODS.includes(qp) ? qp : '30d';

    const SUGGESTED = [
      'Meu FH 540 está competitivo?',
      'Onde há mais oportunidade?',
      'Concorrentes que reduziram?',
      'Há erros nos dados?'
    ];
    let question = '';
    let lastAnswer = null;

    // ----- Insights -----
    const insightCard = i => {
      const ev = i.ev || {};
      const evFull = Object.assign({}, ev, { href: null });
      return `<article class="or-card" style="min-width:0"><div style="display:flex;flex-direction:column;gap:var(--space-3);min-width:0">
        <div style="display:flex;gap:var(--space-3);align-items:flex-start;min-width:0"><span class="or-stat__ic">${U.icon(i.icon)}</span><h3 class="or-card__title" style="min-width:0">${esc(i.title)}</h3></div>
        <p class="or-card__sub" style="margin:0">${esc(i.text)}</p>
        ${U.row(U.badge('accent', ev.valor || '—') + confBadge(ev.confianca))}
        <details><summary style="cursor:pointer;color:var(--text-secondary);font-size:var(--fs-sm)">Ver evidência</summary><div style="margin-top:var(--space-2)">${small(`<strong>Valor:</strong> ${esc(ev.valor)}`)}<div style="margin-top:var(--space-1)">${U.evidenceBlock(evFull)}</div></div></details>
        <div>${U.button(i.action || 'Ver detalhe', { kind: 'secondary', size: 'sm', href: i.href, trail: 'arrow-right' })}</div>
      </div></article>`;
    };
    const renderInsights = () => {
      const list = D.insights({ period: per });
      const box = main.querySelector('#intel-insights');
      box.innerHTML = list.length
        ? U.grid(300, list.map(insightCard).join(''))
        : U.empty('Nenhum insight neste período', 'Não há sinais com amostra suficiente. Tente outro período.');
      const t = main.querySelector('#intel-period-tabs');
      t.innerHTML = U.tabs(PERIODS.map(p => ({ value: p, label: p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias' })), per, 'per');
    };

    // ----- Analista -----
    const renderAnswer = () => {
      const box = main.querySelector('#intel-answer');
      if (!lastAnswer) { box.innerHTML = ''; return; }
      const a = lastAnswer;
      box.innerHTML = `<div class="or-card or-card--sunken" style="min-width:0"><div style="display:flex;flex-direction:column;gap:var(--space-3);min-width:0">
        ${U.row(U.badge('neutral', 'Pergunta') + `<span class="or-card__sub">${esc(a.q)}</span>`)}
        <p style="margin:0;line-height:1.55">${esc(a.text)}</p>
        ${U.row(confBadge(a.conf))}
        ${a.sources && a.sources.length ? `<div><p class="or-card__sub" style="margin:0 0 var(--space-2)"><strong>Fontes</strong></p>${U.row(a.sources.map(s => U.button(s.label, { kind: 'secondary', size: 'sm', href: s.href, trail: 'arrow-right' })).join(''))}</div>` : ''}
      </div></div>`;
    };
    const ask = (q) => {
      const text = String(q || '').trim();
      if (!text) { lastAnswer = { q: '', text: 'Escreva uma pergunta ou escolha uma das sugestões acima.', conf: '—', sources: [] }; renderAnswer(); return; }
      const r = D.answer(text);
      lastAnswer = { q: text, text: r.text, conf: r.conf, sources: r.sources };
      renderAnswer();
    };
    const analystBody = () => U.stack(
      U.row(SUGGESTED.map(q => U.tag(q, { data: { q } })).join('')) +
      `<div style="display:flex;flex-wrap:wrap;align-items:flex-end;gap:var(--space-2);min-width:0"><div style="flex:1 1 240px;min-width:0">${U.input('Sua pergunta', 'pergunta', '', 'Ex.: onde há mais oportunidade por região?', 'chat-circle-dots')}</div>${U.button('Perguntar', { kind: 'primary', size: 'sm', icon: 'paper-plane-tilt', data: { ask: '1' } })}</div>` +
      `<div id="intel-answer" aria-live="polite"></div>` +
      `<p class="or-card__sub" style="margin:0"><strong>IA de demonstração:</strong> respostas calculadas localmente sobre o cenário fictício. Não é um modelo de linguagem e não usa dados reais.</p>`
    );

    // ----- Índice regional (preliminar) -----
    const PARTS = [['movimento', 'Movimento', 30], ['concorrencia', 'Concorrência', 20], ['tempo_saida', 'Tempo de saída', 20], ['preco', 'Preço', 15], ['qualidade', 'Qualidade dos dados', 15]];
    const regionalCard = (r, idx) => {
      const insuf = r.confidence === 'Insuficiente';
      const ev = { recorte: `${r.name} · caminhões e implementos`, periodo: 'Estoque ativo atual', base: 'Escala de 0 a 100; pesos: movimento 30%, concorrência 20%, tempo de saída 20%, preço 15%, qualidade 15%', amostra: `${r.sample} preços válidos (mediana qualificada)`, confianca: r.confidence, atualizacao: D.SCENARIO_DATE, explicacao: 'Índice preliminar de demonstração: combina sinais do estoque ativo e das saídas observadas. Saída observada não é venda.' };
      const body = insuf
        ? small(`Amostra insuficiente (${r.sample} preços válidos; o mínimo é 5). Sem índice para esta região.`)
        : U.stack(U.progress(`<strong>Índice geral</strong>`, `${r.score}/100`, r.score, 100) + PARTS.map(([k, label, w]) => U.progress(`${label} (${w}%)`, String(r.parts[k]), r.parts[k], 100, 'neutral')).join(''), 'var(--space-2)');
      return `<article class="or-card" style="min-width:0"><div style="display:flex;flex-direction:column;gap:var(--space-3);min-width:0">
        <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:var(--space-2)"><h3 class="or-card__title" style="margin:0">${insuf ? '' : (idx + 1) + 'º · '}${esc(r.name)}</h3>${U.badge('warning', 'Preliminar')}</div>
        ${body}
        ${U.row(confBadge(r.confidence) + `<span class="or-card__sub">${r.sample} preços válidos</span>`)}
        <details><summary style="cursor:pointer;color:var(--text-secondary);font-size:var(--fs-sm)">Como este índice é calculado</summary><div style="margin-top:var(--space-2)">${small(`<strong>Valor:</strong> ${insuf ? 'Insuficiente' : r.score + '/100'}`)}<div style="margin-top:var(--space-1)">${U.evidenceBlock(ev)}</div></div></details>
      </div></article>`;
    };
    const regionalBody = () => {
      const rs = D.regionalScore({});
      return U.stack(
        U.alert('warning', 'Índice preliminar', `Ainda em validação: use como ponto de partida, não como decisão final. O período escolhido acima altera os insights e as saídas; o índice regional reflete o estoque ativo atual (${esc(D.SCENARIO_DATE)}).`) +
        (rs.length ? U.grid(300, rs.map(regionalCard).join('')) : U.empty('Sem regiões para exibir', 'Não há estoque ativo suficiente.'))
      );
    };

    // ----- Montagem -----
    main.innerHTML = U.stack(
      head('INTELIGÊNCIA', `Sinais do ${em('mercado.')}`, 'Insights prontos, com evidência, confiança e o próximo passo.', U.badge('neutral', `Cenário fictício · ${D.SCENARIO_DATE}`)) +
      U.section('Insights', 'O período altera os insights e as saídas; o índice regional reflete o estoque ativo atual.', U.stack(`<div id="intel-period-tabs" style="min-width:0"></div><div id="intel-insights"></div>`)) +
      U.section('Pergunte ao Analista', 'Perguntas rápidas sobre preço, regiões, concorrentes e qualidade dos dados.', analystBody()) +
      U.section('Índice de oportunidade regional (preliminar)', 'Onde o mercado mostra mais movimento e menos concorrência, por UF.', regionalBody()),
      'var(--space-5)'
    );
    renderInsights();

    U.on(main, 'click', '[data-per]', el => { per = el.dataset.per; U.setParams({ periodo: per === '30d' ? '' : per }); renderInsights(); });
    U.on(main, 'click', '[data-q]', el => {
      question = el.dataset.q;
      const inp = main.querySelector('[data-field="pergunta"]'); if (inp) inp.value = question;
      ask(question);
    });
    U.on(main, 'click', '[data-ask]', () => { const inp = main.querySelector('[data-field="pergunta"]'); question = inp ? inp.value : ''; ask(question); });
    U.on(main, 'keydown', '[data-field="pergunta"]', (el, ev) => { if (ev.key === 'Enter') { ev.preventDefault(); question = el.value; ask(question); } });
  });

  // =====================================================================
  // DADOS E FIPE (monitor de qualidade)
  // =====================================================================
  U.page('dados-e-fipe.html', (main) => {
    const q = D.quality();
    const SEV = { 'alta': ['danger', 'Alta'], 'média': ['warning', 'Média'], 'baixa': ['info', 'Baixa'], 'info': ['neutral', 'Informativo'] };
    const linkLabel = h => /^mercado/.test(h) ? 'Ver no mercado' : /^concorrencia/.test(h) ? 'Ver concorrência' : 'Abrir';

    const itemCard = it => {
      const [tone, sevLabel] = SEV[it.sev] || SEV.info;
      const ex = (it.examples || []).slice(0, 3);
      const showLink = it.href && it.href !== 'dados-e-fipe.html';
      return `<article class="or-card" style="min-width:0"><div style="display:flex;flex-direction:column;gap:var(--space-3);min-width:0">
        ${U.row(U.badge(tone, 'Severidade ' + sevLabel.toLowerCase()) + `<strong>${U.int(it.count)} ${esc(it.unit)}</strong>`)}
        <h3 class="or-card__title" style="margin:0">${esc(it.title)}</h3>
        <p class="or-card__sub" style="margin:0">${esc(it.detail)}</p>
        ${ex.length ? U.stack(ex.map(e => U.listrow(esc(e))).join(''), 'var(--space-1)') : small('Nenhum caso no momento.')}
        <p class="or-card__sub" style="margin:0"><strong>O que fazer:</strong> ${esc(it.action)}</p>
        ${showLink ? `<div>${U.button(linkLabel(it.href), { kind: 'secondary', size: 'sm', href: it.href, trail: 'arrow-right' })}</div>` : ''}
      </div></article>`;
    };

    // Cobertura FIPE
    const segRow = seg => {
      const rows = D.active.filter(l => l.segment === seg), n = rows.length, k = rows.filter(l => l.fipe).length;
      const pc = n ? k / n * 100 : 0;
      return U.progress(esc(seg), `${p1(pc)}% · ${U.int(k)} de ${U.int(n)}`, pc, 100, pc < 50 ? 'warning' : undefined);
    };
    const covPc = q.fipeCoverage * 100;
    const coverage = U.stack(
      U.progress('<strong>Cobertura geral</strong>', `${p1(covPc)}% · ${U.int(q.fipeCount)} de ${U.int(q.total)}`, covPc, 100, covPc < 50 ? 'warning' : undefined) +
      segRow('Caminhões') + segRow('Implementos') +
      small('Anúncios com referência FIPE vinculada. Carretas e implementos não existem na tabela FIPE: nesses casos a comparação usa só o mercado anunciado.') +
      `<details><summary style="cursor:pointer;color:var(--text-secondary);font-size:var(--fs-sm)">Como este número é calculado</summary><div style="margin-top:var(--space-2)">${U.evidenceBlock({ recorte: 'Todos os anúncios ativos · todas as UFs', periodo: 'Estoque ativo atual', base: `${U.int(q.total)} anúncios ativos`, amostra: `${U.int(q.fipeCount)} com FIPE vinculada`, confianca: 'Alta (contagem direta)', atualizacao: D.SCENARIO_DATE, explicacao: 'Vínculo ambíguo não conta como cobertura: fica sem FIPE até a revisão.' })}</div></details>`
    );

    // Frescor da coleta
    const fresh = h => h < 24 ? ['success', 'Fresca', undefined] : h <= 48 ? ['warning', 'Atrasada', 'warning'] : ['danger', 'Defasada', 'danger'];
    const freshness = U.stack(
      D.UFS.map(uf => {
        const c = D.collection[uf]; if (!c) return '';
        const [tone, label, ptone] = fresh(c.hours);
        return U.progress(`${esc(D.UF_NAMES[uf])} (${esc(uf)})`, `${U.badge(tone, label)} ${U.int(c.hours)} h · ${U.int(c.ok)}% das revendas`, c.ok, 100, ptone);
      }).join('') +
      small('Tempo desde a última coleta completa. Fresca: menos de 24 h · Atrasada: 24 a 48 h · Defasada: mais de 48 h. A barra mostra o % de revendas coletadas na última rodada; a cor mostra a idade da coleta.'),
      'var(--space-3)'
    );

    const limits = U.alert('info', 'O que estes números não dizem',
      'Carretas e implementos não têm FIPE. Saída observada não é venda confirmada e redução de preço é um sinal, não prova. O índice regional é preliminar. Confira sempre versão, quilometragem e estado antes de decidir.');

    main.innerHTML = U.stack(
      head('MONITOR DE QUALIDADE', `Dados e ${em('FIPE.')}`, 'O quanto você pode confiar nos números: o que está fresco, o que falta e o que precisa de revisão.', U.badge('neutral', `Cenário fictício · ${D.SCENARIO_DATE}`)) +
      U.alert('warning', `Resumo do monitor · ${esc(D.SCENARIO_DATE)}`, esc(q.summary)) +
      U.section('Pontos de atenção', 'Ordenados por severidade. Cada um traz exemplos e o que fazer.', U.grid(320, q.items.map(itemCard).join(''))) +
      U.grid(340, U.section('Cobertura FIPE', 'Quanto do estoque tem preço de referência.', coverage) + U.section('Frescor da coleta por UF', 'Se os números da região estão atualizados.', freshness)) +
      limits,
      'var(--space-5)'
    );
  });
})();
