/* Minha Loja: posição de cada veículo próprio contra o mercado e a FIPE.
   Lógica pura (sem React) para ser testada. Só usa o que `minha_loja.php` entrega:
   número sem base vira "amostra insuficiente" ou "fora da base", nunca um valor inventado. */

export const AMOSTRA_MINIMA = 5; // mesmo mínimo de preços válidos do backend (OPER_RADAR_AMOSTRA_MINIMA)
export const CORTE_ACIMA_PCT = 5; // % acima da mediana a partir do qual o veículo é "Acima do mercado" (mesmo corte da DEMO)

const num = valor => {
  if (valor == null || valor === '') return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
};
const positivo = valor => {
  const n = num(valor);
  return n != null && n > 0 ? n : null;
};

export const brl = valor => (valor == null ? '—' : Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }));
export const pct = valor => {
  if (valor == null) return '—';
  const arredondado = Math.abs(valor) < 0.05 ? 0 : valor;
  return `${arredondado > 0 ? '+' : ''}${arredondado.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
};

export const nomeVeiculo = item => [item.marca, item.modelo, item.ano].filter(Boolean).join(' ') || item.titulo || 'Veículo';

/* status: acima | comp | insuf | fora. `fora` = usuário tirou o veículo da base comparativa. */
export function posicaoItem(item) {
  const preco = positivo(item?.preco_anunciado);
  const mediana = positivo(item?.preco_mediana_mercado);
  const fipe = item?.fipe_vinculo_status === 'incompativel' ? null : positivo(item?.preco_fipe);
  const vsFipe = preco != null && fipe != null ? Math.round((preco / fipe - 1) * 1000) / 10 : null;
  if (Number(item?.usar_comparativo ?? 1) !== 1) return { status: 'fora', vsMediana: null, vsFipe: null };
  if (!item?.mercado_amostra_suficiente || mediana == null || preco == null) return { status: 'insuf', vsMediana: null, vsFipe };
  const desvio = (preco / mediana - 1) * 100; // o corte usa o valor exato; só a exibição arredonda (4,96% não vira "5%" e "acima")
  return { status: desvio >= CORTE_ACIMA_PCT ? 'acima' : 'comp', vsMediana: Math.round(desvio * 10) / 10, vsFipe };
}

export const ROTULO_STATUS = {
  acima: ['warning', 'Acima do mercado'],
  comp: ['success', 'Competitivo'],
  insuf: ['neutral', 'Amostra insuficiente'],
  fora: ['neutral', 'Fora da base comparativa'],
};

/* Resumo do estoque ATIVO (vendido não conta). */
export function resumoLoja(itens) {
  const ativos = (itens || []).filter(i => i.status !== 'vendido');
  const grupos = { acima: [], comp: [], insuf: [], fora: [] };
  ativos.forEach(i => grupos[posicaoItem(i).status].push(i));
  const comDias = ativos.filter(i => num(i.dias_estoque) != null);
  return {
    total: ativos.length,
    valor: ativos.reduce((s, i) => s + (positivo(i.preco_anunciado) || 0), 0),
    idadeMediaDias: comDias.length ? Math.round(comDias.reduce((s, i) => s + Number(i.dias_estoque), 0) / comDias.length) : null,
    acima: grupos.acima, comp: grupos.comp, insuf: grupos.insuf, fora: grupos.fora,
    comparaveis: grupos.acima.length + grupos.comp.length,
  };
}

/* Sem FIPE utilizável: sem ID, referência não encontrada ou vínculo incompatível (a API zera o preço FIPE nesses casos). */
export const semReferenciaFipe = item => !item?.fipe_preco_id || ['sem_vinculo', 'incompativel', 'referencia_nao_encontrada'].includes(item?.fipe_vinculo_status);

/* Evidência do cartão: de onde vem a mediana e por que pode não existir. */
export function evidenciaItem(item, posicao = posicaoItem(item)) {
  const amostra = num(item.anuncios_comparaveis);
  const total = num(item.mercado_amostra_total);
  const linhas = {
    recorte: `${nomeVeiculo(item)} · mercado nacional`,
    periodo: 'Anúncios ativos hoje',
    amostra: amostra != null ? `${amostra} preços válidos${total != null ? ` de ${total} anúncios` : ''}` : undefined,
    confianca: item.mercado_confianca,
  };
  if (posicao.status === 'fora') {
    return { ...linhas, base: 'Veículo fora da base comparativa', explicacao: 'Você desativou a comparação deste veículo. Reative no cadastro para voltar a compará-lo.' };
  }
  const ressalvaFipe = positivo(item.preco_fipe) == null ? ' Sem referência FIPE vinculada ou compatível.' : '';
  return {
    ...linhas,
    base: posicao.status === 'insuf' ? 'Sem base: amostra insuficiente' : `Mediana qualificada ${brl(item.preco_mediana_mercado)}${positivo(item.preco_fipe) ? ` · FIPE ${brl(item.preco_fipe)}` : ''}`,
    explicacao: 'Mediana dos preços qualificados de anúncios ativos do mesmo veículo na FIPE (exclui sem preço e preços fora de 35–250% da referência), em todo o Brasil. '
      + (posicao.status === 'insuf' ? 'Abaixo de 5 preços válidos não há comparação. ' : '')
      + `Acima do mercado = preço ${CORTE_ACIMA_PCT}% ou mais acima da mediana: sinal para revisar, não prova de preço errado. Não avalia o estado do veículo.${ressalvaFipe}`,
  };
}

/* Alertas do topo: só o que exige atenção. */
export function alertasLoja(resumo) {
  const lista = [];
  if (resumo.acima.length) {
    lista.push({
      tom: 'warning',
      titulo: `${resumo.acima.length} ${resumo.acima.length > 1 ? 'veículos acima' : 'veículo acima'} do mercado`,
      texto: `${resumo.acima.slice(0, 5).map(i => `${nomeVeiculo(i)} (${pct(posicaoItem(i).vsMediana)})`).join(' · ')}${resumo.acima.length > 5 ? ` e mais ${resumo.acima.length - 5}` : ''}. Vale revisar o preço ou destacar diferenciais; confira versão e condição antes de decidir.`,
    });
  }
  const semFipe = resumo.insuf.filter(semReferenciaFipe);
  const poucos = resumo.insuf.length - semFipe.length;
  // Causas diferentes pedem ações diferentes: sem vínculo se resolve no cadastro; poucos anúncios só o mercado resolve.
  if (semFipe.length) {
    lista.push({
      tom: 'info',
      titulo: `${semFipe.length} sem vínculo com a FIPE`,
      texto: 'Sem a referência FIPE vinculada não há comparação com o mercado. Abra o cadastro do veículo e escolha a versão correta para comparar.',
    });
  }
  if (poucos > 0) {
    lista.push({
      tom: 'info',
      titulo: `${poucos} com poucos anúncios equivalentes`,
      texto: `A FIPE está vinculada, mas há menos de ${AMOSTRA_MINIMA} preços válidos do mesmo veículo no mercado. Não comparo abaixo disso; a FIPE segue como referência de tabela.`,
    });
  }
  return lista;
}
