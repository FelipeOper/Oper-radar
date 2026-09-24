import test from 'node:test';
import assert from 'node:assert/strict';
import { filtraRevendas, panoramaConcorrencia, leituraRevenda } from '../src/concorrenciaModel.js';

test('ordena por reducoes e preserva ausentes no fim', () => {
  const rows = [{ nome: 'A', uf: 'PR', reducoes_30d: null }, { nome: 'B', uf: 'SP', reducoes_30d: 2 }, { nome: 'C', uf: 'SP', reducoes_30d: 4 }];
  assert.deepEqual(filtraRevendas(rows, { ufs: ['SP'], ordem: 'reducoes' }).map(l => l.nome), ['C', 'B']);
  assert.deepEqual(filtraRevendas(rows, { ordem: 'reducoes' }).map(l => l.nome), ['C', 'B', 'A']);
});

test('nao transforma campo ausente em reducao zero nem publica desvio sem amostra', () => {
  const rows = [{ nome: 'A', cidade: 'Curitiba', uf: 'PR', ativos: 8, saidas_30d: 2, reducoes_30d: null, desvio_fipe_mediano_pct: null, desvio_fipe_amostra: 3 }];
  assert.equal(panoramaConcorrencia(rows)[3].valor, 'Dados indisponíveis');
  assert.equal(leituraRevenda(rows[0]).desvio, 'Amostra insuficiente');
  assert.match(leituraRevenda(rows[0]).evidenciaDesvio.amostra, /3 preços/);
});
