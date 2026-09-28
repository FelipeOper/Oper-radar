import test from 'node:test';
import assert from 'node:assert/strict';
import { CHAVE_ARMAZENAMENTO, ORIGENS, carregaAcoes, definirUsuarioAtivo, montaAcao, normalizaAcao, normalizaAcoes, salvaAcoes, separaPendentesFeitas } from '../src/planoAcaoModel.js';

/* Node não tem localStorage global; simula os dois casos que o Codex pediu para cobrir: gravação normal
   e falha de gravação (modo privado, storage cheio). */
function fakeLocalStorage({ falha = false } = {}) {
  let bruto = null;
  return {
    getItem: () => bruto,
    setItem: (_chave, valor) => { if (falha) throw new Error('quota excedida (simulado)'); bruto = valor; },
    removeItem: () => { bruto = null; },
  };
}

/* Versão com várias chaves de verdade (a de cima ignora a chave e serve só pros testes de fallback
   em memória) — precisa pra testar o escopo por usuário, que grava chaves diferentes por conta. */
function fakeLocalStorageMultiChave() {
  const mapa = new Map();
  return {
    getItem: chave => (mapa.has(chave) ? mapa.get(chave) : null),
    setItem: (chave, valor) => mapa.set(chave, valor),
    removeItem: chave => mapa.delete(chave),
  };
}

test('monta ação com título, origem e evidência; título vazio não vira ação', () => {
  const a = montaAcao({ titulo: 'Avaliar FH 540', origem: 'Oportunidades', evidencia: 'Curitiba/PR · R$ 440.000', href: 'https://exemplo.com/a' });
  assert.equal(a.titulo, 'Avaliar FH 540');
  assert.equal(a.origem, 'Oportunidades');
  assert.equal(a.evidencia, 'Curitiba/PR · R$ 440.000');
  assert.equal(a.href, 'https://exemplo.com/a');
  assert.equal(a.done, false);
  assert.match(a.id, /^local-/);
  assert.equal(montaAcao({ titulo: '  ' }), null);
  assert.equal(montaAcao({ titulo: '' }), null);
});

test('origem fora da lista vira Manual; lista bate com as páginas reais do produto', () => {
  assert.deepEqual(ORIGENS, ['Manual', 'Mercado', 'Minha Loja', 'Concorrência', 'Oportunidades', 'Análise', 'FIPE']);
  assert.equal(montaAcao({ titulo: 'x', origem: 'Inteligência' }).origem, 'Manual');
  assert.equal(montaAcao({ titulo: 'x' }).origem, 'Manual');
});

test('título e evidência têm limite de tamanho (nunca gravam texto sem fim no localStorage)', () => {
  const a = montaAcao({ titulo: 'x'.repeat(300), evidencia: 'y'.repeat(900) });
  assert.equal(a.titulo.length, 120);
  assert.equal(a.evidencia.length, 400);
});

test('href só aceita http/https externo ou caminho interno começando com "/"; qualquer outro esquema é descartado', () => {
  assert.equal(montaAcao({ titulo: 'x', href: 'https://exemplo.com/a' }).href, 'https://exemplo.com/a');
  assert.equal(montaAcao({ titulo: 'x', href: '/mercado?modelo=FH540' }).href, '/mercado?modelo=FH540');
  // "//host" (protocol-relative) e "/\host" (o navegador lê "\" como "/" na resolução de URL) mudam a origem mesmo
  // começando com "/" — não são caminho interno. Achado do Codex: "/\evil.example" escapava do filtro antigo.
  for (const ruim of [
    'javascript:alert(1)', 'data:text/html,x', '//exemplo.com', '/\\evil.example', '/\\\\evil.example',
    // achado do Codex: um href malicioso não pode "adivinhar" a base interna e escapar da checagem de origem
    '//oper-radar-interno-x.invalid/evil', '/\\/oper-radar-interno-x.invalid/evil',
    undefined, null,
  ]) {
    assert.equal(montaAcao({ titulo: 'x', href: ruim }).href, '', `deveria rejeitar: ${ruim}`);
  }
});

test('salvaAcoes: falha de localStorage não perde a ação — carregaAcoes() usa o fallback em memória (achado do Codex)', () => {
  const original = globalThis.localStorage;
  try {
    globalThis.localStorage = fakeLocalStorage({ falha: true });
    const nova = montaAcao({ titulo: 'Avaliar FH 540', origem: 'Oportunidades', evidencia: 'R$ 440.000' });
    const ok = salvaAcoes([nova]);
    assert.equal(ok, false, 'salvaAcoes avisa que a gravação falhou');
    // simula a navegação real: PagePlanoAcao remonta e lê carregaAcoes() do zero — a ação não pode ter sumido
    const relido = carregaAcoes();
    assert.equal(relido.length, 1);
    assert.equal(relido[0].titulo, 'Avaliar FH 540');
  } finally {
    globalThis.localStorage = original;
  }
});

