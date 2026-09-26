import test from 'node:test';
import assert from 'node:assert/strict';
import { urlSegura } from '../src/urlSegura.js';
import { urlSegura as reexportada } from '../src/comprarModel.js';

test('aceita http e https, com espaços nas pontas e maiúsculas no esquema', () => {
  assert.equal(urlSegura('https://exemplo.com/a?y=1'), 'https://exemplo.com/a?y=1');
  assert.equal(urlSegura('  https://exemplo.com/a  '), 'https://exemplo.com/a');
  assert.equal(urlSegura('HTTP://exemplo.com'), 'http://exemplo.com/');
  assert.equal(urlSegura('https://exemplo.local/101'), 'https://exemplo.local/101');
  assert.equal(urlSegura('https://exemplo.invalid/101'), 'https://exemplo.invalid/101');
});

test('rejeita esquemas perigosos, mesmo disfarçados', () => {
  for (const ruim of [
    'javascript:alert(1)', 'JaVaScRiPt:1', '\tjavascript:1', ' javascript:1', 'java\nscript:alert(1)',
    'data:text/html,x', 'vbscript:x', 'file:///etc/passwd', 'blob:https://exemplo.com/x', 'ftp://exemplo.com/x',
    'javascript://exemplo.com/%0Aalert(1)', 'https:javascript:alert(1)',
  ]) assert.equal(urlSegura(ruim), null, JSON.stringify(ruim));
});

test('rejeita relativa, sem host, sem barras e valor que não é texto', () => {
  for (const ruim of ['//exemplo.com', '/relativo', 'www.exemplo.com/x', 'exemplo.com', 'http://', 'https://', 'https:///x', 'https:x.com', '', '   ', null, undefined, 42, {}, [], true]) {
    assert.equal(urlSegura(ruim), null, JSON.stringify(ruim));
  }
});

test('rejeita credencial embutida e caractere de controle no meio', () => {
  assert.equal(urlSegura('https://usuario:senha@exemplo.com/x'), null);
  assert.equal(urlSegura('https://usuario@exemplo.com/x'), null);
  assert.equal(urlSegura('https://exemplo.com/a\tb'), null);
  assert.equal(urlSegura('https://exemplo.com/a\u0000b'), null);
});

test('comprarModel continua exportando o mesmo helper', () => {
  assert.equal(reexportada, urlSegura);
});
