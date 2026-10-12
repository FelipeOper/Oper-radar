import test from 'node:test';
import assert from 'node:assert/strict';
import { demoDesloca, demoDeslocamentoMs, demoGet } from '../src/demoFixtures.js';

const BASE = Date.parse('2026-09-23T12:00:00-03:00');
const HORA = 3600000;
const DIA = 24 * HORA;

test('relogio da fixture: no instante-base nada se desloca', () => {
  assert.equal(demoDeslocamentoMs(BASE), 0);
  assert.equal(demoDeslocamentoMs(BASE - 5 * DIA), 0);
  const kpis = demoGet('hoje_stats.php', BASE).kpis;
  assert.equal(kpis.ultima_coleta, '2026-09-23T12:00:00-03:00');
});

test('relogio da fixture: deslocamento em horas inteiras, nunca no futuro', () => {
  const agora = BASE + 3 * DIA + 5 * HORA + 40 * 60000;
  const delta = demoDeslocamentoMs(agora);
  assert.equal(delta, 3 * DIA + 5 * HORA);
  assert.ok(BASE + delta <= agora);
});

test('relogio da fixture: ultima coleta acompanha o relogio real e a pilula nao envelhece', () => {
  const agora = BASE + 10 * DIA + 2 * HORA;
  const ultima = Date.parse(demoGet('hoje_stats.php', agora).kpis.ultima_coleta);
  const horasAtras = Math.round((agora - ultima) / HORA);
  assert.ok(horasAtras < 24, `pilula diria "AGUARDANDO COLETA" (${horasAtras} h)`);
});

test('relogio da fixture: frescor por UF mantem a idade relativa (SC 41 h, SP 5 h, PR 5 h) em qualquer dia', () => {
  for (const dias of [0, 1, 9, 400]) {
    const agora = BASE + dias * DIA;
    const frescor = demoGet('frescor_coleta.php', agora);
    const atualizado = Date.parse(frescor.atualizado_em.replace(' ', 'T') + '-03:00');
    for (const item of frescor.itens) {
      const idade = Math.round((atualizado - Date.parse(item.ultima_coleta.replace(' ', 'T') + '-03:00')) / HORA);
      assert.equal(idade, item.horas, `${item.uf} em +${dias} dias`);
    }
    assert.equal(atualizado, BASE + dias * DIA, 'atualizado_em e "agora" da fixture');
  }
});

test('relogio da fixture: historico so com data e texto sem data ficam fixos', () => {
  const agora = BASE + 20 * DIA;
  const detalhe = demoGet('anuncio_detalhe.php?id=101', agora);
  assert.deepEqual(detalhe.historico.map(h => h.data), ['2026-09-21', '2026-09-23']);
  assert.equal(demoDesloca('Volvo FH 540', DIA), 'Volvo FH 540');
  assert.equal(demoDesloca(42, DIA), 42);
  assert.equal(demoDesloca(null, DIA), null);
});

test('relogio da fixture: formatos dd/mm/aaaa hh:mm e virada de mes', () => {
  assert.equal(demoDesloca('23/09/2026 12:00', 8 * DIA + 13 * HORA), '02/10/2026 01:00');
  assert.equal(demoDesloca('2026-09-23 09:12:00', 8 * DIA), '2026-10-01 09:12:00');
  assert.equal(demoDesloca('2026-09-23T12:00:00-03:00', HORA), '2026-09-23T13:00:00-03:00');
});

test('relogio da fixture: nao altera o objeto original da fixture (duas chamadas iguais)', () => {
  const a = demoGet('frescor_coleta.php', BASE + 3 * DIA);
  const b = demoGet('frescor_coleta.php', BASE);
  assert.equal(b.itens[0].ultima_coleta, '2026-09-21 19:00:00');
  assert.notEqual(a.itens[0].ultima_coleta, b.itens[0].ultima_coleta);
});
