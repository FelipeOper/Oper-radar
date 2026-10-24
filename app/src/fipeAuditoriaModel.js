/* Auditoria de vínculos FIPE × anúncios (tela dentro de FIPE). Só lógica pura: montar a consulta,
   calcular progresso e atualizar contadores na hora do clique. Quem decide o que é "correto" é a
   pessoa; o servidor (fipe_auditoria.php) guarda o veredito do PAR anúncio × referência FIPE. */

export const REGIOES = ['Sul', 'Sudeste', 'Centro-Oeste', 'Nordeste', 'Norte'];
export const UFS = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'];

export const ESTADOS_AUDITORIA = [
  ['nao_auditados', 'Ainda não auditados'],
  ['errados', 'Marcados como errados'],
  ['corretos', 'Marcados como corretos'],
  ['todos', 'Todos'],
];

export const CONFIANCAS_VINCULO = [
  ['', 'Qualquer vínculo'],
  ['alto', 'Automático · alto'],
  ['medio', 'Automático · médio'],
  ['provisorio', 'Provisório'],
  ['manual', 'Manual (curadoria)'],
];

export const FILTROS_CONJUNTO = [
  ['', 'Conjunto: qualquer'],
  ['sim', 'Só conjuntos (cavalo + carreta)'],
  ['nao', 'Sem conjuntos'],
];

export const FILTROS_INICIAIS = Object.freeze({
  marca: '', modelo: '', revenda: '', cidade: '', uf: '', regiao: '', confianca: '', conjunto: '', estado: 'nao_auditados',
});

export function montaConsulta(filtros, extras = {}) {
  const todos = { visao: 'grupos', ...filtros, ...extras };
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(todos)) {
    const texto = valor == null ? '' : String(valor).trim();
    if (texto !== '') params.set(chave, texto);
  }
  return `fipe_auditoria.php?${params.toString()}`;
}

export function rotuloPrecisao(resumo) {
  const pct = resumo?.precisao_pct;
  if (pct == null) return '—';
  return `${Number(pct).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export function progressoGrupo(grupo) {
  return grupo?.total ? Math.round((100 * grupo.auditados) / grupo.total) : 0;
}

export function statusGrupo(grupo) {
  if (grupo.errados > 0) return 'com_erro';
  if (grupo.total > 0 && grupo.auditados >= grupo.total) return 'completo';
  if (grupo.auditados > 0) return 'em_andamento';
  return 'pendente';
}

export function podeAuditar(papel) {
  return ['admin', 'gestor'].includes(String(papel || '').toLowerCase());
}

/* Atualização otimista: o contador muda no clique e o servidor confirma depois. */
export function aplicaVeredito(contagem, antes, depois) {
  const novo = { ...contagem };
  if (antes === depois) return novo;
  const tira = veredito => {
    if (veredito === 'correto') { novo.corretos = Math.max(0, novo.corretos - 1); novo.auditados = Math.max(0, novo.auditados - 1); }
    if (veredito === 'errado') { novo.errados = Math.max(0, novo.errados - 1); novo.auditados = Math.max(0, novo.auditados - 1); }
  };
  const poe = veredito => {
    if (veredito === 'correto') { novo.corretos += 1; novo.auditados += 1; }
    if (veredito === 'errado') { novo.errados += 1; novo.auditados += 1; }
  };
  tira(antes);
  poe(depois);
  return novo;
}

/* "Corrigir" abre o Mercado já filtrado; a correção em si é a curadoria que já existe por anúncio. */
export function contextoParaCorrigir(anuncio) {
  return { marca: anuncio.marca, busca: anuncio.modelo || anuncio.titulo };
}

export function recalculaResumo(resumo) {
  const julgados = resumo.corretos + resumo.errados;
  return {
    ...resumo,
    nao_auditados: Math.max(0, resumo.total - resumo.auditados),
    precisao_pct: julgados > 0 ? Math.round((1000 * resumo.corretos) / julgados) / 10 : null,
  };
}

/* Conjunto = cavalo + carreta vendidos juntos. O preço é do conjunto e a FIPE é só a do cavalo, então o servidor
   tira o anúncio das comparações com a FIPE. valor: true (é conjunto), false (não é) ou null (volta ao automático). */
export function aplicaConjunto(anuncio, valor) {
  if (valor === null) return { ...anuncio, conjunto: null, conjunto_origem: null };
  return { ...anuncio, conjunto: valor ? 1 : 0, conjunto_origem: 'manual' };
}

export function rotuloConjunto(anuncio) {
  const origem = anuncio?.conjunto_origem === 'manual' ? 'manual' : 'automático';
  if (anuncio?.conjunto === 1) return `Conjunto · ${origem}`;
  if (anuncio?.conjunto === 0 && anuncio?.conjunto_origem === 'manual') return 'Não é conjunto · manual';
  return null;
}
