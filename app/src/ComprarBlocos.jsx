import React, { useEffect, useMemo, useState } from 'react';
import { apiGet } from './apiClient.js';
import { ConfiancaBadge, Evidencia } from './Evidencia.jsx';
import { SecaoHoje } from './HojeBlocos.jsx';
import { brl, evidenciaModelo, linhasComponentes, nomeModelo, ordenaUfs, selosAnuncio, textoVazio, urlSegura } from './comprarModel.js';

/* "O que comprar" por região: por UF, os modelos com melhor índice regional e, em cada um, os anúncios candidatos
   à negociação. Dados de oportunidades_compra.php; textos e regras de exibição em comprarModel.js. */

function Selo({ tom, texto }) {
  return <span className={`or-badge or-badge--${tom}`}>{texto}</span>;
}

function Componentes({ anuncio }) {
  const linhas = linhasComponentes(anuncio);
  return (
    <details className="oc-compra__comp">
      <summary>Por que esta nota</summary>
      <ul>
        {linhas.map(l => (
          <li key={l.chave}>
            <span>{l.rotulo}</span>
            <strong>{l.usado ? `${l.indice.toLocaleString('pt-BR')} · peso ${l.peso.toLocaleString('pt-BR')}%` : 'não usado (sem base)'}</strong>
          </li>
        ))}
      </ul>
    </details>
  );
}

function LinhaAnuncio({ anuncio, onCriarAcao }) {
  return (
    <li className="oc-compra__anuncio">
      <div className="oc-compra__anuncio-topo">
        <div style={{ minWidth: 0 }}>
          <strong className="oc-compra__titulo">{anuncio.titulo || 'Anúncio'}</strong>
          <p className="or-card__sub" style={{ margin: 0 }}>{[anuncio.revenda, [anuncio.cidade, anuncio.uf].filter(Boolean).join('/')].filter(Boolean).join(' · ')}</p>
        </div>
        <div className="oc-compra__preco">
          <strong>{brl(anuncio.preco)}</strong>
          <span className="or-badge or-badge--accent" title="Nota do anúncio (0–100): candidato à negociação, não recomendação de compra">Nota {Number(anuncio.pontuacao).toLocaleString('pt-BR')}</span>
        </div>
      </div>
      <div className="oc-compra__selos">{selosAnuncio(anuncio).map(s => <Selo key={s.texto} {...s} />)}</div>
      <Componentes anuncio={anuncio} />
      <div className="oc-compra__acoes">
        {urlSegura(anuncio.url) && <a className="or-btn or-btn--secondary" href={urlSegura(anuncio.url)} target="_blank" rel="noreferrer">Ver anúncio</a>}
        <button type="button" className="or-btn or-btn--ghost" onClick={() => onCriarAcao?.(`Avaliar: ${anuncio.titulo || 'anúncio'} (${anuncio.revenda || 'revenda'}, ${brl(anuncio.preco)})`)}>Criar ação</button>
      </div>
    </li>
  );
}

function CartaoModelo({ uf, modelo, onCriarAcao }) {
  const ind = modelo.indice || {};
  return (
    <article className="or-card or-card--sunken oc-compra__modelo">
      <header className="oc-compra__modelo-topo">
        <div style={{ minWidth: 0 }}>
          <h3 className="or-card__title" style={{ margin: 0 }}>{nomeModelo(modelo)}</h3>
          <p className="or-card__sub" style={{ margin: '4px 0 0' }}>{modelo.texto}</p>
        </div>
        <div className="oc-compra__indice">
          <span className="or-badge or-badge--accent">Índice {Number(ind.pontuacao).toLocaleString('pt-BR')}/100</span>
          <ConfiancaBadge nivel={ind.confianca} />
        </div>
      </header>
      <Evidencia evidencia={evidenciaModelo(uf, modelo)} rotulo="Como este índice é calculado" />
      <ul className="oc-compra__lista">
        {modelo.anuncios.map(a => <LinhaAnuncio key={a.anuncio_id} anuncio={a} onCriarAcao={onCriarAcao} />)}
      </ul>
      {modelo.anuncios_elegiveis > modelo.anuncios.length && (
        <p className="or-card__sub" style={{ margin: 0 }}>Mostrando {modelo.anuncios.length} de {modelo.anuncios_elegiveis} anúncios elegíveis nesta UF.</p>
      )}
    </article>
  );
}

export function ComprarPorRegiao({ ufs = [], onCriarAcao }) {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  const [ufAtiva, setUfAtiva] = useState('');
  const chave = ufs.join(',');

  useEffect(() => {
    const c = new AbortController();
    let vigente = true;
    setDados(null); setErro('');
    apiGet(`oportunidades_compra.php${chave ? `?uf=${chave}` : ''}`, { signal: c.signal, ttlMs: 60000 })
      .then(d => { if (vigente) setDados(d); })
      .catch(e => { if (vigente && e.name !== 'AbortError') setErro(e.message); });
    return () => { vigente = false; c.abort(); };
  }, [chave]);

  const lista = useMemo(() => ordenaUfs(dados?.ufs), [dados]);
  const atual = lista.find(u => u.uf === ufAtiva) || lista[0] || null;

  return (
    <SecaoHoje titulo="O que comprar em cada região"
      subtitulo="Por UF: os modelos com melhor índice regional e, em cada um, os anúncios candidatos à negociação. Preço anunciado, não de venda.">
      {erro && <div role="alert" className="or-alert or-alert--danger"><div className="or-alert__body"><span className="or-alert__t">Não foi possível montar as oportunidades</span><span className="or-alert__d">{erro}</span></div></div>}
      {!dados && !erro && <p role="status" className="or-card__sub">Calculando as oportunidades por região…</p>}
      {dados && lista.length === 0 && <div className="oc-vazio"><strong>Sem base para indicar candidatos</strong><span>{textoVazio(dados)}</span></div>}
      {dados && lista.length > 0 && (
        <div className="oc-compra">
          <div role="tablist" aria-label="Estado" className="oc-compra__ufs">
            {lista.map(u => (
              <button key={u.uf} type="button" role="tab" aria-selected={atual?.uf === u.uf} className={`oc-cmp__modo${atual?.uf === u.uf ? ' is-on' : ''}`} onClick={() => setUfAtiva(u.uf)}>
                {u.uf} · {u.modelos.length} {u.modelos.length === 1 ? 'modelo' : 'modelos'}
              </button>
            ))}
          </div>
          {atual && atual.modelos.map(m => <CartaoModelo key={`${m.marca}|${m.modelo}|${m.ano}`} uf={atual.uf} modelo={m} onCriarAcao={onCriarAcao} />)}
          {dados.nota && <p className="or-card__sub" style={{ margin: 0 }}>{dados.nota}</p>}
        </div>
      )}
    </SecaoHoje>
  );
}
