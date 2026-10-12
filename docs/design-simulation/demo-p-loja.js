/* DEMO Oper Radar — módulo loja: Minha Loja e Plano de Ação. Dados FICTÍCIOS (cenário 22/09/2026), sem rede. */
(() => {
  const U = window.OperUI, D = window.OperDemo;
  if (!U || !D) return;
  const { esc } = U;
  const KEY = 'acoes';
  const CUT = 5; // % acima da mediana a partir do qual o veículo é "Acima do mercado" (mesmo corte de D.insights)
  const MIN_SAMPLE = 5;
  const ORIGENS = ['Manual', 'Minha Loja', 'Concorrência', 'Mercado', 'Dados e FIPE', 'Inteligência'];

  const hero = (tagTxt, h1, sub) => U.stack(
    `<span class="or-sectiontag or-sectiontag--accent" style="align-self:flex-start">${tagTxt}</span>` +
    `<h1 style="margin:0;font-size:var(--fs-h1)">${h1}</h1>` +
    `<p class="or-card__sub" style="margin:0">${sub}</p>`, 'var(--space-2)');
  const em = t => `<em style="font-style:italic;color:var(--text-accent)">${t}</em>`;

  // ---------- Ações (store 'acoes') ----------
  const safeHref = h => (typeof h === 'string' && /^[a-z0-9-]+\.html(\?[^\s"'<>]*)?$/i.test(h)) ? h : '';
  const clean = arr => arr.filter(a => a && typeof a === 'object' && a.id != null && typeof a.titulo === 'string' && a.titulo.trim())
    .map(a => ({ id: String(a.id), titulo: a.titulo.trim().slice(0, 120), origem: String(a.origem || 'Manual').slice(0, 40), evidencia: String(a.evidencia || '').slice(0, 400), href: safeHref(a.href), done: !!a.done }));

  const pc = v => U.pct(v != null && Math.abs(v) < 0.05 ? 0 : v);
  const onde = o => o.scopeLabel === 'Brasil' ? 'no Brasil' : o.scopeLabel === 'Paraná' ? 'no Paraná' : 'em ' + o.scopeLabel;
  const cmpHref = o => 'comparador.html?a=' + encodeURIComponent(o.brand + '|' + o.model + '|' + o.year);
  const nome = o => `${o.brand} ${o.model} ${o.year}`;
  const evidOwn = o => o.median == null
    ? `Amostra insuficiente (${o.sample} preços válidos; mínimo ${MIN_SAMPLE}): sem comparação com o mercado.${o.vsFipe != null ? ` Anunciado ${U.brl(o.price)}, ${pc(o.vsFipe)} vs FIPE.` : ` Anunciado ${U.brl(o.price)}.`}`
    : `Anunciado ${U.brl(o.price)}; ${pc(o.vsMedian)} vs mediana qualificada de ${U.brl(o.median)} (mercado ${onde(o)} · ${o.sample} preços válidos · confiança ${o.confidence.toLowerCase()}).`;
  const status = o => o.median == null ? 'insuf' : (o.vsMedian >= CUT ? 'acima' : 'comp');
  const ownAction = o => ({
    id: 'own-' + o.id,
    titulo: { acima: 'Revisar preço do ', comp: 'Acompanhar preço do ', insuf: 'Acompanhar amostra do ' }[status(o)] + nome(o),
    origem: 'Minha Loja', evidencia: evidOwn(o), href: cmpHref(o), done: false
  });

  const seed = () => {
    const out = [];
    const fh = D.ownAnalysis().find(o => o.id === 'P-001');
    if (fh) out.push(Object.assign(ownAction(fh), { titulo: 'Revisar preço do FH 540' }));
    const ds = D.dealerStats().sort((a, b) => b.cuts - a.cuts)[0];
    if (ds && ds.cuts > 0) out.push({ id: 'seed-concorrente', titulo: 'Monitorar concorrente que reduziu preço', origem: 'Concorrência',
      evidencia: `${ds.dealer.name} (${ds.dealer.city}/${ds.dealer.uf}) reduziu preço em ${ds.cuts} de ${ds.count} anúncios nos últimos 30 dias. Redução é sinal, não prova de venda.`, href: 'lojista.html?id=' + ds.dealer.id, done: false });
    const amb = D.quality().items.find(i => i.id === 'amb');
    if (amb) out.push({ id: 'seed-fipe', titulo: 'Corrigir vínculo FIPE ambíguo', origem: 'Dados e FIPE',
      evidencia: `${U.int(amb.count)} anúncios com mais de um candidato de FIPE ficam sem vínculo automático até a curadoria.`, href: 'dados-e-fipe.html', done: false });
    return out;
  };
  const load = () => { const v = U.store.get(KEY, null); return Array.isArray(v) ? clean(v) : seed(); };
  const save = list => U.store.set(KEY, list);
  window.OperActions = { load, save };

  // ---------- Minha Loja ----------
  const CONF_TONE = { 'Alta': 'success', 'Média': 'info', 'Baixa': 'warning', 'Insuficiente': 'neutral' };
  const STATUS_BADGE = { acima: ['warning', 'Acima do mercado'], comp: ['success', 'Competitivo'], insuf: ['neutral', 'Amostra insuficiente'] };
  const ORDER = { acima: 0, comp: 1, insuf: 2 };

  const stat = (label, value, sub) => `<div style="min-width:0"><span class="or-card__sub" style="display:block">${label}</span><strong style="display:block">${value}</strong>${sub ? `<span class="or-card__sub" style="display:block">${sub}</span>` : ''}</div>`;

  const ownEv = o => ({
    recorte: `${nome(o)} · mercado ${onde(o)}`, periodo: `Estoque ativo · cenário ${D.SCENARIO_DATE}`,
    base: o.median == null ? 'Sem base: amostra insuficiente' : `Mediana qualificada ${U.brl(o.median)}${o.ref && o.segment === 'Caminhões' ? ` · FIPE ${U.brl(o.ref)}` : ''}`,
    amostra: `${o.sample} preços válidos · ${o.offers} ofertas`, confianca: o.confidence, atualizacao: D.SCENARIO_DATE,
    explicacao: 'Mediana dos preços qualificados do mesmo modelo e ano (exclui sem preço, fora de 50–150% da referência e FIPE ambígua). ' +
      (o.median == null ? `Abaixo de ${MIN_SAMPLE} preços válidos não há comparação. ` : '') +
      (o.scope === 'Brasil' ? 'Base nacional: o Paraná tem menos de 5 preços válidos para este modelo e ano. ' : '') +
      (o.segment === 'Caminhões' ? '' : 'Implementos não têm FIPE. ') + 'Não é avaliação do estado do veículo.',
    href: cmpHref(o), action: 'Comparar no detalhe'
  });

  const actionBtn = (o, exists) => exists
    ? U.button('Ação no plano', { href: 'plano-de-acao.html', icon: 'check-circle', kind: 'secondary' })
    : U.button('Criar ação', { kind: 'primary', icon: 'plus', data: { criar: o.id } });

  const ownCard = (o, acoes) => {
    const st = status(o), [tone, label] = STATUS_BADGE[st];
    const sub = `${o.km != null ? U.int(o.km) + ' km' : 'Implemento · sem km'} · placa fictícia ${esc(o.plate)}`;
    const stats = o.median == null
      ? U.grid(130, stat('Mediana do mercado', '—', `${o.sample} de ${MIN_SAMPLE} preços mínimos`) + stat('vs mediana', '—') + stat('vs FIPE', o.vsFipe != null ? pc(o.vsFipe) : '—', o.vsFipe != null ? 'Referência de tabela' : 'Sem FIPE (implemento)') + stat('Mais barato', '—'), 'var(--space-3)')
      : U.grid(130, stat('Mediana do mercado', U.brl(o.median), `Mercado ${onde(o)}`) + stat('vs mediana', pc(o.vsMedian)) + stat('vs FIPE', o.vsFipe != null ? pc(o.vsFipe) : '—', o.vsFipe != null ? 'Referência de tabela' : 'Sem FIPE (implemento)') + stat('Mais barato', o.cheapest != null ? U.brl(o.cheapest) : '—', o.cheapest != null ? `Mercado ${onde(o)}` : ''), 'var(--space-3)');
    const note = o.median == null
      ? `<p class="or-card__sub" style="margin:0">Amostra insuficiente: não comparo com o mercado para não induzir uma conclusão errada.</p>`
      : (o.scope === 'Brasil' ? `<p class="or-card__sub" style="margin:0">Base nacional: o Paraná tem menos de ${MIN_SAMPLE} preços válidos deste modelo e ano.</p>` : '');
    return `<article class="or-card" style="min-width:0" data-own="${esc(o.id)}">` +
      `<div class="or-card__head"><div><h2 class="or-card__title">${esc(o.brand)} ${esc(o.model)} · ${o.year}</h2><p class="or-card__sub">${sub}</p></div><div class="or-card__actions">${U.badge(tone, label)}</div></div>` +
      `<div>${stat('Seu preço', `<span style="font-size:var(--fs-h3)">${U.brl(o.price)}</span>`)}</div>` +
      stats + note +
      U.row(`<span class="or-card__sub">Amostra: ${o.sample} preços válidos · ${o.offers} ofertas</span>${U.badge(CONF_TONE[o.confidence] || 'neutral', 'Confiança ' + o.confidence.toLowerCase())}`) +
      `<div data-actions>${U.row(actionBtn(o, acoes.some(a => a.id === 'own-' + o.id)) + U.button('Detalhes', { href: 'veiculo.html?id=' + encodeURIComponent(o.id), icon: 'eye', kind: 'secondary' }) + U.button('Comparar', { href: cmpHref(o), icon: 'scales' }))}</div>` +
      `<details><summary style="cursor:pointer;color:var(--text-secondary);font-size:var(--fs-sm)">Como este número é calculado</summary><div style="margin-top:var(--space-2)">${U.evidenceBlock(ownEv(o))}</div></details>` +
      `</article>`;
  };

  const summary = list => {
    const n = list.length, acima = list.filter(o => status(o) === 'acima'), comp = list.filter(o => status(o) === 'comp'), insuf = list.filter(o => status(o) === 'insuf');
    const ev = (valor, base, amostra, expl) => ({ recorte: 'Estoque próprio · Curitiba/PR', periodo: `Estoque ativo · cenário ${D.SCENARIO_DATE}`, valor, base, amostra, confianca: 'Varia por veículo (ver cada cartão)', atualizacao: D.SCENARIO_DATE, explicacao: expl });
    const kpis = U.grid(170,
      U.kpi({ icon: 'storefront', label: 'Veículos no estoque', value: U.int(n), sub: 'Estoque fictício de demonstração' }) +
      U.kpi({ icon: 'trend-up', label: 'Acima do mercado', value: U.int(acima.length), sub: `de ${U.int(n - insuf.length)} comparáveis`, accent: true,
        ev: ev(`${acima.length} veículos`, `Mediana qualificada do mesmo modelo e ano (Paraná, ou Brasil quando o Paraná tem menos de ${MIN_SAMPLE} preços válidos)`, `${n - insuf.length} veículos com ${MIN_SAMPLE}+ preços válidos`, `Acima do mercado = preço ${CUT}% ou mais acima da mediana. É um sinal para revisar, não prova de preço errado.`) }) +
      U.kpi({ icon: 'check-circle', label: 'Competitivos', value: U.int(comp.length), sub: `menos de ${CUT}% acima da mediana`,
        ev: ev(`${comp.length} veículos`, 'Mediana qualificada do mesmo modelo e ano', `${n - insuf.length} veículos comparáveis`, `Competitivo = preço a menos de ${CUT}% acima da mediana (inclui abaixo dela). Confiança baixa exige cautela.`) }) +
      U.kpi({ icon: 'question', label: 'Sem amostra suficiente', value: U.int(insuf.length), sub: `menos de ${MIN_SAMPLE} preços válidos`,
        ev: ev(`${insuf.length} veículos`, 'Sem base comparativa', `Menos de ${MIN_SAMPLE} preços válidos`, 'Abaixo do mínimo não há comparação com o mercado. A FIPE segue como referência de tabela quando existe.') }));
    let alerts = '';
    if (acima.length) alerts += U.alert('warning', `${acima.length} ${acima.length > 1 ? 'veículos acima' : 'veículo acima'} do mercado`,
      acima.map(o => `${esc(nome(o))} (${pc(o.vsMedian)})`).join(' · ') + '. Vale revisar o preço ou destacar diferenciais; verifique versão e condição antes de decidir.');
    if (insuf.length) alerts += U.alert('info', `${insuf.length} sem amostra suficiente`, insuf.map(o => esc(nome(o))).join(' · ') + `. Não comparo abaixo de ${MIN_SAMPLE} preços válidos.`);
    return U.stack(kpis + (alerts ? U.stack(alerts, 'var(--space-2)') : ''));
  };

  U.page('minha-loja.html', main => {
    main.innerHTML = U.stack(
      hero('MINHA LOJA', `Seu estoque no ${em('mercado.')}`, 'Como cada veículo seu se posiciona contra a mediana do mercado e a FIPE. Estoque fictício em Curitiba/PR.') +
      '<div data-zone></div>', 'var(--space-6)');
    const zone = main.querySelector('[data-zone]');
    const list = D.ownAnalysis().slice().sort((a, b) => ORDER[status(a)] - ORDER[status(b)]);
    let acoes = load();
    zone.innerHTML = U.stack(summary(list) + U.grid(320, list.map(o => ownCard(o, acoes)).join('')), 'var(--space-6)');

    U.on(main, 'click', '[data-criar]', el => {
      const o = list.find(x => x.id === el.getAttribute('data-criar'));
      if (!o) return;
      acoes = load();
      if (!acoes.some(a => a.id === 'own-' + o.id)) { acoes.unshift(ownAction(o)); save(acoes); }
      const box = el.closest('[data-actions]');
      if (box) { box.innerHTML = U.row(actionBtn(o, true) + U.button('Comparar', { href: cmpHref(o), icon: 'scales' })); const a = box.querySelector('a'); if (a) a.focus(); }
    });
  });

  // ---------- Plano de Ação ----------
  const itemRow = a => {
    const title = `<label class="or-check" style="min-height:44px"><input type="checkbox" data-done="${esc(a.id)}"${a.done ? ' checked' : ''}><span class="or-check__box">${a.done ? U.icon('check') : ''}</span><span style="${a.done ? 'text-decoration:line-through;color:var(--text-tertiary)' : ''}">${esc(a.titulo)}</span></label>`;
    const sub = `<span style="display:flex;flex-direction:column;gap:var(--space-2);min-width:0">` +
      `<span>${U.badge('neutral', 'Origem: ' + a.origem)}</span>` +
      (a.evidencia ? `<span>${esc(a.evidencia)}</span>` : '') +
      `<span style="display:flex;flex-wrap:wrap;gap:var(--space-2)">${a.href ? U.button('Ver evidência', { href: a.href, kind: 'ghost', trail: 'arrow-right' }) : ''}${U.button('Remover', { kind: 'ghost', icon: 'trash', data: { del: a.id } })}</span></span>`;
    return U.listrow(title, sub, '');
  };
  const group = (title, items, emptyTitle, emptyText) =>
    U.stack(`<h3 class="or-card__title" style="margin:0">${title} (${items.length})</h3>` + (items.length ? U.stack(items.map(itemRow).join(''), 'var(--space-2)') : U.empty(emptyTitle, emptyText)), 'var(--space-3)');

  let seq = 0;
  U.page('plano-de-acao.html', main => {
    const form = U.section('Nova ação', 'Registre algo para acompanhar. Fica salvo só neste navegador.',
      U.stack(
        U.grid(220, U.input('Título', 'titulo', '', 'Ex.: Ligar para o cliente do FH 540', 'pencil-simple') + U.select('Origem', 'origem', ORIGENS, 'Manual', 'tag')) +
        U.row(U.button('Adicionar ação', { kind: 'primary', icon: 'plus', data: { add: '1' } }) + '<span data-msg role="status" class="or-card__sub"></span>')));
    main.innerHTML = U.stack(
      hero('PLANO DE AÇÃO', `O que fazer ${em('agora.')}`, 'Ações criadas a partir das evidências do radar. Concluir ou remover não altera os dados do mercado.') +
      '<div data-kpis></div>' + form +
      U.section('Ações', 'Marque como concluída ao terminar.', '<div data-list></div>'), 'var(--space-6)');

    const kEl = main.querySelector('[data-kpis]'), lEl = main.querySelector('[data-list]'), msg = main.querySelector('[data-msg]');
    let acoes = load();
    const paint = () => {
      const pend = acoes.filter(a => !a.done), done = acoes.filter(a => a.done);
      kEl.innerHTML = U.grid(170,
        U.kpi({ icon: 'hourglass-medium', label: 'Pendentes', value: U.int(pend.length), sub: 'Ações ainda por fazer', accent: true }) +
        U.kpi({ icon: 'check-circle', label: 'Concluídas', value: U.int(done.length), sub: 'Ações já resolvidas' }));
      lEl.innerHTML = acoes.length
        ? U.stack(group('Pendentes', pend, 'Tudo em dia', 'Nenhuma ação pendente.') + group('Concluídas', done, 'Nada concluído ainda', 'As ações concluídas aparecem aqui.'), 'var(--space-5)')
        : U.empty('Nenhuma ação ainda', 'Crie uma ação a partir da Minha Loja ou adicione uma acima.');
    };
    paint();

    const add = () => {
      const t = main.querySelector('[name="titulo"]'), o = main.querySelector('[name="origem"]');
      const titulo = (t.value || '').trim().slice(0, 120);
      if (!titulo) { msg.textContent = 'Informe um título para a ação.'; t.focus(); return; }
      acoes.unshift({ id: 'n-' + Date.now().toString(36) + '-' + (++seq), titulo, origem: ORIGENS.includes(o.value) ? o.value : 'Manual', evidencia: 'Ação criada manualmente.', href: '', done: false });
      save(acoes); t.value = ''; msg.textContent = 'Ação adicionada.'; paint(); t.focus();
    };
    U.on(main, 'click', '[data-add]', add);
    main.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target && ev.target.matches && ev.target.matches('[name="titulo"]')) { ev.preventDefault(); add(); } });
    U.on(main, 'change', '[data-done]', el => {
      const a = acoes.find(x => x.id === el.getAttribute('data-done'));
      if (!a) return;
      a.done = el.checked; save(acoes); msg.textContent = ''; paint();
    });
    U.on(main, 'click', '[data-del]', el => {
      const id = el.getAttribute('data-del');
      acoes = acoes.filter(x => x.id !== id); save(acoes); msg.textContent = 'Ação removida.'; paint();
    });
  });
})();
