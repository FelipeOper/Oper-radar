import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://127.0.0.1:5180/oper-radar';
const ROUTES = ['/', '/mercado', '/comparador', '/minha-loja', '/fipe', '/oportunidades', '/concorrencia', '/analise', '/acoes', '/configuracoes', '/conta'];
const falhas = [];
const b = await chromium.launch();

async function medir(vw, vh, nome) {
  const p = await b.newPage({ viewport: { width: vw, height: vh } });
  for (const r of ROUTES) {
    await p.goto(BASE + r, { waitUntil: 'networkidle' });
    await p.waitForTimeout(500);
    const m = await p.evaluate(() => {
      const out = {};
      out.overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      // 1. select cortado: texto da opcao escolhida mais largo que a area util
      const ctx = document.createElement('canvas').getContext('2d');
      out.selectsCortados = [...document.querySelectorAll('select')].filter(s => s.offsetParent).filter(s => {
        const cs = getComputedStyle(s);
        ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        const texto = s.options[s.selectedIndex]?.text || '';
        const util = s.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        return ctx.measureText(texto).width > util + 1;
      }).map(s => s.getAttribute('aria-label') || s.options[s.selectedIndex]?.text);
      // 2. grid: a borda direita do conteudo tem de chegar a borda util do <main>
      const main = document.querySelector('.oc-main');
      const mr = main.getBoundingClientRect();
      const direitaUtil = mr.right - parseFloat(getComputedStyle(main).paddingRight);
      // caixa = elemento visivel com borda ou fundo proprio (pega <Card> com estilo inline, nao so .or-card)
      const caixas = [...main.querySelectorAll('*')].filter(e => {
        if (!e.offsetParent) return false;
        const cs = getComputedStyle(e);
        return parseFloat(cs.borderTopWidth) > 0 || (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent');
      });
      out.folgaDireita = caixas.length ? Math.round(direitaUtil - Math.max(...caixas.map(c => c.getBoundingClientRect().right))) : 0;
      // 3. lista vazia sem mensagem
      out.listasVazias = [...main.querySelectorAll('.or-zebra-list')].filter(l => l.offsetParent && l.children.length === 0).length;
      // 4. texto com reticencias em abas
      out.abasTruncadas = [...main.querySelectorAll('[role=tablist] *')].filter(e => e.offsetParent && e.children.length === 0 && e.scrollWidth > e.clientWidth + 1).map(e => e.textContent.trim()).slice(0, 5);
      // 5. titulo do topo encostando no status (16px: o anel pulsante do RadarPulse vaza ~8px para fora da caixa)
      const t = document.querySelector('.or-topbar__title'); const s = document.querySelector('.oc-topbar-status');
      if (t && s && s.offsetParent) {
        const h = [...t.querySelectorAll('*')].filter(e => e.children.length === 0 && e.textContent.trim()).pop() || t;
        const rng = document.createRange(); rng.selectNodeContents(h);
        const a = rng.getBoundingClientRect(), c = s.getBoundingClientRect();
        out.respiroTitulo = Math.round(c.left - a.right);
      }
      return out;
    });
    const tag = `${nome} ${r}`;
    if (m.overflow > 0) falhas.push(`${tag}: overflow horizontal ${m.overflow}px`);
    if (m.selectsCortados.length) falhas.push(`${tag}: select cortado -> ${m.selectsCortados.join(', ')}`);
    if (nome === 'desktop' && m.folgaDireita > 24) falhas.push(`${tag}: grid termina ${m.folgaDireita}px antes da borda`);
    if (m.listasVazias) falhas.push(`${tag}: ${m.listasVazias} lista(s) vazia(s) sem mensagem`);
    if (m.abasTruncadas.length) falhas.push(`${tag}: aba truncada -> ${m.abasTruncadas.join(' | ')}`);
    if (m.respiroTitulo != null && m.respiroTitulo < 16) falhas.push(`${tag}: titulo a ${m.respiroTitulo}px do status`);
  }
  await p.close();
}

await medir(1440, 900, 'desktop');
await medir(1024, 768, 'tablet');
await medir(390, 844, 'mobile');
await b.close();
console.log(falhas.length ? falhas.join('\n') : 'OK - nenhuma falha de layout');
process.exit(falhas.length ? 1 : 0);
