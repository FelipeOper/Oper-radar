import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const DIR = '../evidence/temas';
const uri = f => 'data:image/png;base64,' + readFileSync(f).toString('base64');
const V = [['dark', 'Verde radar'], ['dourado', 'Dourado'], ['azul', 'Azul aço'], ['light', 'Claro']];
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 2400, height: 100 } });
for (const [tela, w] of [['hoje', 1440], ['mercado', 1440], ['minha-loja', 1440], ['oportunidades', 1440], ['configuracoes', 1440], ['hoje', 390]]) {
  const mob = w === 390;
  await p.setViewportSize({ width: mob ? 1700 : 2400, height: 100 });
  await p.setContent(`<body style="margin:0;background:#1e1e1e;color:#fff;font:600 22px Segoe UI,sans-serif">
    <div style="padding:20px 24px 4px;font-size:26px">App real · ${tela}${mob ? ' (mobile)' : ''}</div>
    <div style="display:grid;grid-template-columns:repeat(${mob ? 4 : 2},1fr);gap:18px;padding:16px 24px 24px">
    ${V.map(([v, t]) => `<div><div style="padding:0 0 10px">${t}</div><img src="${uri(`${DIR}/${v}-${w}-${tela}.png`)}" style="width:100%;display:block;border-radius:10px;border:1px solid #3a3a3a"></div>`).join('')}
    </div></body>`);
  await p.screenshot({ path: `${DIR}/prancha-${tela}${mob ? '-mobile' : ''}.png`, fullPage: true });
}
await b.close(); console.log('ok');
