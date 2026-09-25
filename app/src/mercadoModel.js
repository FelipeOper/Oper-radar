/* Regras puras do painel Mercado: evidencia das metricas do Panorama e leitura da
   oportunidade regional do modelo. Sem React e sem rede (testavel com node:test). */

const brl = valor => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const inteiro = valor => Number(valor ?? 0).toLocaleString('pt-BR');
const pctAssinado = valor => `${Number(valor) > 0 ? '+' : ''}${Number(valor).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
const doisDigitos = n => String(n).padStart(2, '0');

const PERIODOS = { '7d': 'Últimos 7 dias', '30d': 'Últimos 30 dias', '90d': 'Últimos 90 dias', '180d': 'Últimos 180 dias', '12m': 'Últimos 12 meses' };

function textoData(valor) {
  if (!valor) return null;
  const data = new Date(String(valor).replace(' ', 'T'));
  if (Number.isNaN(data.getTime())) return null;
  return `${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)}/${data.getFullYear()} ${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`;
}

export function recorteDoPainel(escopo = {}, segmentoRotulo = 'Caminhões e implementos') {
  const ufs = Array.isArray(escopo.ufs) && escopo.ufs.length ? escopo.ufs.join(', ') : 'Todas as UFs';
  const cidade = escopo.cidade && escopo.cidade !== 'todas' ? ` · ${escopo.cidade}` : '';
  return `${ufs}${cidade} · ${segmentoRotulo}`;
}

/* Evidencia dos quatro KPIs do Panorama. So usa campos que a API entrega; a confianca do
   ticket vem de resumo.confianca (regra 5/10/20 preços), nunca inventada. */
export function evidenciaPanorama({ resumo = {}, escopo = {}, fonte = {}, periodo = '30d', segmentoRotulo } = {}) {
  const recorte = recorteDoPainel(escopo, segmentoRotulo);
  const atualizacao = textoData(fonte.atualizado_em);
  const janela = (PERIODOS[periodo] || periodo).toLowerCase();
  const suficiente = resumo.confianca && resumo.confianca !== 'insuficiente';
  const desvio = desvioFipeExibivel(resumo);
  return {
    anuncios: {
      recorte,
      periodo: `Estoque ativo hoje · entradas e saídas nos ${janela}`,
      valor: `${inteiro(resumo.anuncios)} anúncios`,
      base: `${inteiro(resumo.entradas_periodo)} entradas · ${inteiro(resumo.saidas_periodo)} saídas`,
      atualizacao,
      explicacao: 'O período altera as entradas e saídas, não o estoque ativo. Saída observada não é venda.',
    },
    lojistas: {
      recorte,
      periodo: 'Estoque ativo hoje',
      valor: `${inteiro(resumo.lojistas)} lojistas`,
      base: `${inteiro(resumo.cidades)} cidades · ${inteiro(resumo.ufs)} UFs`,
      atualizacao,
      explicacao: 'Revendas com pelo menos um anúncio ativo dentro do recorte.',
    },
    ticket: {
      recorte,
      periodo: 'Estoque ativo hoje',
      valor: suficiente ? brl(resumo.ticket_mediano) : 'Amostra insuficiente',
      amostra: `${inteiro(resumo.amostra_qualificada)} preços qualificados de ${inteiro(resumo.anuncios)} anúncios`,
      confianca: resumo.confianca,
      atualizacao,
      explicacao: 'Mediana dos preços qualificados (sem valores extremos ou inválidos), nunca média bruta. Mistura modelos e anos: para comparar, use "Modelos em destaque".',
    },
    desvio: {
      recorte,
      periodo: 'Estoque ativo hoje',
      valor: desvio.valor == null ? (desvio.amostra == null ? 'Sem amostra verificável' : 'Amostra insuficiente') : pctAssinado(desvio.valor),
      base: 'Preço anunciado contra a tabela FIPE (mediana dos desvios)',
      ...(desvio.amostra == null ? {} : { amostra: `${inteiro(desvio.amostra)} preços válidos com FIPE`, confianca: resumo.desvio_fipe_confianca || 'insuficiente' }),
      atualizacao,
      explicacao: 'Mediana do desvio entre o preço anunciado e a FIPE, só nos anúncios ativos com FIPE vinculada e preço válido; a mediana não é puxada por vínculos FIPE suspeitos. Modelos até 2005 ficam de fora: para eles a FIPE não é referência confiável do preço anunciado. Só é exibida com ao menos 5 preços válidos. FIPE cobre parte dos anúncios e não cobre implementos.',
    },
  };
}

/* Desvio MEDIANO da FIPE do Panorama: so vira numero quando a API informa amostra >= 5 precos validos e o campo da mediana.
   Sem amostra verificavel (servidor antigo) ou com amostra menor, nao ha numero: errado e pior que nenhum. */
export const AMOSTRA_MINIMA_DESVIO_FIPE = 5;
export function desvioFipeExibivel(resumo = {}) {
  const amostra = resumo.desvio_fipe_amostra == null ? null : Number(resumo.desvio_fipe_amostra);
  const valor = resumo.desvio_fipe_mediano_pct == null ? null : Number(resumo.desvio_fipe_mediano_pct);
  // API antiga (sem o campo da mediana): a media nao serve como substituta, entao nao ha numero verificavel
  if (amostra == null || resumo.desvio_fipe_mediano_pct === undefined) return { valor: null, amostra: null };
  if (amostra < AMOSTRA_MINIMA_DESVIO_FIPE) return { valor: null, amostra };
  return { valor, amostra };
}

export const COMPONENTES_OPORTUNIDADE = [
  ['movimento', 'Movimento observado'],
  ['concorrencia', 'Concorrência (menos ofertas pontua mais)'],
  ['tempo_saida', 'Tempo até a saída (mais rápido pontua mais)'],
  ['preco', 'Posicionamento de preço'],
  ['qualidade', 'Qualidade e cobertura da amostra'],
];

/* Oportunidade regional do modelo -> linhas para a interface.
   Retorna null quando a API nao trouxe o bloco (servidor antigo ou falha tolerada). */
export function leituraOportunidade(dados) {
  if (!dados || !Array.isArray(dados.regioes) || !dados.regioes.length) return null;
  const linhas = dados.regioes.map(regiao => {
    const avaliacao = regiao.avaliacao || {};
    return {
      uf: regiao.uf,
      publicavel: Boolean(avaliacao.publicavel),
      pontuacao: Number(avaliacao.pontuacao ?? 0),
      confianca: avaliacao.confianca || 'insuficiente',
      motivo: avaliacao.motivo_confianca || '',
      comparaveis: Number(regiao.comparaveis ?? 0),
      revendas: Number(regiao.revendas ?? 0),
      saidas: Number(regiao.saidas_observadas ?? 0),
      diasSaida: regiao.mediana_dias_saida == null ? null : Number(regiao.mediana_dias_saida),
      precoMediano: regiao.preco_mediano == null ? null : Number(regiao.preco_mediano),
      componentes: COMPONENTES_OPORTUNIDADE.map(([chave, rotulo]) => ({
        chave,
        rotulo,
        indice: Number(avaliacao.componentes?.[chave]?.indice ?? 0),
        peso: Number(avaliacao.componentes?.[chave]?.peso ?? 0),
        contribuicao: Number(avaliacao.componentes?.[chave]?.contribuicao ?? 0),
      })),
    };
  });
  const historico = dados.historico_eventos || {};
  return {
    linhas,
    melhorUf: dados.melhor_uf || null,
    semHistorico: historico.disponivel === false,
    coberturaDias: Number(historico.cobertura_dias ?? 0),
    nota: dados.nota || '',
  };
}

/* Texto curto do modelo (confianca + amostra) para o card de "Modelos em destaque". */
export function textoAmostraModelo(precos = {}) {
  if (!precos || precos.amostra_qualificada == null) return '';
  const n = Number(precos.amostra_qualificada);
  const nivel = { alta: 'alta', media: 'média', baixa: 'baixa', insuficiente: 'insuficiente' }[precos.confianca] || precos.confianca;
  return `${n} ${n === 1 ? 'preço válido' : 'preços válidos'} · confiança ${nivel}`;
}
