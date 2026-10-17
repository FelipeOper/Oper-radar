import { chromium } from 'playwright';
const OUT = '../evidence/versoes';
const b = await chromium.launch();
const erros = [];
for (const v of ['verde', 'dourado', 'azul']) {
  for (const [tela, w, h, nome] of [['painel', 1440, 900, 'painel'], ['simulador', 1440, 900, 'simulador'], ['chat', 1440, 900, 'chat'], ['painel', 390, 844, 'mobile']]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    p.on('pageerror', e => erros.push(e.message)); p.on('requestfailed', r => erros.push('FAIL ' + r.url()));
    await p.goto(`http://127.0.0.1:5182/prototipos/versoes.html?v=${v}&tela=${tela}`, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (ov > 0) erros.push(`${v} ${nome} overflow ${ov}`);
    await p.screenshot({ path: `${OUT}/${v}-${nome}.png` });
    await p.close();
  }
}
await b.close();
console.log(erros.length ? erros.join('\n') : 'ok sem erros');
