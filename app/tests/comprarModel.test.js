import test from 'node:test';
import assert from 'node:assert/strict';
import { evidenciaModelo, linhasComponentes, ordenaUfs, pctAssinado, selosAnuncio, textoVazio, urlSegura } from '../src/comprarModel.js';

const anuncio = extra => ({ anuncio_id: 1, titulo: 'Volvo FH 540', preco: 440000, desvio_mediana_pct: -8.3, desvio_fipe_pct: -8.3, reduziu_30d: 1, dias_observados: 42,
  componentes: { preco_mediana: { indice: 82.5, peso: 35 }, preco_fipe: { indice: 70, peso: 20 }, negociacao: { indice: 100, peso: 20 }, liquidez: { indice: 71.4, peso: 15 }, qualidade: { indice: 100, peso: 10 } }, ...extra });

test('selos mostram desvios, redução e tempo; sem FIPE utilizável diz isso em vez de esconder', () => {
  const textos = selosAnuncio(anuncio()).map(s => s.texto);
  assert.deepEqual(textos, ['-8,3% vs mediana da UF', '-8,3% vs FIPE', 'Preço caiu (30 d)', '42 dias no radar']);
  const semFipe = selosAnuncio(anuncio({ desvio_fipe_pct: null, reduziu_30d: 0, dias_observados: null })).map(s => s.texto);
  assert.deepEqual(semFipe, ['-8,3% vs mediana da UF', 'Sem FIPE utilizável']);
});

test('componentes marcam como não usado o que não teve base', () => {
  const linhas = linhasComponentes(anuncio({ componentes: { preco_mediana: { indice: 80, peso: 50 }, preco_fipe: { indice: null, peso: 0 } } }));
  assert.equal(linhas[0].usado, true);
  assert.equal(linhas[1].usado, false);
  assert.equal(linhas[1].rotulo, 'Preço vs FIPE');
});

test('UFs ordenadas pelo melhor índice e UF sem modelo some', () => {
  const ufs = [{ uf: 'SP', modelos: [{ indice: { pontuacao: 60 } }] }, { uf: 'GO', modelos: [] }, { uf: 'PR', modelos: [{ indice: { pontuacao: 71 } }] }];
  assert.deepEqual(ordenaUfs(ufs).map(u => u.uf), ['PR', 'SP']);
  assert.deepEqual(ordenaUfs(null), []);
});

test('evidência declara base, amostra, confiança e que saída/redução não provam venda nem disposição', () => {
  const ev = evidenciaModelo('PR', { marca: 'Volvo', modelo: 'FH 540', ano: 2021, mediana_uf: 480000, comparaveis: 12, revendas: 6, saidas_observadas: 8, indice: { confianca: 'media' } });
  assert.match(ev.recorte, /Volvo FH 540 · 2021 · PR/);
  assert.match(ev.amostra, /12 preços válidos · 6 revendas · 8 saídas observadas/);
  assert.equal(ev.confianca, 'media');
  assert.match(ev.explicacao, /não é venda/);
  assert.match(ev.explicacao, /não prova de disposição|não prova de disposição para negociar/);
});

test('texto de vazio distingue falta de histórico de falta de amostra e não afirma mercado ruim', () => {
  assert.match(textoVazio({ historico_eventos: { disponivel: false } }), /histórico de eventos ainda não está disponível/);
  assert.match(textoVazio({ historico_eventos: { disponivel: true } }), /não é sinal de mercado ruim/);
});

test('pctAssinado evita -0 e valores nulos', () => {
  assert.equal(pctAssinado(-3), '-3%');
  assert.equal(pctAssinado(0.01), '0%');
  assert.equal(pctAssinado(null), '—');
});

test('só http/https vira link do anúncio', () => {
  assert.equal(urlSegura('https://exemplo.com/a'), 'https://exemplo.com/a');
  for (const ruim of ['javascript:alert(1)', 'data:text/html,x', '//exemplo.com', '', null, undefined, 42]) assert.equal(urlSegura(ruim), null);
});
