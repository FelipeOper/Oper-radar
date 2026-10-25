import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTextoIa, segmentosInline } from '../src/textoIaModel.js';

test('negrito vira segmento, o resto fica texto', () => {
  assert.deepEqual(segmentosInline('a **b** c'), [{ t: 'a ', b: false }, { t: 'b', b: true }, { t: ' c', b: false }]);
  assert.deepEqual(segmentosInline('sem marcação'), [{ t: 'sem marcação', b: false }]);
});

test('parágrafos separados por linha em branco e lista com hífen', () => {
  const blocos = parseTextoIa('**Situação** — 3 anúncios.\n\n**Preço** — sem base.\n\n**Próximos passos**\n- Pedir km\n- Pedir estado\n* Confirmar cabine');
  assert.equal(blocos.length, 4);
  assert.equal(blocos[0].tipo, 'p');
  assert.equal(blocos[0].partes[0].b, true);
  assert.equal(blocos[3].tipo, 'ul');
  assert.equal(blocos[3].itens.length, 3);
});

test('lista numerada, título com # e linhas vazias extras', () => {
  const blocos = parseTextoIa('### Resumo\n\n\n1. um\n2) dois');
  assert.equal(blocos[0].partes[0].t, 'Resumo');
  assert.equal(blocos[1].tipo, 'ul');
  assert.equal(blocos[1].itens.length, 2);
});

test('HTML cru do modelo continua texto (nunca vira marcação)', () => {
  const [bloco] = parseTextoIa('<img src=x onerror=alert(1)> **ok**');
  assert.equal(bloco.tipo, 'p');
  assert.equal(bloco.partes[0].t, '<img src=x onerror=alert(1)> ');
});

test('vazio e nulo não quebram', () => {
  assert.deepEqual(parseTextoIa(''), []);
  assert.deepEqual(parseTextoIa(null), []);
});
