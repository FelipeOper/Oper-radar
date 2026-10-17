import { chromium } from 'playwright';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => localStorage.setItem('oper-radar-ui-preferences-v1', JSON.stringify({ theme: 'dourado' })));
const p = await ctx.newPage(); await p.goto('http://127.0.0.1:5180/oper-radar/configuracoes', { waitUntil: 'networkidle' }); await p.waitForTimeout(500);
const el = p.getByText('Dourado', { exact: true }).first(); await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
await p.screenshot({ path: '../evidence/temas/dourado-configuracoes-aparencia.png' }); await b.close();
