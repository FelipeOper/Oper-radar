import test from 'node:test';
import assert from 'node:assert/strict';
import { ORIGENS, montaAcao, normalizaAcao, normalizaAcoes, separaPendentesFeitas } from '../src/planoAcaoModel.js';

test('monta ação com título, origem e evidência; título vazio não vira ação', () => {
  const a = montaAcao({ titulo: 'Avaliar FH 540', origem: 'Oportunidades', evidencia: 'Curitiba/PR · R$ 440.000', href: 'https://exemplo.com/a' });
  assert.equal(a.titulo, 'Avaliar FH 540');
  assert.equal(a.origem, 'Oportunidades');
  assert.equal(a.evidencia, 'Curitiba/PR · R$ 440.000');
  assert.equal(a.href, 'https://exemplo.com/a');
  assert.equal(a.done, false);
  assert.match(a.id, /^local-/);
  assert.equal(montaAcao({ titulo: '  ' }), null);
  assert.equal(montaAcao({ titulo: '' }), null);
});

test('origem fora da lista vira Manual; lista bate com as páginas reais do produto', () => {
  assert.deepEqual(ORIGENS, ['Manual', 'Mercado', 'Minha Loja', 'Concorrência', 'Oportunidades', 'Análise', 'FIPE']);
  assert.equal(montaAcao({ titulo: 'x', origem: 'Inteligência' }).origem, 'Manual');
  assert.equal(montaAcao({ titulo: 'x' }).origem, 'Manual');
});

test('título e evidência têm limite de tamanho (nunca gravam texto sem fim no localStorage)', () => {
  const a = montaAcao({ titulo: 'x'.repeat(300), evidencia: 'y'.repeat(900) });
  assert.equal(a.titulo.length, 120);
  assert.equal(a.evidencia.length, 400);
});

test('href só aceita http/https externo ou caminho interno começando com "/"; qualquer outro esquema é descartado', () => {
  assert.equal(montaAcao({ titulo: 'x', href: 'https://exemplo.com/a' }).href, 'https://exemplo.com/a');
  assert.equal(montaAcao({ titulo: 'x', href: '/mercado?modelo=FH540' }).href, '/mercado?modelo=FH540');
  for (const ruim of ['javascript:alert(1)', 'data:text/html,x', '//exemplo.com', undefined, null]) {
    assert.equal(montaAcao({ titulo: 'x', href: ruim }).href, '');
  }
});

test('normalizaAcao migra o formato antigo (texto/feita) sem perder a ação', () => {
  const migrada = normalizaAcao({ id: 'local-1', texto: 'Ação antiga', feita: true, criadaEm: '2026-09-01T10:00:00.000Z' });
  assert.equal(migrada.titulo, 'Ação antiga');
  assert.equal(migrada.done, true);
  assert.equal(migrada.origem, 'Manual');
  assert.equal(migrada.criadaEm, '2026-09-01T10:00:00.000Z');
});

test('normalizaAcoes descarta lixo (não array, item sem título) sem lançar exceção', () => {
  assert.deepEqual(normalizaAcoes(null), []);
  assert.deepEqual(normalizaAcoes('nao é lista'), []);
  assert.equal(normalizaAcoes([{ titulo: 'ok' }, {}, { titulo: '   ' }, null, 42]).length, 1);
});

test('separaPendentesFeitas divide pelas duas listas sem perder nem duplicar item', () => {
  const acoes = [montaAcao({ titulo: 'a' }), { ...montaAcao({ titulo: 'b' }), done: true }, montaAcao({ titulo: 'c' })];
  const { pendentes, feitas } = separaPendentesFeitas(acoes);
  assert.equal(pendentes.length, 2);
  assert.equal(feitas.length, 1);
  assert.equal(pendentes.length + feitas.length, acoes.length);
});
