/* Único ponto que decide se uma URL vinda de coleta de terceiros pode virar href.
   Regra: só http/https, com host, sem credencial embutida e sem caractere de controle.
   Devolve a URL normalizada (URL#href) ou null. Nunca lança.
   Todo link externo da interface passa por LinkExterno, que usa esta função (ver tests/linksExternos.contract.test.js). */

const ESQUEMA_WEB = /^https?:\/\/(?!\/)/i;

const temControle = texto => [...texto].some(c => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127);

export function urlSegura(valor) {
  if (typeof valor !== 'string') return null;
  const texto = valor.trim();
  if (!ESQUEMA_WEB.test(texto) || temControle(texto)) return null;
  let url;
  try {
    url = new URL(texto);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (!url.hostname || url.username || url.password) return null;
  return url.href;
}
