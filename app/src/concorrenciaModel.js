/* Leitura honesta dos indicadores da Concorrencia. Dados antigos podem omitir
   reducoes e desvio FIPE; ausente nunca vira zero. */
import { CATEGORIAS_MERCADO, categoriaDeTipo } from './marketTaxonomy.js';

const n = valor => Number(valor ?? 0);
const inteiro = valor => n(valor).toLocaleString('pt-BR');
const percentual = valor => `${n(valor) > 0 ? '+' : ''}${n(valor).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

/* Segmento de atuacao: a revenda entra na categoria quando tem ao menos 1 anuncio ATIVO de algum tipo dela
   (mix_categorias: tipo -> anuncios ativos, vindo de lojistas.php). */
export function ativosNaCategoria(l, categoria) {
  if (!categoria || categoria === 'todas') return n(l.ativos);
  return Object.entries(l.mix_categorias || {})
    .filter(([tipo]) => categoriaDeTipo(tipo) === categoria)
    .reduce((soma, [, qtd]) => soma + n(qtd), 0);
}

export function contagemPorCategoria(lojistas = []) {
  const contagem = {};
  for (const l of lojistas) {
    for (const categoria of Object.keys(CATEGORIAS_MERCADO)) {
      if (ativosNaCategoria(l, categoria) > 0) contagem[categoria] = (contagem[categoria] || 0) + 1;
    }
  }
  return contagem;
}

export const chaveCidade = l => `${l.uf}|${l.cidade}`;

/* Cidades so fazem sentido dentro de UFs escolhidas (hierarquia previsivel). Ordena por numero de revendas. */
export function cidadesDisponiveis(lojistas = [], ufs = []) {
  if (!ufs.length) return [];
  const mapa = new Map();
  for (const l of lojistas) {
    if (!l.cidade || !ufs.includes(l.uf)) continue;
    const chave = chaveCidade(l);
    const atual = mapa.get(chave) || { chave, rotulo: `${l.cidade}/${l.uf}`, revendas: 0 };
    atual.revendas += 1;
    mapa.set(chave, atual);
  }
  return [...mapa.values()].sort((a, b) => b.revendas - a.revendas || a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
}

/* Numero de revendas por UF no recorte atual (segmento e busca ja aplicados; UF e cidade nao): assim o numero do chip e
   exatamente o total que a lista mostra ao marcar aquela UF. */
export function contagemPorUf(lojistas = [], { busca = '', categoria = 'todas' } = {}) {
  const contagem = {};
  for (const l of filtraRevendas(lojistas, { busca, categoria })) contagem[l.uf] = (contagem[l.uf] || 0) + 1;
  return contagem;
}

export function filtraRevendas(lojistas = [], { ufs = [], busca = '', ordem = 'estoque', categoria = 'todas', cidade = 'todas' } = {}) {
  const termo = busca.trim().toLocaleLowerCase('pt-BR');
  const lista = lojistas.filter(l => (!ufs.length || ufs.includes(l.uf)) &&
    (categoria === 'todas' || ativosNaCategoria(l, categoria) > 0) &&
    (cidade === 'todas' || chaveCidade(l) === cidade) &&
    (!termo || String(l.nome || '').toLocaleLowerCase('pt-BR').includes(termo)));
  const campo = { estoque: 'ativos', saidas: 'saidas_30d', reducoes: 'reducoes_30d', idade: 'idade_media_estoque' }[ordem] || 'ativos';
  const valorDe = (l, nomeCampo) => {
    if (nomeCampo === 'idade_media_estoque' && !l.idade_observada_confiavel) return null;
    if (nomeCampo === 'ativos') return ativosNaCategoria(l, categoria);
    return l[nomeCampo];
  };
  return lista.sort((a, b) => {
    const va = valorDe(a, campo);
    const vb = valorDe(b, campo);
    if (va == null && vb != null) return 1;
    if (vb == null && va != null) return -1;
    return n(vb) - n(va) || String(a.nome).localeCompare(String(b.nome), 'pt-BR');
  });
}

/* Saidas e reducoes nao sao separadas por categoria na API: com segmento escolhido elas seguem contando todo o estoque. */
const NOTA_TODO_ESTOQUE = ' Com segmento selecionado, este número ainda considera todo o estoque das revendas listadas.';

export function panoramaConcorrencia(lojistas = [], escopo = 'Todas as UFs', atualizacao = null, { categoria = 'todas' } = {}) {
  const rotuloCategoria = categoria !== 'todas' ? (CATEGORIAS_MERCADO[categoria]?.label || categoria) : null;
  const ativos = lojistas.reduce((s, l) => s + ativosNaCategoria(l, categoria), 0);
  const saidas = lojistas.reduce((s, l) => s + n(l.saidas_30d), 0);
  const reducoesDisponiveis = lojistas.every(l => l.reducoes_30d != null);
  const reducoes = reducoesDisponiveis ? lojistas.reduce((s, l) => s + n(l.reducoes_30d), 0) : null;
  const comum = { recorte: `${escopo}${rotuloCategoria ? ` · ${rotuloCategoria}` : ''} · revendas monitoradas`, base: `${inteiro(ativos)} anúncios ativos${rotuloCategoria ? ` de ${rotuloCategoria.toLocaleLowerCase('pt-BR')}` : ''} em ${inteiro(lojistas.length)} revendas`, amostra: `${inteiro(lojistas.length)} revendas`, atualizacao };
  return [
    { titulo: 'Revendas no recorte', icone: 'buildings', detalhe: escopo, valor: inteiro(lojistas.length), evidencia: { ...comum, periodo: 'Estoque atual', valor: inteiro(lojistas.length), explicacao: 'Revendas retornadas pela API dentro das UFs selecionadas.' } },
    { titulo: 'Anúncios ativos', icone: 'truck', detalhe: rotuloCategoria ? `Estoque de ${rotuloCategoria.toLocaleLowerCase('pt-BR')} somado` : 'Estoque somado das revendas', valor: inteiro(ativos), evidencia: { ...comum, periodo: 'Estoque atual', valor: inteiro(ativos), explicacao: rotuloCategoria ? `Soma dos anúncios ativos de ${rotuloCategoria.toLocaleLowerCase('pt-BR')} nas revendas listadas.` : 'Soma dos anúncios ativos das revendas listadas.' } },
    { titulo: 'Saídas observadas (30 d)', icone: 'check-circle', detalhe: 'Saída observada não é venda', valor: inteiro(saidas), evidencia: { ...comum, periodo: 'Últimos 30 dias', valor: inteiro(saidas), explicacao: `Ausência confirmada no portal. Não comprova venda.${rotuloCategoria ? NOTA_TODO_ESTOQUE : ''}` } },
    { titulo: 'Reduções de preço (30 d)', icone: 'trend-down', detalhe: 'Sinal, não prova', valor: reducoes == null ? 'Dados indisponíveis' : inteiro(reducoes), evidencia: { ...comum, periodo: 'Últimos 30 dias', valor: reducoes == null ? 'Dados indisponíveis' : inteiro(reducoes), explicacao: 'Anúncios com ao menos uma queda de preço registrada nos eventos. Queda acima de 50% é descartada como provável erro de coleta. Redução é sinal, não prova.' + (rotuloCategoria ? NOTA_TODO_ESTOQUE : '') } },
  ];
}

export function leituraRevenda(l, atualizacao = null) {
  const desvio = l.desvio_fipe_mediano_pct;
  return {
    idade: l.idade_observada_confiavel && l.idade_media_estoque != null ? `${Math.round(n(l.idade_media_estoque))} d` : 'Amostra temporal insuficiente',
    reducoes: l.reducoes_30d == null ? 'Indisponível' : inteiro(l.reducoes_30d),
    desvio: desvio == null ? 'Amostra insuficiente' : percentual(desvio),
    evidenciaDesvio: { recorte: `${l.nome} · ${l.cidade}/${l.uf}`, periodo: 'Estoque ativo', valor: desvio == null ? 'Amostra insuficiente' : percentual(desvio), base: 'Preço anunciado frente à FIPE vinculada de cada veículo', amostra: `${inteiro(l.desvio_fipe_amostra)} preços válidos com FIPE`, confianca: l.desvio_fipe_confianca || 'insuficiente', atualizacao, explicacao: 'Mediana dos desvios individuais. Só é exibida com ao menos 5 preços válidos vinculados à FIPE; modelos até 2005 não entram (a FIPE não é referência confiável para eles) e caminhões com implemento também não (a FIPE precifica o veículo sem o equipamento): só cavalo, chassi ou sem carroceria informada.' },
  };
}

/* Diz POR QUE a idade nao existe so quando a causa e conhecida: sem anuncio ativo, coleta curta (< 14 dias) ou generica. */
function motivoIdadeIndisponivel(l) {
  if (n(l.ativos) === 0) return ' (sem anúncios ativos)';
  if (l.dias_de_coleta != null && n(l.dias_de_coleta) < 14) return ' (menos de 14 dias de coleta)';
  if (l.idade_observada_confiavel === false) return ' (coleta ainda curta)';
  return '';
}

const plural = (qtd, singular, plur) => `${inteiro(qtd)} ${n(qtd) === 1 ? singular : plur}`;

/* Duas linhas de texto da revenda na lista, no vocabulario da demo aprovada. Com segmento escolhido a lista so traz o
   total (idade e desvio por segmento aparecem no painel do lojista), entao esses dois ficam de fora e o texto avisa. */
export function linhasRevenda(l, { categoria = 'todas', rotuloCategoria = '' } = {}) {
  const local = `${l.cidade}/${l.uf}`;
  const saidas = plural(l.saidas_30d, 'saída observada', 'saídas observadas');
  const reducoes = l.reducoes_30d == null ? 'reduções indisponíveis' : plural(l.reducoes_30d, 'redução', 'reduções');
  if (categoria !== 'todas') {
    return [
      `${local} · ${plural(ativosNaCategoria(l, categoria), 'anúncio', 'anúncios')} em ${rotuloCategoria || categoria} (de ${inteiro(l.ativos)} no total)`,
      `${saidas} · ${reducoes} (30 d) · estoque total da revenda`,
    ];
  }
  const idade = l.idade_observada_confiavel && l.idade_media_estoque != null
    ? `idade média ${Math.round(n(l.idade_media_estoque))} d`
    : `idade média indisponível${motivoIdadeIndisponivel(l)}`;
  const desvio = l.desvio_fipe_mediano_pct == null ? 'amostra insuficiente' : percentual(l.desvio_fipe_mediano_pct);
  return [
    `${local} · ${plural(l.ativos, 'anúncio', 'anúncios')} · ${idade}`,
    `${saidas} · ${reducoes} (30 d) · desvio FIPE (mediana) ${desvio}`,
  ];
}
