/* DEMO Oper Radar — módulo Detalhe: anuncio.html (?id=A-0001) e veiculo.html (?id=P-001).
   Só classes oficiais (or-*) e tokens (var(--...)). Sem rede. Dados FICTÍCIOS do motor OperDemo. */
(() => {
  const U = window.OperUI, D = window.OperDemo;
  if (!U || !D) return;
  const e = U.esc;
  const MIN_SAMPLE = 5, CUT = 5; // amostra mínima e corte "acima do mercado" (mesmos de Minha Loja)
  const KEY = 'acoes';

  const hero = (tagTxt, h1, sub) => U.stack(
    `<span class="or-sectiontag or-sectiontag--accent" style="align-self:flex-start">${tagTxt}</span>` +
    `<h1 style="margin:0;font-size:var(--fs-h1)">${h1}</h1>` +
    `<p class="or-card__sub" style="margin:0">${sub}</p>`, 'var(--space-2)');
  const note = t => `<p class="or-card__sub" style="margin:0;line-height:1.5">${t}</p>`;
  const pc = v => U.pct(v != null && Math.abs(v) < 0.05 ? 0 : v);
  const cmpHref = (b, m, y) => 'comparador.html?a=' + encodeURIComponent(b + '|' + m + '|' + y);
  const upd = `Cenário fictício de ${D.SCENARIO_DATE}`;
  const row = (label, value) => U.listrow(label, '', undefined, value);
  const days = n => n === 0 ? 'hoje' : n === 1 ? 'há 1 dia' : `há ${n} dias`;
  const notFound = (main, titulo, texto, href, label) => {
    main.innerHTML = U.stack(U.empty(titulo, texto) + `<div style="text-align:center">${U.button(label, { kind: 'primary', href, icon: 'arrow-left' })}</div>`, 'var(--space-4)');
  };
  const idParam = () => String(U.params().id || '').trim();

  /* ============================== ANÚNCIO ============================== */
  U.page('anuncio.html', main => {
    const id = idParam();
    const l = id ? D.active.find(a => a.id === id) : null;
    if (!l) { notFound(main, 'Anúncio não encontrado', 'O código informado não corresponde a um anúncio ativo do radar.', 'mercado.html', 'Ver mercado'); return; }

    const dealer = D.dealers[l.dealerId];
    const name = `${l.brand} ${l.model}`;
    const hasPrice = l.price != null && l.price > 0;
    const inRange = hasPrice && l.price >= 0.5 * l.ref && l.price <= 1.5 * l.ref;
    const valid = D.qualified(l);
    const g = D.groupModels({}).find(x => x.brand === l.brand && x.model === l.model && x.year === l.year);
    const okGroup = !!g && g.qualified >= MIN_SAMPLE;
    const recorte = `${name} · ${l.year} · ${l.city}/${l.uf}`;

    // Qualificação do preço (por que entra ou não na mediana qualificada)
    const qual = !hasPrice ? U.badge('neutral', 'Sem preço informado')
      : !inRange ? U.badge('warning', 'Preço fora da faixa esperada')
        : l.fipeLink === 'ambigua' ? U.badge('warning', 'Vínculo FIPE ambíguo')
          : U.badge('success', 'Preço válido');
    const fipeBadge = l.fipeLink === 'ok' ? U.badge('info', 'FIPE vinculada') : l.fipeLink === 'ambigua' ? U.badge('warning', 'FIPE ambígua') : U.badge('neutral', 'Sem FIPE');
    const qualTxt = !hasPrice ? 'Preço “sob consulta”: não entra em médias nem medianas.'
      : !inRange ? 'Preço abaixo de 50% ou acima de 150% da referência do modelo e ano. Fica fora da mediana qualificada e sem comparação — confira se é erro de digitação ou valor especial.'
        : l.fipeLink === 'ambigua' ? 'Mais de um candidato de FIPE: por segurança o anúncio não entra na mediana qualificada até a curadoria.'
          : 'Preço dentro da faixa esperada: entra na mediana qualificada do grupo.';

    const fipeDev = valid && l.fipe ? (l.price - l.fipe) / l.fipe * 100 : null;
    const medDev = valid && okGroup ? (l.price - g.median) / g.median * 100 : null;
    const fipeSub = l.fipeLink === 'ambigua' ? 'Vínculo ambíguo: sem FIPE'
      : l.fipe ? `FIPE ${U.brl(l.fipe)}` : l.segment === 'Implementos' ? 'Sem FIPE (implemento)' : 'Sem FIPE vinculada';

    const entered48 = l.enteredHoursAgo < 48;
    const idade = l.ageDays === 0 ? 'Entrou hoje' : `${l.ageDays} dia${l.ageDays === 1 ? '' : 's'}`;

    const kpis = U.grid(220, [
      U.kpi({ icon: 'currency-circle-dollar', label: 'Preço anunciado', value: hasPrice ? U.brl(l.price) : 'Sem preço informado', sub: hasPrice ? `${e(dealer.name)}` : 'Sob consulta',
        ev: { recorte, periodo: 'Estoque ativo hoje', valor: hasPrice ? U.brl(l.price) : 'Sem preço', base: `Referência do modelo/ano ${U.brl(l.ref)}`, amostra: '1 anúncio', confianca: valid ? 'Alta' : 'Insuficiente', atualizacao: upd, explicacao: qualTxt } }),
      U.kpi({ icon: 'seal-percent', label: 'vs FIPE', value: fipeDev != null ? pc(fipeDev) : '—', sub: fipeSub,
        ev: { recorte, periodo: 'Estoque ativo hoje', valor: fipeDev != null ? pc(fipeDev) : 'Sem comparação', base: l.fipe ? `FIPE ${U.brl(l.fipe)}` : 'Sem FIPE vinculada', amostra: '1 anúncio', confianca: fipeDev != null ? 'Média' : 'Insuficiente', atualizacao: upd, explicacao: 'Diferença entre o preço anunciado e a tabela FIPE do mesmo modelo e ano. A comparação só é feita com preço válido e FIPE vinculada sem ambiguidade.' } }),
      U.kpi({ icon: 'scales', label: 'vs mediana do grupo', value: medDev != null ? pc(medDev) : (okGroup ? '—' : 'Amostra insuficiente'), accent: medDev != null,
        sub: okGroup ? `Mediana ${U.brl(g.median)} · ${g.qualified} preços válidos` : `Grupo com ${g ? g.qualified : 0} preço(s) válido(s); mínimo ${MIN_SAMPLE}`,
        ev: { recorte: `${name} · ${l.year} · todas as UFs`, periodo: 'Estoque ativo hoje', valor: medDev != null ? pc(medDev) : 'Sem comparação', base: okGroup ? `Mediana qualificada ${U.brl(g.median)}` : 'Sem base: amostra insuficiente', amostra: g ? `${g.qualified} preços válidos · ${g.count} ofertas · ${g.dealers} revendas` : 'Sem grupo', confianca: g ? g.confidence : 'Insuficiente', atualizacao: upd, explicacao: 'Mediana qualificada do mesmo modelo e ano (marca + modelo + ano-modelo), nunca média bruta. Não há comparação sem 5 preços válidos ou com preço inválido.', href: cmpHref(l.brand, l.model, l.year), action: 'Abrir comparador' } }),
      U.kpi({ icon: 'hourglass-medium', label: 'Tempo no ar', value: idade, sub: entered48 ? `Entrou há ${l.enteredHoursAgo} h` : 'Dias desde a 1ª observação',
        ev: { recorte, periodo: 'Estoque ativo hoje', valor: idade, base: g ? `Idade média do grupo: ${Math.round(g.avgAge)} dias` : 'Sem grupo', amostra: g ? `${g.count} anúncios do grupo` : '1 anúncio', confianca: g ? g.confidence : 'Insuficiente', atualizacao: upd, explicacao: 'Idade = dias desde a primeira observação do anúncio. Tempo longo é um sinal, não prova de que o preço esteja alto.' } })
    ].join(''));

    // Posição na distribuição do grupo
    let posBody;
    if (!hasPrice || !valid) posBody = U.alert('info', 'Sem posição na distribuição', 'O preço deste anúncio não é válido para comparação.');
    else if (!okGroup) posBody = U.alert('info', 'Amostra insuficiente', `O grupo tem ${g ? g.qualified : 0} preço(s) válido(s); o mínimo é ${MIN_SAMPLE}. Sem posição nem comparação.`);
    else {
      const prices = g.list.filter(D.qualified).map(x => x.price);
      const rank = prices.filter(p => p < l.price).length + 1;
      const span = g.max - g.min;
      posBody = U.stack((span > 0 ? U.progress('Posição entre o menor e o maior preço do grupo', U.brl(l.price), l.price - g.min, span) : '') +
        U.grid(130, [['Mínimo', g.min], ['Mediana', g.median], ['Máximo', g.max]].map(([t, v]) => `<div style="min-width:0"><span class="or-card__sub" style="display:block">${t}</span><strong>${U.brl(v)}</strong></div>`).join('')) +
        note(`${rank}º mais barato entre ${prices.length} ofertas com preço válido de ${e(name)} ${l.year} (todas as UFs).`), 'var(--space-3)');
    }
    const posSec = U.section('Posição no mercado', 'Onde este preço fica entre as ofertas do mesmo modelo e ano', posBody);

    // Redução de preço
    let cutHtml = '';
    if (l.cut) {
      const d = (l.cut.to - l.cut.from) / l.cut.from * 100;
      cutHtml = U.alert('info', 'Preço reduzido', `De ${U.brl(l.cut.from)} para ${U.brl(l.cut.to)} (${pc(d)}), ${days(l.cut.daysAgo)}. Redução de preço é sinal, não prova de venda nem de urgência do vendedor.`);
    }

    // Dados do anúncio
    const km = l.km != null ? `${U.int(l.km)} km` : l.segment === 'Implementos' ? 'Não se aplica' : 'Não informado';
    const dadosSec = U.section('Dados do anúncio', `Código ${e(l.id)} · ${e(l.segment)}`, U.stack(
      row('Revenda', `<a href="lojista.html?id=${e(dealer.id)}" style="color:var(--text-link)">${e(dealer.name)}</a>`) +
      row('Local', `${e(l.city)}/${e(l.uf)}`) +
      row('Quilometragem', km) +
      row('Ano-modelo', String(l.year)) +
      row('Entrada no radar', entered48 ? `Há ${l.enteredHoursAgo} h` : idade), 'var(--space-2)'));

    const qualSec = U.section('Qualificação do preço', 'Por que este anúncio entra (ou não) nos cálculos',
      U.stack(U.row(qual + fipeBadge) + note(qualTxt), 'var(--space-3)'));

    const actions = U.row(
      U.button('Comparar', { kind: 'primary', href: cmpHref(l.brand, l.model, l.year), icon: 'scales' }) +
      U.button('Ver revenda', { kind: 'secondary', href: 'lojista.html?id=' + dealer.id, icon: 'storefront' }) +
      U.button('Ver mercado do modelo', { kind: 'secondary', href: `mercado.html?uf=${encodeURIComponent(l.uf)}&marca=${encodeURIComponent(l.brand)}`, icon: 'chart-bar' }));

    main.innerHTML = U.stack(
      hero('ANÚNCIO', `${e(name)} · ${l.year}`, `${e(dealer.name)} · ${e(l.city)}/${e(l.uf)} · dados fictícios de demonstração`) +
      U.row(qual + fipeBadge) + actions + kpis + cutHtml +
      U.grid(340, posSec + U.stack(qualSec + dadosSec)), 'var(--space-5)');
  });

  /* ============================== VEÍCULO ============================== */
  const CONF_TONE = { 'Alta': 'success', 'Média': 'info', 'Baixa': 'warning', 'Insuficiente': 'neutral' };
  const STATUS_BADGE = { acima: ['warning', 'Acima do mercado'], comp: ['success', 'Competitivo'], insuf: ['neutral', 'Amostra insuficiente'] };
  const onde = o => o.scopeLabel === 'Brasil' ? 'no Brasil' : o.scopeLabel === 'Paraná' ? 'no Paraná' : 'em ' + o.scopeLabel;
  const safeList = () => { if (window.OperActions) return window.OperActions.load(); const v = U.store.get(KEY, null); return Array.isArray(v) ? v : []; };

  U.page('veiculo.html', main => {
    const id = idParam();
    const o = id ? D.ownAnalysis().find(x => x.id === id) : null;
    if (!o) { notFound(main, 'Veículo não encontrado', 'O código informado não corresponde a um veículo da sua loja.', 'minha-loja.html', 'Ver Minha Loja'); return; }

    const nome = `${o.brand} ${o.model} ${o.year}`;
    const st = o.median == null ? 'insuf' : (o.vsMedian >= CUT ? 'acima' : 'comp');
    const evid = o.median == null
      ? `Amostra insuficiente (${o.sample} preços válidos; mínimo ${MIN_SAMPLE}): sem comparação com o mercado.${o.vsFipe != null ? ` Anunciado ${U.brl(o.price)}, ${pc(o.vsFipe)} vs FIPE.` : ` Anunciado ${U.brl(o.price)}.`}`
      : `Anunciado ${U.brl(o.price)}; ${pc(o.vsMedian)} vs mediana qualificada de ${U.brl(o.median)} (mercado ${onde(o)} · ${o.sample} preços válidos · confiança ${o.confidence.toLowerCase()}).`;
    const cmp = cmpHref(o.brand, o.model, o.year);
    const recorte = `${nome} · mercado ${onde(o)}`;
    const base = o.median == null ? 'Sem base: amostra insuficiente' : `Mediana qualificada ${U.brl(o.median)}${o.vsFipe != null ? ` · FIPE ${U.brl(o.ref)}` : ''}`;
    const ev = (valor, explicacao) => ({ recorte, periodo: 'Estoque ativo hoje', valor, base, amostra: `${o.sample} preços válidos · ${o.offers} ofertas`, confianca: o.confidence, atualizacao: upd, explicacao, href: cmp, action: 'Abrir comparador' });

    const kpis = U.grid(220, [
      U.kpi({ icon: 'currency-circle-dollar', label: 'Seu preço', value: U.brl(o.price), sub: o.km != null ? `${U.int(o.km)} km` : 'Implemento (sem km)',
        ev: ev(U.brl(o.price), 'Preço do seu anúncio ativo na loja.') }),
      U.kpi({ icon: 'scales', label: 'Mediana do mercado', value: o.median != null ? U.brl(o.median) : 'Insuficiente', sub: o.median != null ? `Mercado ${onde(o)}` : `Amostra de ${o.sample}; mínimo ${MIN_SAMPLE}`,
        ev: ev(o.median != null ? U.brl(o.median) : 'Insuficiente', 'Mediana dos preços qualificados do mesmo modelo e ano (Paraná, ou Brasil quando o Paraná tem menos de 5 preços válidos). Nunca média bruta.') }),
      U.kpi({ icon: 'trend-up', label: 'vs mediana', value: o.vsMedian != null ? pc(o.vsMedian) : '—', accent: o.vsMedian != null, sub: o.median != null ? `Corte de ${CUT}% para “acima do mercado”` : 'Sem comparação',
        ev: ev(o.vsMedian != null ? pc(o.vsMedian) : 'Sem comparação', `Acima do mercado = preço ${CUT}% ou mais acima da mediana. É um sinal para revisar, não prova de preço errado.`) }),
      U.kpi({ icon: 'seal-percent', label: 'vs FIPE', value: o.vsFipe != null ? pc(o.vsFipe) : '—', sub: o.vsFipe != null ? `FIPE ${U.brl(o.ref)}` : 'Sem FIPE (implemento)',
        ev: ev(o.vsFipe != null ? pc(o.vsFipe) : 'Sem comparação', 'Diferença entre o seu preço e a tabela FIPE do mesmo modelo e ano. Implementos não têm FIPE.') })
    ].join(''));

    const [tone, label] = STATUS_BADGE[st];
    const reco = { acima: `Seu preço está ${pc(o.vsMedian)} da mediana qualificada. Vale revisar o preço ou destacar diferenciais; verifique versão e condição antes de decidir.`,
      comp: 'Seu preço está dentro do que o mercado pratica. Redução de preço e posição são sinais, não garantia de venda.',
      insuf: 'Poucos preços válidos para comparar com segurança. Prefiro não estimar posição de mercado.' }[st];

    const mercadoSec = U.section('Seu preço no mercado', `Base de comparação: ${e(o.scopeLabel)}`, U.stack(
      U.row(U.badge(tone, label) + U.badge(CONF_TONE[o.confidence] || 'neutral', 'Confiança ' + o.confidence.toLowerCase())) +
      note(e(reco)) +
      U.stack(
        row('Mais barato do mercado', o.cheapest != null ? U.brl(o.cheapest) : '—') +
        row('Preços válidos na amostra', `${o.sample} de ${o.offers} ofertas`) +
        row('Comparação', e(o.scopeLabel)), 'var(--space-2)'), 'var(--space-3)'));

    const dadosSec = U.section('Dados do veículo', `Código ${e(o.id)} · ${e(o.segment)}`, U.stack(
      row('Quilometragem', o.km != null ? `${U.int(o.km)} km` : 'Não se aplica') +
      row('Placa (fictícia)', e(o.plate)) +
      row('Preço anunciado', U.brl(o.price)) +
      row('Local', `${e(o.city)}/${e(o.uf)}`), 'var(--space-2)'));

    const evSec = U.section('Evidência', 'Como a leitura foi calculada', note(e(evid)));

    // Ação no plano
    const actionHtml = () => safeList().some(a => a && a.id === 'own-' + o.id)
      ? U.button('Ação no plano', { kind: 'secondary', href: 'plano-de-acao.html', icon: 'check-circle' })
      : U.button('Criar ação', { kind: 'primary', icon: 'plus', data: { create: '1' } });
    const actions = U.row(`<span data-action-slot>${actionHtml()}</span>` +
      U.button('Comparar', { kind: 'secondary', href: cmp, icon: 'scales' }) +
      U.button('Minha Loja', { kind: 'ghost', href: 'minha-loja.html', icon: 'storefront' }));

    main.innerHTML = U.stack(
      hero('MEU VEÍCULO', `${e(o.brand)} ${e(o.model)} · ${o.year}`, `Placa fictícia ${e(o.plate)} · ${e(o.city)}/${e(o.uf)} · dados fictícios de demonstração`) +
      actions + kpis + U.grid(340, mercadoSec + U.stack(dadosSec + evSec)), 'var(--space-5)');

    U.on(main, 'click', '[data-create]', () => {
      const list = safeList();
      if (!list.some(a => a && a.id === 'own-' + o.id)) {
        list.unshift({ id: 'own-' + o.id, titulo: { acima: 'Revisar preço do ', comp: 'Acompanhar preço do ', insuf: 'Acompanhar amostra do ' }[st] + nome, origem: 'Minha Loja', evidencia: evid, href: cmp, done: false });
        U.store.set(KEY, list);
      }
      const slot = main.querySelector('[data-action-slot]');
      if (slot) slot.innerHTML = actionHtml();
    });
  });
})();
