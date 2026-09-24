export const APP_ROUTES = [
  { page: 'hoje', path: '/', title: 'Hoje' },
  { page: 'mercado', path: '/mercado', title: 'Mercado' },
  { page: 'comparador', path: '/comparador', title: 'Comparador' },
  { page: 'minha-loja', path: '/minha-loja', title: 'Minha Loja' },
  { page: 'fipe', path: '/fipe', title: 'FIPE' },
  { page: 'oportunidades', path: '/oportunidades', title: 'Oportunidades' },
  { page: 'concorrentes', path: '/concorrencia', title: 'Concorrência' },
  { page: 'analise', path: '/analise', title: 'Análise' },
  { page: 'acoes', path: '/acoes', title: 'Ações' },
  { page: 'ajustes', path: '/configuracoes', title: 'Configurações' },
  { page: 'conta', path: '/conta', title: 'Minha conta' },
];

export const DEFAULT_APP_CONTEXT = Object.freeze({
  periodo: '30d',
  mercado: 'principal',
  regiao: 'todas',
  uf: 'todas',
  cidade: 'todas',
  segmento: 'todas',
  grupo: null,
  marca: null,
  modelo: null,
  ano: null,
  busca: null,
  comparacao: null,
});

const ROUTE_BY_PAGE = new Map(APP_ROUTES.map(route => [route.page, route]));
const ROUTE_BY_PATH = new Map(APP_ROUTES.map(route => [route.path, route]));
const KNOWN_ROUTE_PATHS = APP_ROUTES
  .map(route => route.path)
  .filter(path => path !== '/')
  .sort((a, b) => b.length - a.length);
const PERIODOS = new Set(['7d', '30d', '90d', '180d', '12m']);
const MERCADOS = new Set(['principal', 'outros']);
const TODAS = new Set(['', 'todas', 'todos']);

// Aceita uma UF única ('SC') ou uma lista separada por vírgula ('SC,PR') — o painel
// Mercado permite multisseleção de UF (item 3 do redesign). Formato inválido cai em 'todas',
// siglas duplicadas são unificadas; a validação de sigla real (existe/não existe) é feita no
// backend (painel_normaliza_ufs em lib/market_scope.php), aqui só garante o formato XX,YY,...
function normalizeUfList(ufRaw) {
  if (!ufRaw || TODAS.has(ufRaw.toLowerCase())) return 'todas';
  const siglas = [...new Set(ufRaw.split(',').map(parte => parte.trim()).filter(parte => /^[A-Z]{2}$/.test(parte)))];
  return siglas.length ? siglas.join(',') : 'todas';
}

function cleanText(value, maxLength = 120) {
  if (value == null) return null;
  const text = String(value).trim().replace(/\s+/g, ' ');
  return text ? text.slice(0, maxLength) : null;
}

export function normalizeBasePath(value = '') {
  const base = String(value || '').trim();
  if (!base || base === '/' || base === './') return '';
  const withSlash = base.startsWith('/') ? base : `/${base}`;
  return withSlash.replace(/\/+$/, '');
}

export function detectBasePath(pathname = '/') {
  const path = `/${String(pathname || '/').replace(/^\/+|\/+$/g, '')}`;
  if (path === '/') return '';
  const routePath = KNOWN_ROUTE_PATHS.find(candidate => path === candidate || path.endsWith(candidate));
  if (routePath) return normalizeBasePath(path.slice(0, -routePath.length));
  return normalizeBasePath(path);
}

