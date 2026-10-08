// Oper Radar admin — sample data (fictional; realistic shapes for the truck/implement market in BR)
window.OR_DATA = (() => {
  const fmtBRL = (v) => 'R$ ' + v.toLocaleString('pt-BR');
  const sources = [
    { id: 'olx', name: 'OLX', ads: 7812, status: 'live', last: 'há 2 min', share: 42, on: true },
    { id: 'ml', name: 'Mercado Livre', ads: 5806, status: 'live', last: 'há 4 min', share: 31, on: true },
    { id: 'wm', name: 'Webmotors', ads: 2143, status: 'warning', last: 'há 3 h', share: 11, on: true },
    { id: 'cc', name: 'Caminhões e Carretas', ads: 1590, status: 'live', last: 'há 9 min', share: 8, on: true },
    { id: 'sc', name: 'Só Caminhões', ads: 902, status: 'live', last: 'há 12 min', share: 5, on: true },
    { id: 'np', name: 'Na Pista', ads: 489, status: 'idle', last: 'ontem 23:10', share: 3, on: false },
  ];
  const listings = [
    { id: 1, model: 'Scania R450 6x2', brand: 'Scania', year: 2021, km: 312000, price: 489900, fipe: 552000, src: 'OLX', city: 'Curitiba/PR', dealer: 'Transnorte Seminovos', status: 'drop', days: 3, hist: [540, 535, 528, 520, 510, 498, 490] },
    { id: 2, model: 'Volvo FH 540 6x4', brand: 'Volvo', year: 2020, km: 402000, price: 512000, fipe: 575000, src: 'Webmotors', city: 'Campinas/SP', dealer: 'Rodoeste Caminhões', status: 'new', days: 0, hist: [512, 512, 512, 512, 512, 512, 512] },
    { id: 3, model: 'MB Actros 2651 6x4', brand: 'Mercedes-Benz', year: 2019, km: 455000, price: 398500, fipe: 410000, src: 'Mercado Livre', city: 'Goiânia/GO', dealer: 'Central Diesel', status: 'stable', days: 18, hist: [399, 399, 398, 398, 398, 398, 398] },
    { id: 4, model: 'DAF XF 480 6x2', brand: 'DAF', year: 2022, km: 198000, price: 578000, fipe: 610000, src: 'OLX', city: 'Uberlândia/MG', dealer: 'Particular', status: 'opportunity', days: 1, hist: [600, 598, 590, 585, 580, 578, 578] },
    { id: 5, model: 'VW Constellation 24.280', brand: 'Volkswagen', year: 2018, km: 520000, price: 259000, fipe: 268000, src: 'Caminhões e Carretas', city: 'Chapecó/SC', dealer: 'Oeste Pesados', status: 'stable', days: 26, hist: [262, 261, 260, 259, 259, 259, 259] },
    { id: 6, model: 'Iveco S-Way 540 6x4', brand: 'Iveco', year: 2023, km: 96000, price: 689000, fipe: 705000, src: 'Mercado Livre', city: 'Cuiabá/MT', dealer: 'Matogrosso Trucks', status: 'new', days: 0, hist: [689, 689, 689, 689, 689, 689, 689] },
    { id: 7, model: 'Scania R540 6x4', brand: 'Scania', year: 2020, km: 388000, price: 468000, fipe: 530000, src: 'Só Caminhões', city: 'Rondonópolis/MT', dealer: 'Transnorte Seminovos', status: 'opportunity', days: 5, hist: [530, 520, 505, 495, 482, 470, 468] },
    { id: 8, model: 'Volvo FH 460 6x2', brand: 'Volvo', year: 2019, km: 478000, price: 402000, fipe: 415000, src: 'OLX', city: 'Londrina/PR', dealer: 'Particular', status: 'sold', days: 41, hist: [420, 418, 415, 410, 405, 402, 402] },
  ];
  const alerts = [
    { id: 'a1', tone: 'success', icon: 'lightning', title: 'Oportunidade: Scania R540 6x4', desc: '11,7% abaixo da FIPE · Rondonópolis/MT', time: '08:42', unread: true, rule: 'Abaixo da FIPE > 10%' },
    { id: 'a2', tone: 'warning', icon: 'trend-down', title: 'Preço caiu: Scania R450 6x2', desc: 'R$ 510.000 → R$ 489.900 (−3,9%)', time: '07:15', unread: true, rule: 'Queda de preço > 3%' },
    { id: 'a3', tone: 'danger', icon: 'plugs', title: 'Webmotors sem resposta', desc: 'Coleta atrasada há 3 h — 3 tentativas', time: '06:02', unread: true, rule: 'Saúde das fontes' },
    { id: 'a4', tone: 'info', icon: 'storefront', title: 'Novo lojista: Matogrosso Trucks', desc: '38 anúncios publicados · Cuiabá/MT', time: 'Ontem', unread: false, rule: 'Novos concorrentes' },
    { id: 'a5', tone: 'success', icon: 'lightning', title: 'Oportunidade: DAF XF 480 6x2', desc: '5,2% abaixo da FIPE · Uberlândia/MG', time: 'Ontem', unread: false, rule: 'Abaixo da FIPE > 5%' },
  ];
  const daily = [410, 452, 438, 501, 476, 520, 498, 560, 544, 588, 602, 571, 640, 622, 655, 690, 648, 702, 731, 710, 754, 769, 742, 801, 788, 824, 812, 856, 870, 884];
  const prev = [380, 402, 395, 420, 410, 432, 440, 452, 448, 470, 466, 480, 492, 488, 505, 512, 508, 520, 531, 528, 540, 552, 548, 560, 566, 571, 580, 588, 594, 602];
  const byBrand = [{ label: 'Scania', value: 4820 }, { label: 'Volvo', value: 4310 }, { label: 'MB', value: 3960 }, { label: 'VW', value: 2780 }, { label: 'DAF', value: 1620 }, { label: 'Iveco', value: 1252 }];
  return { fmtBRL, sources, listings, alerts, daily, prev, byBrand };
})();
