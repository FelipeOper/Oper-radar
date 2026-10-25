import React from 'react';
import { parseTextoIa } from './textoIaModel.js';

const Partes = ({ partes }) => partes.map((p, i) => (p.b ? <strong key={i}>{p.t}</strong> : <React.Fragment key={i}>{p.t}</React.Fragment>));

// Resposta da IA com parágrafos, negrito e listas. Nunca usa HTML cru.
export function TextoIa({ texto }) {
  return (
    <div className="oc-ia-texto">
      {parseTextoIa(texto).map((b, i) => b.tipo === 'ul'
        ? <ul key={i}>{b.itens.map((partes, j) => <li key={j}><Partes partes={partes} /></li>)}</ul>
        : <p key={i}><Partes partes={b.partes} /></p>)}
    </div>
  );
}
