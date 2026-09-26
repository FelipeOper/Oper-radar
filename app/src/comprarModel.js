/* "O que comprar" por região: textos e regras de exibição (sem React, testável).
   Os números e a pontuação vêm de oportunidades_compra.php; aqui só se decide como dizê-los sem exagerar:
   são candidatos à negociação (não "ideais"), preço é anunciado e redução/tempo são sinais, não prova. */

export const ROTULO_COMPONENTE = {
  preco_mediana: 'Preço vs mediana da UF',
  preco_fipe: 'Preço vs FIPE',
  negociacao: 'Sinal de negociação',
  liquidez: 'Liquidez do modelo na UF',
  qualidade: 'Qualidade do anúncio',
};

const num = valor => {
  if (valor == null || valor === '') return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
};

export const brl = valor => (num(valor) == null ? '—' : Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }));

export function pctAssinado(valor) {
  const v = num(valor);
  if (v == null) return '—';
  const arredondado = Math.abs(v) < 0.05 ? 0 : v;
  return `${arredondado > 0 ? '+' : ''}${arredondado.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
}

/* O link vem de coleta de terceiros: só http/https vira href (a API também filtra; aqui é a segunda barreira).
   A regra mora em urlSegura.js; reexportada aqui para não quebrar quem já importa de comprarModel. */
export { urlSegura } from './urlSegura.js';

export const nomeModelo = m => `${m.marca} ${m.modelo} · ${m.ano}`;

/* UF com o modelo de maior índice primeiro; UF sem nada some. */
export function ordenaUfs(ufs) {
  return [...(ufs || [])].filter(u => u?.modelos?.length).sort((a, b) => {
    const pa = num(a.modelos[0]?.indice?.pontuacao) ?? -1;
    const pb = num(b.modelos[0]?.indice?.pontuacao) ?? -1;
    return pb - pa || String(a.uf).localeCompare(String(b.uf));
  });
}

/* Selos do anúncio: só o que a API entregou; ausência de FIPE utilizável é dita, não escondida. */
export function selosAnuncio(anuncio) {
  const selos = [];
  const dm = num(anuncio.desvio_mediana_pct);
  if (dm != null) selos.push({ tom: dm <= 0 ? 'success' : 'neutral', texto: `${pctAssinado(dm)} vs mediana da UF` });
  const df = num(anuncio.desvio_fipe_pct);
  selos.push(df != null ? { tom: df <= 0 ? 'success' : 'neutral', texto: `${pctAssinado(df)} vs FIPE` } : { tom: 'neutral', texto: 'Sem FIPE utilizável' });
  if (anuncio.reduziu_30d) selos.push({ tom: 'warning', texto: 'Preço caiu (30 d)' });
  const dias = num(anuncio.dias_observados);
  if (dias != null) selos.push({ tom: 'neutral', texto: `${dias} dias no radar` });
  return selos;
}

/* Componentes que entraram na nota, com o peso efetivo (a FIPE é redistribuída quando não é utilizável). */
export function linhasComponentes(anuncio) {
  return Object.entries(anuncio.componentes || {}).map(([chave, c]) => ({
    chave,
    rotulo: ROTULO_COMPONENTE[chave] || chave,
    indice: num(c?.indice),
    peso: num(c?.peso) ?? 0,
    usado: num(c?.indice) != null,
  }));
}

export function evidenciaModelo(uf, modelo) {
  const ind = modelo.indice || {};
  return {
    recorte: `${nomeModelo(modelo)} · ${uf}`,
    periodo: 'Anúncios ativos hoje; saídas observadas em até 180 dias',
    base: modelo.mediana_uf != null ? `Mediana qualificada da UF ${brl(modelo.mediana_uf)}` : 'Sem mediana qualificada',
    amostra: `${modelo.comparaveis ?? 0} preços válidos · ${modelo.revendas ?? 0} revendas · ${modelo.saidas_observadas ?? 0} saídas observadas`,
    confianca: ind.confianca,
    explicacao: 'Índice de 0 a 100 entre as UFs do mesmo modelo e ano: movimento observado, concorrência, tempo até a saída, preço e qualidade da amostra. Saída observada não é venda; UF sem amostra ou histórico suficiente não aparece. Anúncios pontuados por preço vs mediana da UF, vs FIPE (só com vínculo confiável), sinal de negociação, liquidez e qualidade. Preço é anunciado, não de venda; redução de preço e tempo no radar são sinais, não prova de disposição para negociar.',
  };
}

export function textoVazio(dados) {
  if (dados?.historico_eventos && dados.historico_eventos.disponivel === false) {
    return 'O histórico de eventos ainda não está disponível, então não há como medir a saída dos modelos por UF. Sem isso, não indicamos onde comprar.';
  }
  return 'Nenhuma UF tem, agora, modelo com amostra e histórico suficientes (mínimo de 5 preços válidos por praça) para indicar candidatos. Isso não é sinal de mercado ruim: é falta de base.';
}