test('salvaAcoes: gravação bem-sucedida limpa o fallback em memória (não mascara uma falha futura de leitura real)', () => {
  const original = globalThis.localStorage;
  try {
    globalThis.localStorage = fakeLocalStorage();
    assert.equal(salvaAcoes([montaAcao({ titulo: 'a' })]), true);
    assert.equal(carregaAcoes().length, 1);
    globalThis.localStorage = fakeLocalStorage({ falha: true }); // storage novo, já sem o fallback do teste anterior
    assert.equal(carregaAcoes().length, 0, 'sem fallback e sem dado gravado nesta instância, a lista é vazia');
  } finally {
    globalThis.localStorage = original;
  }
});

test('normalizaAcao migra o formato antigo (texto/feita) sem perder a ação', () => {
  const migrada = normalizaAcao({ id: 'local-1', texto: 'Ação antiga', feita: true, criadaEm: '2026-09-01T10:00:00.000Z' });
  assert.equal(migrada.titulo, 'Ação antiga');
  assert.equal(migrada.done, true);
  assert.equal(migrada.origem, 'Manual');
  assert.equal(migrada.criadaEm, '2026-09-01T10:00:00.000Z');
});

test('normalizaAcoes descarta lixo (não array, item sem título) sem lançar exceção', () => {
  assert.deepEqual(normalizaAcoes(null), []);
  assert.deepEqual(normalizaAcoes('nao é lista'), []);
  assert.equal(normalizaAcoes([{ titulo: 'ok' }, {}, { titulo: '   ' }, null, 42]).length, 1);
});

test('definirUsuarioAtivo escopa leitura/escrita por conta; duas contas no mesmo navegador não leem a lista uma da outra (achado do Codex)', () => {
  const original = globalThis.localStorage;
  try {
    globalThis.localStorage = fakeLocalStorageMultiChave();
    definirUsuarioAtivo(null);
    definirUsuarioAtivo('7');
    salvaAcoes([montaAcao({ titulo: 'do usuário 7' })]);
    definirUsuarioAtivo('9');
    assert.equal(carregaAcoes().length, 0, 'usuário 9 não enxerga a lista gravada pelo usuário 7');
    salvaAcoes([montaAcao({ titulo: 'do usuário 9' })]);
    definirUsuarioAtivo('7');
    assert.equal(carregaAcoes().length, 1);
    assert.equal(carregaAcoes()[0].titulo, 'do usuário 7', 'voltar pro usuário 7 ainda vê a lista dele, não a do 9');
  } finally {
    definirUsuarioAtivo(null);
    globalThis.localStorage = original;
  }
});

test('chave antiga sem escopo (de antes desta correção) NÃO migra automaticamente para quem logar primeiro (achado do Codex no round 2: migração vazava titularidade errada)', () => {
  const original = globalThis.localStorage;
  try {
    const armazem = fakeLocalStorageMultiChave();
    globalThis.localStorage = armazem;
    definirUsuarioAtivo(null);
    salvaAcoes([montaAcao({ titulo: 'legado sem conta' })]); // grava sob a chave antiga, sem usuário ativo
    definirUsuarioAtivo('7');
    assert.equal(carregaAcoes().length, 0, 'primeira conta a logar não herda o legado — titularidade não pode ser assumida');
    assert.notEqual(armazem.getItem(CHAVE_ARMAZENAMENTO), null, 'a simples leitura da conta 7 não apaga nem consome a chave antiga');
    definirUsuarioAtivo('9');
    assert.equal(carregaAcoes().length, 0, 'segunda conta a logar também não herda o legado');
  } finally {
    definirUsuarioAtivo(null);
    globalThis.localStorage = original;
  }
});

test('separaPendentesFeitas divide pelas duas listas sem perder nem duplicar item', () => {
  const acoes = [montaAcao({ titulo: 'a' }), { ...montaAcao({ titulo: 'b' }), done: true }, montaAcao({ titulo: 'c' })];
  const { pendentes, feitas } = separaPendentesFeitas(acoes);
  assert.equal(pendentes.length, 2);
  assert.equal(feitas.length, 1);
  assert.equal(pendentes.length + feitas.length, acoes.length);
});
