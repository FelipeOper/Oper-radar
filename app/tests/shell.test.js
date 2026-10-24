import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { APP_ROUTES } from '../src/navigation.js';

const here = dirname(fileURLToPath(import.meta.url));
const shell = readFileSync(resolve(here, '../src/Shell.jsx'), 'utf8');
const icons = readFileSync(resolve(here, '../src/icons.jsx'), 'utf8');
const app = readFileSync(resolve(here, '../src/App.jsx'), 'utf8');

function idsDoMenu() {
  const bloco = shell.slice(shell.indexOf('export const NAV = ['), shell.indexOf('];', shell.indexOf('export const NAV = [')));
  return [...bloco.matchAll(/id: '([a-z-]+)'/g)].map(m => m[1]);
}

test('todo item do menu tem rota correspondente e vice-versa', () => {
  const menu = idsDoMenu().sort();
  const rotas = APP_ROUTES.map(r => r.page).sort();
  assert.deepEqual(menu, rotas);
});

test('rotulos do menu acompanham o titulo da rota (menu e titulo da pagina nao divergem)', () => {
  const rotulos = Object.fromEntries([...shell.matchAll(/id: '([a-z-]+)', rotulo: '([^']+)'/g)].map(m => [m[1], m[2]]));
  APP_ROUTES.filter(r => r.page !== 'conta').forEach(r => {
    assert.equal(rotulos[r.page], r.title, `rotulo de ${r.page}`);
  });
});

test('shell usa as classes do design system e nao depende de largura em JS', () => {
  ['or-sidebar', 'or-navitem', 'or-topbar', 'or-bottomnav'].forEach(c => assert.match(shell, new RegExp(c)));
  assert.doesNotMatch(shell, /innerWidth/);
  assert.doesNotMatch(app, /window\.innerWidth\s*<=\s*760/);
});

test('icones vem do adaptador Phosphor, sem lucide', () => {
  assert.doesNotMatch(app, /lucide-react/);
  assert.doesNotMatch(shell, /lucide-react/);
  assert.match(icons, /ph-\$\{name\}/);
});

test('menu lateral: grupos em dropdown acessível e barra recolhível só com ícones', () => {
  assert.match(shell, /aria-expanded=\{aberto\}/);
  assert.match(shell, /aria-controls=\{idLista\}/);
  assert.match(shell, /hidden=\{!aberto\}/);
  assert.match(shell, /or-sidebar--collapsed/);
  assert.match(shell, /aria-pressed=\{recolhida\}/);
  assert.match(shell, /'Expandir menu' : 'Recolher menu'/);
  assert.match(shell, /title=\{recolhida \? rotulo : undefined\}/);
  assert.match(shell, /salvaPreferencia\(armazenamentoLocal\(\)/);
  assert.doesNotMatch(shell, /localStorage\.(get|set)Item/);
});
