import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('build usa base absoluta compatível com deep links aninhados', () => {
  const vite = readFileSync(resolve(appRoot, 'vite.config.js'), 'utf8');
  assert.match(vite, /base:\s*['"]\/oper-radar\/['"]/);
});

test('build publica fallback SPA restrito a /oper-radar/', () => {
  const htaccess = readFileSync(resolve(appRoot, 'public', '.htaccess'), 'utf8');
  assert.match(htaccess, /RewriteBase \/oper-radar\//);
  assert.match(htaccess, /RewriteRule \. \/oper-radar\/index\.html \[L\]/);
  assert.doesNotMatch(htaccess, /RewriteBase \/\s*$/m);
});
