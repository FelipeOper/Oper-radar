/* Orientação de venda de UM veículo do estoque próprio (Minha Loja): manter preço, avaliar redução ou
   avaliar outra praça. A decisão em si vem pronta de minha_loja_detalhe.php (lib/orientacao_estoque.php,
   testado lá); aqui só se traduz a ação em rótulo, tom e texto do botão "Criar ação" — sem reimplementar a
   lógica de corte/amostra. Decisão do Felipe (28/09/2026): o Radar orienta a vender melhor o PRÓPRIO
   estoque, não a comprar; saída observada nunca é venda. */

export const ROTULO_ACAO = {
  manter: 'Manter preço',
  avaliar_reducao: 'Avaliar redução',
  avaliar_outra_praca: 'Avaliar outra praça',
  sem_base: 'Sem base suficiente',
};

export const TOM_ACAO = {
  manter: 'success',
  avaliar_reducao: 'warning',
  avaliar_outra_praca: 'info',
  sem_base: 'neutral',
};

export function rotuloAcao(acao) {
  return ROTULO_ACAO[acao] || 'Sem base suficiente';
}

export function tomAcao(acao) {
  return TOM_ACAO[acao] || 'neutral';
}

/* Texto do botão "Criar ação": nunca genérico, sempre nomeia o veículo e o que fazer. */
export function tituloAcaoPlano(orientacao, nomeVeiculo) {
  if (orientacao?.acao === 'avaliar_reducao') return `Avaliar redução de preço: ${nomeVeiculo}`;
  if (orientacao?.acao === 'avaliar_outra_praca') return `Avaliar anunciar em ${orientacao.uf_sugerida}: ${nomeVeiculo}`;
  return `Revisar preço: ${nomeVeiculo}`;
}

/* Botão "Criar ação" só aparece quando há algo a decidir (não em 'manter' nem 'sem_base', que não pedem ação). */
export function precisaDeAcao(orientacao) {
  return orientacao?.acao === 'avaliar_reducao' || orientacao?.acao === 'avaliar_outra_praca';
}

/* A orientação vem calculada em cima de `itemAnalisado` (o que a API de fato leu). Se o rascunho em edição
 * mudou preço ou UF sem salvar, a orientação exibida já não descreve o veículo que está na tela — criar uma
 * ação nesse momento gravaria um motivo/desvio que não corresponde ao nome atual (achado do Codex). */
export function orientacaoDesatualizada(rascunho, itemAnalisado) {
  if (!rascunho || !itemAnalisado) return false;
  const precoMudou = Number(rascunho.preco_anunciado || 0) !== Number(itemAnalisado.preco_anunciado || 0);
  const ufMudou = String(rascunho.uf || '') !== String(itemAnalisado.uf || '');
  return precoMudou || ufMudou;
}
