import test from 'node:test';
import assert from 'node:assert/strict';
import { ativosNaCategoria, cidadesDisponiveis, contagemPorCategoria, filtraRevendas, panoramaConcorrencia, leituraRevenda } from '../src/concorrenciaModel.js';

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

const base = [
  { id: 1, nome: 'Rota', cidade: 'Curitiba', uf: 'PR', ativos: 30, saidas_30d: 4, reducoes_30d: 1, mix_categorias: { Caminhao: 10, Implemento: 15, Trailer: 5 } },
  { id: 2, nome: 'Campos', cidade: 'Londrina', uf: 'PR', ativos: 12, saidas_30d: 1, reducoes_30d: 0, mix_categorias: { Caminhao: 12 } },
  { id: 3, nome: 'Paulista', cidade: 'Campinas', uf: 'SP', ativos: 8, saidas_30d: 2, reducoes_30d: 0, mix_categorias: { Trator: 8 } },
  { id: 4, nome: 'Curitiba Pecas', cidade: 'Curitiba', uf: 'PR', ativos: 6, saidas_30d: 0, reducoes_30d: 0, mix_categorias: { 'Pecas-a-venda': 6 } },
  { id: 5, nome: 'Sem Mix', cidade: 'Curitiba', uf: 'SC', ativos: 3, saidas_30d: 0, reducoes_30d: 0 },
];

test('segmento de atuacao: revenda entra so com anuncio ativo da categoria e conta os ativos dela', () => {
  assert.equal(ativosNaCategoria(base[0], 'implementos'), 20); // Implemento + Trailer
  assert.equal(ativosNaCategoria(base[0], 'caminhoes'), 10);
  assert.equal(ativosNaCategoria(base[0], 'todas'), 30);
  assert.equal(ativosNaCategoria(base[4], 'caminhoes'), 0); // sem mix: nunca inventa
  assert.deepEqual(filtraRevendas(base, { categoria: 'caminhoes' }).map(l => l.nome), ['Campos', 'Rota']);
  assert.deepEqual(filtraRevendas(base, { categoria: 'agricolas' }).map(l => l.nome), ['Paulista']);
  assert.deepEqual(contagemPorCategoria(base), { caminhoes: 2, implementos: 1, agricolas: 1, pecas: 1 });
});

test('segmento reordena por estoque DA CATEGORIA, nao pelo total da revenda', () => {
  // Rota tem 30 no total mas so 10 caminhoes; Campos tem 12 caminhoes: Campos vem primeiro no segmento
  assert.deepEqual(filtraRevendas(base, { categoria: 'caminhoes', ordem: 'estoque' }).map(l => l.nome), ['Campos', 'Rota']);
  assert.deepEqual(filtraRevendas(base, { ordem: 'estoque', ufs: ['PR'] }).map(l => l.nome), ['Rota', 'Campos', 'Curitiba Pecas']);
});

test('cidade so existe dentro das UFs escolhidas e distingue homonimas entre UFs', () => {
  assert.deepEqual(cidadesDisponiveis(base, []), []);
  assert.deepEqual(cidadesDisponiveis(base, ['PR']).map(c => [c.rotulo, c.revendas]), [['Curitiba/PR', 2], ['Londrina/PR', 1]]);
  assert.deepEqual(filtraRevendas(base, { ufs: ['PR'], cidade: 'PR|Curitiba' }).map(l => l.nome), ['Rota', 'Curitiba Pecas']);
  // Curitiba/SC (fictícia) nao aparece quando a cidade escolhida e Curitiba/PR
  assert.ok(!filtraRevendas(base, { cidade: 'PR|Curitiba' }).some(l => l.uf === 'SC'));
  assert.deepEqual(filtraRevendas(base, { ufs: ['PR'], cidade: 'PR|Curitiba', categoria: 'pecas' }).map(l => l.nome), ['Curitiba Pecas']);
});

test('panorama com segmento soma so os ativos do segmento e avisa que saidas/reducoes seguem no estoque todo', () => {
  const lista = filtraRevendas(base, { categoria: 'caminhoes' });
  const p = panoramaConcorrencia(lista, 'Todas as UFs', null, { categoria: 'caminhoes' });
  assert.equal(p[1].valor, '22'); // 10 + 12
  assert.match(p[1].evidencia.recorte, /Caminhões/);
  assert.match(p[2].evidencia.explicacao, /todo o estoque/);
  assert.match(p[3].evidencia.explicacao, /todo o estoque/);
  const semSegmento = panoramaConcorrencia(base.slice(0, 2), 'PR');
  assert.equal(semSegmento[1].valor, '42');
  assert.doesNotMatch(semSegmento[2].evidencia.explicacao, /todo o estoque/);
});

