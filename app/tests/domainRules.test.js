import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classificaEmissao,
  filtraOrdenaEstoque,
  normalizaTracao,
  rotuloTempoObservado,
  textoEmissao,
} from '../src/domainRules.js';

test('emissão não é aplicada a implementos ou máquinas', () => {
  assert.equal(classificaEmissao('Implemento', 'Carreta 2024', '', 2024).aplicavel, false);
  assert.equal(textoEmissao(classificaEmissao('Trator', 'Trator 2020', '', 2020)), 'Não aplicável');
});

test('emissão explícita vence o ano e 2022 permanece transição', () => {
  assert.deepEqual(classificaEmissao('Caminhao', 'DAF XF E5', '', 2024), {
    norma: 'E5', origem: 'informado', aplicavel: true,
  });
  assert.equal(textoEmissao(classificaEmissao('Caminhao', 'DAF XF', '', 2022)), 'transição E5/E6');
});

test('tempo é descrito como observação do radar', () => {
  assert.equal(rotuloTempoObservado(31, 'ativo'), 'OBSERVADO HÁ 31D');
  assert.equal(rotuloTempoObservado(1, 'ativo'), 'NOVO NO RADAR');
  assert.equal(rotuloTempoObservado(10, 'saida_detectada'), 'SAIU DO PORTAL');
});

test('tração é normalizada sem inferir quando o campo está vazio', () => {
  assert.equal(normalizaTracao('Cavalo 6X4'), '6x4');
  assert.equal(normalizaTracao('Truck  8 × 2'), '8x2');
  assert.equal(normalizaTracao('4x2'), '4x2');
  assert.equal(normalizaTracao('Cavalo mecânico'), null);
  assert.equal(normalizaTracao(null), null);
});

test('estoque pode ser filtrado e ordenado sem alterar a lista original', () => {
  const itens = [
    { id: 1, referencia_interna: '8451', placa: 'ABC1D23', titulo: 'Cavalo 6x4 completo', marca: 'DAF', modelo: 'XF 530', status: 'estoque', preco_anunciado: 500000, data_entrada: '2026-08-01' },
    { id: 2, marca: 'Scania', modelo: 'R450', status: 'reservado', preco_anunciado: 450000, data_entrada: '2026-08-10' },
  ];
  const resultado = filtraOrdenaEstoque(itens, 'daf', 'estoque', 'preco_asc');
  assert.deepEqual(resultado.map(item => item.id), [1]);
  assert.deepEqual(filtraOrdenaEstoque(itens, 'ABC1D23', 'todos', 'recente').map(item => item.id), [1]);
  assert.deepEqual(filtraOrdenaEstoque(itens, '8451', 'todos', 'recente').map(item => item.id), [1]);
  assert.deepEqual(filtraOrdenaEstoque(itens, 'completo', 'todos', 'recente').map(item => item.id), [1]);
  assert.deepEqual(itens.map(item => item.id), [1, 2]);
});
