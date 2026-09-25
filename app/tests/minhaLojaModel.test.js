import test from 'node:test';
import assert from 'node:assert/strict';
import { posicaoItem, resumoLoja, evidenciaItem, alertasLoja, pct } from '../src/minhaLojaModel.js';
import { filtraOrdenaEstoque } from '../src/domainRules.js';

const base = { id: 1, status: 'estoque', marca: 'VOLVO', modelo: 'FH 540', ano: 2021, preco_anunciado: 500000, preco_fipe: 480000,
  preco_mediana_mercado: 470000, mercado_amostra_suficiente: true, anuncios_comparaveis: 40, mercado_amostra_total: 44, mercado_confianca: 'alta', usar_comparativo: 1, dias_estoque: 30 };
const item = (extra = {}) => ({ ...base, ...extra });

test('acima do mercado a partir de 5% sobre a mediana; abaixo disso é competitivo', () => {
  assert.equal(posicaoItem(item({ preco_anunciado: 494000 })).status, 'acima'); // +5,1%
  assert.equal(posicaoItem(item({ preco_anunciado: 490000 })).status, 'comp'); // +4,3%
  assert.equal(posicaoItem(item({ preco_anunciado: 400000 })).status, 'comp'); // bem abaixo continua competitivo
  assert.equal(posicaoItem(item({ preco_anunciado: 494000 })).vsMediana, 5.1);
});

test('sem amostra suficiente não inventa comparação; FIPE segue disponível', () => {
  const p = posicaoItem(item({ mercado_amostra_suficiente: false, preco_mediana_mercado: null }));
  assert.equal(p.status, 'insuf');
  assert.equal(p.vsMediana, null);
  assert.equal(p.vsFipe, 4.2);
  assert.equal(posicaoItem(item({ preco_mediana_mercado: 0 })).status, 'insuf');
  assert.equal(posicaoItem(item({ preco_anunciado: null })).status, 'insuf');
});

test('veículo fora da base comparativa não recebe posição nem FIPE', () => {
  const p = posicaoItem(item({ usar_comparativo: 0 }));
  assert.deepEqual(p, { status: 'fora', vsMediana: null, vsFipe: null });
});

test('vínculo FIPE incompatível não vira desvio contra a FIPE', () => {
  assert.equal(posicaoItem(item({ fipe_vinculo_status: 'incompativel' })).vsFipe, null);
});

test('resumo considera só estoque ativo e separa os grupos', () => {
  const lista = [item({ id: 1, preco_anunciado: 520000 }), item({ id: 2, preco_anunciado: 460000 }), item({ id: 3, mercado_amostra_suficiente: false }),
    item({ id: 4, usar_comparativo: 0 }), item({ id: 5, status: 'vendido', preco_anunciado: 999999 })];
  const r = resumoLoja(lista);
  assert.equal(r.total, 4);
  assert.equal(r.acima.length, 1);
  assert.equal(r.comp.length, 1);
  assert.equal(r.insuf.length, 1);
  assert.equal(r.fora.length, 1);
  assert.equal(r.comparaveis, 2);
  assert.equal(r.valor, 520000 + 460000 + 500000 + 500000);
  assert.equal(r.idadeMediaDias, 30);
  assert.equal(resumoLoja([]).idadeMediaDias, null);
});

test('alertas só aparecem quando há veículo acima ou sem amostra', () => {
  assert.equal(alertasLoja(resumoLoja([item({ preco_anunciado: 480000 })])).length, 0);
  const alertas = alertasLoja(resumoLoja([item({ preco_anunciado: 520000 }), item({ id: 2, mercado_amostra_suficiente: false })]));
  assert.deepEqual(alertas.map(a => a.tom), ['warning', 'info']);
  assert.match(alertas[0].texto, /VOLVO FH 540 2021 \(\+10,6%\)/);
});

test('evidência declara mercado nacional, amostra e a ressalva de amostra insuficiente', () => {
  const ev = evidenciaItem(item());
  assert.match(ev.recorte, /mercado nacional/);
  assert.equal(ev.amostra, '40 preços válidos de 44 anúncios');
  assert.equal(ev.confianca, 'alta');
  const insuf = evidenciaItem(item({ mercado_amostra_suficiente: false }));
  assert.match(insuf.base, /amostra insuficiente/);
  assert.match(insuf.explicacao, /Abaixo de 5 preços válidos/);
  assert.match(evidenciaItem(item({ usar_comparativo: 0 })).base, /fora da base/);
});

test('ordenação por posição põe acima do mercado primeiro e o maior desvio à frente', () => {
  const lista = [item({ id: 1, preco_anunciado: 460000 }), item({ id: 2, mercado_amostra_suficiente: false }), item({ id: 3, preco_anunciado: 520000 }), item({ id: 4, preco_anunciado: 500000 })];
  const ids = filtraOrdenaEstoque(lista, '', 'todos', 'posicao').map(i => i.id);
  assert.deepEqual(ids, [3, 4, 1, 2]);
});

test('pct formata sinal e evita -0', () => {
  assert.equal(pct(4.2), '+4,2%');
  assert.equal(pct(-3), '-3%');
  assert.equal(pct(0.01), '0%');
  assert.equal(pct(null), '—');
});

test('corte de 5% usa o desvio exato: 4,96% continua competitivo mesmo exibindo 5%', () => {
  const p = posicaoItem(item({ preco_mediana_mercado: 100000, preco_anunciado: 104960 }));
  assert.equal(p.status, 'comp');
  assert.equal(p.vsMediana, 5);
  assert.equal(posicaoItem(item({ preco_mediana_mercado: 100000, preco_anunciado: 105000 })).status, 'acima');
  assert.equal(posicaoItem(item({ preco_mediana_mercado: 100000, preco_anunciado: 104999 })).status, 'comp');
});
