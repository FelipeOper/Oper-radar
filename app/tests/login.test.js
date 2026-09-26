import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const src = resolve(dirname(fileURLToPath(import.meta.url)), '../src');
const login = readFileSync(resolve(src, 'Login.jsx'), 'utf8');
const app = readFileSync(resolve(src, 'App.jsx'), 'utf8');

test('login no layout do Beta: painel de marca, formulario e classes do design system', () => {
  ['oc-login__marca', 'oc-login__painel', 'or-field', 'or-input or-input--lg', 'or-btn or-btn--primary or-btn--lg or-btn--block'].forEach(c => assert.ok(login.includes(c), c));
  assert.match(login, /Inteligência para decidir/);
  assert.match(login, /Entrar no radar/);
});

test('login mantem acessibilidade e credenciais: autocomplete, required, alerta de erro', () => {
  assert.match(login, /autoComplete="username"/);
  assert.match(login, /autoComplete="current-password"/);
  assert.equal((login.match(/required/g) || []).length, 2);
  assert.match(login, /role="alert"/);
  assert.match(login, /disabled=\{enviando\}/);
});

test('login real nao carrega texto de demonstracao e a autenticacao continua em App.jsx', () => {
  assert.doesNotMatch(login, /demonstra[cç][aã]o|fict[ií]cio/i);
  assert.match(app, /apiPost\('auth\.php', \{ acao: 'login', email, senha \}\)/);
  assert.match(app, /<LoginLayout /);
});
