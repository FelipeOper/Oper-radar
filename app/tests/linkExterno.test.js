import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LinkExterno } from '../src/LinkExterno.js';

const html = (props, filho = 'Ver') => renderToStaticMarkup(React.createElement(LinkExterno, props, filho));

test('URL válida vira <a> em nova aba com noopener noreferrer', () => {
  const saida = html({ href: 'https://exemplo.com/a', className: 'x', 'aria-label': 'Ver anúncio', title: 'T' });
  assert.match(saida, /^<a /);
  assert.match(saida, /href="https:\/\/exemplo\.com\/a"/);
  assert.match(saida, /target="_blank"/);
  assert.match(saida, /rel="noopener noreferrer"/);
  assert.match(saida, /class="x"/);
  assert.match(saida, /aria-label="Ver anúncio"/);
  assert.match(saida, /title="T"/);
});

test('URL insegura ou ausente não gera <a>, nem href="#"', () => {
  for (const href of ['javascript:alert(1)', 'data:text/html,x', '//exemplo.com', 'https://u:p@exemplo.com', '', null, undefined, 42]) {
    assert.equal(html({ href }), '', String(href));
  }
});

test('semLink="div" mantém o conteúdo sem link quando a URL não é segura', () => {
  const saida = html({ href: 'javascript:alert(1)', semLink: 'div', style: { padding: 4 }, onClick: () => {} }, 'Cartão');
  assert.equal(saida, '<div style="padding:4px">Cartão</div>');
  assert.doesNotMatch(saida, /href|target|rel=/);
});

test('href, target e rel não podem ser sobrescritos por quem chama', () => {
  const saida = html({ href: 'https://exemplo.com', target: '_self', rel: 'opener' });
  assert.match(saida, /target="_blank"/);
  assert.match(saida, /rel="noopener noreferrer"/);
  assert.doesNotMatch(saida, /_self|opener"/);
});