export function normalizeAppContext(input = {}) {
  const periodo = PERIODOS.has(input.periodo) ? input.periodo : DEFAULT_APP_CONTEXT.periodo;
  const mercado = MERCADOS.has(input.mercado) ? input.mercado : DEFAULT_APP_CONTEXT.mercado;
  const regiaoRaw = cleanText(input.regiao, 40);
  const ufRaw = cleanText(input.uf, 120)?.toUpperCase();
  const cidadeRaw = cleanText(input.cidade, 80);
  const segmentoRaw = cleanText(input.segmento, 60);
  const anoNumero = Number.parseInt(input.ano, 10);
  const ano = Number.isInteger(anoNumero) && anoNumero >= 1950 && anoNumero <= 2100
    ? String(anoNumero)
    : null;

  return {
    periodo,
    mercado,
    regiao: !regiaoRaw || TODAS.has(regiaoRaw.toLowerCase()) ? 'todas' : regiaoRaw,
    uf: normalizeUfList(ufRaw),
    cidade: !cidadeRaw || TODAS.has(cidadeRaw.toLowerCase()) ? 'todas' : cidadeRaw,
    segmento: !segmentoRaw || TODAS.has(segmentoRaw.toLowerCase()) ? 'todas' : segmentoRaw,
    grupo: cleanText(input.grupo, 120),
    marca: cleanText(input.marca, 80),
    modelo: cleanText(input.modelo, 120),
    ano,
    busca: cleanText(input.busca, 160),
    comparacao: cleanText(input.comparacao, 160),
  };
}

export function parseContext(search = '') {
  const params = new URLSearchParams(String(search || '').replace(/^\?/, ''));
  return normalizeAppContext(Object.fromEntries(params.entries()));
}

export function serializeContext(input = {}) {
  const context = normalizeAppContext(input);
  const params = new URLSearchParams();
  if (context.periodo !== DEFAULT_APP_CONTEXT.periodo) params.set('periodo', context.periodo);
  if (context.mercado !== DEFAULT_APP_CONTEXT.mercado) params.set('mercado', context.mercado);
  if (context.regiao !== 'todas') params.set('regiao', context.regiao);
  if (context.uf !== 'todas') params.set('uf', context.uf);
  if (context.cidade !== 'todas') params.set('cidade', context.cidade);
  if (context.segmento !== 'todas') params.set('segmento', context.segmento);
  for (const key of ['grupo', 'marca', 'modelo', 'ano', 'busca', 'comparacao']) {
    if (context[key]) params.set(key, context[key]);
  }
  return params.toString();
}

export function buildAppUrl(page, context = DEFAULT_APP_CONTEXT, basePath = '') {
  const route = ROUTE_BY_PAGE.get(page) || ROUTE_BY_PAGE.get('hoje');
  const base = normalizeBasePath(basePath);
  const pathname = route.path === '/' ? `${base}/` : `${base}${route.path}`;
  const query = serializeContext(context);
  return query ? `${pathname}?${query}` : pathname;
}

export function parseAppLocation(pathname = '/', search = '', configuredBasePath) {
  const basePath = configuredBasePath == null
    ? detectBasePath(pathname)
    : normalizeBasePath(configuredBasePath);
  const normalizedPath = `/${String(pathname || '/').replace(/^\/+|\/+$/g, '')}`;
  let relativePath = basePath && normalizedPath.startsWith(basePath)
    ? normalizedPath.slice(basePath.length)
    : normalizedPath;
  relativePath = `/${relativePath.replace(/^\/+|\/+$/g, '')}`;
  if (relativePath === '//') relativePath = '/';
  const route = ROUTE_BY_PATH.get(relativePath) || ROUTE_BY_PAGE.get('hoje');
  return {
    page: route.page,
    title: route.title,
    context: parseContext(search),
    basePath,
    notFound: !ROUTE_BY_PATH.has(relativePath),
  };
}

export function routeForPage(page) {
  return ROUTE_BY_PAGE.get(page) || ROUTE_BY_PAGE.get('hoje');
}

export function breadcrumbsFor(page, context = DEFAULT_APP_CONTEXT) {
  const route = routeForPage(page);
  const items = [{ label: 'OPER RADAR', page: 'hoje' }];
  if (route.page !== 'hoje') items.push({ label: route.title, page: route.page });
  if (route.page === 'mercado') {
    const normalized = normalizeAppContext(context);
    if (normalized.uf !== 'todas') items.push({ label: normalized.uf.split(',').join(', ') });
    if (normalized.cidade !== 'todas') items.push({ label: normalized.cidade });
  }
  return items;
}
