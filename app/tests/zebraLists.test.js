import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const app = readFileSync(resolve(here, '../src/App.jsx'), 'utf8');
const css = readFileSync(resolve(here, '../src/theme.css'), 'utf8');

test('listagens usam separação zebrada compatível com todos os temas', () => {
  assert.match(css, /\.or-zebra-list\s*>\s*:nth-child\(odd\)/);
  assert.match(css, /\.or-zebra-list\s*>\s*:nth-child\(even\)/);
  assert.match(css, /var\(--or-surface\)/);
  assert.match(css, /var\(--or-surface-2\)/);
  assert.match(app, /var\(--or-zebra-bg/);
  assert.ok((app.match(/className="or-zebra-list/g) || []).length >= 20);
});
