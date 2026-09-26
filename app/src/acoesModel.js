import { brl } from './comprarModel.js';

/* "Criar ação": regras puras dos textos e do objeto de uma ação. As ações vivem SÓ neste navegador
   (localStorage 'oper-radar-acoes', ver RadarApp em App.jsx): nada aqui chama a API nem grava no servidor.
   Este módulo não pode importar apiClient.js; tests/acoesModel.test.js trava isso. */

export const ORIGEM_ACAO_OPORTUNIDADE = 'oportunidade';

const textoOu = (valor, padrao) => String(valor ?? '').trim() || padrao;

/* Cartão "O que comprar": título, revenda e preço anunciado. */
export const textoAvaliarOferta = anuncio =>
  `Avaliar: ${textoOu(anuncio?.titulo, 'anúncio')} (${textoOu(anuncio?.revenda, 'revenda')}, ${brl(anuncio?.preco)})`;

/* Lista "Anúncios observados há mais tempo": título, revenda e dias desde a primeira observação pelo Radar. */
export const textoAvaliarObservado = anuncio => {
  const dias = Number(anuncio?.dias);
  const tempo = anuncio?.dias != null && Number.isFinite(dias) ? `observado há ${dias}d` : 'tempo observado indisponível';
  return `Avaliar: ${textoOu(anuncio?.titulo, 'anúncio')} (${textoOu(anuncio?.revenda, 'revenda')}, ${tempo})`;
};

/* Lista de oportunidades por FIPE: só título e revenda. */
export const textoValidarFipe = anuncio =>
  `Validar oportunidade FIPE: ${textoOu(anuncio?.titulo, 'anúncio')} (${textoOu(anuncio?.revenda, 'revenda')})`;

/* Objeto salvo no estado e no localStorage. `agora` é injetável para o teste ser determinístico. */
export function novaAcaoLocal(texto, origem = ORIGEM_ACAO_OPORTUNIDADE, agora = new Date()) {
  return { id: `local-${agora.getTime()}`, texto, feita: false, origem, criadaEm: agora.toISOString() };
}
