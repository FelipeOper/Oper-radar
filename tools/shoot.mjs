import { chromium } from 'playwright';
const BASE = 'http://127.0.0.1:5180/oper-radar';
const OUT = process.argv[2];
const ROUTES = ['', '/mercado', '/comparador', '/minha-loja', '/fipe', '/oportunidades', '/concorrencia', '/analise', '/acoes', '/configuracoes', '/conta'];
const VIEWS = [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844 }];
const browser = await chromium.launch();
const report = [];
for (const view of VIEWS) {
  const ctx = await browser.newContext({ viewport: { width: view.width, height: view.height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message.slice(0, 200)));
  for (const r of ROUTES) {
    const name = (r || '/hoje').replace(/\//g, '_').replace(/^_/, '');
    try {
      await page.goto(BASE + (r || '/'), { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(800);
      const file = `${OUT}/${view.name}-${name}.png`;
      await page.screenshot({ path: file, fullPage: true });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      report.push({ view: view.name, route: r || '/', file, horizontalOverflowPx: overflow });
    } catch (e) { report.push({ view: view.name, route: r || '/', error: e.message.slice(0, 150) }); }
  }
  report.push({ view: view.name, consoleErrors: errors.slice(0, 10) });
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(report, null, 1));
