import test from 'node:test';
import assert from 'node:assert/strict';
import { evidenciaKpis, formataItemFeed, linhasUfsSaidas, navegacaoDoInsight, resumoFrescor, rotuloConfianca, rotuloQuando } from '../src/hojeModel.js';

const espaco = texto => texto.replace(/ /g, ' ');

test('feed: entrada, queda de preco e saida tem texto proprio e nunca falam em venda confirmada', () => {
  const novo = formataItemFeed({ tipo: 'novo', marca: 'Volvo', modelo: 'FH 540', ano: 2021, cidade: 'Curitiba', uf: 'PR', preco: 498000 });
  assert.equal(novo.titulo, 'Volvo FH 540 · 2021');
  assert.equal(espaco(novo.detalhe), 'Novo · Curitiba/PR · R$ 498.000');

  const queda = formataItemFeed({ tipo: 'preco', titulo: 'x', marca: 'Scania', modelo: 'R 450', ano: 2020, cidade: 'Goiania', uf: 'GO', preco_anterior: 500000, preco_novo: 480000, variacao_pct: -4 });
  assert.equal(espaco(queda.detalhe), 'Preço caiu · Goiania/GO · R$ 500.000 → R$ 480.000 · −4%');

  const saida = formataItemFeed({ tipo: 'saida', marca: 'DAF', modelo: 'XF', ano: 2022, cidade: 'Sorriso', uf: 'MT' });
  assert.equal(saida.detalhe, 'Saída detectada · Sorriso/MT · venda não confirmada');
});

test('feed: sem marca e modelo usa o titulo do anuncio; campos ausentes nao viram "undefined"', () => {
  const item = formataItemFeed({ tipo: 'novo', titulo: 'Carreta graneleira 2019', uf: 'SP' });
  assert.equal(item.titulo, 'Carreta graneleira 2019');
  assert.equal(item.detalhe, 'Novo · SP');
  assert.ok(!/undefined|null/.test(item.detalhe));
});

test('monitor de dados: severidade alta lista as UFs com problema', () => {
  const resumo = resumoFrescor({
    limite_horas: 24,
    resumo: { severidade: 'alta', ufs: 4, atrasada: 1, sem_coleta: 1, parcial: 1, em_dia: 1 },
    itens: [
      { uf: 'MT', status: 'sem_coleta', horas: null },
      { uf: 'GO', status: 'atrasada', horas: 41 },
      { uf: 'SP', status: 'parcial', horas: 5, revendas: 20, revendas_coletadas_24h: 8 },
      { uf: 'PR', status: 'em_dia', horas: 5 },
    ],
  });
  assert.equal(resumo.severidade, 'alta');
  assert.equal(resumo.titulo, 'Monitor de dados: coleta atrasada em 2 estados');
  assert.deepEqual(resumo.linhas, [
    'MT: nenhuma coleta bem-sucedida nos últimos 30 dias',
    'GO: última coleta há 41 h (limite de 24 h)',
    'SP: 8 de 20 revendas coletadas nas últimas 24 h',
  ]);
});

test('monitor de dados: tudo em dia e resposta invalida', () => {
  const ok = resumoFrescor({ resumo: { severidade: 'ok', ufs: 1 }, itens: [{ uf: 'PR', status: 'em_dia' }] });
  assert.equal(ok.severidade, 'ok');
  assert.equal(ok.titulo, 'Coleta em dia em 1 estado');
  // Sem resposta valida a interface nao pode afirmar que a coleta esta em dia.
  assert.equal(resumoFrescor(null), null);
  assert.equal(resumoFrescor({}), null);
  assert.equal(resumoFrescor({ erro: 'x', codigo: 'FRESCOR_COLETA_INDISPONIVEL' }), null);
});

