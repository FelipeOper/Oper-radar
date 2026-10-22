/* DEMO Oper Radar — módulo Mercado: páginas hoje.html e mercado.html.
   Só classes oficiais (or-*) e tokens (var(--...)). Sem rede. Dados FICTÍCIOS do motor OperDemo. */
(() => {
  const U = window.OperUI, D = window.OperDemo;
  if (!U || !D) return;
  const e = U.esc;

  const TONE = { 'Alta': 'success', 'Média': 'info', 'Baixa': 'warning', 'Insuficiente': 'neutral' };
  const confBadge = c => U.badge(TONE[c] || 'neutral', c);
  const sectionH = t => `<h3 style="margin:0 0 var(--space-3);font-size:var(--fs-h3)">${t}</h3>`;
  const note = t => `<p class="or-card__sub" style="margin:0;line-height:1.5">${t}</p>`;
  const link = (href, text) => `<a href="${e(href)}" style="color:var(--text-link)">${text} ${U.icon('arrow-right')}</a>`;
  const linkA = key => 'comparador.html?a=' + encodeURIComponent(key);

  /* ============================== HOJE ============================== */
  U.page('hoje.html', main => {
    const k = D.kpis({}), days = k.days;
    const recorte = 'Todas as UFs · caminhões e implementos';
    const upd = `Cenário fictício de ${D.SCENARIO_DATE}`;
    const per = D.PERIOD_LABEL['30d'];

    const hero = `<header style="display:flex;flex-direction:column;gap:var(--space-3);min-width:0">
      <span class="or-sectiontag or-sectiontag--accent" style="align-self:flex-start">VISÃO DO DIA</span>
      <h1 style="margin:0;font-size:var(--fs-h1)">Seu radar, <em style="color:var(--accent)">hoje.</em></h1>
      <p class="or-card__sub" style="margin:0">O que entrou, saiu e mudou de preço no mercado de caminhões e implementos em ${e(D.SCENARIO_DATE)}. Dados fictícios de demonstração.</p>
      <div>${U.button('Explorar mercado', { kind: 'primary', href: 'mercado.html', trail: 'arrow-right' })}</div>
    </header>`;

    const kpis = U.grid(220, [
      U.kpi({ icon: 'storefront', label: 'Revendas no radar', value: U.int(k.dealers), sub: `${k.cities} cidades · ${k.ufs} UFs`,
        ev: { recorte, periodo: 'Estoque ativo hoje', valor: `${k.dealers} revendas`, base: `${D.dealers.length} revendas cadastradas no cenário`, amostra: `${U.int(k.active)} anúncios ativos`, confianca: k.confidence, atualizacao: upd, explicacao: 'Revendas com pelo menos um anúncio ativo na última coleta.', href: 'concorrencia.html', action: 'Ver concorrência' } }),
      U.kpi({ icon: 'truck', label: 'Anúncios ativos revalidados', value: U.int(k.active), sub: `${U.int(k.qualified)} com preço válido`,
        ev: { recorte, periodo: 'Estoque ativo hoje', valor: `${U.int(k.active)} anúncios`, base: `${U.int(k.qualified)} anúncios com preço qualificado`, amostra: `${U.int(k.active)} anúncios`, confianca: k.confidence, atualizacao: upd, explicacao: 'Anúncios vistos como ativos na última coleta. Preços fora da faixa esperada ou sem vínculo FIPE claro não entram na mediana qualificada.', href: 'mercado.html', action: 'Ver mercado' } }),
      U.kpi({ icon: 'check-circle', label: 'Saídas detectadas (mês)', value: U.int(k.exits), sub: 'Saída observada, não é venda',
        ev: { recorte, periodo: per, valor: `${k.exits} saídas`, base: `${D.pending.length} candidatas aguardando 2ª confirmação`, amostra: `${U.int(k.active)} anúncios monitorados`, confianca: 'Média', atualizacao: upd, explicacao: `Anúncio ausente em 2 verificações consecutivas (${days} dias). Não comprova venda.`, href: 'concorrencia.html', action: 'Ver concorrência' } }),
      U.kpi({ icon: 'arrows-left-right', label: 'Movimento em 48 h', value: `+${k.entries48} / −${k.exits48}`, accent: true, sub: 'entradas / saídas observadas',
        ev: { recorte, periodo: 'Últimas 48 horas', valor: `+${k.entries48} entradas · −${k.exits48} saídas`, base: `${U.int(k.active)} anúncios ativos`, amostra: `${k.entries48 + k.exits48} eventos`, confianca: 'Média', atualizacao: upd, explicacao: 'Entradas = anúncios vistos pela 1ª vez. Saídas = ausentes em 2 verificações; não confirmam venda.', href: 'mercado.html', action: 'Ver mercado' } })
    ].join(''));

    // Alerta do monitor de qualidade
    const q = D.quality(), highs = q.items.filter(i => i.sev === 'alta' && i.count);
    const alertHtml = highs.length
      ? U.alert('danger', `Monitor de dados: ${highs.length} ponto(s) de severidade alta`,
        highs.map(i => `• ${e(i.title)}: ${i.count} ${e(i.unit)}`).join('<br>') + `<br>${link('dados-e-fipe.html', 'Ver monitor de qualidade')}`)
      : U.alert('success', 'Monitor de dados sem pontos de severidade alta', link('dados-e-fipe.html', 'Ver monitor de qualidade'));

    // Feed
    const feed = D.feed({});
    const feedBody = feed.length
      ? U.stack(feed.map(ev => U.listrow(`${U.icon(ev.icon)} ${e(ev.title)}`, e(ev.sub), undefined, e(ev.when))).join(''), 'var(--space-2)')
      : U.empty('Sem movimento recente', 'Nenhuma entrada, saída ou queda de preço nas últimas horas.');
    const feedSec = U.section('Movimento do mercado', 'Entradas, quedas de preço e saídas observadas. Saída não é venda.', feedBody);

    // Regiões com mais saídas
    const ufs = D.byUF({}).slice().sort((a, b) => b.exits - a.exits);
    const maxEx = Math.max(1, ...ufs.map(u => u.exits));
    const regBody = U.stack(ufs.map(u => U.progress(`${e(u.name)} (${u.uf})`, `${u.exits} saída${u.exits === 1 ? '' : 's'}`, u.exits, maxEx)).join('') +
      note(`${e(per)} · saídas observadas por UF, sem confirmação de venda.`), 'var(--space-3)');
    const regSec = U.section('Regiões com mais saídas', 'Onde o mercado mais se movimentou', regBody);

    // Insights do dia
    const ins = D.insights().slice(0, 3);
    const insBody = ins.length
      ? U.stack(ins.map(i => U.listrow(`${U.icon(i.icon)} ${e(i.title)}`, e(i.text), i.href)).join(''), 'var(--space-2)')
      : U.empty('Sem insights hoje', 'Nenhum destaque com amostra suficiente no cenário atual.');
    const insSec = U.section('Insights do dia', 'Sinais calculados sobre o cenário. Confira a evidência antes de decidir.', insBody, U.button('Ver todos', { kind: 'ghost', size: 'sm', href: 'inteligencia.html' }));

    main.innerHTML = U.stack(hero + kpis + alertHtml + U.grid(340, feedSec + U.stack(regSec + insSec)), 'var(--space-5)');
  });

  /* ============================= MERCADO ============================= */
  U.page('mercado.html', main => {
    const SEGS = ['Todos', 'Caminhões', 'Implementos'];
    const PERS = ['7d', '30d', '90d'];
    const brandsFor = seg => ['Todas'].concat([...new Set(D.MODELS.filter(m => seg === 'Todos' || m[2] === seg).map(m => m[0]))]);

    // Estado inicial a partir da query string (deep-link)
    const p = U.params();
    const st = {
      ufs: D.UFS.filter(u => (p.uf || '').toUpperCase().split(',').map(s => s.trim()).includes(u)),
      period: PERS.includes(p.periodo) ? p.periodo : '30d',
      segment: SEGS.includes(p.segmento) ? p.segmento : 'Todos',
      brand: 'Todas', drill: null, sel: null, showN: 10
    };
    if (brandsFor(st.segment).includes(p.marca)) st.brand = p.marca;

    const filt = () => ({ ufs: st.ufs, segment: st.segment, brand: st.brand, period: st.period });
    const isDefault = () => !st.ufs.length && st.period === '30d' && st.segment === 'Todos' && st.brand === 'Todas';
    const scopeLabel = () => [st.ufs.length ? st.ufs.join(', ') : 'Todas as UFs', st.segment === 'Todos' ? 'caminhões e implementos' : st.segment.toLowerCase(), st.brand === 'Todas' ? 'todas as marcas' : st.brand].join(' · ');
    const upd = `Cenário fictício de ${D.SCENARIO_DATE}`;
    const inScope = uf => !st.ufs.length || st.ufs.includes(uf);

    main.innerHTML = U.stack(`
      <header style="display:flex;flex-direction:column;gap:var(--space-3);min-width:0">
        <span class="or-sectiontag or-sectiontag--accent" style="align-self:flex-start">PANORAMA</span>
        <h1 style="margin:0;font-size:var(--fs-h1)">Mercado</h1>
        <p class="or-card__sub" style="margin:0">Panorama do mercado por região, modelo e período. Dados fictícios de demonstração (${e(D.SCENARIO_DATE)}).</p>
      </header>
      <div id="m-bar"></div><div id="m-refine"></div><div id="m-kpis"></div>
      ${U.grid(340, '<div id="m-ufs" style="min-width:0"></div><div id="m-reg" style="min-width:0"></div>')}
      <div id="m-mod" style="min-width:0"></div><div id="m-det" style="min-width:0"></div>`, 'var(--space-5)');
    const $ = id => main.querySelector('#' + id);

    /* ---------- barra "Analisando" ---------- */
    const renderBar = () => {
      const chips = [
        st.ufs.length ? st.ufs.map(u => U.tag(u + ' ×', { selected: true, data: { remove: 'uf:' + u } })).join('') : U.badge('neutral', 'Todas as UFs'),
        U.badge('info', D.PERIOD_LABEL[st.period]),
        st.segment !== 'Todos' ? U.tag(st.segment + ' ×', { selected: true, data: { remove: 'segment' } }) : U.badge('neutral', 'Caminhões e implementos'),
        st.brand !== 'Todas' ? U.tag(st.brand + ' ×', { selected: true, data: { remove: 'brand' } }) : U.badge('neutral', 'Todas as marcas')
      ].join('');
      $('m-bar').innerHTML = `<div class="or-card or-card--sunken" style="min-width:0">${U.row(`<strong>Analisando:</strong>${chips}${isDefault() ? '' : U.button('Limpar filtros', { kind: 'ghost', size: 'sm', icon: 'x', data: { clear: '1' } })}`)}</div>`;
    };

    /* ---------- painel "Refinar resultados" (sempre visível) ---------- */
    const renderRefine = () => {
      const cnt = Object.fromEntries(D.byUF({ segment: st.segment, brand: st.brand, period: st.period }).map(r => [r.uf, r.count]));
      const lbl = t => `<span class="or-field__label">${t}</span>`;
      const ufField = `<div style="display:flex;flex-direction:column;gap:var(--space-2);min-width:0">${lbl('Estados (UF) — nenhuma marcada = todas')}${U.row(D.UFS.map(u => U.tag(u, { selected: st.ufs.includes(u), count: U.int(cnt[u] || 0), data: { uf: u } })).join(''))}</div>`;
      const perField = `<div style="display:flex;flex-direction:column;gap:var(--space-2);min-width:0">${lbl('Período')}${U.tabs(PERS.map(v => ({ value: v, label: D.PERIODS[v] + ' dias' })), st.period, 'period')}</div>`;
      const segField = U.select('Segmento', 'segmento', SEGS.map(s => ({ value: s, label: s === 'Todos' ? 'Todos os segmentos' : s })), st.segment, 'truck');
      const brField = U.select('Marca', 'marca', brandsFor(st.segment).map(b => ({ value: b, label: b === 'Todas' ? 'Todas as marcas' : b })), st.brand, 'tag');
      $('m-refine').innerHTML = U.section('Refinar resultados', 'Tudo abaixo recalcula quando você muda um filtro.', U.stack(ufField + U.grid(200, perField + segField + brField)));
    };

    /* ---------- KPIs ---------- */
    const renderKpis = () => {
      const f = filt(), k = D.kpis(f), enough = k.qualified >= 5, recorte = scopeLabel();
      const per = D.PERIOD_LABEL[st.period];
      $('m-kpis').innerHTML = U.grid(220, [
        U.kpi({ icon: 'truck', label: 'Anúncios ativos', value: U.int(k.active), sub: `+${k.entries} entradas · −${k.exits} saídas (${D.PERIODS[st.period]} d)`,
          ev: { recorte, periodo: `Estoque ativo hoje; entradas e saídas nos ${per.toLowerCase()}`, valor: `${U.int(k.active)} anúncios`, base: 'Total do cenário: ' + U.int(D.active.length) + ' anúncios', amostra: `${U.int(k.qualified)} com preço válido`, confianca: k.confidence, atualizacao: upd, explicacao: 'O período altera o movimento (entradas e saídas), não o estoque ativo. Saída observada não é venda.' } }),
        U.kpi({ icon: 'storefront', label: 'Lojistas', value: U.int(k.dealers), sub: `${k.ufs} UF${k.ufs === 1 ? '' : 's'} no recorte`,
          ev: { recorte, periodo: 'Estoque ativo hoje', valor: `${k.dealers} lojistas`, base: `${D.dealers.length} revendas cadastradas`, amostra: `${U.int(k.active)} anúncios`, confianca: k.confidence, atualizacao: upd, explicacao: 'Revendas com anúncio ativo dentro do recorte.', href: 'concorrencia.html', action: 'Ver concorrência' } }),
        U.kpi({ icon: 'map-pin', label: 'Cidades', value: U.int(k.cities), sub: `${k.ufs} UF${k.ufs === 1 ? '' : 's'}`,
          ev: { recorte, periodo: 'Estoque ativo hoje', valor: `${k.cities} cidades`, base: 'Cidades com pelo menos um anúncio', amostra: `${U.int(k.active)} anúncios`, confianca: k.confidence, atualizacao: upd, explicacao: 'Cidades distintas dos anúncios ativos do recorte.' } }),
        U.kpi({ icon: 'currency-circle-dollar', label: 'Preço mediano qualificado', value: enough ? U.brl(k.medianPrice) : 'Insuficiente', sub: enough ? 'Mediana do recorte (mistura modelos)' : `Amostra de ${k.qualified} preço(s); mínimo 5`,
          ev: { recorte, periodo: 'Estoque ativo hoje', valor: enough ? U.brl(k.medianPrice) : 'Insuficiente', base: k.fipeSample ? `Desvio médio vs FIPE: ${U.pct(k.fipeDev)} (${k.fipeSample} preços)` : 'Sem FIPE vinculada no recorte', amostra: `${U.int(k.qualified)} preços válidos de ${U.int(k.active)} anúncios`, confianca: k.confidence, atualizacao: upd, explicacao: 'Mediana dos preços qualificados (sem valores fora da faixa e sem vínculo FIPE ambíguo), nunca média bruta. Mistura modelos e anos: para comparar, use "Modelos em destaque".' } })
      ].join(''));
    };

    /* ---------- Onde há mais ofertas (UF -> cidades) ---------- */
    const renderUfs = () => {
      const f = filt(), rows = D.byUF(f).filter(r => inScope(r.uf)), box = $('m-ufs');
      if (st.drill && !rows.some(r => r.uf === st.drill)) st.drill = null;
      if (!rows.length) {
        box.innerHTML = U.section('Onde há mais ofertas', 'Anúncios ativos por UF', U.empty('Nenhum anúncio neste recorte', 'Ajuste os filtros para ver ofertas.') + `<div style="margin-top:var(--space-3)">${U.button('Limpar filtros', { kind: 'secondary', icon: 'x', data: { clear: '1' } })}</div>`);
        return;
      }
      if (st.drill) {
        const cities = D.byCity(st.drill, f), r = rows.find(x => x.uf === st.drill);
        box.innerHTML = U.section(`Cidades em ${e(r.name)}`, `${U.int(r.count)} anúncios ativos em ${cities.length} cidade${cities.length === 1 ? '' : 's'}`,
          U.stack(cities.map(c => U.listrow(`<strong>${e(c.city)}</strong>`, `${U.int(c.dealers)} lojista${c.dealers === 1 ? '' : 's'}`, undefined, `<b>${U.int(c.count)}</b>`)).join(''), 'var(--space-2)'),
          U.button('Voltar', { kind: 'secondary', size: 'sm', icon: 'arrow-left', data: { back: '1' } }));
        return;
      }
      box.innerHTML = U.section('Onde há mais ofertas', 'Anúncios ativos por UF. Toque numa UF para ver as cidades.',
        U.stack(rows.map(r => `<div data-drill="${e(r.uf)}" style="cursor:pointer">${U.listrow(`<strong>${e(r.name)}</strong> · ${e(r.uf)}`, `${U.int(r.dealers)} lojistas · ${r.cities} cidades · ${r.exits} saídas em ${D.PERIODS[st.period]} d`, '#', `<b>${U.int(r.count)}</b> ${U.icon('caret-right')}`)}</div>`).join(''), 'var(--space-2)'));
    };

    /* ---------- Oportunidade regional (por UF, preliminar) ---------- */
    const renderReg = () => {
      const box = $('m-reg');
      const rs = D.regionalScore(filt()).filter(r => inScope(r.uf));
      if (!rs.length) { box.innerHTML = ''; return; }
      const ok = r => r.confidence !== 'Insuficiente';
      rs.sort((a, b) => (ok(b) - ok(a)) || (b.score - a.score));
      const bars = rs.map((r, i) => U.progress(`${i + 1}. ${e(r.name)} (${e(r.uf)})`, ok(r) ? `${r.score}/100` : 'Insuficiente', ok(r) ? r.score : 0, 100, ok(r) ? undefined : 'neutral')
        + note(ok(r) ? `Amostra: ${r.sample} preços válidos · confiança ${e(r.confidence.toLowerCase())}` : `Amostra de ${r.sample} preço(s); mínimo 5 — sem índice.`));
      box.innerHTML = U.section('Oportunidade regional', 'Índice por UF · preliminar', U.stack(bars.join('') +
        note('<strong>Como este índice é calculado:</strong> índice PRELIMINAR por UF, sem previsão de vendas. Combina movimento (30%), concorrência (20%), tempo de saída (20%), preço (15%) e qualidade dos dados (15%). O período altera o componente de movimento. Cenário fictício de ' + e(D.SCENARIO_DATE) + '.'), 'var(--space-3)'),
      U.badge('warning', 'Preliminar'));
    };

    /* ---------- Modelos em destaque ---------- */
    let groups = [];
    const renderModels = () => {
      const box = $('m-mod');
      groups = D.groupModels(filt());
      if (st.sel && !groups.some(g => g.key === st.sel)) st.sel = null;
      if (!groups.length) { box.innerHTML = U.section('Modelos em destaque', 'Modelos com mais anúncios', U.empty('Nenhum modelo neste recorte', 'Ajuste os filtros para ver modelos.')); return; }
      const shown = groups.slice(0, st.showN);
      const rows = shown.map(g => {
        const ok = g.qualified >= 5;
        const sub = ok
          ? `${g.count} anúncios · mediana ${U.brl(g.median)} · ${U.brl(g.min)}–${U.brl(g.max)} · ${g.dev != null ? 'vs FIPE ' + U.pct(g.dev) : 'sem FIPE'}`
          : `${g.count} anúncios · amostra insuficiente (${g.qualified} preço(s) válido(s); mínimo 5)`;
        const sel = g.key === st.sel;
        return `<div data-model="${e(g.key)}" style="cursor:pointer;border-radius:var(--radius-md);${sel ? 'outline:2px solid var(--accent);' : ''}">${U.listrow(`<strong>${e(g.brand)} ${e(g.model)}</strong> · ${g.year}`, e(sub), '#', confBadge(ok ? g.confidence : 'Insuficiente'))}</div>`;
      }).join('');
      const more = groups.length > 10
        ? `<div>${U.button(st.showN > 10 ? 'Ver menos' : 'Ver mais', { kind: 'secondary', icon: st.showN > 10 ? 'caret-up' : 'caret-down', data: { more: '1' } })}</div>` : '';
      box.innerHTML = U.section('Modelos em destaque', 'Ordenados por nº de anúncios. Toque num modelo para ver os detalhes.',
        U.stack(U.stack(rows, 'var(--space-2)') + note(`Mostrando ${shown.length} de ${groups.length} modelos (marca, modelo e ano). Mediana qualificada; amostra mínima de 5 preços.`) + more, 'var(--space-3)'));
    };

    /* ---------- Detalhes do modelo ---------- */
    const renderDetail = () => {
      const box = $('m-det'), g = groups.find(x => x.key === st.sel);
      if (!g) { box.innerHTML = U.empty('Detalhes do modelo', 'Selecione um modelo em "Modelos em destaque" para ver distribuição de preços, concentração por UF e movimento do estoque.'); return; }
      const ok = g.qualified >= 5, days = D.PERIODS[st.period];
      // 1) distribuição
      const dist = ok
        ? U.stack(
          [['Mínimo', g.min, 'neutral'], ['Faixa baixa (25%)', g.p25, 'neutral'], ['Mediana', g.median, undefined], ['Faixa alta (75%)', g.p75, 'neutral'], ['Máximo', g.max, 'neutral']]
            .map(([l, v, t]) => U.progress(l, U.brl(v), v, g.max, t)).join('') +
          note(`Base: ${g.qualified} preços válidos de ${g.count} anúncios. ` + (g.fipe ? `FIPE ${U.brl(g.fipe)} · mediana ${U.pct(g.dev)} vs FIPE.` : 'Sem FIPE vinculada: comparação só com o mercado anunciado.')), 'var(--space-3)')
        : U.alert('info', 'Amostra insuficiente', `Apenas ${g.qualified} preço(s) válido(s) de ${g.count} anúncios; o mínimo é 5. Sem distribuição nem comparação.`);
      // 2) concentração por UF
      const byUf = {}; g.list.forEach(l => { byUf[l.uf] = (byUf[l.uf] || 0) + 1; });
      const ufRows = Object.entries(byUf).sort((a, b) => b[1] - a[1]);
      const conc = U.stack(ufRows.map(([u, n]) => U.progress(e(D.UF_NAMES[u] || u), `${n} · ${Math.round(n / g.list.length * 100)}%`, n, g.list.length)).join(''), 'var(--space-3)');
      // 3) movimento / idade
      const ent48 = g.list.filter(l => l.enteredHoursAgo < 48).length, cuts = g.list.filter(l => l.cut && l.cut.daysAgo <= days).length, old = g.list.filter(l => l.ageDays > 90).length;
      const mov = U.stack(
        U.listrow('Entradas nas últimas 48 h', '', undefined, `<b>${ent48}</b>`) +
        U.listrow(`Reduções de preço (${days} dias)`, 'Sinal, não prova de venda', undefined, `<b>${cuts}</b>`) +
        U.listrow('Idade média dos anúncios', '', undefined, `<b>${Math.round(g.avgAge)} dias</b>`) +
        U.listrow('No ar há mais de 90 dias', '', undefined, `<b>${old}</b>`) +
        note('Saídas observadas são medidas por região (veja "Onde há mais ofertas"), não por modelo.'), 'var(--space-2)');
      const block = (t, body) => `<div class="or-card or-card--sunken" style="min-width:0">${sectionH(t)}${body}</div>`;
      // 4) ofertas mais baratas
      const cheap = g.list.filter(D.qualified).sort((a, b) => a.price - b.price).slice(0, 5);
      const cheapBody = cheap.length
        ? U.stack(cheap.map(l => {
          const d = D.dealers[l.dealerId];
          const dev = l.fipe ? 'vs FIPE ' + U.pct((l.price - l.fipe) / l.fipe * 100) : 'sem FIPE';
          return U.listrow(`<strong>${e(d ? d.name : 'Revenda')}</strong>`, `${e(l.city)}/${e(l.uf)} · ${l.ageDays} dias no ar · ${dev}${l.cut ? ' · preço caiu' : ''}`, 'anuncio.html?id=' + encodeURIComponent(l.id), `<b>${U.brl(l.price)}</b>`);
        }).join(''), 'var(--space-2)')
        : U.empty('Sem preços válidos', 'Nenhum anúncio deste grupo passou nos critérios de preço qualificado.');
      box.innerHTML = U.section('Detalhes do modelo', `${e(g.brand)} ${e(g.model)} · ${g.year} — ${g.count} anúncios · ${g.dealers} lojistas · confiança ${e((ok ? g.confidence : 'Insuficiente').toLowerCase())}`,
        U.stack(U.grid(260, block('Distribuição de preços', dist) + block('Concentração por UF', conc) + block('Movimento e idade', mov)) +
          block('Ofertas mais baratas do grupo', cheapBody + note('Anúncios com preço qualificado, do menor para o maior.')), 'var(--space-4)'),
        U.button('Comparar', { kind: 'primary', size: 'sm', icon: 'scales', href: linkA(`${g.brand}|${g.model}|${g.year}`) }));
    };

    /* ---------- orquestração ---------- */
    const focusKey = () => {
      const a = document.activeElement; if (!a || !main.contains(a)) return null;
      for (const k of ['uf', 'period', 'field', 'more']) { const v = a.getAttribute('data-' + k); if (v != null) return `[data-${k}="${v}"]`; }
      return null;
    };
    const renderBody = () => { renderUfs(); renderReg(); renderModels(); renderDetail(); };
    const renderAll = () => {
      const fk = focusKey();
      U.setParams({ uf: st.ufs, periodo: st.period === '30d' ? null : st.period, segmento: st.segment === 'Todos' ? null : st.segment, marca: st.brand === 'Todas' ? null : st.brand });
      renderBar(); renderRefine(); renderKpis(); renderBody();
      if (fk) { const el = main.querySelector(fk); if (el) el.focus(); }
    };
    const fixBrand = () => { if (!brandsFor(st.segment).includes(st.brand)) st.brand = 'Todas'; };

    U.on(main, 'click', '[data-uf]', el => {
      const u = el.getAttribute('data-uf');
      st.ufs = D.UFS.filter(x => (x === u) !== st.ufs.includes(x));
      st.drill = null; renderAll();
    });
    U.on(main, 'click', '[data-period]', el => { st.period = el.getAttribute('data-period'); renderAll(); });
    U.on(main, 'click', '[data-remove]', el => {
      const [k, v] = el.getAttribute('data-remove').split(':');
      if (k === 'uf') st.ufs = st.ufs.filter(x => x !== v); else if (k === 'segment') st.segment = 'Todos'; else if (k === 'brand') st.brand = 'Todas';
      st.drill = null; renderAll();
    });
    U.on(main, 'click', '[data-clear]', () => { st.ufs = []; st.period = '30d'; st.segment = 'Todos'; st.brand = 'Todas'; st.drill = null; renderAll(); });
    U.on(main, 'change', '[data-field]', el => {
      const n = el.getAttribute('data-field');
      if (n === 'segmento' && SEGS.includes(el.value)) { st.segment = el.value; fixBrand(); }
      else if (n === 'marca' && brandsFor(st.segment).includes(el.value)) st.brand = el.value;
      st.drill = null; renderAll();
    });
    U.on(main, 'click', '[data-drill]', (el, ev) => { ev.preventDefault(); st.drill = el.getAttribute('data-drill'); renderUfs(); });
    U.on(main, 'click', '[data-back]', () => { st.drill = null; renderUfs(); });
    U.on(main, 'click', '[data-model]', (el, ev) => {
      ev.preventDefault();
      const k = el.getAttribute('data-model'); st.sel = st.sel === k ? null : k;
      renderModels(); renderDetail();
      if (st.sel) $('m-det').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    U.on(main, 'click', '[data-more]', () => { st.showN = st.showN > 10 ? 10 : 30; renderModels(); });

    renderAll();
  });
})();
