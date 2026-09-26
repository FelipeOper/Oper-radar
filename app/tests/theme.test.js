import test from 'node:test';
import assert from 'node:assert/strict';
import { THEMES, DEFAULT_UI_PREFERENCES, migrateThemeId, resolveTheme } from '../src/theme.js';

test('design system define apenas os temas escuro e claro', () => {
  assert.deepEqual(Object.keys(THEMES).sort(), ['dark', 'light']);
  assert.equal(DEFAULT_UI_PREFERENCES.theme, 'dark');
});

test('temas do design system mantem as mesmas chaves de token', () => {
  assert.deepEqual(Object.keys(THEMES.dark.tokens).sort(), Object.keys(THEMES.light.tokens).sort());
});

test('preferencias antigas migram para os temas do design system', () => {
  assert.equal(migrateThemeId('radar'), 'dark');
  assert.equal(migrateThemeId('white'), 'light');
  assert.equal(migrateThemeId('dark'), 'dark');
  assert.equal(migrateThemeId('light'), 'light');
  assert.equal(migrateThemeId('auto'), 'auto');
  assert.equal(migrateThemeId('inexistente'), null);
});

test('resolveTheme segue o aparelho no automatico e cai no padrao se invalido', () => {
  assert.equal(resolveTheme('auto', true), 'dark');
  assert.equal(resolveTheme('auto', false), 'light');
  assert.equal(resolveTheme('white', true), 'light');
  assert.equal(resolveTheme('lixo', true), 'dark');
});
