import React, { useState } from 'react';
import { ArrowUpRight, CheckCircle2, ChevronDown, ChevronUp, ExternalLink, Plus, Radar, Timer, TrendingDown } from './icons.jsx';
import { Evidencia } from './Evidencia.jsx';
import { formataItemFeed, linhasUfsSaidas, navegacaoDoInsight, resumoFrescor, rotuloQuando } from './hojeModel.js';

/* Blocos da tela Hoje, montados com as classes do design system (or-card, or-alert,
   or-progress, or-btn). Recebem dados ja carregados; nao fazem requisicao. */

export function SecaoHoje({ titulo, subtitulo, acao, children }) {
  return (
    <section className="or-card oc-secao">
      <header className="or-card__head oc-secao__cab">
        <div>
          <h2 className="or-card__title">{titulo}</h2>
          {subtitulo && <p className="or-card__sub">{subtitulo}</p>}
        </div>
        {acao}
      </header>
      {children}
    </section>
  );
}

export function VazioHoje({ icone: Icone = Radar, titulo, texto }) {
  return (
    <div className="oc-vazio">
      <Icone size={22} />
      <strong>{titulo}</strong>
      {texto && <span>{texto}</span>}
    </div>
  );
}

/* Monitor de dados. Sem resposta valida da API nao mostra nada (nunca afirma "em dia"). */
export function AlertaColeta({ frescor }) {
  const resumo = resumoFrescor(frescor);
  if (!resumo) return null;
  if (resumo.severidade === 'ok') {
    return <p className="oc-coleta-ok"><CheckCircle2 size={14} /> {resumo.titulo}</p>;
  }
  const tom = resumo.severidade === 'alta' ? 'danger' : 'warning';
  const icone = resumo.severidade === 'alta' ? 'warning' : 'exclamation-mark';
  return (
    <div role={tom === 'danger' ? 'alert' : 'status'} className={`or-alert or-alert--${tom}`}>
      <span className="or-alert__ic"><i className={`ph-bold ph-${icone}`} aria-hidden="true" /></span>
      <div className="or-alert__body">
        <span className="or-alert__t">{resumo.titulo}</span>
        <span className="or-alert__d">{resumo.texto}</span>
        {resumo.linhas.length > 0 && <ul className="oc-alerta-lista">{resumo.linhas.map(linha => <li key={linha}>{linha}</li>)}</ul>}
      </div>
    </div>
  );
}

const ICONE_FEED = { novo: Plus, preco: TrendingDown, saida: CheckCircle2, verificacao: Timer };
const ROTULO_FEED = { novo: 'Novo', preco: 'Preço', saida: 'Saída', verificacao: 'Verificar' };

/* `renderDetalhe(item)` devolve o conteudo expandido do item (ou null). Assim o feed continua
   mostrando o comparativo FIPE/mercado quando o anuncio esta na lista carregada pela tela. */
export function FeedMovimento({ itens, renderDetalhe }) {
  const [aberto, setAberto] = useState(null);
  if (!itens.length) {
    return <VazioHoje titulo="Sem movimento recente" texto="Nenhuma entrada, queda de preço ou saída nas últimas horas." />;
  }
  return (
    <ul className="oc-feed">
      {itens.map((bruto, indice) => {
        const item = formataItemFeed(bruto);
        const Icone = ICONE_FEED[item.tipo] || Radar;
        const detalhe = renderDetalhe ? renderDetalhe(bruto) : null;
        const expandido = aberto === indice && Boolean(detalhe);
        const Seta = expandido ? ChevronUp : ChevronDown;
        return (
          <li key={`${item.anuncioId}-${item.tipo}-${indice}`} className={`oc-feed__item oc-feed__item--${item.tipo}`}>
            <div className="oc-feed__linha">
              <span className="oc-feed__icone" title={ROTULO_FEED[item.tipo]}><Icone size={16} /></span>
              <span className="oc-feed__corpo">
                <strong>{item.titulo}</strong>
                <small>{item.detalhe}</small>
              </span>
              <span className="oc-feed__quando">{rotuloQuando(item.quando)}</span>
              {item.url && <a className="oc-feed__link" href={item.url} target="_blank" rel="noreferrer" aria-label={`Ver ${item.titulo} no portal`}><ExternalLink size={14} /></a>}
              {detalhe && (
                <button type="button" className="oc-feed__abrir" aria-expanded={expandido} aria-label={`${expandido ? 'Ocultar' : 'Ver'} detalhes de ${item.titulo}`}
                  onClick={() => setAberto(expandido ? null : indice)}><Seta size={16} /></button>
              )}
            </div>
            {expandido && <div className="oc-feed__detalhe">{detalhe}</div>}
          </li>
        );
      })}
    </ul>
  );
}

export function RegioesSaidas({ ufs }) {
  const linhas = linhasUfsSaidas(ufs);
  if (!linhas.length) return <VazioHoje titulo="Sem saídas observadas" texto="Nenhuma saída detectada nos últimos 30 dias." />;
  return (
    <div className="oc-regioes">
      {linhas.map(linha => (
        <div key={linha.uf} className="or-progress">
          <div className="or-progress__top">
            <span>{linha.uf}</span>
            <b>{linha.saidas} {linha.saidas === 1 ? 'saída' : 'saídas'}</b>
          </div>
          <div className="or-progress__track" role="img" aria-label={`${linha.uf}: ${linha.saidas} saídas em 30 dias, ${linha.ativos} anúncios ativos`}>
            <div className="or-progress__bar" style={{ width: `${Math.max(4, linha.proporcao * 100)}%` }} />
          </div>
        </div>
      ))}
      <p className="oc-nota">Últimos 30 dias · saídas observadas por UF, sem confirmação de venda.</p>
    </div>
  );
}

export function InsightsDoDia({ insights, onNavegar }) {
  if (!insights.length) {
    return <VazioHoje icone={Radar} titulo="Sem insights hoje" texto="Nenhum destaque atingiu a amostra mínima para ser mostrado." />;
  }
  return (
    <ul className="oc-insights">
      {insights.map(insight => {
        const destino = navegacaoDoInsight(insight.acao);
        return (
          <li key={insight.id} className="oc-insight">
            <strong>{insight.titulo}</strong>
            <p>{insight.texto}</p>
            <div className="oc-insight__rodape">
              <Evidencia evidencia={insight.evidencia} />
              {destino && onNavegar && (
                <button type="button" className="or-btn or-btn--ghost or-btn--sm" onClick={() => onNavegar(destino.page, destino.context)}>
                  {insight.acao.rotulo} <ArrowUpRight size={14} />
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
