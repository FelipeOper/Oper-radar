import { chromium } from 'playwright';
// Regua dos achados da revisao final. Cada bloco reproduz um achado; exit 1 enquanto houver falha.
const BASE = 'http://127.0.0.1:5180/oper-radar';
const falhas = [];
const b = await chromium.launch();
function lum(rgb) { const [r, g, bl] = rgb.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * bl; }
const contraste = (a, c) => { const [x, y] = [lum(a), lum(c)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
async function pagina(w, h, tema, rota) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(t => localStorage.setItem('oper-radar-ui-preferences-v1', JSON.stringify({ theme: t })), tema);
  const p = await ctx.newPage(); await p.goto(BASE + rota, { waitUntil: 'networkidle' }); await p.waitForTimeout(400); return [ctx, p];
}
// 1. placa: 17px no desktop, 15px no celular
for (const [w, esperado] of [[1440, '17px'], [390, '15px']]) {
  const [c, p] = await pagina(w, 900, 'dark', '/fipe');
  const fs = await p.$eval('input[aria-label="Placa do veículo"]', e => getComputedStyle(e).fontSize);
  if (fs !== esperado) falhas.push(`#1 placa ${w}px: font-size ${fs}, esperado ${esperado}`); await c.close();
}
// 2. comparador em 1100px: nenhum campo com menos de 200px
{ const [c, p] = await pagina(1100, 800, 'dark', '/comparador');
  const larg = await p.$$eval('.oc-cmp__campos select', s => s.map(e => Math.round(e.getBoundingClientRect().width)));
  if (larg.some(v => v < 200)) falhas.push(`#2 comparador 1100px: larguras ${larg.join(',')}`); await c.close(); }
// 3. contagem da UF selecionada legivel (>= 4.5:1)
for (const tema of ['dark', 'light']) {
  const [c, p] = await pagina(1440, 900, tema, '/oportunidades');
  await p.getByRole('button', { name: /^Sul/ }).first().click(); await p.waitForTimeout(300);
  await p.locator('button[aria-pressed]').filter({ hasText: /^PR/ }).first().click(); await p.waitForTimeout(300);
  const r = await p.evaluate(() => { const bt = [...document.querySelectorAll('button[aria-pressed="true"]')].find(x => /^PR/.test(x.textContent.trim())); if (!bt) return null;
    const sp = [...bt.querySelectorAll('span')].pop(); return { fg: getComputedStyle(sp).color, op: getComputedStyle(sp).opacity, bg: getComputedStyle(bt).backgroundColor }; });
  if (!r) { falhas.push(`#3 ${tema}: botao PR selecionado nao encontrado`); await c.close(); continue; }
  const fg = r.fg.replace(/rgba?\(([^)]+)\)/, (_, v) => { const [R, G, B] = v.split(',').map(Number); const bgv = r.bg.match(/[\d.]+/g).map(Number); const o = Number(r.op);
    return `rgb(${R * o + bgv[0] * (1 - o)},${G * o + bgv[1] * (1 - o)},${B * o + bgv[2] * (1 - o)})`; });
  const k = contraste(fg, r.bg); if (k < 4.5) falhas.push(`#3 ${tema}: contagem da UF ${k.toFixed(2)}:1`); await c.close();
}
// 4. azul: texto do botao primario >= 4.5:1
{ const [c, p] = await pagina(1440, 900, 'azul', '/mercado');
  const r = await p.$eval('.or-refine-btn', e => ({ fg: getComputedStyle(e).color, bg: getComputedStyle(e).backgroundColor }));
  const k = contraste(r.fg, r.bg); if (k < 4.5) falhas.push(`#4 azul: Refinar resultados ${k.toFixed(2)}:1`); await c.close(); }
// 5. barra neutra x barra destaque: contraste >= 2:1 em todos os temas
for (const tema of ['dark', 'dourado', 'azul', 'light']) {
  const [c, p] = await pagina(1440, 900, tema, '/mercado');
  const cores = await p.$$eval('.oc-oferta-linha > span:nth-child(2) > span', s => s.map(e => getComputedStyle(e).backgroundColor));
  const destaque = cores.find(x => !/rgba\(.*,\s*0\.\d+\)$/.test(x) && !x.includes('0.'));
  const neutra = cores.find(x => x !== destaque);
  const fundo = await p.$eval('.oc-oferta-linha', e => getComputedStyle(e.closest('.or-card') || document.body).backgroundColor);
  const sol = x => { const v = x.match(/[\d.]+/g).map(Number); if (v.length < 4) return x; const f = fundo.match(/[\d.]+/g).map(Number); return `rgb(${v[0] * v[3] + f[0] * (1 - v[3])},${v[1] * v[3] + f[1] * (1 - v[3])},${v[2] * v[3] + f[2] * (1 - v[3])})`; };
  if (!destaque || !neutra || neutra === 'rgba(0, 0, 0, 0)') falhas.push(`#5 ${tema}: cores ${cores.join(' | ')}`);
  else { const k = contraste(sol(destaque), sol(neutra)); if (k < 2) falhas.push(`#5 ${tema}: destaque x neutra ${k.toFixed(2)}:1`); }
  await c.close();
}
// 6. valor de KPI no celular nao quebra dentro dos digitos
{ const [c, p] = await pagina(390, 844, 'dark', '/mercado');
  const ow = await p.$eval('.or-panorama-cards .or-stat__value', e => getComputedStyle(e).overflowWrap);
  if (ow !== 'normal') falhas.push(`#6 KPI mobile overflow-wrap ${ow}`); await c.close(); }
// 8. analise em 1024px: blocos com pelo menos 400px
{ const [c, p] = await pagina(1024, 768, 'dark', '/analise');
  const larg = await p.$$eval('.oc-analise-blocos > *', s => s.map(e => Math.round(e.getBoundingClientRect().width)));
  if (larg.some(v => v < 400)) falhas.push(`#8 analise 1024px: larguras ${larg.join(',')}`); await c.close(); }
await b.close();
console.log(falhas.length ? falhas.join('\n') : 'OK - achados da revisao resolvidos');
process.exit(falhas.length ? 1 : 0);
