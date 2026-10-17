import { chromium } from 'playwright';
const [out, w, h, r, y, nome] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +w, height: +h } });
await p.goto('http://127.0.0.1:5180/oper-radar' + r, { waitUntil: 'networkidle' }); await p.waitForTimeout(500);
await p.evaluate(y => document.getElementById('app-scroll-container')?.scrollTo(0, y) || window.scrollTo(0, y), +y); await p.waitForTimeout(300);
await p.screenshot({ path: `${out}/${nome}.png` }); await b.close();
