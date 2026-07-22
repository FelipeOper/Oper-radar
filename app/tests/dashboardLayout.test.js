import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_DASHBOARD_LAYOUT,
  layoutFromPreset,
  moveDashboardItem,
  normalizeDashboardLayout,
} from '../src/dashboardLayout.js';

test('normaliza um layout inválido para o padrão', () => {
  assert.deepEqual(normalizeDashboardLayout({ kpis: [], sections: [] }), DEFAULT_DASHBOARD_LAYOUT);
});

test('remove itens desconhecidos e duplicados', () => {
  const layout = normalizeDashboardLayout({
    kpis: ['anuncios', 'desconhecido', 'anuncios'],
    sections: [{ id: 'feed', size: 'wide' }, { id: 'feed' }, { id: 'fantasma' }],
  });
  assert.deepEqual(layout.kpis, ['anuncios']);
  assert.deepEqual(layout.sections, [{ id: 'feed', size: 'wide' }]);
});

test('presets retornam cópias independentes', () => {
  const primeiro = layoutFromPreset('comercial');
  primeiro.kpis.pop();
  assert.notDeepEqual(primeiro, layoutFromPreset('comercial'));
});

test('move itens sem alterar a lista original', () => {
  const original = ['a', 'b', 'c'];
  assert.deepEqual(moveDashboardItem(original, 1, -1), ['b', 'a', 'c']);
  assert.deepEqual(original, ['a', 'b', 'c']);
  assert.deepEqual(moveDashboardItem(original, 0, -1), original);
});
