import React from 'react';
import { urlSegura } from './urlSegura.js';

/* Único caminho para link que sai do app com URL de terceiros (anúncio, perfil de revenda, sinal do feed).
   - href passa por urlSegura: só http/https; qualquer outra coisa não vira <a> (nem "#").
   - Sempre abre em nova aba com rel="noopener noreferrer".
   - Sem URL válida renderiza nada, ou, com semLink="div", o mesmo conteúdo sem link (para cartões que não podem sumir).
   - Repassa style, className, title, aria-label, onClick e o resto; href, target e rel não podem ser sobrescritos.
   Arquivo .js (sem JSX) para ser testável em node sem transformador. Regra travada por tests/linksExternos.contract.test.js. */
export function LinkExterno({ href, children, semLink = null, ...props }) {
  const seguro = urlSegura(href);
  if (!seguro) return semLink ? React.createElement(semLink, props, children) : null;
  return React.createElement('a', { ...props, href: seguro, target: '_blank', rel: 'noopener noreferrer' }, children);
}
