import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/* Contrato da T09: todo link externo com URL de terceiros passa por LinkExterno (que usa urlSegura).
   Fora de LinkExterno.js e urlSegura.js não pode existir href/target escrito à mão, window.open,
   atribuição a location, HTML injetado nem <a> criado por createElement. */

const SRC = fileURLToPath(new URL('../src/', import.meta.url));
const PERMITIDOS = new Set(['LinkExterno.js', 'urlSegura.js']);

const semComentarios = texto => texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/* href só é aceito como atributo do próprio <LinkExterno>; qualquer outro elemento ou objeto com href é link cru. */
function hrefCru(texto) {
  for (const m of texto.matchAll(/(?<![.\w-])href\s*([=:])/g)) {
    if (m[1] === ':') return true;
    const tags = [...texto.slice(0, m.index).matchAll(/<([A-Za-z][\w.]*)/g)];
    if (tags.length === 0 || tags[tags.length - 1][1] !== 'LinkExterno') return true;
  }
  return false;
}

const PROIBIDOS = [
  [hrefCru, 'href escrito à mão (use LinkExterno)'],
  [/_blank/, 'target _blank fora de LinkExterno'],
  [/\bwindow\.open\s*\(/, 'window.open'],
  [/\b(?:window\.)?location\s*\.\s*(?:assign|replace)\s*\(/, 'location.assign/replace'],
  [/\.href\s*=(?!=)/, 'atribuição a .href'],
  [/dangerouslySetInnerHTML|\.innerHTML\s*=/, 'HTML injetado'],
  [/createElement\(\s*['"`]a['"`]/, '<a> criado por createElement'],
];

export function achaLinksCrus(texto) {
  const limpo = semComentarios(texto);
  return PROIBIDOS.filter(([regra]) => (typeof regra === 'function' ? regra(limpo) : regra.test(limpo))).map(([, motivo]) => motivo);
}

const arquivos = readdirSync(SRC).filter(nome => /\.(jsx?|mjs)$/.test(nome));

test('o scanner pega os padrões que a T09 quer impedir', () => {
  const ruins = [
    '<a href={a.url}>x</a>',
    '<a href={cond && a.url}>x</a>',
    '<a href={`${base}/${id}`}>x</a>',
    '<a target="_blank" rel="noreferrer">x</a>',
    'window.open(a.url)',
    'location.assign(url)',
    'el.href = url',
    '<div dangerouslySetInnerHTML={{ __html: x }} />',
    "React.createElement('a', { href: x })",
    '<LinkExterno href={x}>ok</LinkExterno><a href={y}>ruim</a>',
    '<Botao href={x}>ruim</Botao>',
  ];
  for (const ruim of ruins) assert.ok(achaLinksCrus(ruim).length > 0, ruim);
  const bons = ['<LinkExterno href={a.url}>x</LinkExterno>', 'const u = window.location.href;', '/* href={x} target="_blank" */ const y = 1;', 'a === b'];
  for (const bom of bons) assert.deepEqual(achaLinksCrus(bom), [], bom);
});

test('nenhum arquivo de app/src escreve link externo fora de LinkExterno', () => {
  const achados = [];
  for (const nome of arquivos) {
    if (PERMITIDOS.has(nome)) continue;
    for (const motivo of achaLinksCrus(readFileSync(join(SRC, nome), 'utf8'))) achados.push(`${nome}: ${motivo}`);
  }
  assert.deepEqual(achados, []);
});

test('quem usa <LinkExterno> importa o componente, e o scanner não passa em branco', () => {
  let usos = 0;
  for (const nome of arquivos.filter(n => n.endsWith('.jsx'))) {
    const texto = semComentarios(readFileSync(join(SRC, nome), 'utf8'));
    const n = (texto.match(/<LinkExterno[\s>]/g) || []).length;
    usos += n;
    if (n > 0) assert.match(texto, /import\s*\{\s*LinkExterno\s*\}\s*from\s*'\.\/LinkExterno\.js'/, `${nome} usa LinkExterno sem importar`);
  }
  assert.ok(usos >= 8, `esperava pelo menos 8 usos de LinkExterno em app/src, achei ${usos}`);
});

test('LinkExterno valida com urlSegura e fixa target e rel', () => {
  const texto = readFileSync(join(SRC, 'LinkExterno.js'), 'utf8');
  assert.match(texto, /urlSegura\(href\)/);
  assert.match(texto, /target: '_blank'/);
  assert.match(texto, /rel: 'noopener noreferrer'/);
  assert.ok(texto.indexOf('...props') < texto.indexOf("href: seguro"), 'href, target e rel vêm depois de ...props (não sobrescrevíveis)');
  assert.doesNotMatch(texto, /dangerouslySetInnerHTML/);
});
