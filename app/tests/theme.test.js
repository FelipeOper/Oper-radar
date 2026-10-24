import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { THEMES, DEFAULT_UI_PREFERENCES, migrateThemeId, nomeVariavelTema, resolveTheme, proximoTemaAlternado } from '../src/theme.js';

test('temas: verde radar (padrao), dourado, azul aco e claro', () => {
  assert.deepEqual(Object.keys(THEMES).sort(), ['azul', 'dark', 'dourado', 'light']);
  assert.equal(DEFAULT_UI_PREFERENCES.theme, 'dark');
  assert.equal(THEMES.dark.label, 'Verde radar');
  assert.equal(THEMES.dourado.mode, 'dark');
  assert.equal(THEMES.azul.mode, 'dark');
  assert.equal(THEMES.light.mode, 'light');
});

test('todos os temas mantem as mesmas chaves de token', () => {
  const chaves = Object.keys(THEMES.dark.tokens).sort();
  for (const tema of Object.values(THEMES)) assert.deepEqual(Object.keys(tema.tokens).sort(), chaves, tema.id);
});

test('alternar claro/escuro volta para o ultimo tema escuro escolhido', () => {
  assert.deepEqual(proximoTemaAlternado('dourado', null), { theme: 'light', ultimoEscuro: 'dourado' });
  assert.deepEqual(proximoTemaAlternado('light', 'dourado'), { theme: 'dourado', ultimoEscuro: 'dourado' });
  assert.deepEqual(proximoTemaAlternado('light', null), { theme: 'dark', ultimoEscuro: null });
  assert.deepEqual(proximoTemaAlternado('light', 'inexistente'), { theme: 'dark', ultimoEscuro: null });
  assert.deepEqual(proximoTemaAlternado('dark', 'azul'), { theme: 'light', ultimoEscuro: 'dark' });
});

test('preferencias antigas migram para os temas do design system', () => {
  assert.equal(migrateThemeId('radar'), 'dark');
  assert.equal(migrateThemeId('white'), 'light');
  assert.equal(migrateThemeId('dark'), 'dark');
  assert.equal(migrateThemeId('light'), 'light');
  assert.equal(migrateThemeId('dourado'), 'dourado');
  assert.equal(migrateThemeId('azul'), 'azul');
  assert.equal(migrateThemeId('auto'), 'auto');
  assert.equal(migrateThemeId('inexistente'), null);
});

test('resolveTheme segue o aparelho no automatico e cai no padrao se invalido', () => {
  assert.equal(resolveTheme('auto', true), 'dark');
  assert.equal(resolveTheme('auto', false), 'light');
  assert.equal(resolveTheme('white', true), 'light');
  assert.equal(resolveTheme('lixo', true), 'dark');
});

test('nome da variável CSS de cada token: camelCase e número viram hífen (surface2 -> --or-surface-2)', () => {
  assert.equal(nomeVariavelTema('surface2'), '--or-surface-2');
  assert.equal(nomeVariavelTema('surface3'), '--or-surface-3');
  assert.equal(nomeVariavelTema('inkMuted'), '--or-ink-muted');
  assert.equal(nomeVariavelTema('bg'), '--or-bg');
});

test('toda variável --or-<nome>-<n> usada no CSS é gerada por algum token de tema (senão fica presa no escuro)', () => {
  const css = readFileSync(new URL('../src/theme.css', import.meta.url), 'utf8');
  const usadas = new Set([...css.matchAll(/var\(\s*(--or-[a-z]+-\d+)/g)].map(m => m[1]));
  const geradas = new Set(Object.keys(THEMES.light.tokens).map(nomeVariavelTema));
  assert.ok(usadas.size > 0);
  for (const nome of usadas) assert.ok(geradas.has(nome), `${nome} não é gerada por nenhum token de tema`);
});
