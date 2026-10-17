import { chromium } from 'playwright';
const [out, w, h, theme, ...routes] = process.argv.slice(2);
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: +w, height: +h } });
await ctx.addInitScript(t => { try { const k = 'oper-radar-ui-preferences-v1'; const v = JSON.parse(localStorage.getItem(k) || '{}'); v.theme = t; localStorage.setItem(k, JSON.stringify(v)); } catch {} }, theme);
const p = await ctx.newPage();
for (const r of routes) { await p.goto('http://127.0.0.1:5180/oper-radar' + r, { waitUntil: 'networkidle' }); await p.waitForTimeout(600);
  await p.screenshot({ path: `${out}/${theme}-${w}-${r === '/' ? 'hoje' : r.slice(1)}.png` }); }
await b.close();
