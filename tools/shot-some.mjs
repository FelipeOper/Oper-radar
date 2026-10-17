import { chromium } from 'playwright';
const [out, w, h, ...routes] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: +h } });
for (const r of routes) { await p.goto('http://127.0.0.1:5180/oper-radar' + r, { waitUntil: 'networkidle' }); await p.waitForTimeout(600);
  await p.screenshot({ path: `${out}/${w}-${(r === '/' ? 'hoje' : r.slice(1))}.png`, fullPage: false }); }
await b.close();
