import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CATEGORIAS_MERCADO,
  categoriaDeTipo,
  filtrosDaCategoria,
  rotuloTipo,
} from '../src/marketTaxonomy.js';

test('segmentos separam caminhões, motorhomes e utilitários', () => {
  assert.equal(categoriaDeTipo('Caminhao'), 'caminhoes');
  assert.equal(categoriaDeTipo('Motorhome'), 'onibus_vans');
  assert.equal(categoriaDeTipo('Utilitarios'), 'leves');
  assert.equal(categoriaDeTipo('tipo ainda não mapeado'), 'outros');
});

test('filtros são contextuais ao segmento', () => {
  assert.deepEqual(filtrosDaCategoria('caminhoes'), ['tipo', 'marca', 'carroceria', 'tracao', 'fipe']);
  assert.deepEqual(filtrosDaCategoria('agricolas'), ['tipo', 'marca']);
  assert.equal(filtrosDaCategoria('leves').includes('tracao'), false);
});

test('taxonomia oferece rótulos de negócio legíveis', () => {
  assert.equal(CATEGORIAS_MERCADO.onibus_vans.label, 'Ônibus, vans e motorhomes');
  assert.equal(rotuloTipo('Micro-onibus'), 'Micro-ônibus');
  assert.equal(rotuloTipo('Rolo-compactador'), 'Rolo Compactador');
});
