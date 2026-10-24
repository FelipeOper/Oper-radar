import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FILTROS_INICIAIS, aplicaVeredito, contextoParaCorrigir, montaConsulta, podeAuditar, progressoGrupo,
  recalculaResumo, rotuloPrecisao, statusGrupo,
} from '../src/fipeAuditoriaModel.js';

test('a consulta omite filtros vazios e leva só o que foi preenchido', () => {
  assert.equal(montaConsulta(FILTROS_INICIAIS), 'fipe_auditoria.php?visao=grupos&estado=nao_auditados');
  const q = montaConsulta({ ...FILTROS_INICIAIS, marca: 'DAF', uf: 'PR,SC', revenda: ' Rota ' });
  assert.match(q, /marca=DAF/);
  assert.match(q, /uf=PR%2CSC/);
  assert.match(q, /revenda=Rota/);
  assert.doesNotMatch(q, /cidade=/);
});

test('a consulta de anúncios de um grupo pede todos os estados e a referência', () => {
  const q = montaConsulta({ ...FILTROS_INICIAIS, estado: 'nao_auditados' }, { visao: 'anuncios', fipe_preco_id: 7, estado: 'todos' });
  assert.match(q, /visao=anuncios/);
  assert.match(q, /fipe_preco_id=7/);
  assert.match(q, /estado=todos/);
  assert.equal((q.match(/estado=/g) || []).length, 1);
});

test('a precisão só aparece quando há vereditos', () => {
  assert.equal(rotuloPrecisao({ precisao_pct: null, auditados: 0 }), '—');
  assert.equal(rotuloPrecisao({ precisao_pct: 91.3, auditados: 40 }), '91,3%');
  assert.equal(rotuloPrecisao(null), '—');
});

test('progresso e status do grupo', () => {
  assert.equal(progressoGrupo({ total: 10, auditados: 4 }), 40);
  assert.equal(progressoGrupo({ total: 0, auditados: 0 }), 0);
  assert.equal(statusGrupo({ total: 5, auditados: 0, errados: 0 }), 'pendente');
  assert.equal(statusGrupo({ total: 5, auditados: 2, errados: 0 }), 'em_andamento');
  assert.equal(statusGrupo({ total: 5, auditados: 5, errados: 0 }), 'completo');
  assert.equal(statusGrupo({ total: 5, auditados: 5, errados: 1 }), 'com_erro');
  assert.equal(statusGrupo({ total: 5, auditados: 1, errados: 1 }), 'com_erro');
});

test('só admin e gestor auditam', () => {
  assert.equal(podeAuditar('admin'), true);
  assert.equal(podeAuditar('Gestor'), true);
  assert.equal(podeAuditar('analista'), false);
  assert.equal(podeAuditar(undefined), false);
});

test('aplicar um veredito atualiza os contadores sem recontar do servidor', () => {
  const grupo = { total: 3, auditados: 0, corretos: 0, errados: 0 };
  const a = aplicaVeredito(grupo, null, 'correto');
  assert.deepEqual(a, { total: 3, auditados: 1, corretos: 1, errados: 0 });
  const b = aplicaVeredito(a, 'correto', 'errado');
  assert.deepEqual(b, { total: 3, auditados: 1, corretos: 0, errados: 1 });
  const c = aplicaVeredito(b, 'errado', null);
  assert.deepEqual(c, { total: 3, auditados: 0, corretos: 0, errados: 0 });
});

test('repetir o mesmo veredito não conta duas vezes e nada fica negativo', () => {
  const grupo = { total: 3, auditados: 1, corretos: 1, errados: 0 };
  assert.deepEqual(aplicaVeredito(grupo, 'correto', 'correto'), grupo);
  assert.deepEqual(aplicaVeredito({ total: 1, auditados: 0, corretos: 0, errados: 0 }, 'correto', null),
    { total: 1, auditados: 0, corretos: 0, errados: 0 });
});

test('corrigir leva ao Mercado já filtrado pela marca e pelo modelo do anúncio', () => {
  assert.deepEqual(contextoParaCorrigir({ marca: 'DAF', modelo: 'XF 530', titulo: 'DAF XF 530 6x4' }),
    { marca: 'DAF', busca: 'XF 530' });
  assert.deepEqual(contextoParaCorrigir({ marca: 'DAF', modelo: null, titulo: 'DAF XF 530 6x4' }),
    { marca: 'DAF', busca: 'DAF XF 530 6x4' });
});

test('o resumo recalcula não auditados e precisão depois de um clique', () => {
  const r = recalculaResumo({ total: 10, auditados: 4, corretos: 3, errados: 1, grupos: 2 });
  assert.equal(r.nao_auditados, 6);
  assert.equal(r.precisao_pct, 75);
  assert.equal(r.grupos, 2);
  assert.equal(recalculaResumo({ total: 10, auditados: 0, corretos: 0, errados: 0 }).precisao_pct, null);
  assert.equal(recalculaResumo({ total: 3, auditados: 3, corretos: 2, errados: 1 }).precisao_pct, 66.7);
});
