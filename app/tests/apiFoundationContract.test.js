import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('API adiciona request_id e metadados sem remover o payload legado', () => {
  const config = readFileSync(resolve(root, 'oper-radar-api', 'config.php'), 'utf8');
  assert.match(config, /function oper_request_id\(\): string/);
  assert.match(config, /\$dados\['_meta'\] = oper_api_meta\(\$metaExistente\);/);
  assert.match(config, /header\('X-Request-ID: ' \./);
  assert.doesNotMatch(config, /'dados'\s*=>\s*\$dados/);
});

test('mutação de curadoria usa autorização central e CSRF', () => {
  const detalhe = readFileSync(resolve(root, 'oper-radar-api', 'anuncio_detalhe.php'), 'utf8');
  assert.match(detalhe, /\$usuario = exige_papel\(\['admin', 'gestor'\]\);/);
  assert.match(detalhe, /exige_csrf\(\);/);
  assert.doesNotMatch(detalhe, /in_array\(\$usuario\['papel'\]/);
});
