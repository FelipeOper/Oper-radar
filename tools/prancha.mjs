import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const DIR = '../evidence/versoes';
const uri = f => 'data:image/png;base64,' + readFileSync(f).toString('base64');
const V = [['verde', 'A · Verde radar (design system v2)'], ['dourado', 'B · Dourado (oper-radar-2)'], ['azul', 'C · Azul aço (oper-radar-2)']];
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 2400, height: 100 } });
for (const tela of ['painel', 'simulador', 'chat', 'mobile']) {
  const mob = tela === 'mobile';
  await p.setViewportSize({ width: mob ? 1320 : 2400, height: 100 });
  await p.setContent(`<body style="margin:0;background:#1e1e1e;color:#fff;font:600 22px Segoe UI,sans-serif">
    <div style="padding:20px 24px 4px;font-size:26px">Tela: ${tela}</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;padding:16px 24px 24px">
    ${V.map(([v, t]) => `<div><div style="padding:0 0 10px">${t}</div><img src="${uri(`${DIR}/${v}-${tela}.png`)}" style="width:100%;display:block;border-radius:10px;border:1px solid #3a3a3a"></div>`).join('')}
    </div></body>`);
  await p.screenshot({ path: `${DIR}/prancha-${tela}.png`, fullPage: true });
}
await b.close(); console.log('ok');
