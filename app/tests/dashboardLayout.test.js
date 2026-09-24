import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DASHBOARD_LAYOUT_VERSION,
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
    version: DASHBOARD_LAYOUT_VERSION,
  });
  assert.deepEqual(layout.kpis, ['anuncios']);
  assert.deepEqual(layout.sections, [{ id: 'feed', size: 'wide' }]);
});

test('layout salvo antes da versao 2 ganha insights depois do feed, sem mudar o resto', () => {
  const layout = normalizeDashboardLayout({
    preset: 'personalizado',
    kpis: ['anuncios'],
    sections: [{ id: 'modelos', size: 'half' }, { id: 'feed', size: 'wide' }, { id: 'regioes', size: 'half' }],
  });
  assert.deepEqual(layout.sections.map(item => item.id), ['modelos', 'feed', 'insights', 'regioes']);
  assert.equal(layout.version, DASHBOARD_LAYOUT_VERSION);
});

test('layout sem feed recebe insights no inicio e ja migrado nao e alterado de novo', () => {
  const semFeed = normalizeDashboardLayout({ kpis: ['anuncios'], sections: [{ id: 'modelos' }] });
  assert.deepEqual(semFeed.sections.map(item => item.id), ['insights', 'modelos']);
  const migrado = normalizeDashboardLayout(semFeed);
  assert.deepEqual(migrado.sections.map(item => item.id), ['insights', 'modelos']);
  const removidoDeProposito = normalizeDashboardLayout({ ...semFeed, sections: [{ id: 'modelos' }], version: DASHBOARD_LAYOUT_VERSION });
  assert.deepEqual(removidoDeProposito.sections.map(item => item.id), ['modelos']);
});

test('todos os presets incluem insights do dia', () => {
  ['executivo', 'comercial', 'enxuto'].forEach(id => {
    assert.ok(layoutFromPreset(id).sections.some(item => item.id === 'insights'), id);
  });
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
