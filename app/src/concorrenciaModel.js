/* Leitura honesta dos indicadores da Concorrencia. Dados antigos podem omitir
   reducoes e desvio FIPE; ausente nunca vira zero. */
const n = valor => Number(valor ?? 0);
const inteiro = valor => n(valor).toLocaleString('pt-BR');
const percentual = valor => `${n(valor) > 0 ? '+' : ''}${n(valor).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

export function filtraRevendas(lojistas = [], { ufs = [], busca = '', ordem = 'estoque' } = {}) {
  const termo = busca.trim().toLocaleLowerCase('pt-BR');
  const lista = lojistas.filter(l => (!ufs.length || ufs.includes(l.uf)) &&
    (!termo || String(l.nome || '').toLocaleLowerCase('pt-BR').includes(termo)));
  const campo = { estoque: 'ativos', saidas: 'saidas_30d', reducoes: 'reducoes_30d', idade: 'idade_media_estoque' }[ordem] || 'ativos';
  return lista.sort((a, b) => {
    const va = campo === 'idade' && !a.idade_observada_confiavel ? null : a[campo];
    const vb = campo === 'idade' && !b.idade_observada_confiavel ? null : b[campo];
    if (va == null && vb != null) return 1;
    if (vb == null && va != null) return -1;
    return n(vb) - n(va) || String(a.nome).localeCompare(String(b.nome), 'pt-BR');
  });
}

export function panoramaConcorrencia(lojistas = [], escopo = 'Todas as UFs', atualizacao = null) {
  const ativos = lojistas.reduce((s, l) => s + n(l.ativos), 0);
  const saidas = lojistas.reduce((s, l) => s + n(l.saidas_30d), 0);
  const reducoesDisponiveis = lojistas.every(l => l.reducoes_30d != null);
  const reducoes = reducoesDisponiveis ? lojistas.reduce((s, l) => s + n(l.reducoes_30d), 0) : null;
  const comum = { recorte: `${escopo} · revendas monitoradas`, base: `${inteiro(ativos)} anúncios ativos em ${inteiro(lojistas.length)} revendas`, amostra: `${inteiro(lojistas.length)} revendas`, atualizacao };
  return [
    { titulo: 'Revendas no recorte', valor: inteiro(lojistas.length), evidencia: { ...comum, periodo: 'Estoque atual', valor: inteiro(lojistas.length), explicacao: 'Revendas retornadas pela API dentro das UFs selecionadas.' } },
    { titulo: 'Anúncios ativos', valor: inteiro(ativos), evidencia: { ...comum, periodo: 'Estoque atual', valor: inteiro(ativos), explicacao: 'Soma dos anúncios ativos das revendas listadas.' } },
    { titulo: 'Saídas observadas (30 d)', valor: inteiro(saidas), evidencia: { ...comum, periodo: 'Últimos 30 dias', valor: inteiro(saidas), explicacao: 'Ausência confirmada no portal. Não comprova venda.' } },
    { titulo: 'Reduções de preço (30 d)', valor: reducoes == null ? 'Dados indisponíveis' : inteiro(reducoes), evidencia: { ...comum, periodo: 'Últimos 30 dias', valor: reducoes == null ? 'Dados indisponíveis' : inteiro(reducoes), explicacao: 'Anúncios com ao menos uma queda de preço registrada nos eventos. Queda acima de 50% é descartada como provável erro de coleta. Redução é sinal, não prova.' } },
  ];
}

export function leituraRevenda(l, atualizacao = null) {
  const desvio = l.desvio_fipe_mediano_pct;
  return {
    idade: l.idade_observada_confiavel && l.idade_media_estoque != null ? `${Math.round(n(l.idade_media_estoque))} d` : 'Amostra temporal insuficiente',
    reducoes: l.reducoes_30d == null ? 'Indisponível' : inteiro(l.reducoes_30d),
    desvio: desvio == null ? 'Amostra insuficiente' : percentual(desvio),
    evidenciaDesvio: { recorte: `${l.nome} · ${l.cidade}/${l.uf}`, periodo: 'Estoque ativo', valor: desvio == null ? 'Amostra insuficiente' : percentual(desvio), base: 'Preço anunciado frente à FIPE vinculada de cada veículo', amostra: `${inteiro(l.desvio_fipe_amostra)} preços válidos com FIPE`, confianca: l.desvio_fipe_confianca || 'insuficiente', atualizacao, explicacao: 'Mediana dos desvios individuais. Só é exibida com ao menos 5 preços válidos vinculados à FIPE.' },
  };
}
