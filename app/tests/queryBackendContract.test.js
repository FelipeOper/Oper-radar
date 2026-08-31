import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = path => readFileSync(`${root}${path}`, 'utf8');

test('comparador resolve somente periodos permitidos e devolve janela explicita', () => {
  const contract = read('oper-radar-api/lib/query_contract.php');
  const endpoint = read('oper-radar-api/comparador.php');
  for (const periodo of ['7d', '30d', '90d', '180d', '12m']) {
    assert.match(contract, new RegExp(`'${periodo}'`));
  }
  assert.match(endpoint, /oper_periodo_contrato/);
  assert.match(endpoint, /AS entrada_periodo/);
  assert.match(endpoint, /'periodo' => \$periodo/);
});

test('paginacao keyset usa desempate por id e preserva fallback offset', () => {
  const endpoint = read('oper-radar-api/anuncios.php');
  assert.match(endpoint, /'recente'.*a\.id DESC/);
  assert.match(endpoint, /'mais_tempo'.*a\.id ASC/);
  assert.match(endpoint, /cursor_supported/);
  assert.match(endpoint, /proximo_cursor/);
  assert.match(endpoint, /\$limit \+ 1/);
  assert.match(endpoint, /pagination_mode.*cursor.*offset/);
});

test('grupo equivalente permanece opaco e inapto para recomendacao', () => {
  const contract = read('oper-radar-api/lib/equivalent_group.php');
  assert.match(contract, /'regras' => null/);
  assert.match(contract, /'calculavel' => false/);
  assert.match(contract, /'apto_para_recomendacao' => false/);
});
