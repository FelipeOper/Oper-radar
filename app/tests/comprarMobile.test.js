import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(resolve(here, '../src/theme.css'), 'utf8');

// T02: no mobile (<= 760 px) os alvos de toque de "O que comprar" ficam em >= 44 px (--hit-min).
// O regex procura o bloco @media com o escopo .oc-compra, para que o Comparador (.oc-cmp__modo) não seja alterado.
const bloco = css.match(/@media \(max-width: 760px\) \{\s*\.oc-compra__ufs \.oc-cmp__modo,[\s\S]*?\n\}/);

test('Oportunidades: alvos de toque do mobile usam o piso --hit-min com escopo em .oc-compra', () => {
  assert.ok(bloco, 'bloco @media (max-width: 760px) de .oc-compra ausente');
  assert.match(bloco[0], /\.oc-compra__ufs \.oc-cmp__modo/);
  assert.match(bloco[0], /\.oc-compra \.oc-evidencia__botao/);
  assert.match(bloco[0], /\.oc-compra \.or-btn\s*\{\s*min-height:\s*var\(--hit-min\)/);
  assert.match(bloco[0], /\.oc-compra__comp summary\s*\{\s*padding-block:\s*13px/);
});

test('Oportunidades: o resumo de "Por que esta nota" não usa display:flex (esconderia o marcador do details)', () => {
  assert.doesNotMatch(bloco[0], /summary\s*\{[^}]*display:\s*flex/);
});

test('Oportunidades: a regra mobile não vaza para o Comparador nem para a evidência das outras telas', () => {
  const semComentarios = bloco[0].replace(/\/\*[\s\S]*?\*\//g, '');
  const seletores = [...semComentarios.matchAll(/([^{}]+)\{/g)].slice(1).flatMap(m => m[1].split(',')).map(s => s.trim()).filter(Boolean);
  assert.ok(seletores.length === 4, 'seletores do bloco não encontrados');
  for (const s of seletores) assert.match(s, /^\.oc-compra/, `seletor sem escopo .oc-compra: ${s}`);
});
