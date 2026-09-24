import test from 'node:test';
import assert from 'node:assert/strict';
import { desvioFipeExibivel, evidenciaPanorama, leituraOportunidade, recorteDoPainel, textoAmostraModelo } from '../src/mercadoModel.js';

const espaco = texto => texto.replace(/ /g, ' ');

test('recorte descreve UFs, cidade e segmento', () => {
  assert.equal(recorteDoPainel({}), 'Todas as UFs · Caminhões e implementos');
  assert.equal(recorteDoPainel({ ufs: ['PR', 'SC'], cidade: 'Curitiba' }, 'Cavalos mecânicos'), 'PR, SC · Curitiba · Cavalos mecânicos');
  assert.equal(recorteDoPainel({ ufs: [], cidade: 'todas' }), 'Todas as UFs · Caminhões e implementos');
});

test('evidencia do panorama usa so campos da API e a confianca real do ticket', () => {
  const ev = evidenciaPanorama({
    resumo: { anuncios: 1284, lojistas: 48, cidades: 22, ufs: 3, ticket_mediano: 428000, amostra_qualificada: 310, confianca: 'alta', desvio_fipe_medio_pct: -1.4, desvio_fipe_amostra: 37, desvio_fipe_confianca: 'media', entradas_periodo: 64, saidas_periodo: 21 },
    escopo: { ufs: ['PR'] },
    fonte: { atualizado_em: '2026-09-24 07:05:00' },
    periodo: '30d',
  });
  assert.equal(espaco(ev.ticket.valor), 'R$ 428.000');
  assert.equal(ev.ticket.confianca, 'alta');
  assert.equal(ev.ticket.amostra, '310 preços qualificados de 1.284 anúncios');
  assert.equal(ev.anuncios.periodo, 'Estoque ativo hoje · entradas e saídas nos últimos 30 dias');
  assert.equal(ev.anuncios.base, '64 entradas · 21 saídas');
  assert.equal(ev.desvio.valor, '-1,4%');
  assert.equal(ev.lojistas.atualizacao, '24/09/2026 07:05');
  // contagens nao ganham confianca inventada
  assert.ok(!('confianca' in ev.anuncios) && !('confianca' in ev.lojistas));
  // o desvio carrega amostra e confianca reais da API (regra 5/10/20)
  assert.equal(ev.desvio.amostra, '37 preços válidos com FIPE');
  assert.equal(ev.desvio.confianca, 'media');
});

test('ticket sem amostra suficiente nao mostra numero; desvio sem FIPE diz que nao ha base', () => {
  const ev = evidenciaPanorama({ resumo: { anuncios: 3, ticket_mediano: 100000, amostra_qualificada: 2, confianca: 'insuficiente', desvio_fipe_medio_pct: null } });
  assert.equal(ev.ticket.valor, 'Amostra insuficiente');
  assert.equal(ev.ticket.confianca, 'insuficiente');
  assert.equal(ev.desvio.valor, 'Sem amostra verificável');
  assert.equal(ev.anuncios.atualizacao, null);
});

