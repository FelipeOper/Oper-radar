import test from 'node:test';
import assert from 'node:assert/strict';
import { orientacaoDesatualizada, precisaDeAcao, rotuloAcao, tituloAcaoPlano, tomAcao } from '../src/orientacaoEstoqueModel.js';

test('rótulo e tom cobrem as quatro ações possíveis; ação desconhecida cai em "sem base"', () => {
  assert.equal(rotuloAcao('manter'), 'Manter preço');
  assert.equal(rotuloAcao('avaliar_reducao'), 'Avaliar redução');
  assert.equal(rotuloAcao('avaliar_outra_praca'), 'Avaliar outra praça');
  assert.equal(rotuloAcao('sem_base'), 'Sem base suficiente');
  assert.equal(rotuloAcao('xyz'), 'Sem base suficiente');
  assert.equal(tomAcao('manter'), 'success');
  assert.equal(tomAcao('avaliar_reducao'), 'warning');
  assert.equal(tomAcao('avaliar_outra_praca'), 'info');
  assert.equal(tomAcao('xyz'), 'neutral');
});

test('título da ação no Plano nomeia o veículo e a decisão certa para cada caso', () => {
  assert.equal(tituloAcaoPlano({ acao: 'avaliar_reducao' }, 'Volvo FH 540'), 'Avaliar redução de preço: Volvo FH 540');
  assert.equal(tituloAcaoPlano({ acao: 'avaliar_outra_praca', uf_sugerida: 'SP' }, 'Volvo FH 540'), 'Avaliar anunciar em SP: Volvo FH 540');
  assert.equal(tituloAcaoPlano({ acao: 'manter' }, 'Volvo FH 540'), 'Revisar preço: Volvo FH 540');
});

test('botão "Criar ação" só aparece quando há algo a decidir — não em manter nem sem_base', () => {
  assert.equal(precisaDeAcao({ acao: 'avaliar_reducao' }), true);
  assert.equal(precisaDeAcao({ acao: 'avaliar_outra_praca' }), true);
  assert.equal(precisaDeAcao({ acao: 'manter' }), false);
  assert.equal(precisaDeAcao({ acao: 'sem_base' }), false);
  assert.equal(precisaDeAcao(null), false);
});

test('orientação fica desatualizada quando rascunho diverge do item analisado (preço, UF ou referência FIPE), não com outros campos', () => {
  const analisado = { preco_anunciado: 450000, uf: 'PR', fipe_preco_id: 900 };
  assert.equal(orientacaoDesatualizada({ preco_anunciado: 450000, uf: 'PR', fipe_preco_id: 900 }, analisado), false, 'igual: não está desatualizada');
  assert.equal(orientacaoDesatualizada({ preco_anunciado: '450000', uf: 'PR', fipe_preco_id: 900 }, analisado), false, 'string numérica igual (input controlado) não conta como mudança');
  assert.equal(orientacaoDesatualizada({ preco_anunciado: 460000, uf: 'PR', fipe_preco_id: 900 }, analisado), true, 'preço mudou');
  assert.equal(orientacaoDesatualizada({ preco_anunciado: 450000, uf: 'SP', fipe_preco_id: 900 }, analisado), true, 'UF mudou');
  // achado do Codex (round 2): minha_loja_detalhe.php busca região/nacional pelo fipe_preco_id do item salvo —
  // trocar a referência FIPE no rascunho muda o próprio conjunto de comparáveis, não só o desvio exibido.
  assert.equal(orientacaoDesatualizada({ preco_anunciado: 450000, uf: 'PR', fipe_preco_id: 901 }, analisado), true, 'referência FIPE mudou');
  assert.equal(orientacaoDesatualizada(null, analisado), false, 'sem rascunho: não há o que comparar');
  assert.equal(orientacaoDesatualizada({ preco_anunciado: 450000, uf: 'PR', fipe_preco_id: 900 }, null), false, 'sem item analisado ainda (carregando): não sinaliza desatualizada');
});
