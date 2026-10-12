import React from 'react';
import { ConfiancaBadge } from './Evidencia.jsx';

/* Oportunidade regional do modelo selecionado (regra da especificacao do Insight regional).
   Recebe a leitura ja normalizada por leituraOportunidade(); nao faz requisicao. */

const brl = valor => Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const numero = valor => Number(valor).toLocaleString('pt-BR', { maximumFractionDigits: 1 });

export function OportunidadeRegional({ leitura }) {
  return (
    <div className="oc-oport">
      {leitura.semHistorico && (
        <p className="oc-nota">O histórico de eventos ainda não está disponível: nenhuma UF recebe selo de oportunidade.</p>
      )}
      <ul className="oc-oport__lista">
        {leitura.linhas.map(linha => {
          const melhor = linha.uf === leitura.melhorUf;
          const fatos = [
            `${numero(linha.comparaveis)} comparáveis`,
            `${numero(linha.revendas)} revendas`,
            `${numero(linha.saidas)} ${linha.saidas === 1 ? 'saída observada' : 'saídas observadas'}`,
            linha.precoMediano != null ? `preço mediano ${brl(linha.precoMediano)}` : null,
            linha.diasSaida != null ? `${numero(linha.diasSaida)} dias até a saída (mediana)` : null,
          ].filter(Boolean).join(' · ');
          return (
            <li key={linha.uf} className={`oc-oport__item${linha.publicavel ? '' : ' oc-oport__item--sem-selo'}`}>
              <div className="oc-oport__cab">
                <strong>{linha.uf}</strong>
                {melhor && <span className="or-badge or-badge--success">Melhor praça observada</span>}
                <ConfiancaBadge nivel={linha.confianca} />
              </div>
              {linha.publicavel ? (
                <div className="or-progress">
                  <div className="or-progress__top"><span>Índice comparativo</span><b>{numero(linha.pontuacao)} de 100</b></div>
                  <div className="or-progress__track" role="img" aria-label={`${linha.uf}: índice ${numero(linha.pontuacao)} de 100`}>
                    <div className="or-progress__bar" style={{ width: `${Math.max(3, Math.min(100, linha.pontuacao))}%` }} />
                  </div>
                </div>
              ) : (
                <p className="oc-nota">Sem selo de oportunidade{linha.motivo ? `: ${linha.motivo}` : ''}.</p>
              )}
              <p className="oc-oport__fatos">{fatos}</p>
              <details className="oc-oport__detalhe">
                <summary>Como esta nota foi formada</summary>
                <dl className="oc-evidencia__lista">
                  {linha.componentes.map(componente => (
                    <React.Fragment key={componente.chave}>
                      <dt>{componente.rotulo}</dt>
                      <dd>{numero(componente.indice)} × peso {componente.peso}% = {numero(componente.contribuicao)}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              </details>
            </li>
          );
        })}
      </ul>
      {leitura.nota && <p className="oc-nota">{leitura.nota}</p>}
    </div>
  );
}
