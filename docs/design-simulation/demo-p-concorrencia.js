/* DEMO Oper Radar — RUMO: Concorrência, Lojista e Comparador. Só OperUI/OperDemo, classes or-* e tokens. Sem rede, dados fictícios (cenário 22/09/2026). */
(() => {
  const U = window.OperUI, D = window.OperDemo;
  if (!U || !D) return;
  const { esc, brl, int, pct, grid, stack, row, section, badge, tag, select, button, listrow, alert, empty, kpi, evidenceBlock } = U;
  const MIN = 5;
  const UPD = 'Cenário fictício de ' + D.SCENARIO_DATE;
  const num1 = n => Math.abs(n).toFixed(1).replace('.', ',');
  const plural = (n, s, p) => int(n) + ' ' + (n === 1 ? s : p);
  const ageText = d => d === 0 ? 'menos de 48 h' : int(d) + ' d';
  const scopeLabel = ufs => ufs.length ? ufs.join(', ') : 'Todas as UFs';
  const confTone = { Alta: 'success', 'Média': 'info', Baixa: 'warning', Insuficiente: 'neutral' };
  const confRank = { Insuficiente: 0, Baixa: 1, 'Média': 2, Alta: 3 };
  const cmpHref = (brand, model, year, uf) => 'comparador.html?a=' + encodeURIComponent(brand + '|' + model + '|' + year) + (uf ? '&uf=' + encodeURIComponent(uf) : '');

  // Desvio vs FIPE = MEDIANA dos desvios dos preços qualificados com FIPE; amostra < 5 => sem valor.
  const medianDev = rows => {
    const v = rows.filter(l => D.qualified(l) && l.fipe).map(l => (l.price - l.fipe) / l.fipe * 100);
    return { value: v.length >= MIN ? D.median(v) : null, n: v.length };
  };
  const devText = d => d.value == null ? '—' : pct(d.value);
  const nullsLast = (fn, dir) => (a, b) => { const x = fn(a), y = fn(b); if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1; return dir * (x - y); };

  /* ============================== CONCORRÊNCIA ============================== */
  U.page('concorrencia.html', main => {
    const ORDEM = { estoque: 'Maior estoque', saidas: 'Mais saídas observadas', reducoes: 'Mais reduções de preço', idade: 'Maior idade média' };
    const byName = (a, b) => a.dealer.name.localeCompare(b.dealer.name, 'pt-BR');
    const CMP = {
      estoque: (a, b) => b.count - a.count || byName(a, b),
      saidas: (a, b) => b.exits - a.exits || b.count - a.count || byName(a, b),
      reducoes: (a, b) => b.cuts - a.cuts || b.count - a.count || byName(a, b),
      idade: (a, b) => b.avgAge - a.avgAge || b.count - a.count || byName(a, b)
    };
    const p = U.params();
    const wanted = (p.uf || '').split(',');
    const state = { ufs: D.UFS.filter(u => wanted.includes(u)), ordem: ORDEM[p.ordem] ? p.ordem : 'estoque' };
    const dealerCount = {};
    D.dealerStats({}).forEach(s => { dealerCount[s.dealer.uf] = (dealerCount[s.dealer.uf] || 0) + 1; });

    main.innerHTML = stack('<div data-slot="filters"></div><div data-slot="results"></div>');
    const slot = n => main.querySelector('[data-slot="' + n + '"]');

    const paintFilters = () => {
      slot('filters').innerHTML = section('Refinar resultados', 'Sem UF marcada, mostra todas. O número em cada UF é a quantidade de revendas.', stack(
        row(tag('Todas as UFs', { selected: !state.ufs.length, data: { uf: '*' } }) +
          D.UFS.map(u => tag(u, { selected: state.ufs.includes(u), count: dealerCount[u] || 0, data: { uf: u } })).join('')) +
        grid(220, select('Ordenar por', 'ordem', Object.entries(ORDEM).map(([value, label]) => ({ value, label })), state.ordem))
      ));
    };

    const paintResults = () => {
      const stats = D.dealerStats({ ufs: state.ufs }).map(s => Object.assign(s, { devm: medianDev(s.rows) })).sort(CMP[state.ordem]);
      if (!stats.length) { slot('results').innerHTML = empty('Nenhuma revenda no recorte', 'Marque outra UF ou volte para "Todas as UFs".'); return; }
      const n = stats.length, total = stats.reduce((a, s) => a + s.count, 0), exits = stats.reduce((a, s) => a + s.exits, 0), cuts = stats.reduce((a, s) => a + s.cuts, 0);
      const conf = D.confidence(total, n), scope = scopeLabel(state.ufs);
      const ev = (base, explicacao) => ({ recorte: scope + ' · caminhões e implementos', periodo: 'Estoque ativo; saídas e reduções em 30 dias', base, amostra: plural(total, 'anúncio ativo', 'anúncios ativos') + ' em ' + plural(n, 'revenda', 'revendas'), confianca: conf, atualizacao: UPD, explicacao });
      const kpis = grid(170,
        kpi({ icon: 'buildings', label: 'Revendas no recorte', value: int(n), sub: scope, ev: ev(plural(D.dealers.length, 'revenda monitorada', 'revendas monitoradas') + ' no cenário', 'Revendas com ao menos um anúncio ativo no recorte.') }) +
        kpi({ icon: 'truck', label: 'Anúncios ativos', value: int(total), sub: 'Estoque somado das revendas', ev: ev(plural(D.active.length, 'anúncio ativo', 'anúncios ativos') + ' no cenário todo', 'Soma dos anúncios ativos das revendas listadas.') }) +
        kpi({ icon: 'check-circle', label: 'Saídas observadas (30 d)', value: int(exits), sub: 'Saída observada não é venda', ev: ev('Estoque ativo de ' + plural(n, 'revenda', 'revendas'), 'Anúncio ausente em 2 verificações consecutivas. Soma das revendas listadas; não comprova venda.') }) +
        kpi({ icon: 'trend-down', label: 'Reduções de preço (30 d)', value: int(cuts), sub: 'Sinal, não prova', ev: ev('Estoque ativo de ' + plural(n, 'revenda', 'revendas'), 'Redução = queda de preço entre duas coletas. É um sinal, não prova de intenção de venda.') })
      );
      const items = stats.map(s => {
        const d = s.dealer;
        const l1 = esc(d.city) + '/' + esc(d.uf) + ' · ' + plural(s.count, 'anúncio', 'anúncios') + ' · idade média ' + int(s.avgAge) + ' d';
        const l2 = plural(s.exits, 'saída observada', 'saídas observadas') + ' · ' + plural(s.cuts, 'redução', 'reduções') + ' (30 d) · desvio FIPE (mediana) ' + devText(s.devm);
        return listrow('<strong>' + esc(d.name) + '</strong>', l1 + '<br>' + l2, 'lojista.html?id=' + d.id);
      }).join('');
      slot('results').innerHTML = stack(
        kpis +
        section('Revendas no recorte', plural(n, 'revenda', 'revendas') + ' · ' + ORDEM[state.ordem].toLowerCase(), stack(items, 'var(--space-2)')) +
        alert('info', 'Como ler', '"—" no desvio FIPE = menos de 5 preços válidos com FIPE. Saída observada não é venda; redução de preço é sinal, não prova. Dados fictícios (' + esc(D.SCENARIO_DATE) + ').')
      );
    };

    const sync = () => U.setParams({ uf: state.ufs, ordem: state.ordem === 'estoque' ? '' : state.ordem });
    paintFilters(); paintResults();

    U.on(main, 'click', '[data-uf]', el => {
      const u = el.dataset.uf;
      if (u === '*') state.ufs = [];
      else state.ufs = D.UFS.filter(x => (x === u) !== state.ufs.includes(x));
      sync(); paintFilters(); paintResults();
    });
    U.on(main, 'change', '[data-field="ordem"]', el => {
      state.ordem = ORDEM[el.value] ? el.value : 'estoque';
      sync(); paintResults();
    });
  });

  /* ================================ LOJISTA ================================= */
  U.page('lojista.html', main => {
    const p = U.params();
    const id = /^\d+$/.test(p.id || '') ? +p.id : null;
    const s = id == null ? null : D.dealerStats({}).find(x => x.dealer.id === id);
    if (!s) {
      main.innerHTML = stack(empty('Lojista não encontrado', 'O endereço não indica um lojista com anúncios ativos no cenário. Escolha um na lista de concorrentes.') +
        row(button('Ver concorrência', { kind: 'primary', href: 'concorrencia.html', icon: 'buildings' })));
      return;
    }
    const d = s.dealer, rows = s.rows, valid = rows.filter(D.qualified).length, devm = medianDev(rows);
    const cutShare = rows.length ? s.cuts / rows.length * 100 : 0;
    const rec = d.name + ' · ' + d.city + '/' + d.uf;
    const ev = (periodo, base, amostra, conf, explicacao) => ({ recorte: rec, periodo, base, amostra, confianca: conf, atualizacao: UPD, explicacao });
    const cConf = D.confidence(rows.length, 1);
    const dev = l => (D.qualified(l) && l.fipe) ? (l.price - l.fipe) / l.fipe * 100 : null;
    const devLabel = l => { const v = dev(l); if (v != null) return pct(v); if (!l.price) return 'sem preço'; if (l.fipeLink === 'ambigua') return 'FIPE ambígua'; if (!D.qualified(l)) return 'preço fora da faixa (fora da mediana)'; return 'sem FIPE'; };

    const SORTS = {
      idade: (a, b) => b.ageDays - a.ageDays,
      preco_asc: nullsLast(l => l.price, 1),
      preco_desc: nullsLast(l => l.price, -1),
      desvio: nullsLast(dev, -1),
      modelo: (a, b) => (a.brand + ' ' + a.model).localeCompare(b.brand + ' ' + b.model, 'pt-BR') || b.year - a.year
    };
    const SORT_LABEL = { idade: 'Mais antigos primeiro', preco_asc: 'Menor preço', preco_desc: 'Maior preço', desvio: 'Maior desvio vs FIPE', modelo: 'Modelo (A–Z)' };
    const state = { ordem: SORTS[p.ordem] ? p.ordem : 'idade', all: false };
    const LIMIT = 20;

    const kpis = grid(170,
      kpi({ icon: 'truck', label: 'Anúncios ativos', value: int(rows.length), sub: plural(valid, 'preço válido', 'preços válidos'), ev: ev('Estoque ativo', plural(D.dealers.length, 'revenda monitorada', 'revendas monitoradas') + ' no cenário', plural(rows.length, 'anúncio', 'anúncios'), cConf, 'Anúncios ativos do lojista na última coleta do cenário. "Válido" = preço dentro da faixa esperada e sem FIPE ambígua.') }) +
      kpi({ icon: 'check-circle', label: 'Saídas observadas (30 d)', value: int(s.exits), sub: 'Saída observada não é venda', ev: ev('Últimos 30 dias', plural(rows.length, 'anúncio ativo', 'anúncios ativos') + ' hoje', plural(s.exits, 'saída', 'saídas'), cConf, 'Anúncio ausente em 2 verificações consecutivas. Não comprova venda.') }) +
      kpi({ icon: 'trend-down', label: 'Reduções de preço (30 d)', value: int(s.cuts), sub: int(cutShare) + '% do estoque · sinal, não prova', ev: ev('Últimos 30 dias', plural(rows.length, 'anúncio ativo', 'anúncios ativos') + ' hoje', plural(s.cuts, 'redução', 'reduções'), cConf, 'Redução = queda de preço entre duas coletas. É um sinal, não prova de intenção de venda.') }) +
      kpi({ icon: 'hourglass-medium', label: 'Idade média do estoque', value: int(s.avgAge) + ' d', sub: 'Desde a 1ª observação', ev: ev('Estoque ativo', 'Média do cenário todo: ' + int(D.active.reduce((a, l) => a + l.ageDays, 0) / D.active.length) + ' d', plural(rows.length, 'anúncio', 'anúncios'), cConf, 'Média simples dos dias desde a primeira vez que cada anúncio foi visto.') }) +
      kpi({ icon: 'seal-percent', label: 'Desvio vs FIPE (mediana)', value: devText(devm), sub: devm.value == null ? 'Amostra insuficiente (' + devm.n + ' de ' + MIN + ' preços válidos com FIPE)' : plural(devm.n, 'preço válido', 'preços válidos') + ' com FIPE', ev: ev('Estoque ativo', 'FIPE do modelo e ano de cada anúncio', plural(devm.n, 'preço válido com FIPE', 'preços válidos com FIPE'), D.confidence(devm.n, 1), 'Mediana dos desvios entre o preço anunciado e a FIPE; só preços qualificados. Com menos de 5, não é exibida. Implementos não têm FIPE.') })
    );

    const alertHtml = (s.cuts >= 3 || cutShare >= 20)
      ? alert('warning', 'Muitas reduções de preço recentes', plural(s.cuts, 'anúncio', 'anúncios') + ' de ' + int(rows.length) + ' (' + int(cutShare) + '%) tiveram redução nos últimos 30 dias. Pode indicar pressão sobre preços na região — é um sinal, não prova de venda nem de urgência.')
      : '';

    main.innerHTML = stack(
      section(esc(d.name), esc(d.city) + '/' + esc(d.uf) + ' · perfil fictício · ' + esc(D.SCENARIO_DATE), kpis, button('Ver concorrência', { href: 'concorrencia.html', icon: 'buildings', size: 'sm' })) +
      alertHtml +
      section('Estoque do lojista', plural(rows.length, 'anúncio ativo', 'anúncios ativos'), stack(
        grid(220, select('Ordenar por', 'ordem', Object.entries(SORT_LABEL).map(([value, label]) => ({ value, label })), state.ordem)) +
        '<div data-slot="list"></div>'
      ))
    );
    const list = main.querySelector('[data-slot="list"]');

    const paintList = () => {
      const sorted = rows.slice().sort(SORTS[state.ordem]);
      const shown = state.all ? sorted : sorted.slice(0, LIMIT);
      const items = shown.map(l => {
        const cut = l.cut ? ' (antes ' + brl(l.cut.from) + ', ' + (l.cut.daysAgo === 0 ? 'hoje' : 'há ' + l.cut.daysAgo + ' d') + ')' : '';
        const title = '<strong>' + esc(l.brand + ' ' + l.model) + ' · ' + l.year + '</strong>' + (l.cut ? ' ' + badge('warning', 'Preço caiu') : '');
        const l1 = (l.price ? brl(l.price) : 'Sob consulta') + esc(cut);
        const l2 = 'idade ' + ageText(l.ageDays) + (l.km ? ' · ' + int(l.km) + ' km' : '') + ' · ' + (dev(l) != null ? 'desvio FIPE ' : 'FIPE: ') + devLabel(l);
        return listrow(title, l1 + '<br>' + l2, null, button('Detalhes', { size: 'sm', kind: 'secondary', href: 'anuncio.html?id=' + encodeURIComponent(l.id) }) + ' ' + button('Comparar', { size: 'sm', href: cmpHref(l.brand, l.model, l.year, d.uf) }));
      }).join('');
      list.innerHTML = stack(stack(items, 'var(--space-2)') +
        (sorted.length > LIMIT ? row(button(state.all ? 'Mostrar menos' : 'Mostrar todos (' + sorted.length + ')', { data: { more: '1' } })) : '') +
        '<p class="or-card__sub" style="margin:0">Desvio FIPE por anúncio só quando o preço é válido e há FIPE vinculada. "Comparar" abre o mesmo modelo e ano na UF do lojista.</p>');
    };
    paintList();

    U.on(main, 'change', '[data-field="ordem"]', el => {
      state.ordem = SORTS[el.value] ? el.value : 'idade';
      U.setParams({ id: d.id, ordem: state.ordem === 'idade' ? '' : state.ordem });
      paintList();
    });
    U.on(main, 'click', '[data-more]', () => { state.all = !state.all; paintList(); });
  });

  /* =============================== COMPARADOR =============================== */
  U.page('comparador.html', main => {
    const brands = [...new Set(D.MODELS.map(m => m[0]))];
    const modelsOf = b => D.MODELS.filter(m => m[0] === b).map(m => m[1]);
    const yearCount = new Map();
    D.active.forEach(l => {
      const k = l.brand + '|' + l.model;
      if (!yearCount.has(k)) yearCount.set(k, new Map());
      const m = yearCount.get(k); m.set(l.year, (m.get(l.year) || 0) + 1);
    });
    const yearsOf = (b, m) => [...(yearCount.get(b + '|' + m) || new Map()).keys()].sort((x, y) => y - x);
    const bestYear = (b, m, prefer) => {
      const ys = yearsOf(b, m), c = yearCount.get(b + '|' + m) || new Map();
      if (prefer != null && ys.includes(+prefer)) return +prefer;
      return ys.slice().sort((x, y) => (c.get(y) - c.get(x)) || (y - x))[0];
    };
    const key = s => s.brand + '|' + s.model + '|' + s.year;
    const norm = t => String(t == null ? '' : t).trim().toLowerCase();
    const parseSide = (txt, def) => {
      if (!txt) return { side: def, ok: true };
      const [b, m, y] = String(txt).split('|');
      const brand = brands.find(x => norm(x) === norm(b));
      const model = brand && modelsOf(brand).find(x => norm(x) === norm(m));
      if (!brand || !model) return { side: def, ok: false };
      const year = bestYear(brand, model, y);
      return { side: { brand, model, year }, ok: y == null || y === '' || year === +y };
    };
    const DEF_A = { brand: 'Volvo', model: 'FH 540', year: 2021 }, DEF_B = { brand: 'Scania', model: 'R 450', year: 2021 };
    const p = U.params();
    const pa = parseSide(p.a, DEF_A), pb = parseSide(p.b, DEF_B);
    const wantedUf = (p.uf || '').split(',').filter(u => D.UFS.includes(u));
    const state = { a: Object.assign({}, pa.side), b: Object.assign({}, pb.side), uf: wantedUf.join(',') };
    const badLink = !pa.ok || !pb.ok || (p.uf && p.uf.split(',').some(u => !D.UFS.includes(u)));

    main.innerHTML = '<div data-slot="body"></div>';
    const body = main.querySelector('[data-slot="body"]');

    const ok = g => !!g && g.qualified >= MIN;
    const sideName = s => s.brand + ' ' + s.model + ' · ' + s.year;
    const vals = g => ({
      ofertas: g ? int(g.count) : '0',
      validos: g ? int(g.qualified) : '0',
      mediana: ok(g) ? brl(g.median) : 'Insuficiente',
      min: ok(g) ? brl(g.min) : '—',
      max: ok(g) ? brl(g.max) : '—',
      fipe: g && g.fipe ? brl(g.fipe) : 'Sem FIPE',
      dev: ok(g) && g.dev != null ? pct(g.dev) : '—',
      idade: g ? int(g.avgAge) + ' d' : '—',
      conf: badge(confTone[g ? g.confidence : 'Insuficiente'], g ? g.confidence : 'Insuficiente')
    });

    const panel = (k, label) => {
      const s = state[k];
      return section('Lado ' + label, '', grid(140,
        select('Marca', k + '-brand', brands, s.brand) +
        select('Modelo', k + '-model', modelsOf(s.brand), s.model) +
        select('Ano', k + '-year', yearsOf(s.brand, s.model), s.year)));
    };

    const paint = focusName => {
      const ufs = state.uf ? state.uf.split(',') : [];
      const groups = D.groupModels({ ufs });
      const find = s => groups.find(g => g.brand === s.brand && g.model === s.model && g.year === s.year) || null;
      const gA = find(state.a), gB = find(state.b), vA = vals(gA), vB = vals(gB);
      const same = key(state.a) === key(state.b);
      const ufOpts = [{ value: '', label: 'Todas as UFs' }].concat(D.UFS.map(u => ({ value: u, label: u + ' · ' + D.UF_NAMES[u] })));
      if (state.uf && !D.UFS.includes(state.uf)) ufOpts.push({ value: state.uf, label: ufs.join(' + ') });
      const ufLabel = scopeLabel(ufs);

      const notes = badLink ? alert('warning', 'Recorte do link ajustado', 'Parte do recorte do endereço não existe no cenário; usei o padrão para esse item. Escolha abaixo o que deseja comparar.') : '';
      const filters = grid(300, panel('a', 'A') + panel('b', 'B')) +
        section('Recorte de UF (opcional)', 'Vale para os dois lados.', grid(220, select('UF', 'uf', ufOpts, state.uf)));

      // Aviso / veredito
      let verdict;
      const lacks = [];
      if (!ok(gA)) lacks.push('Lado A: ' + plural(gA ? gA.qualified : 0, 'preço válido', 'preços válidos') + ' em ' + plural(gA ? gA.count : 0, 'oferta', 'ofertas'));
      if (!ok(gB)) lacks.push('Lado B: ' + plural(gB ? gB.qualified : 0, 'preço válido', 'preços válidos') + ' em ' + plural(gB ? gB.count : 0, 'oferta', 'ofertas'));
      if (same) verdict = alert('info', 'Os dois lados são o mesmo grupo', 'Marca, modelo e ano iguais. Escolha outro veículo em um dos lados para comparar.');
      else if (lacks.length) verdict = alert('warning', 'Amostra insuficiente para comparar', esc(lacks.join(' · ')) + '. O mínimo é ' + MIN + ' preços válidos por lado. Sem veredito, para não induzir uma conclusão errada. Tente "Todas as UFs" ou outro ano.');
      else {
        const diff = (gA.median - gB.median) / gB.median * 100;
        const head = Math.abs(diff) < 0.05 ? 'A e B têm a mesma mediana qualificada' : 'A está ' + num1(diff) + '% ' + (diff > 0 ? 'acima' : 'abaixo') + ' de B na mediana qualificada';
        const fipeTxt = (gA.dev != null && gB.dev != null) ? ' Contra a FIPE, A está ' + pct(gA.dev) + ' e B ' + pct(gB.dev) + '.' : '';
        const diffGroup = (state.a.brand !== state.b.brand || state.a.model !== state.b.model || state.a.year !== state.b.year) ? ' Os grupos são diferentes (marca, modelo e/ou ano): a diferença reflete também categoria, versão e idade — não é uma oferta equivalente.' : '';
        const low = confRank[gA.confidence] <= confRank[gB.confidence] ? gA.confidence : gB.confidence;
        verdict = alert('success', esc(head), esc('(' + brl(gA.median) + ' vs ' + brl(gB.median) + ').' + fipeTxt + diffGroup + ' Preços anunciados, não preços de venda. Confiança do veredito: ' + low.toLowerCase() + '.'));
      }

      const metric = (label, a, b) => stack('<span class="or-card__sub" style="margin:0">' + label + '</span>' + grid(120, '<strong>' + a + '</strong><strong>' + b + '</strong>', 'var(--space-2)'), 'var(--space-1)');
      const colHead = (tagLabel, s) => '<div style="min-width:0">' + badge('accent', tagLabel) + '<br><strong>' + esc(sideName(s)) + '</strong></div>';
      const evDet = (lbl, s, g) => '<div style="margin-top:var(--space-2)"><strong>' + lbl + ' · ' + esc(sideName(s)) + '</strong>' + evidenceBlock({
        recorte: sideName(s) + ' · ' + ufLabel, periodo: 'Estoque ativo em ' + D.SCENARIO_DATE, base: 'Mediana qualificada: preços entre 50% e 150% da referência, sem FIPE ambígua' + (g && g.fipe ? ' · FIPE ' + brl(g.fipe) : ' · sem FIPE'),
        amostra: g ? plural(g.qualified, 'preço válido', 'preços válidos') + ' de ' + plural(g.count, 'oferta', 'ofertas') + ' · ' + plural(g.dealers, 'revenda', 'revendas') : 'Nenhuma oferta no recorte', confianca: g ? g.confidence : 'Insuficiente',
        atualizacao: UPD, explicacao: 'Mediana, não média bruta. Com menos de ' + MIN + ' preços válidos os valores de preço não são exibidos.' }) + '</div>';

      const result = section('Resultado', 'Recorte: ' + esc(ufLabel) + ' · estoque ativo · mediana qualificada', stack(
        verdict +
        '<div class="or-card or-card--sunken" style="min-width:0">' + stack(
          grid(120, colHead('A', state.a) + colHead('B', state.b), 'var(--space-2)') +
          metric('Ofertas', vA.ofertas, vB.ofertas) +
          metric('Preços válidos', vA.validos, vB.validos) +
          metric('Mediana qualificada', vA.mediana, vB.mediana) +
          metric('Mínimo', vA.min, vB.min) +
          metric('Máximo', vA.max, vB.max) +
          metric('FIPE', vA.fipe, vB.fipe) +
          metric('Desvio da mediana vs FIPE', vA.dev, vB.dev) +
          metric('Idade média dos anúncios', vA.idade, vB.idade) +
          metric('Confiança', vA.conf, vB.conf)) + '</div>' +
        '<p class="or-card__sub" style="margin:0">"Insuficiente" e "—": menos de ' + MIN + ' preços válidos; não comparamos. "Sem FIPE": implementos não existem na tabela FIPE.</p>' +
        '<details><summary style="cursor:pointer;color:var(--text-secondary);font-size:var(--fs-sm)">Como este resultado é calculado</summary>' + evDet('Lado A', state.a, gA) + evDet('Lado B', state.b, gB) + '</details>'
      ));

      body.innerHTML = stack(notes + filters + result);
      if (focusName) { const el = body.querySelector('[data-field="' + focusName + '"]'); if (el) el.focus(); }
    };

    const sync = () => U.setParams({ a: key(state.a), b: key(state.b), uf: state.uf });
    sync(); paint();

    U.on(main, 'change', '[data-field]', el => {
      const name = el.dataset.field;
      if (name === 'uf') state.uf = el.value;
      else {
        const [k, f] = name.split('-'), s = state[k];
        if (!s) return;
        if (f === 'brand') { s.brand = el.value; s.model = modelsOf(s.brand)[0]; s.year = bestYear(s.brand, s.model, s.year); }
        else if (f === 'model') { s.model = el.value; s.year = bestYear(s.brand, s.model, s.year); }
        else if (f === 'year') s.year = +el.value;
      }
      sync(); paint(name);
    });
  });
})();
