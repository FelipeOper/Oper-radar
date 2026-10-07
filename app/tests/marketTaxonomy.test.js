import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CATEGORIAS_MERCADO,
  TIPO_PARA_CATEGORIA,
  categoriasDoMercado,
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

test('mercado principal isola caminhões e implementos rodoviários', () => {
  assert.deepEqual(categoriasDoMercado('principal'), ['caminhoes', 'implementos']);
  assert.equal(categoriasDoMercado('outros').includes('agricolas'), true);
  assert.equal(categoriasDoMercado('outros').includes('caminhoes'), false);
  assert.equal(CATEGORIAS_MERCADO.implementos.label, 'Implementos rodoviários');
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

test('segmento Pesado: carreta e implemento rodoviario; implemento agricola e o resto ficam fora do mercado principal', () => {
  assert.equal(categoriaDeTipo('Carreta'), 'implementos');
  assert.equal(categoriaDeTipo('Implementos-agricolas'), 'agricolas');
  assert.equal(categoriaDeTipo('Aviao'), 'outros');
  const principal = categoriasDoMercado('principal');
  const doPrincipal = tipo => principal.includes(categoriaDeTipo(tipo));
  assert.equal(doPrincipal('Carreta'), true);
  assert.equal(doPrincipal('Implementos-agricolas'), false);
  assert.equal(doPrincipal('Trator'), false);
  const tiposPrincipais = Object.keys(TIPO_PARA_CATEGORIA).filter(doPrincipal).sort();
  assert.deepEqual(tiposPrincipais, ['Caminhao', 'Carreta', 'Carroceria-sobre-chassi', 'Implemento', 'Trailer']);
  assert.equal(rotuloTipo('Carreta'), 'Carretas');
});
