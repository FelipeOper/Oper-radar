import React, { useId, useState } from 'react';
import { BadgeInfo, ChevronDown, ChevronUp } from './icons.jsx';
import { rotuloConfianca } from './hojeModel.js';

/* Regra do produto: toda metrica destacada mostra de onde vem. Campos ausentes sao omitidos
   (nao inventamos amostra ou confianca que a API nao entregou). */

const TOM_CONFIANCA = { alta: 'success', media: 'info', baixa: 'warning', insuficiente: 'neutral', parcial: 'neutral' };

export function ConfiancaBadge({ nivel, curto = false }) {
  const chave = String(nivel || '').toLowerCase();
  const texto = curto ? rotuloConfianca(nivel) : `Confiança ${rotuloConfianca(nivel).toLowerCase()}`;
  return <span className={`or-badge or-badge--${TOM_CONFIANCA[chave] || 'neutral'}`}>{texto}</span>;
}

const CAMPOS = [
  ['recorte', 'Recorte'],
  ['periodo', 'Período'],
  ['valor', 'Valor'],
  ['base', 'Base de comparação'],
  ['amostra', 'Amostra'],
  ['atualizacao', 'Atualizado em'],
  ['explicacao', 'Como é calculado'],
];

export function Evidencia({ evidencia, rotulo = 'Ver evidência' }) {
  const [aberta, setAberta] = useState(false);
  const id = useId();
  if (!evidencia) return null;
  const linhas = CAMPOS.filter(([chave]) => evidencia[chave] != null && evidencia[chave] !== '');
  const Seta = aberta ? ChevronUp : ChevronDown;
  return (
    <div className="oc-evidencia">
      <button type="button" className="oc-evidencia__botao" aria-expanded={aberta} aria-controls={id} onClick={() => setAberta(v => !v)}>
        <BadgeInfo size={13} /> {rotulo} <Seta size={13} />
      </button>
      {aberta && (
        <dl id={id} className="oc-evidencia__lista">
          {linhas.map(([chave, nome]) => <React.Fragment key={chave}><dt>{nome}</dt><dd>{evidencia[chave]}</dd></React.Fragment>)}
          {evidencia.confianca && <><dt>Confiança</dt><dd><ConfiancaBadge nivel={evidencia.confianca} curto /></dd></>}
        </dl>
      )}
    </div>
  );
}
