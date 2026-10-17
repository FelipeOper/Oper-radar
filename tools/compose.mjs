import { chromium } from 'playwright';
import { readFileSync, mkdirSync } from 'node:fs';
const [antesDir, depoisDir, outDir, ...nomes] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 560 } });
const uri = f => 'data:image/png;base64,' + readFileSync(f).toString('base64');
for (const n of nomes) {
  const mobile = n.startsWith('mobile');
  await p.setContent(`<html><body style="margin:0;background:#2a2a2a;font:600 18px Inter,Segoe UI,sans-serif;color:#fff">
  <div style="display:flex;gap:16px;padding:16px">${[['ANTES', antesDir], ['DEPOIS (Fase 1)', depoisDir]].map(([t, d]) => `
   <div style="flex:1"><div style="padding:0 0 8px">${t} · ${n}</div>
   <div style="aspect-ratio:${mobile ? "390/844" : "1440/900"};overflow:hidden;border-radius:8px;border:1px solid #444"><img src="${uri(`${d}/${n}.png`)}" style="width:100%;display:block"></div></div>`).join('')}
  </div></body></html>`);
  await p.setViewportSize({ width: mobile ? 860 : 1600, height: 100 });
  await p.screenshot({ path: `${outDir}/${n}.png`, fullPage: true });
}
await b.close();