test('oportunidade regional: null sem dados; linhas com componentes na ordem da especificacao', () => {
  assert.equal(leituraOportunidade(null), null);
  assert.equal(leituraOportunidade({ regioes: [] }), null);
  const leitura = leituraOportunidade({
    melhor_uf: 'PR',
    historico_eventos: { disponivel: true, cobertura_dias: 120 },
    regioes: [
      { uf: 'PR', comparaveis: 36, revendas: 8, saidas_observadas: 14, mediana_dias_saida: 40, preco_mediano: 498000,
        avaliacao: { publicavel: true, pontuacao: 71.4, confianca: 'alta', motivo_confianca: 'amostra ampla e cobertura continua',
          componentes: { movimento: { indice: 80, peso: 30, contribuicao: 24 }, concorrencia: { indice: 50, peso: 20, contribuicao: 10 }, tempo_saida: { indice: 60, peso: 20, contribuicao: 12 }, preco: { indice: 90, peso: 15, contribuicao: 13.5 }, qualidade: { indice: 80, peso: 15, contribuicao: 12 } } } },
      { uf: 'SC', comparaveis: 3, revendas: 2, saidas_observadas: 1, mediana_dias_saida: null, preco_mediano: null,
        avaliacao: { publicavel: false, pontuacao: 10, confianca: 'insuficiente', motivo_confianca: 'menos de 5 comparáveis', componentes: {} } },
    ],
  });
  assert.equal(leitura.melhorUf, 'PR');
  assert.equal(leitura.linhas.length, 2);
  assert.deepEqual(leitura.linhas[0].componentes.map(c => c.chave), ['movimento', 'concorrencia', 'tempo_saida', 'preco', 'qualidade']);
  assert.equal(leitura.linhas[0].componentes.reduce((soma, c) => soma + c.peso, 0), 100);
  assert.equal(leitura.linhas[1].publicavel, false);
  assert.equal(leitura.linhas[1].diasSaida, null);
  assert.equal(leitura.linhas[1].precoMediano, null);
  assert.equal(leitura.linhas[1].componentes[0].indice, 0);
  assert.equal(leitura.semHistorico, false);
});

test('oportunidade regional sinaliza historico indisponivel', () => {
  const leitura = leituraOportunidade({ historico_eventos: { disponivel: false, cobertura_dias: 0 }, regioes: [{ uf: 'GO', avaliacao: { publicavel: false } }] });
  assert.equal(leitura.semHistorico, true);
  assert.equal(leitura.melhorUf, null);
});

test('texto de amostra do modelo', () => {
  assert.equal(textoAmostraModelo({ amostra_qualificada: 9, confianca: 'baixa' }), '9 preços válidos · confiança baixa');
  assert.equal(textoAmostraModelo({ amostra_qualificada: 1, confianca: 'insuficiente' }), '1 preço válido · confiança insuficiente');
  assert.equal(textoAmostraModelo({ amostra_qualificada: 12, confianca: 'media' }), '12 preços válidos · confiança média');
  assert.equal(textoAmostraModelo({}), '');
  assert.equal(textoAmostraModelo(undefined), '');
});

test('desvio da FIPE: amostra abaixo de 5 nao mostra numero, mesmo que o servidor mande um valor', () => {
  assert.deepEqual(desvioFipeExibivel({ desvio_fipe_medio_pct: 42.0, desvio_fipe_amostra: 1 }), { valor: null, amostra: 1 });
  assert.deepEqual(desvioFipeExibivel({ desvio_fipe_medio_pct: -3.1, desvio_fipe_amostra: 5 }), { valor: -3.1, amostra: 5 });
  // servidor antigo (sem amostra verificavel): nao mostra o numero, mesmo que tenha vindo um valor
  assert.deepEqual(desvioFipeExibivel({ desvio_fipe_medio_pct: -3.1 }), { valor: null, amostra: null });
  assert.deepEqual(desvioFipeExibivel({}), { valor: null, amostra: null });
  const ev = evidenciaPanorama({ resumo: { anuncios: 9, confianca: 'insuficiente', desvio_fipe_medio_pct: null, desvio_fipe_amostra: 2, desvio_fipe_confianca: 'insuficiente' } });
  assert.equal(ev.desvio.valor, 'Amostra insuficiente');
  assert.equal(ev.desvio.amostra, '2 preços válidos com FIPE');
  assert.equal(ev.desvio.confianca, 'insuficiente');
  const semBase = evidenciaPanorama({ resumo: { anuncios: 9, desvio_fipe_medio_pct: null } });
  assert.equal(semBase.desvio.valor, 'Sem amostra verificável');
  assert.equal(evidenciaPanorama({ resumo: { anuncios: 9, desvio_fipe_medio_pct: 42 } }).desvio.valor, 'Sem amostra verificável');
  assert.ok(!('confianca' in semBase.desvio));
});
