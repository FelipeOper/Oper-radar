import test from 'node:test';
import assert from 'node:assert/strict';
import { AMOSTRA_MINIMA, diferencaPct, evidenciaLado, ladoSuficiente, linhasComparacao, mesmoSeletor, seletorValido, veredito } from '../src/comparadorModel.js';

const lado = (rotulo, { ativos = 20, amostra = 20, mediana = 400000, confianca = 'alta' } = {}) => ({
  rotulo,
  metricas: { periodo: { rotulo: '30 dias' }, ativos, revendas: 5, ufs: 3, entradas_periodo: 4, saidas_periodo: 2, dias_observados_media: 40.5,
    precos: { amostra_qualificada: amostra, amostra_total: ativos, mediana, p25: mediana * 0.95, p75: mediana * 1.05, menor: mediana * 0.9, maior: mediana * 1.1, confianca, excluidos: ativos - amostra } },
});
const selA = { modo: 'marca_modelo', marca: 'Volvo', modelo: 'FH 540', ano: '2021' };
const selB = { modo: 'marca_modelo', marca: 'Scania', modelo: 'R 450', ano: '2021' };
const res = (a, b) => ({ periodo: { rotulo: '30 dias' }, lado_a: a, lado_b: b, diferencas: { estoque_pct: 25, dias_observados_pct: 0 } });

test('seletor só é válido com o recorte do modo e o ano', () => {
  assert.equal(seletorValido({ modo: 'marca', marca: 'Volvo', ano: '2021' }), true);
  assert.equal(seletorValido({ modo: 'marca', marca: 'Volvo', ano: '' }), false);
  assert.equal(seletorValido({ modo: 'modelo', modelo: 'FH 540', ano: '2021' }), true);
  assert.equal(seletorValido({ modo: 'marca_modelo', marca: 'Volvo', modelo: '', ano: '2021' }), false);
  assert.equal(mesmoSeletor(selA, { ...selA, ano: 2021 }), true);
});

test('lado só tem base com 5 preços válidos e mediana positiva', () => {
  assert.equal(ladoSuficiente(lado('A', { amostra: AMOSTRA_MINIMA })), true);
  assert.equal(ladoSuficiente(lado('A', { amostra: AMOSTRA_MINIMA - 1 })), false);
  assert.equal(ladoSuficiente(lado('A', { mediana: 0 })), false);
  assert.equal(ladoSuficiente({}), false);
});

test('veredito compara medianas e usa a menor confiança dos dois lados', () => {
  const v = veredito(res(lado('A', { mediana: 420000, confianca: 'alta' }), lado('B', { mediana: 400000, confianca: 'baixa' })), selA, selB);
  assert.equal(v.tom, 'success');
  assert.match(v.titulo, /A está 5% acima de B/);
  assert.match(v.texto, /Confiança do veredito: baixa/);
  assert.match(v.texto, /não é uma oferta equivalente/);
  const abaixo = veredito(res(lado('A', { mediana: 380000 }), lado('B', { mediana: 400000 })), selA, selB);
  assert.match(abaixo.titulo, /A está 5% abaixo de B/);
  assert.match(veredito(res(lado('A', { mediana: 400000 }), lado('B', { mediana: 400000 })), selA, selB).titulo, /mesma mediana/);
});

test('sem 5 preços válidos em um lado não há veredito nem valor de preço', () => {
  const r = res(lado('A', { amostra: 3, ativos: 3 }), lado('B'));
  const v = veredito(r, selA, selB);
  assert.equal(v.tom, 'warning');
  assert.match(v.texto, /Lado A: 3 preços válidos em 3 ofertas/);
  assert.doesNotMatch(v.texto, /Lado B/);
  const linhas = Object.fromEntries(linhasComparacao(r.lado_a));
  assert.equal(linhas['Mediana qualificada'], 'Insuficiente');
  assert.equal(linhas['Faixa central (p25–p75)'], '—');
  assert.equal(linhas['Mínimo · máximo'], '—');
  assert.equal(linhas['Anúncios ativos'], '3'); // contagem aparece sempre
  assert.match(evidenciaLado('Lado A', r.lado_a).base, /amostra insuficiente/);
  assert.equal(evidenciaLado('Lado A', r.lado_a).confianca, 'insuficiente');
});

test('mesmo recorte nos dois lados não gera veredito de preço', () => {
  const v = veredito(res(lado('A'), lado('B')), selA, { ...selA });
  assert.equal(v.tom, 'info');
  assert.match(v.titulo, /mesmo recorte/);
});

test('diferença percentual não inventa número sem base', () => {
  assert.equal(diferencaPct(110, 100), 10);
  assert.equal(diferencaPct(null, 100), null);
  assert.equal(diferencaPct(100, 0), null);
  assert.equal(veredito({}, selA, selB), null);
});