test('insight: acao vira navegacao com contexto valido', () => {
  assert.deepEqual(navegacaoDoInsight({ pagina: 'mercado', contexto: { uf: 'PR' } }), { page: 'mercado', context: { uf: 'PR' } });
  assert.deepEqual(
    navegacaoDoInsight({ pagina: 'mercado', contexto: { marca: 'Volvo', modelo: 'FH 540', ano: 2021 } }),
    { page: 'mercado', context: { marca: 'Volvo', modelo: 'FH 540', ano: '2021' } },
  );
  // marca sem modelo/ano nao abre um recorte pela metade
  assert.deepEqual(navegacaoDoInsight({ pagina: 'mercado', contexto: { marca: 'Volvo' } }), { page: 'mercado', context: {} });
  assert.deepEqual(navegacaoDoInsight({ pagina: 'concorrentes', contexto: [] }), { page: 'concorrentes', context: {} });
  assert.equal(navegacaoDoInsight(null), null);
  assert.equal(navegacaoDoInsight({}), null);
});

test('regioes com mais saidas: barra proporcional ao maior, sem zeros, com limite', () => {
  const linhas = linhasUfsSaidas([
    { uf: 'PR', saidas: 20, ativos: 400 },
    { uf: 'SP', saidas: 10, ativos: 500 },
    { uf: 'GO', saidas: 0, ativos: 100 },
  ]);
  assert.deepEqual(linhas.map(l => l.uf), ['PR', 'SP']);
  assert.equal(linhas[0].proporcao, 1);
  assert.equal(linhas[1].proporcao, 0.5);
  assert.equal(linhasUfsSaidas(undefined).length, 0);
  assert.equal(linhasUfsSaidas(Array.from({ length: 9 }, (_, i) => ({ uf: `U${i}`, saidas: 9 - i })), 3).length, 3);
});

test('confianca usa os niveis reais da API', () => {
  assert.equal(rotuloConfianca('media'), 'Média');
  assert.equal(rotuloConfianca('insuficiente'), 'Insuficiente');
  assert.equal(rotuloConfianca(undefined), '—');
});

test('feed: verificacao (2a confirmacao) nao e chamada de saida e carrega url', () => {
  const item = formataItemFeed({ tipo: 'verificacao', marca: 'Iveco', modelo: 'S-Way', ano: 2022, cidade: 'Londrina', uf: 'PR', url: 'https://exemplo.test/1' });
  assert.equal(item.detalhe, 'Aguardando 2ª confirmação · Londrina/PR · ainda não é saída');
  assert.equal(item.url, 'https://exemplo.test/1');
  assert.equal(formataItemFeed({ tipo: 'novo', titulo: 'x' }).url, null);
});

test('horario relativo: hoje, ontem, data; evento de dia inteiro sem hora', () => {
  const agora = new Date(2026, 8, 24, 12, 0);
  assert.equal(rotuloQuando('2026-09-24 09:30:00', agora), 'Hoje 09:30');
  assert.equal(rotuloQuando('2026-09-24 00:00:00', agora), 'Hoje');
  assert.equal(rotuloQuando('2026-09-23 18:05:00', agora), 'Ontem 18:05');
  assert.equal(rotuloQuando('2026-09-23 00:00:00', agora), 'Ontem');
  assert.equal(rotuloQuando('2026-09-20 08:00:00', agora), '20/09');
  assert.equal(rotuloQuando('', agora), '');
  assert.equal(rotuloQuando('lixo', agora), '');
});

test('evidencia dos KPIs usa so campos da API e nunca inventa confianca', () => {
  assert.deepEqual(evidenciaKpis(null), {});
  const ev = evidenciaKpis({
    revendas_monitoradas: 48, revendas_com_estoque: 44, anuncios_ativos: 1300, anuncios_ativos_total: 1300,
    anuncios_ativos_revalidados: 1284, anuncios_ativos_herdados: 16, ciclo_referencia: { dia: '2026-09-24', janela: '07h' },
    saidas_detectadas_mes: 37, entradas_48h: 64, saidas_48h: 21, ultima_coleta: '2026-09-24 07:05:00',
  });
  assert.equal(ev.anuncios.periodo, 'Estoque ativo · ciclo 07h');
  assert.equal(espaco(ev.anuncios.base), '1.300 ativos no total · 16 herdados');
  assert.equal(ev.saidas.valor, '37 saídas detectadas');
  assert.equal(ev.movimento.valor, '+64 entradas · −21 saídas');
  assert.equal(ev.revendas.atualizacao, '24/09/2026 07:05');
  ['revendas', 'anuncios', 'saidas', 'movimento'].forEach(chave => assert.ok(!('confianca' in ev[chave]), chave));
});
