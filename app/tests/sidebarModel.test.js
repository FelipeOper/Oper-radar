import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHAVE_SIDEBAR, PREFERENCIA_PADRAO, abreGrupoDaPagina, alternaGrupo, alternaRecolhida, grupoAberto,
  lePreferencia, salvaPreferencia,
} from '../src/sidebarModel.js';

const NAV = [
  { id: 'hoje', grupo: 'inteligencia' },
  { id: 'mercado', grupo: 'inteligencia' },
  { id: 'ajustes', grupo: 'preferencias' },
];

function armazenamento(inicial = {}) {
  const dados = { ...inicial };
  return { getItem: k => (k in dados ? dados[k] : null), setItem: (k, v) => { dados[k] = String(v); }, dados };
}

test('sem nada salvo, o menu abre expandido e com todos os grupos abertos', () => {
  assert.deepEqual(lePreferencia(armazenamento()), PREFERENCIA_PADRAO);
  assert.equal(grupoAberto(PREFERENCIA_PADRAO, 'inteligencia'), true);
  assert.equal(PREFERENCIA_PADRAO.recolhida, false);
});

test('lê e grava a preferência', () => {
  const s = armazenamento();
  assert.equal(salvaPreferencia(s, { recolhida: true, fechados: ['preferencias'] }), true);
  assert.deepEqual(lePreferencia(s), { recolhida: true, fechados: ['preferencias'] });
});

test('valor salvo corrompido ou de formato errado cai no padrão, sem quebrar', () => {
  assert.deepEqual(lePreferencia(armazenamento({ [CHAVE_SIDEBAR]: '{nao e json' })), PREFERENCIA_PADRAO);
  assert.deepEqual(lePreferencia(armazenamento({ [CHAVE_SIDEBAR]: '{"recolhida":"sim","fechados":"x"}' })), PREFERENCIA_PADRAO);
  assert.deepEqual(lePreferencia(armazenamento({ [CHAVE_SIDEBAR]: '{"recolhida":true,"fechados":[1,"a"]}' })), { recolhida: true, fechados: ['a'] });
});

test('armazenamento bloqueado ou ausente não derruba a tela', () => {
  const bloqueado = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); } };
  assert.deepEqual(lePreferencia(bloqueado), PREFERENCIA_PADRAO);
  assert.equal(salvaPreferencia(bloqueado, PREFERENCIA_PADRAO), false);
  assert.deepEqual(lePreferencia(undefined), PREFERENCIA_PADRAO);
  assert.equal(salvaPreferencia(undefined, PREFERENCIA_PADRAO), false);
});

test('alternar grupo fecha e reabre sem mutar o original', () => {
  const fechado = alternaGrupo(PREFERENCIA_PADRAO, 'inteligencia');
  assert.equal(grupoAberto(fechado, 'inteligencia'), false);
  assert.equal(grupoAberto(fechado, 'preferencias'), true);
  assert.equal(grupoAberto(PREFERENCIA_PADRAO, 'inteligencia'), true);
  assert.equal(grupoAberto(alternaGrupo(fechado, 'inteligencia'), 'inteligencia'), true);
});

test('recolher e expandir a barra preserva os grupos fechados', () => {
  const pref = alternaRecolhida(alternaGrupo(PREFERENCIA_PADRAO, 'preferencias'));
  assert.equal(pref.recolhida, true);
  assert.deepEqual(pref.fechados, ['preferencias']);
  assert.equal(alternaRecolhida(pref).recolhida, false);
});

test('ir para uma página reabre o grupo dela e não mexe nos outros', () => {
  const pref = alternaGrupo(alternaGrupo(PREFERENCIA_PADRAO, 'inteligencia'), 'preferencias');
  const depois = abreGrupoDaPagina(pref, NAV, 'mercado');
  assert.equal(grupoAberto(depois, 'inteligencia'), true);
  assert.equal(grupoAberto(depois, 'preferencias'), false);
  assert.equal(abreGrupoDaPagina(pref, NAV, 'inexistente'), pref);
  assert.equal(abreGrupoDaPagina(PREFERENCIA_PADRAO, NAV, 'hoje'), PREFERENCIA_PADRAO);
});
