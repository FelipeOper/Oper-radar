/* DEMO Oper Radar — motor de dados FICTÍCIO e coerente.
   Sem rede, sem dados reais, sem credenciais. Tudo é calculado localmente a partir de um cenário determinístico. */
(() => {
  const SCENARIO_DATE = '22/09/2026';
  const seeded = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const rnd = seeded(20260922);
  const between = (a, b) => a + rnd() * (b - a);
  const pickW = (items, w) => { const tot = w.reduce((a, b) => a + b, 0); let r = rnd() * tot; for (let i = 0; i < items.length; i++) { r -= w[i]; if (r <= 0) return items[i]; } return items[items.length - 1]; };
  const roundTo = (n, s) => Math.round(n / s) * s;
  const nice = n => (rnd() < 0.7 ? Math.round(n / 1000) * 1000 - 100 : Math.round(n / 500) * 500);

  const CITIES = {
    PR: ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel', 'São José dos Pinhais'],
    SC: ['Joinville', 'Itajaí', 'Chapecó', 'Blumenau'],
    SP: ['Campinas', 'Ribeirão Preto', 'Sorocaba', 'São José do Rio Preto', 'Santos'],
    GO: ['Goiânia', 'Rio Verde', 'Anápolis'],
    MG: ['Uberlândia', 'Belo Horizonte', 'Juiz de Fora', 'Uberaba']
  };
  const UF_NAMES = { PR: 'Paraná', SC: 'Santa Catarina', SP: 'São Paulo', GO: 'Goiás', MG: 'Minas Gerais' };
  const UFS = Object.keys(CITIES);
  const DEALERS_PER_UF = { PR: 14, SC: 7, SP: 12, GO: 6, MG: 9 };
  const NAME_A = ['Rota', 'Pátio', 'Eixo', 'Frota', 'Trecho', 'Cargo', 'Diesel', 'Estrada', 'Norte', 'Sul', 'Centro', 'Serra', 'Vale', 'Litoral', 'Planalto', 'Horizonte'];
  const NAME_B = ['Exemplo Caminhões', 'Demonstração', 'Modelo Pesados', 'Amostra Veículos', 'Fictício Seminovos', 'Piloto Caminhões', 'Cenário Pesados'];

  const dealers = [];
  const nameSet = new Set();
  const addDealer = (uf, city, name) => {
    let n = name, k = 2;
    while (nameSet.has(n)) n = name + ' ' + (k++);
    nameSet.add(n);
    dealers.push({ id: dealers.length, name: n, uf, city, weight: 0.4 + rnd() * 2.2 });
  };
  addDealer('PR', 'Curitiba', 'Rota Exemplo Caminhões');
  addDealer('SP', 'Campinas', 'Pátio Demonstração');
  { let k = 0;
    UFS.forEach(uf => {
      const need = DEALERS_PER_UF[uf] - dealers.filter(d => d.uf === uf).length;
      for (let i = 0; i < need; i++, k++) addDealer(uf, CITIES[uf][(i + 1) % CITIES[uf].length], NAME_A[(k * 5 + 3) % 16] + ' ' + NAME_B[(k * 3 + i) % 7]);
    });
  }
  dealers[0].weight = 2.6; dealers[1].weight = 2.2;

  // [marca, modelo, segmento, FIPE base 2021, peso]
  const MODELS = [
    ['Volvo', 'FH 540', 'Caminhões', 505000, 0.09], ['Volvo', 'FH 460', 'Caminhões', 430000, 0.08],
    ['Scania', 'R 450', 'Caminhões', 445000, 0.10], ['Scania', 'R 500', 'Caminhões', 520000, 0.07],
    ['Mercedes-Benz', 'Actros 2651', 'Caminhões', 480000, 0.08], ['Mercedes-Benz', 'Axor 2544', 'Caminhões', 300000, 0.07],
    ['DAF', 'XF 530', 'Caminhões', 495000, 0.05], ['Iveco', 'Hi-Way 600S44', 'Caminhões', 400000, 0.06],
    ['Volkswagen', 'Constellation 24.280', 'Caminhões', 285000, 0.07], ['Volkswagen', 'Meteor 29.520', 'Caminhões', 470000, 0.05],
    ['Ford', 'Cargo 2429', 'Caminhões', 255000, 0.05], ['MAN', 'TGX 29.480', 'Caminhões', 400000, 0.04],
    ['Randon', 'Graneleiro 3 eixos', 'Implementos', 180000, 0.05], ['Librelato', 'Bitrem Graneleiro', 'Implementos', 260000, 0.03],
    ['Guerra', 'Basculante', 'Implementos', 210000, 0.03], ['Facchini', 'Sider', 'Implementos', 195000, 0.03]
  ];
  const YEARS = [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
  const YEAR_W = [3, 4, 6, 8, 11, 13, 14, 14, 12, 9, 6];
  const fipeOf = (base, year) => roundTo(base * Math.pow(0.9, 2021 - year), 1000);

  let seq = 0;
  const makeListing = (extra = {}) => {
    const m = pickW(MODELS, MODELS.map(x => x[4]));
    const year = pickW(YEARS, YEAR_W);
    const dealer = pickW(dealers, dealers.map(d => d.weight));
    const ref = fipeOf(m[3], year);
    const truck = m[2] === 'Caminhões';
    let price = nice(ref * between(0.86, 1.07));
    const r = rnd();
    if (r < 0.03) price = null; else if (r < 0.045) price = nice(ref * (rnd() < 0.5 ? between(0.35, 0.48) : between(2.0, 2.6)));
    let fipeLink = 'ok';
    const q = rnd();
    if (truck) fipeLink = q < 0.88 ? 'ok' : q < 0.96 ? 'ambigua' : 'sem'; else fipeLink = q < 0.95 ? 'sem' : 'ok';
    const l = {
      id: 'A-' + String(++seq).padStart(4, '0'), dealerId: dealer.id, uf: dealer.uf, city: dealer.city,
      brand: m[0], model: m[1], segment: m[2], year, km: truck ? roundTo(Math.min(650000, Math.max(20000, (2026 - year) * between(60000, 105000))), 1000) : null,
      price, ref, fipe: fipeLink === 'ok' ? ref : null, fipeLink,
      ageDays: Math.min(400, Math.floor(-Math.log(1 - rnd()) * 40)), cut: null, status: 'ativo'
    };
    return Object.assign(l, extra);
  };

  const active = [];
  for (let i = 0; i < 1284; i++) active.push(makeListing());

  // Cenário fixo (coerente com as telas de detalhe): Volvo FH 540 2021 em Curitiba/PR = 11 ofertas, 9 qualificadas, mediana 498.000
  for (let i = active.length - 1; i >= 0; i--) { const a = active[i]; if (a.brand === 'Volvo' && a.model === 'FH 540' && a.year === 2021 && a.uf === 'PR') active.splice(i, 1); }
  const curitibaDealers = dealers.filter(d => d.city === 'Curitiba');
  const fixedPrices = [489900, 493000, 495500, 497000, 498000, 499900, 503000, 509000, 519000, 512000, null];
  fixedPrices.forEach((p, i) => {
    const d = curitibaDealers[i % curitibaDealers.length];
    active.push({ id: 'A-F' + String(i + 1).padStart(2, '0'), dealerId: d.id, uf: 'PR', city: 'Curitiba', brand: 'Volvo', model: 'FH 540', segment: 'Caminhões', year: 2021,
      km: 250000 + i * 9000, price: p, ref: 505000, fipe: i === 9 ? null : 505000, fipeLink: i === 9 ? 'ambigua' : 'ok', ageDays: 6 + i * 4, cut: null, status: 'ativo' });
  });
  while (active.length > 1284) active.splice(Math.floor(rnd() * 800), 1);
  while (active.length < 1284) active.push(makeListing());

  // Idade / entradas nas últimas 48 h (64 entradas) e reduções de preço nos últimos 30 dias
  const fixedIds = new Set(active.filter(a => a.id.startsWith('A-F')).map(a => a.id));
  const shuffled = active.filter(a => !fixedIds.has(a.id)).sort(() => rnd() - 0.5);
  shuffled.slice(0, 64).forEach(a => { a.ageDays = 0; a.enteredHoursAgo = Math.floor(between(1, 47)); });
  active.forEach(a => { if (a.enteredHoursAgo == null) { a.ageDays = Math.max(2, a.ageDays); a.enteredHoursAgo = a.ageDays * 24 + Math.floor(between(2, 22)); } });
  active.forEach(a => { if (a.price && rnd() < 0.15 && !fixedIds.has(a.id)) { a.cut = { daysAgo: Math.floor(between(0, 29.9)), from: nice(a.price * between(1.02, 1.09)), to: a.price }; } });
  const fh = active.find(a => a.id === 'A-F01'); fh.cut = { daysAgo: 1, from: 499900, to: 489900 };

  // Saídas detectadas (37 em 30 dias; 21 nas últimas 48 h) e candidatas aguardando 2ª confirmação
  const exits = [];
  for (let i = 0; i < 37; i++) { const l = makeListing({ status: 'saída' }); l.exitHoursAgo = i < 21 ? Math.floor(between(1, 47)) : Math.floor(between(3, 29.9) * 24); exits.push(l); }
  { const goD = dealers.find(d => d.uf === 'GO' && d.city === 'Goiânia') || dealers.find(d => d.uf === 'GO'); exits[0].dealerId = goD.id; exits[0].uf = goD.uf; exits[0].city = goD.city; } exits[0].brand = 'Mercedes-Benz'; exits[0].model = 'Actros 2651'; exits[0].year = 2019; exits[0].price = 468000; exits[0].exitHoursAgo = 20;
  const pending = [];
  for (let i = 0; i < 6; i++) { const l = makeListing({ status: 'candidata' }); pending.push(l); }

  // Coleta por UF (frescor)
  const collection = { PR: { hours: 6, ok: 100 }, SC: { hours: 9, ok: 100 }, SP: { hours: 11, ok: 98 }, GO: { hours: 41, ok: 83 }, MG: { hours: 13, ok: 100 } };

  // Estoque próprio (Minha Loja — Curitiba/PR)
  const own = [
    { id: 'P-001', brand: 'Volvo', model: 'FH 540', year: 2021, km: 312000, price: 515000, plate: 'AAA0A00' },
    { id: 'P-002', brand: 'Scania', model: 'R 450', year: 2020, km: 355000, price: null, plate: 'BBB1B11' },
    { id: 'P-003', brand: 'Mercedes-Benz', model: 'Actros 2651', year: 2019, km: 402000, price: null, plate: 'CCC2C22' },
    { id: 'P-004', brand: 'Volvo', model: 'FH 460', year: 2022, km: 228000, price: null, plate: 'DDD3D33' },
    { id: 'P-005', brand: 'Iveco', model: 'Hi-Way 600S44', year: 2020, km: 344000, price: null, plate: 'EEE4E44' },
    { id: 'P-006', brand: 'Randon', model: 'Graneleiro 3 eixos', year: 2021, km: null, price: null, plate: 'FFF5F55' },
    { id: 'P-007', brand: 'Volkswagen', model: 'Constellation 24.280', year: 2019, km: 391000, price: null, plate: 'GGG6G66' },
    { id: 'P-008', brand: 'DAF', model: 'XF 530', year: 2021, km: 276000, price: null, plate: 'HHH7H77' }
  ];
  own.forEach((o, i) => { const m = MODELS.find(x => x[0] === o.brand && x[1] === o.model); o.segment = m[2]; o.ref = fipeOf(m[3], o.year); if (o.price == null) o.price = nice(o.ref * [1.045, 0.99, 1.06, 0.97, 1.02, 1.0, 1.03][(i - 1) % 7]); o.uf = 'PR'; o.city = 'Curitiba'; });

  // ---------- Consultas ----------
  const median = arr => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); const h = s.length >> 1; return s.length % 2 ? s[h] : (s[h - 1] + s[h]) / 2; };
  const quant = (arr, p) => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); const i = (s.length - 1) * p; const lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo); };
  const qualified = l => l.price > 0 && l.fipeLink !== 'ambigua' && l.price >= 0.5 * l.ref && l.price <= 1.5 * l.ref;
  const PERIODS = { '7d': 7, '30d': 30, '90d': 90 };
  const PERIOD_LABEL = { '7d': 'Últimos 7 dias', '30d': 'Últimos 30 dias', '90d': 'Últimos 90 dias' };
  // Calibração da DEMO (a regra real usa 10 comparáveis para "média"): 9 já é "média" para manter o cenário-âncora coerente entre telas.
  const confidence = (n, dealersN) => n < 5 ? 'Insuficiente' : (n >= 30 && dealersN >= 5) ? 'Alta' : n >= 9 ? 'Média' : 'Baixa';

  const filter = (f = {}) => active.filter(l =>
    (!f.ufs || !f.ufs.length || f.ufs.includes(l.uf)) && (!f.city || l.city === f.city) &&
    (!f.segment || f.segment === 'Todos' || l.segment === f.segment) && (!f.brand || f.brand === 'Todas' || l.brand === f.brand));
  const scopeExits = (f = {}) => exits.filter(l =>
    (!f.ufs || !f.ufs.length || f.ufs.includes(l.uf)) && (!f.segment || f.segment === 'Todos' || l.segment === f.segment) && (!f.brand || f.brand === 'Todas' || l.brand === f.brand));

  const kpis = (f = {}) => {
    const rows = filter(f), days = PERIODS[f.period || '30d'];
    const q = rows.filter(qualified), ex = scopeExits(f).filter(e => e.exitHoursAgo <= days * 24);
    const entered = rows.filter(l => l.enteredHoursAgo <= days * 24);
    const dev = q.filter(l => l.fipe).map(l => (l.price - l.fipe) / l.fipe * 100);
    const dealerSet = new Set(rows.map(l => l.dealerId)), citySet = new Set(rows.map(l => l.city));
    const e48 = rows.filter(l => l.enteredHoursAgo < 48).length, x48 = scopeExits(f).filter(e => e.exitHoursAgo < 48).length;
    return { active: rows.length, dealers: dealerSet.size, cities: citySet.size, ufs: new Set(rows.map(l => l.uf)).size, qualified: q.length,
      medianPrice: median(q.map(l => l.price)), fipeDev: dev.length ? dev.reduce((a, b) => a + b, 0) / dev.length : null, fipeSample: dev.length,
      exits: ex.length, entries: entered.length, entries48: e48, exits48: x48, cuts: rows.filter(l => l.cut && l.cut.daysAgo <= days).length,
      confidence: confidence(q.length, dealerSet.size), days };
  };

  const groupModels = (f = {}) => {
    const rows = filter(f), map = new Map();
    rows.forEach(l => { const k = l.brand + '|' + l.model + '|' + l.year; if (!map.has(k)) map.set(k, []); map.get(k).push(l); });
    return [...map.entries()].map(([k, arr]) => {
      const [brand, model, year] = k.split('|'); const q = arr.filter(qualified), prices = q.map(l => l.price);
      const dealerN = new Set(arr.map(l => l.dealerId)).size, fipe = arr.find(l => l.fipe)?.fipe ?? null, med = median(prices);
      return { key: k, brand, model, year: +year, segment: arr[0].segment, count: arr.length, qualified: q.length, dealers: dealerN, median: med, min: prices.length ? Math.min(...prices) : null,
        max: prices.length ? Math.max(...prices) : null, p25: quant(prices, .25), p75: quant(prices, .75), fipe, dev: fipe && med ? (med - fipe) / fipe * 100 : null,
        confidence: confidence(q.length, dealerN), avgAge: arr.reduce((a, l) => a + l.ageDays, 0) / arr.length, list: arr };
    }).sort((a, b) => b.count - a.count);
  };

  const byUF = (f = {}) => UFS.map(uf => {
    const ff = Object.assign({}, f, { ufs: [uf] }); const rows = filter(ff); const k = kpis(ff);
    return { uf, name: UF_NAMES[uf], count: rows.length, dealers: k.dealers, cities: k.cities, median: k.medianPrice, exits: k.exits, cuts: k.cuts };
  }).filter(x => x.count).sort((a, b) => b.count - a.count);
  const byCity = (uf, f = {}) => CITIES[uf].map(city => { const rows = filter(Object.assign({}, f, { ufs: [uf], city })); return { city, uf, count: rows.length, dealers: new Set(rows.map(l => l.dealerId)).size }; }).filter(x => x.count).sort((a, b) => b.count - a.count);

  const dealerStats = (f = {}) => dealers.map(d => {
    const rows = filter(f).filter(l => l.dealerId === d.id), q = rows.filter(qualified);
    const ex = exits.filter(e => e.dealerId === d.id && e.exitHoursAgo <= 30 * 24).length;
    return { dealer: d, count: rows.length, exits: ex, cuts: rows.filter(l => l.cut && l.cut.daysAgo <= 30).length, avgAge: rows.length ? rows.reduce((a, l) => a + l.ageDays, 0) / rows.length : 0,
      dev: (() => { const v = q.filter(l => l.fipe).map(l => (l.price - l.fipe) / l.fipe * 100); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; })(), rows };
  }).filter(x => x.count > 0);

  // Índice de oportunidade regional — pesos da especificação (movimento 30, concorrência 20, tempo de saída 20, preço 15, qualidade 15). PRELIMINAR na demo.
  const clamp = v => Math.max(0, Math.min(100, v));
  const regionalScore = (f = {}) => byUF(f).map(r => {
    const rows = filter(Object.assign({}, f, { ufs: [r.uf] })), q = rows.filter(qualified);
    const move = clamp(r.exits / Math.max(1, rows.length) * 100 * 12), comp = clamp(100 - r.dealers / Math.max(1, rows.length) * 100 * 10);
    const speed = clamp(100 - (rows.reduce((a, l) => a + l.ageDays, 0) / Math.max(1, rows.length)) * 1.4);
    const dev = q.filter(l => l.fipe).map(l => (l.price - l.fipe) / l.fipe * 100), avgDev = dev.length ? dev.reduce((a, b) => a + b, 0) / dev.length : 0;
    const price = clamp(50 - avgDev * 6), qual = clamp(q.length / Math.max(1, rows.length) * 100);
    const score = Math.round(move * .30 + comp * .20 + speed * .20 + price * .15 + qual * .15);
    return { uf: r.uf, name: r.name, score, parts: { movimento: Math.round(move), concorrencia: Math.round(comp), tempo_saida: Math.round(speed), preco: Math.round(price), qualidade: Math.round(qual) }, sample: q.length, confidence: confidence(q.length, r.dealers) };
  }).sort((a, b) => b.score - a.score);

  // Base de comparação: Paraná quando há amostra (>=5 preços válidos); senão cai para o Brasil, sempre rotulado em scope/scopeLabel.
  const ownAnalysis = () => {
    const pr = groupModels({ ufs: ['PR'] }), br = groupModels({});
    return own.map(o => {
      const same = x => x.brand === o.brand && x.model === o.model && x.year === o.year;
      const gPR = pr.find(same), gBR = br.find(same);
      const useBR = !(gPR && gPR.qualified >= 5) && gBR && gBR.qualified >= 5;
      const g = useBR ? gBR : (gPR || gBR || null);
      const med = g && g.qualified >= 5 ? g.median : null;
      const scope = useBR ? 'Brasil' : 'Paraná';
      const scopeLabel = useBR ? 'Brasil' : (g && g.list.every(l => l.city === 'Curitiba') ? 'Curitiba/PR' : 'Paraná');
      return Object.assign({}, o, { group: g, scope, scopeLabel, median: med, vsMedian: med ? (o.price - med) / med * 100 : null, vsFipe: o.ref && o.segment === 'Caminhões' ? (o.price - o.ref) / o.ref * 100 : null,
        cheapest: g && g.min ? g.min : null, sample: g ? g.qualified : 0, offers: g ? g.count : 0, confidence: g ? g.confidence : 'Insuficiente' });
    });
  };

  // ---------- Monitor de qualidade / inconsistências ----------
  const quality = () => {
    const noPrice = active.filter(l => !l.price), amb = active.filter(l => l.fipeLink === 'ambigua');
    const outl = active.filter(l => l.price && (l.price < 0.5 * l.ref || l.price > 1.5 * l.ref));
    const dupMap = new Map(); active.forEach(l => { const k = [l.dealerId, l.brand, l.model, l.year, l.km].join('|'); if (!dupMap.has(k)) dupMap.set(k, []); dupMap.get(k).push(l); });
    let dups = [...dupMap.values()].filter(a => a.length > 1);
    const fakeDup = active.slice(300, 306); fakeDup.forEach((l, i) => { const c = Object.assign({}, l, { id: l.id + '-dup' }); if (i < 4) { dups.push([l, c]); } });
    const implNoFipe = active.filter(l => l.segment === 'Implementos' && l.fipeLink === 'sem');
    const stale = UFS.filter(u => collection[u].hours > 24);
    const ex = (arr, fn) => arr.slice(0, 3).map(fn);
    const desc = l => `${l.brand} ${l.model} ${l.year} · ${dealers[l.dealerId].name} (${l.city}/${l.uf})`;
    const items = [
      { id: 'stale', sev: 'alta', title: 'Coleta atrasada por região', count: stale.length, unit: 'UF', detail: stale.map(u => `${u}: última coleta completa há ${collection[u].hours} h (${collection[u].ok}% das revendas)`).join(' · ') || 'Nenhuma', examples: stale.map(u => `${UF_NAMES[u]}: ${collection[u].hours} h sem coleta completa`), action: 'Reexecutar coleta da UF e revisar revendas com erro.', href: 'dados-e-fipe.html' },
      { id: 'outlier', sev: 'alta', title: 'Preços fora da faixa esperada', count: outl.length, unit: 'anúncios', detail: 'Preço abaixo de 50% ou acima de 150% da referência do modelo/ano. Ficam fora da mediana qualificada.', examples: ex(outl, l => `${desc(l)} · ${l.price ? 'R$ ' + l.price.toLocaleString('pt-BR') : ''} (ref. R$ ${l.ref.toLocaleString('pt-BR')})`), action: 'Conferir se é erro de digitação do anunciante ou valor especial.', href: 'mercado.html' },
      { id: 'pending', sev: 'média', title: 'Saídas aguardando 2ª confirmação', count: pending.length, unit: 'anúncios', detail: 'Ausentes na 1ª verificação. Só viram saída detectada após a 2ª confirmação — e mesmo assim não comprovam venda.', examples: ex(pending, desc), action: 'Aguardar próxima coleta; não contar como venda.', href: 'concorrencia.html' },
      { id: 'dups', sev: 'média', title: 'Possíveis anúncios duplicados', count: dups.length, unit: 'pares', detail: 'Mesma revenda, marca, modelo, ano e km.', examples: dups.slice(0, 3).map(a => desc(a[0])), action: 'Confirmar e mesclar duplicados na curadoria.', href: 'dados-e-fipe.html' },
      { id: 'amb', sev: 'média', title: 'Vínculo FIPE ambíguo', count: amb.length, unit: 'anúncios', detail: 'Mais de um candidato de FIPE. Por segurança ficam sem vínculo automático.', examples: ex(amb, desc), action: 'Resolver na curadoria FIPE.', href: 'dados-e-fipe.html' },
      { id: 'noprice', sev: 'baixa', title: 'Anúncios sem preço', count: noPrice.length, unit: 'anúncios', detail: 'Preço “sob consulta”. Não entram em médias nem medianas.', examples: ex(noPrice, desc), action: 'Nenhuma ação obrigatória.', href: 'mercado.html' },
      { id: 'impl', sev: 'info', title: 'Implementos sem cobertura FIPE', count: implNoFipe.length, unit: 'anúncios', detail: 'Esperado: a tabela FIPE não cobre carretas e implementos. Comparação usa apenas o mercado anunciado.', examples: ex(implNoFipe, desc), action: 'Sem ação — limitação conhecida da fonte.', href: 'dados-e-fipe.html' }
    ];
    const total = active.length, highs = items.filter(i => i.sev === 'alta' && i.count).length, meds = items.filter(i => i.sev === 'média' && i.count).length;
    const fipeCov = active.filter(l => l.fipe).length;
    const summary = `Analisei ${total.toLocaleString('pt-BR')} anúncios ativos em ${dealers.length} revendas. Encontrei ${highs} ponto(s) de severidade alta e ${meds} de severidade média. ` +
      (stale.length ? `O mais urgente é a coleta atrasada em ${stale.map(u => UF_NAMES[u]).join(', ')} (${stale.map(u => collection[u].hours + ' h').join(', ')}): os números dessa região podem estar defasados. ` : '') +
      `Há ${outl.length} preços fora da faixa esperada (já excluídos da mediana qualificada) e ${amb.length} vínculos FIPE ambíguos aguardando curadoria. Cobertura FIPE: ${(fipeCov / total * 100).toFixed(0).replace('.', ',')}% dos anúncios.`;
    return { items, summary, fipeCoverage: fipeCov / total, fipeCount: fipeCov, total, collection };
  };

  // ---------- Insights ----------
  const insights = (f = {}) => {
    const out = [], k = kpis(f), days = PERIODS[f.period || '30d'], upd = SCENARIO_DATE;
    const reg = byUF(f).slice().sort((a, b) => b.exits - a.exits)[0];
    if (reg && reg.exits) out.push({ id: 'exits', icon: 'trend-down', title: `${reg.name} concentra as saídas observadas`, text: `${reg.exits} dos ${k.exits} anúncios que saíram do radar em ${PERIOD_LABEL[f.period || '30d'].toLowerCase()} eram de ${reg.name}. Saída observada não comprova venda.`,
      ev: { recorte: `${reg.name} · caminhões e implementos`, periodo: PERIOD_LABEL[f.period || '30d'], valor: `${reg.exits} saídas`, base: `${k.exits} saídas no total`, amostra: `${reg.count} anúncios ativos`, confianca: confidence(reg.count, reg.dealers), atualizacao: upd, explicacao: 'Anúncio ausente em 2 verificações consecutivas.' }, href: 'mercado.html?uf=' + reg.uf, action: 'Ver mercado da região' });
    const opp = groupModels(f).filter(g => g.qualified >= 5 && g.dev != null && g.dev <= -4).sort((a, b) => a.dev - b.dev)[0];
    if (opp) out.push({ id: 'opp', icon: 'seal-percent', title: `${opp.brand} ${opp.model} ${opp.year} anunciado abaixo da FIPE`, text: `A mediana qualificada (${brl(opp.median)}) está ${Math.abs(opp.dev).toFixed(1).replace('.', ',')}% abaixo da FIPE (${brl(opp.fipe)}). Pode indicar oportunidade de compra — confira estado e versão.`,
      ev: { recorte: `${opp.brand} ${opp.model} ${opp.year} · todas as UFs`, periodo: 'Estoque ativo', valor: brl(opp.median), base: `FIPE ${brl(opp.fipe)}`, amostra: `${opp.qualified} preços válidos · ${opp.dealers} revendas`, confianca: opp.confidence, atualizacao: upd, explicacao: 'Mediana qualificada, não média bruta.' }, href: 'comparador.html?a=' + encodeURIComponent(opp.brand + '|' + opp.model + '|' + opp.year), action: 'Abrir comparador' });
    const aged = groupModels(f).map(g => ({ g, n: g.list.filter(l => l.ageDays > 90).length })).sort((a, b) => b.n - a.n)[0];
    if (aged && aged.n >= 4) out.push({ id: 'aged', icon: 'hourglass-medium', title: `${aged.g.brand} ${aged.g.model} ${aged.g.year}: estoque parado há mais de 90 dias`, text: `${aged.n} de ${aged.g.count} anúncios estão há mais de 90 dias no ar. Tempo longo sugere preço acima do que o mercado aceita.`,
      ev: { recorte: `${aged.g.brand} ${aged.g.model} ${aged.g.year}`, periodo: 'Estoque ativo', valor: `${aged.n} anúncios`, base: `${aged.g.count} anúncios do grupo`, amostra: `${aged.g.dealers} revendas`, confianca: aged.g.confidence, atualizacao: upd, explicacao: 'Idade = dias desde a primeira observação.' }, href: 'comparador.html?a=' + encodeURIComponent(aged.g.brand + '|' + aged.g.model + '|' + aged.g.year), action: 'Comparar preços' });
    const ds = dealerStats(f).sort((a, b) => b.cuts - a.cuts)[0];
    if (ds && ds.cuts >= 3) out.push({ id: 'cuts', icon: 'tag', title: `${ds.dealer.name} reduziu preço em ${ds.cuts} anúncios`, text: `Concorrente em ${ds.dealer.city}/${ds.dealer.uf} com ${ds.count} anúncios ativos. Reduções recentes podem pressionar seus preços.`,
      ev: { recorte: `${ds.dealer.name} · ${ds.dealer.city}/${ds.dealer.uf}`, periodo: 'Últimos 30 dias', valor: `${ds.cuts} reduções`, base: `${ds.count} anúncios ativos`, amostra: `${ds.count} anúncios`, confianca: ds.count >= 10 ? 'Média' : 'Baixa', atualizacao: upd, explicacao: 'Redução = queda de preço entre duas coletas.' }, href: 'lojista.html?id=' + ds.dealer.id, action: 'Ver perfil do lojista' });
    ownAnalysis().filter(o => o.vsMedian != null && o.vsMedian >= 5).sort((a, b) => b.vsMedian - a.vsMedian).slice(0, 2).forEach(o => out.push({ id: 'own-' + o.id, icon: 'storefront', title: `Seu ${o.brand} ${o.model} ${o.year} está ${o.vsMedian.toFixed(1).replace('.', ',')}% acima da mediana`, text: `Você anuncia ${brl(o.price)}; a mediana qualificada do grupo (${o.scopeLabel}) é ${brl(o.median)}${o.cheapest ? ` e o mais barato está em ${brl(o.cheapest)}` : ''}. Vale revisar preço ou destacar diferenciais.`,
      ev: { recorte: `${o.brand} ${o.model} ${o.year} · base ${o.scopeLabel}`, periodo: 'Últimos 30 dias', valor: brl(o.price), base: `Mediana qualificada ${brl(o.median)}${o.fipe || o.ref ? ` · FIPE ${brl(o.ref)}` : ''}`, amostra: `${o.sample} preços válidos · ${o.offers} ofertas`, confianca: o.confidence, atualizacao: upd, explicacao: 'Comparação com o mesmo modelo e ano (' + o.scopeLabel + ').' }, href: 'minha-loja.html', action: 'Ver na Minha Loja' }));
    return out;
  };
  const brl = n => n == null ? '—' : 'R$ ' + Math.round(n).toLocaleString('pt-BR');

  // ---------- Feed de movimento (Hoje) ----------
  const timeLabel = h => h < 24 ? 'Hoje ' + String(Math.max(0, 9 - Math.floor(h / 2))).padStart(2, '0') + ':' + String((h * 13) % 60).padStart(2, '0') : 'Há ' + Math.floor(h / 24) + ' d';
  const feed = (f = {}) => {
    const ev = [];
    filter(f).filter(l => l.enteredHoursAgo < 48).slice(0, 40).forEach(l => ev.push({ h: l.enteredHoursAgo, kind: 'novo', icon: 'plus-circle', title: `${l.brand} ${l.model} · ${l.year}`, sub: `Novo · ${l.city}/${l.uf}${l.price ? ' · ' + brl(l.price) : ''}` }));
    filter(f).filter(l => l.cut && l.cut.daysAgo <= 2).forEach(l => ev.push({ h: l.cut.daysAgo * 24 + 3, kind: 'preco', icon: 'trend-down', title: `${l.brand} ${l.model} · ${l.year}`, sub: `Preço caiu · ${l.city}/${l.uf} · ${brl(l.cut.from)} → ${brl(l.cut.to)}` }));
    scopeExits(f).filter(e => e.exitHoursAgo < 72).forEach(e => ev.push({ h: e.exitHoursAgo, kind: 'saida', icon: 'check-circle', title: `${e.brand} ${e.model} · ${e.year}`, sub: `Saída detectada · ${e.city}/${e.uf} · venda não confirmada` }));
    return ev.sort((a, b) => a.h - b.h).slice(0, 12).map(e => Object.assign(e, { when: timeLabel(e.h) }));
  };

  // ---------- Analista IA (regras locais; não é modelo de linguagem) ----------
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const answer = (q) => {
    const t = norm(q), src = [], k = kpis({}), pct1 = v => Math.abs(v).toFixed(1).replace('.', ',');
    if (/(competitiv|caro|barato|preco|posicion|meu |minha |seu )/.test(t) || /(volvo|scania|actros|fh|r 450|iveco|daf)/.test(t)) {
      const a = ownAnalysis(); let o = a[0];
      const hit = a.find(x => t.includes(norm(x.model)) || t.includes(norm(x.brand)) && a.filter(y => y.brand === x.brand).length === 1); if (hit) o = hit;
      if (o.median == null) return { text: `Não há amostra suficiente para comparar o seu ${o.brand} ${o.model} ${o.year} (${o.sample} preços válidos; o mínimo é 5). Prefiro não estimar.`, conf: 'Insuficiente', sources: [{ label: 'Minha Loja', href: 'minha-loja.html' }] };
      const dir = o.vsMedian >= 0 ? 'acima' : 'abaixo';
      return { text: `Seu ${o.brand} ${o.model} ${o.year} está anunciado por ${brl(o.price)}, ${pct1(o.vsMedian)}% ${dir} da mediana qualificada do grupo em ${o.scopeLabel} (${brl(o.median)}; ${o.sample} preços válidos de ${o.offers} ofertas)` + (o.vsFipe != null ? ` e ${pct1(o.vsFipe)}% ${o.vsFipe >= 0 ? 'acima' : 'abaixo'} da FIPE (${brl(o.ref)}).` : '.') + (o.cheapest ? ` O concorrente mais barato anuncia ${brl(o.cheapest)}.` : '') + (o.vsMedian >= 3 ? ' Sugestão: revisar o preço ou destacar km e versão no anúncio.' : ' Sua posição é competitiva.') + ' Confiança ' + o.confidence.toLowerCase() + '. Verifique versão e condição antes de decidir.',
        conf: o.confidence, sources: [{ label: 'Comparador', href: 'comparador.html?a=' + encodeURIComponent(o.brand + '|' + o.model + '|' + o.year) + (o.scope === 'Paraná' ? '&uf=PR' : '') }, { label: 'Minha Loja', href: 'minha-loja.html' }] };
    }
    if (/(erro|inconsist|qualidade|monitor|problema|falha|atras)/.test(t)) { const qd = quality(); return { text: qd.summary, conf: 'Média', sources: [{ label: 'Monitor de qualidade', href: 'dados-e-fipe.html' }] }; }
    if (/(regi|onde|praca|vender|quente|uf|estado)/.test(t)) { const r = regionalScore()[0], r2 = regionalScore()[1]; return { text: `Pelo índice de oportunidade regional preliminar, ${r.name} lidera (${r.score}/100), seguida de ${r2.name} (${r2.score}/100). O índice combina movimento (30%), concorrência (20%), tempo de saída (20%), preço (15%) e qualidade (15%). Confiança ${r.confidence.toLowerCase()} · amostra de ${r.sample} preços válidos. É um índice preliminar de demonstração.`, conf: r.confidence, sources: [{ label: 'Mercado por região', href: 'mercado.html' }, { label: 'Inteligência', href: 'inteligencia.html' }] }; }
    if (/(concorrent|lojista|revenda|loja)/.test(t)) { const d = dealerStats().sort((a, b) => b.cuts - a.cuts).slice(0, 3); return { text: `Concorrentes que mais reduziram preço em 30 dias: ` + d.map(x => `${x.dealer.name} (${x.dealer.city}/${x.dealer.uf}) — ${x.cuts} reduções em ${x.count} anúncios`).join('; ') + '. Redução de preço é sinal, não prova de venda.', conf: 'Média', sources: [{ label: 'Concorrência', href: 'concorrencia.html' }] }; }
    if (/(fipe)/.test(t)) { const qd = quality(); return { text: `A FIPE cobre ${(qd.fipeCoverage * 100).toFixed(0)}% dos anúncios ativos (${qd.fipeCount.toLocaleString('pt-BR')} de ${qd.total.toLocaleString('pt-BR')}); carretas e implementos não existem na tabela. Nos anúncios vinculados, o preço médio está ${pct1(k.fipeDev)}% ${k.fipeDev >= 0 ? 'acima' : 'abaixo'} da FIPE (${k.fipeSample} preços válidos). ${quality().items.find(i => i.id === 'amb').count} vínculos ambíguos aguardam curadoria.`, conf: 'Média', sources: [{ label: 'Dados e FIPE', href: 'dados-e-fipe.html' }] }; }
    if (/(oportunidade|abaixo)/.test(t)) { const ins = insights().find(i => i.id === 'opp'); return ins ? { text: ins.title + '. ' + ins.text, conf: ins.ev.confianca, sources: [{ label: 'Comparador', href: ins.href }] } : { text: 'Não encontrei grupo com amostra suficiente abaixo da FIPE no recorte atual.', conf: 'Insuficiente', sources: [] }; }
    if (/(resumo|hoje|panorama|briefing|novidade)/.test(t)) { const top = insights().slice(0, 3); return { text: `Panorama de ${SCENARIO_DATE}: ${k.active.toLocaleString('pt-BR')} anúncios ativos em ${k.dealers} revendas e ${k.cities} cidades; ${k.entries48} entradas e ${k.exits48} saídas nas últimas 48 h. ` + top.map((i, n) => `${n + 1}) ${i.title}`).join(' · '), conf: 'Média', sources: [{ label: 'Hoje', href: 'hoje.html' }, { label: 'Inteligência', href: 'inteligencia.html' }] }; }
    return { text: 'Posso responder sobre: preço do seu veículo vs mercado e FIPE, regiões com melhor oportunidade, concorrentes que reduziram preço, cobertura FIPE, erros e inconsistências dos dados, oportunidades abaixo da FIPE e um panorama do dia. Reformule a pergunta usando um desses temas.', conf: '—', sources: [] };
  };

  window.OperDemo = { SCENARIO_DATE, UFS, UF_NAMES, CITIES, PERIODS, PERIOD_LABEL, MODELS, dealers, active, exits, pending, own, collection, filter, kpis, groupModels, byUF, byCity, dealerStats,
    regionalScore, ownAnalysis, quality, insights, feed, answer, qualified, median, brl, confidence };
})();
