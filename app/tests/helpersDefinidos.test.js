import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

/* Regressao (beta, 24/09/2026): a tela Mercado quebrou com "fmtDataObservada is not defined" porque o helper
   foi removido junto com a Concorrencia antiga. Todo fmt*() usado num .jsx precisa estar definido ou importado nele. */
const dir = new URL('../src/', import.meta.url);

for (const arquivo of readdirSync(dir).filter(n => n.endsWith('.jsx'))) {
  test(`helpers fmt* usados em ${arquivo} estao definidos ou importados`, () => {
    const src = readFileSync(new URL(arquivo, dir), 'utf8');
    const usados = new Set([...src.matchAll(/(?<![.\w])(fmt[A-Z]\w*)\s*\(/g)].map(m => m[1]));
    for (const nome of usados) {
      const definido = new RegExp(String.raw`(?:const|let|function)\s+${nome}\b|import[^;]*\b${nome}\b`).test(src);
      assert.ok(definido, `${nome} e usado em ${arquivo} mas nao esta definido nem importado`);
    }
  });
}
