/* Comparador: regras puras para comparar dois recortes do mercado (sem React, testável).
   A API (`comparador.php`) devolve a mediana mesmo com amostra pequena; quem impõe o mínimo é esta camada:
   abaixo de 5 preços válidos por lado não há valor de preço nem veredito, para não induzir uma conclusão errada. */

export const AMOSTRA_MINIMA = 5; // mesmo mínimo do backend (OPER_RADAR_AMOSTRA_MINIMA)

export const MODOS = [
  ['marca', 'Marca inteira'],
  ['modelo', 'Modelo, qualquer marca'],
  ['marca_modelo', 'Marca + modelo'],
];

const RANK_CONFIANCA = { insuficiente: 0, baixa: 1, media: 2, alta: 3 };

const numero = valor => {
  if (valor == null || valor === '') return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
};

export const brl = valor => (valor == null ? '—' : Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }));
export const inteiro = valor => (valor == null ? '—' : Number(valor).toLocaleString('pt-BR'));
export const pct = valor => {
  if (valor == null) return '—';
  const v = Math.abs(valor) < 0.05 ? 0 : valor;
  return `${v > 0 ? '+' : ''}${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
};

export function seletorValido(lado) {
  if (!lado?.ano) return false;
  if (lado.modo === 'marca') return Boolean(lado.marca);
  if (lado.modo === 'modelo') return Boolean(lado.modelo);
  return Boolean(lado.marca && lado.modelo);
}

export const mesmoSeletor = (a, b) => ['modo', 'marca', 'modelo', 'ano'].every(k => String(a?.[k] ?? '') === String(b?.[k] ?? ''));

/* O lado tem base para mostrar valores de preço? */
export function ladoSuficiente(lado) {
  const precos = lado?.metricas?.precos;
  return Boolean(precos) && numero(precos.amostra_qualificada) >= AMOSTRA_MINIMA && numero(precos.mediana) > 0;
}

const amostraDe = lado => numero(lado?.metricas?.precos?.amostra_qualificada) ?? 0;
const ofertasDe = lado => numero(lado?.metricas?.ativos) ?? 0;
const plural = (n, um, varios) => `${inteiro(n)} ${n === 1 ? um : varios}`;

/* Diferença percentual A vs B; null sem base (nunca 0 inventado). */
export function diferencaPct(a, b) {
  const va = numero(a), vb = numero(b);
  if (va == null || vb == null || vb === 0) return null;
  return Math.round((va - vb) / vb * 1000) / 10;
}

/* Veredito do topo: mesmo recorte, amostra insuficiente ou a diferença da mediana qualificada. */
export function veredito(resultado, seletorA, seletorB) {
  if (!resultado?.lado_a || !resultado?.lado_b) return null;
  const { lado_a: a, lado_b: b } = resultado;
  if (mesmoSeletor(seletorA, seletorB)) {
    return { tom: 'info', titulo: 'Os dois lados são o mesmo recorte', texto: 'Escolha outro veículo em um dos lados para comparar.' };
  }
  const faltas = [];
  if (!ladoSuficiente(a)) faltas.push(`Lado A: ${plural(amostraDe(a), 'preço válido', 'preços válidos')} em ${plural(ofertasDe(a), 'oferta', 'ofertas')}`);
  if (!ladoSuficiente(b)) faltas.push(`Lado B: ${plural(amostraDe(b), 'preço válido', 'preços válidos')} em ${plural(ofertasDe(b), 'oferta', 'ofertas')}`);
  if (faltas.length) {
    return {
      tom: 'warning', titulo: 'Amostra insuficiente para comparar',
      texto: `${faltas.join(' · ')}. O mínimo é ${AMOSTRA_MINIMA} preços válidos por lado. Sem veredito, para não induzir uma conclusão errada. Tente outro ano ou um recorte mais amplo.`,
    };
  }
  const diff = diferencaPct(a.metricas.precos.mediana, b.metricas.precos.mediana);
  const cabeca = Math.abs(diff) < 0.05 ? 'A e B têm a mesma mediana qualificada' : `A está ${Math.abs(diff).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% ${diff > 0 ? 'acima' : 'abaixo'} de B na mediana qualificada`;
  const menor = [a, b].map(l => String(l.metricas.precos.confianca || 'insuficiente').toLowerCase())
    .sort((x, y) => (RANK_CONFIANCA[x] ?? 0) - (RANK_CONFIANCA[y] ?? 0))[0];
  return {
    tom: 'success', titulo: cabeca,
    texto: `(${brl(a.metricas.precos.mediana)} vs ${brl(b.metricas.precos.mediana)}). Os recortes são diferentes: a diferença reflete também categoria, versão e idade — não é uma oferta equivalente. Preços anunciados, não preços de venda. Confiança do veredito: ${menor}.`,
  };
}

/* Linhas lado a lado. Preço só com amostra mínima; contagens e movimento sempre. */
export function linhasComparacao(lado) {
  const m = lado?.metricas || {};
  const p = m.precos || {};
  const ok = ladoSuficiente(lado);
  const janela = m.periodo?.rotulo || '30 dias';
  return [
    ['Anúncios ativos', inteiro(m.ativos)],
    ['Preços válidos', inteiro(p.amostra_qualificada)],
    ['Mediana qualificada', ok ? brl(p.mediana) : 'Insuficiente'],
    ['Faixa central (p25–p75)', ok && p.p25 != null && p.p75 != null ? `${brl(p.p25)}–${brl(p.p75)}` : '—'],
    ['Mínimo · máximo', ok && p.menor != null && p.maior != null ? `${brl(p.menor)} · ${brl(p.maior)}` : '—'],
    ['Revendas', inteiro(m.revendas)],
    ['Estados', inteiro(m.ufs)],
    [`Entradas (${janela})`, inteiro(m.entradas_periodo ?? m.entradas_30d)],
    [`Saídas observadas (${janela})`, inteiro(m.saidas_periodo ?? m.saidas_30d)],
    ['Tempo observado (média)', m.dias_observados_media == null ? '—' : `${Number(m.dias_observados_media).toLocaleString('pt-BR')} dias`],
  ];
}

/* Diferenças de movimento (A vs B). Volume e tempo são contagens; não dependem da amostra de preço. */
export function diferencasMovimento(resultado) {
  const d = resultado?.diferencas || {};
  return [
    ['Oferta ativa', d.estoque_pct ?? null, 'diferença de volume anunciado'],
    ['Tempo observado', d.dias_observados_pct ?? null, 'diferença da média observada'],
  ];
}

export function evidenciaLado(rotulo, lado) {
  const m = lado?.metricas || {};
  const p = m.precos || {};
  const ok = ladoSuficiente(lado);
  return {
    recorte: `${rotulo} · ${lado?.rotulo || '—'}`,
    periodo: `Estoque ativo hoje; movimento em ${m.periodo?.rotulo || '30 dias'}`,
    base: ok ? `Mediana qualificada ${brl(p.mediana)}` : 'Sem base: amostra insuficiente',
    amostra: `${plural(numero(p.amostra_qualificada) ?? 0, 'preço válido', 'preços válidos')} de ${plural(numero(m.ativos) ?? 0, 'oferta', 'ofertas')} · ${plural(numero(m.revendas) ?? 0, 'revenda', 'revendas')}${numero(p.excluidos) > 0 ? ` · ${inteiro(p.excluidos)} excluídos por qualidade` : ''}`,
    confianca: ok ? p.confianca : 'insuficiente',
    explicacao: `Mediana, não média bruta: exclui anúncios sem preço e preços fora da faixa esperada. Com menos de ${AMOSTRA_MINIMA} preços válidos os valores de preço não são exibidos. Saída observada não é venda.`,
  };
}
