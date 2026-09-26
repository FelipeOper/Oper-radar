import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { ORIGEM_ACAO_OPORTUNIDADE, novaAcaoLocal, textoAvaliarObservado, textoAvaliarOferta, textoValidarFipe } from '../src/acoesModel.js';

/* Fixtures fictícias: nenhum dado real de revenda ou preço. */
const oferta = { titulo: 'Caminhão Exemplo 2020', revenda: 'Revenda Exemplo', preco: 440000, url: 'https://exemplo.invalid/1', telefone: 'TEL-FICTICIO-77' };

const src = nome => readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '..', 'src', nome), 'utf8');
const NBSP = ' '; // o toLocaleString('pt-BR') separa "R$" e o número com espaço não separável

test('texto da oferta: título, revenda e preço anunciado, no formato que o cartão já usava', () => {
  assert.equal(textoAvaliarOferta(oferta), `Avaliar: Caminhão Exemplo 2020 (Revenda Exemplo, R$${NBSP}440.000)`);
});

test('texto do observado: título, revenda e dias; sem dias não inventa número', () => {
  assert.equal(textoAvaliarObservado({ ...oferta, dias: 42 }), 'Avaliar: Caminhão Exemplo 2020 (Revenda Exemplo, observado há 42d)');
  assert.equal(textoAvaliarObservado({ ...oferta, dias: 0 }), 'Avaliar: Caminhão Exemplo 2020 (Revenda Exemplo, observado há 0d)');
  for (const dias of [undefined, null, 'abc', NaN]) {
    assert.equal(textoAvaliarObservado({ ...oferta, dias }), 'Avaliar: Caminhão Exemplo 2020 (Revenda Exemplo, tempo observado indisponível)');
  }
});

test('texto da validação FIPE: só título e revenda', () => {
  assert.equal(textoValidarFipe(oferta), 'Validar oportunidade FIPE: Caminhão Exemplo 2020 (Revenda Exemplo)');
});

test('campo ausente cai no padrão e nunca vira undefined, null ou NaN no texto', () => {
  for (const vazio of [undefined, null, {}, { titulo: '  ', revenda: '' }]) {
    for (const texto of [textoAvaliarOferta(vazio), textoAvaliarObservado(vazio), textoValidarFipe(vazio)]) {
      assert.doesNotMatch(texto, /undefined|null|NaN/);
      assert.match(texto, /anúncio \(revenda/);
    }
  }
  assert.equal(textoAvaliarOferta({}), 'Avaliar: anúncio (revenda, —)');
});

test('o texto só leva título, revenda e preço ou dias: URL e telefone do anúncio não entram', () => {
  for (const texto of [textoAvaliarOferta(oferta), textoAvaliarObservado({ ...oferta, dias: 3 }), textoValidarFipe(oferta)]) {
    assert.doesNotMatch(texto, /exemplo\.invalid|https?:|TEL-FICTICIO-77/);
  }
});

test('nova ação local: exatamente as cinco chaves, feita falsa, origem oportunidade, criadaEm ISO', () => {
  const agora = new Date('2026-09-26T12:00:00.000Z');
  const acao = novaAcaoLocal('Avaliar: X (Y, Z)', ORIGEM_ACAO_OPORTUNIDADE, agora);
  assert.deepEqual(acao, { id: `local-${agora.getTime()}`, texto: 'Avaliar: X (Y, Z)', feita: false, origem: 'oportunidade', criadaEm: '2026-09-26T12:00:00.000Z' });
  assert.deepEqual(Object.keys(acao).sort(), ['criadaEm', 'feita', 'id', 'origem', 'texto']);
  assert.equal(ORIGEM_ACAO_OPORTUNIDADE, 'oportunidade');
  assert.ok(acao.id.startsWith('local-'));
  assert.equal(new Date(acao.criadaEm).toISOString(), acao.criadaEm);
});

test('nova ação local sem data injetada usa o relógio e continua válida', () => {
  const antes = Date.now();
  const acao = novaAcaoLocal('t');
  const depois = Date.now();
  const ts = Number(acao.id.slice('local-'.length));
  assert.ok(ts >= antes && ts <= depois);
  assert.equal(acao.origem, 'oportunidade');
  assert.equal(acao.feita, false);
});

/* Contrato de "sem escrita remota". É uma varredura de TEXTO: prova ausência de padrões de rede nos trechos abaixo,
   não prova ausência de toda escrita remota possível (chamada indireta por função importada de outro módulo). */
const REDE = /\b(fetch|apiFetch|apiGet|apiPost|apiClient|XMLHttpRequest|sendBeacon|WebSocket|EventSource|axios)\b|\bmethod\s*:|['"`](POST|PUT|PATCH|DELETE)['"`]/;

test('acoesModel.js não importa cliente de API nem usa rede', () => {
  const texto = src('acoesModel.js');
  const importacoes = texto.split('\n').filter(l => /^\s*import\b/.test(l));
  assert.deepEqual(importacoes, ["import { brl } from './comprarModel.js';"]);
  const codigo = texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  assert.doesNotMatch(codigo, REDE);
});

test('comprarModel.js, que acoesModel.js importa, também não usa rede', () => {
  assert.doesNotMatch(src('comprarModel.js').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''), REDE);
});

test('criarAcao e adicionarAcao em App.jsx só mexem em estado local, sem rede', () => {
  const app = src('App.jsx');
  const inicio = app.indexOf('const adicionarAcao');
  const fim = app.indexOf('const paginas = {', inicio);
  assert.ok(inicio > 0 && fim > inicio, 'trecho adicionarAcao...paginas não encontrado');
  assert.doesNotMatch(app.slice(inicio, fim), REDE);
});
