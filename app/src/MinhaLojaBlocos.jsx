import React from 'react';
import { Evidencia, ConfiancaBadge } from './Evidencia.jsx';
import { Trash2 } from './icons.jsx';
import { ROTULO_STATUS, alertasLoja, brl, evidenciaItem, nomeVeiculo, pct, posicaoItem } from './minhaLojaModel.js';

/* Blocos visuais da Minha Loja, com as classes do design system (or-card, or-stat, or-alert, or-badge).
   Dados e regras vêm de minhaLojaModel.js; aqui só se desenha. */

function Kpi({ label, valor, sub, icone, destaque, evidencia }) {
  return (
    <section className={`or-card or-stat oc-kpi${destaque ? ' or-card--accent' : ''}`} style={{ minWidth: 0 }}>
      <div className="or-stat__top"><span className="or-stat__label">{label}</span>{icone && <span className="or-stat__ic"><i className={`ph ph-${icone}`} aria-hidden="true" /></span>}</div>
      <div className="or-stat__row"><span className="or-stat__value">{valor}</span></div>
      {sub && <p className="or-card__sub" style={{ margin: 0 }}>{sub}</p>}
      <Evidencia evidencia={evidencia} rotulo="Evidência" />
    </section>
  );
}

function Alerta({ tom, titulo, texto }) {
  return (
    <div role={tom === 'danger' ? 'alert' : 'status'} className={`or-alert or-alert--${tom}`}>
      <span className="or-alert__ic"><i className={`ph-bold ph-${tom === 'warning' ? 'warning' : 'info'}`} aria-hidden="true" /></span>
      <div className="or-alert__body"><span className="or-alert__t">{titulo}</span><span className="or-alert__d">{texto}</span></div>
    </div>
  );
}

export function ResumoLoja({ resumo }) {
  const evidenciaBase = (valor, base, amostra, explicacao) => ({
    recorte: 'Estoque próprio ativo (exclui vendidos)', periodo: 'Estoque atual', valor, base, amostra,
    confianca: 'Varia por veículo (ver cada cartão)', explicacao,
  });
  const alertas = alertasLoja(resumo);
  return (
    <div className="oc-loja__resumo">
      <div className="or-panorama-cards">
        <Kpi label="Veículos no estoque" valor={resumo.total.toLocaleString('pt-BR')} sub={`${brl(resumo.valor)} anunciados${resumo.idadeMediaDias != null ? ` · ${resumo.idadeMediaDias} dias em média` : ''}`} icone="storefront" />
        <Kpi label="Acima do mercado" valor={resumo.acima.length.toLocaleString('pt-BR')} sub={`de ${resumo.comparaveis.toLocaleString('pt-BR')} comparáveis`} icone="trend-up" destaque={resumo.acima.length > 0}
          evidencia={evidenciaBase(`${resumo.acima.length} veículos`, 'Mediana qualificada do mesmo veículo na FIPE, em todo o Brasil', `${resumo.comparaveis} veículos com 5+ preços válidos`, 'Acima do mercado = preço 5% ou mais acima da mediana. É um sinal para revisar, não prova de preço errado.')} />
        <Kpi label="Competitivos" valor={resumo.comp.length.toLocaleString('pt-BR')} sub="menos de 5% acima da mediana" icone="check-circle"
          evidencia={evidenciaBase(`${resumo.comp.length} veículos`, 'Mediana qualificada do mesmo veículo na FIPE, em todo o Brasil', `${resumo.comparaveis} veículos comparáveis`, 'Competitivo = preço a menos de 5% acima da mediana (inclui abaixo dela). Confiança baixa exige cautela.')} />
        <Kpi label="Sem comparação" valor={(resumo.insuf.length + resumo.fora.length).toLocaleString('pt-BR')} sub={`${resumo.insuf.length} sem amostra · ${resumo.fora.length} fora da base`} icone="question"
          evidencia={evidenciaBase(`${resumo.insuf.length + resumo.fora.length} veículos`, 'Sem base comparativa', 'Menos de 5 preços válidos, sem vínculo FIPE ou fora da base', 'Sem base suficiente não comparo com o mercado, para não induzir uma conclusão errada.')} />
      </div>
      {alertas.map(a => <Alerta key={a.titulo} {...a} />)}
    </div>
  );
}

/* Legenda da FIPE: o número só existe com vínculo compatível; sem ele a legenda explica o porquê. */
function subFipe(item, posicao) {
  if (posicao.vsFipe != null) return `${pct(posicao.vsFipe)} vs FIPE`;
  if (item.fipe_vinculo_status === 'incompativel') return 'Vínculo incompatível';
  return Number(item.preco_fipe) > 0 ? 'Referência de tabela' : 'Sem referência';
}

function Dado({ rotulo, valor, sub }) {
  return <div className="oc-loja__dado"><span className="or-card__sub">{rotulo}</span><strong>{valor}</strong>{sub && <span className="or-card__sub">{sub}</span>}</div>;
}

export function CartaoVeiculo({ item, salvandoStatus, onAbrir, onStatus, onExcluir }) {
  const posicao = posicaoItem(item);
  const [tom, rotulo] = ROTULO_STATUS[posicao.status];
  const nome = item.titulo || nomeVeiculo(item);
  const local = [item.cidade, item.uf].filter(Boolean).join('/');
  const meta = [item.referencia_interna && `ID ${item.referencia_interna}`, item.placa, [item.marca, item.modelo, item.ano].filter(Boolean).join(' · '), local, item.dias_estoque != null && `${item.dias_estoque} dias`, item.quilometragem && `${Number(item.quilometragem).toLocaleString('pt-BR')} km`].filter(Boolean).join(' · ');
  const comparavel = posicao.status === 'acima' || posicao.status === 'comp';
  const rotuloItem = `${item.marca || ''} ${item.modelo || ''}`.trim() || 'veículo';
  return (
    <article className="or-card oc-loja__cartao">
      <div className="oc-loja__topo">
        <div className="oc-loja__controles">
          <select aria-label={`Status de ${rotuloItem}`} className="oc-loja__status" disabled={salvandoStatus} value={item.status} onChange={e => onStatus(item, e.target.value)}>
            <option value="estoque">No estoque</option><option value="reservado">Reservado</option><option value="vendido">Vendido</option>
          </select>
          {item.origem === 'xml' && <span className="or-badge or-badge--info">XML</span>}
        </div>
        <button type="button" className="or-btn or-btn--ghost" aria-label={`Excluir ${rotuloItem}`} onClick={() => onExcluir(item.id)}><Trash2 size={15} /></button>
      </div>
      <div>
        <h3 className="or-card__title" style={{ margin: 0 }}>{nome}</h3>
        <p className="or-card__sub" style={{ margin: '4px 0 0' }}>{meta || 'Sem detalhes cadastrados'}</p>
      </div>
      <div className="oc-loja__linha-preco">
        <div className="oc-loja__dado"><span className="or-card__sub">Seu preço</span><strong className="oc-loja__preco">{brl(item.preco_anunciado)}</strong></div>
        <span className={`or-badge or-badge--${tom}`}>{rotulo}</span>
      </div>
      <div className="oc-loja__dados">
        <Dado rotulo="Mediana do mercado" valor={comparavel ? brl(item.preco_mediana_mercado) : '—'} sub={comparavel ? 'Mercado nacional' : posicao.status === 'insuf' ? `${item.anuncios_comparaveis ?? 0} de 5 preços mínimos` : ''} />
        <Dado rotulo="vs mediana" valor={comparavel ? pct(posicao.vsMediana) : '—'} />
        <Dado rotulo="FIPE" valor={brl(item.preco_fipe)} sub={subFipe(item, posicao)} />
        <Dado rotulo="Mais barato" valor={comparavel && item.menor_preco_mercado ? brl(item.menor_preco_mercado) : '—'} sub={comparavel && item.menor_preco_mercado ? 'Mercado nacional' : ''} />
      </div>
      {posicao.status === 'insuf' && <p className="or-card__sub" style={{ margin: 0 }}>Amostra insuficiente: não comparo com o mercado para não induzir uma conclusão errada.</p>}
      <div className="oc-loja__rodape">
        {item.mercado_confianca && posicao.status !== 'fora' ? <ConfiancaBadge nivel={item.mercado_confianca} /> : <span />}
        <button type="button" className="or-btn or-btn--secondary" onClick={() => onAbrir(item)}>Abrir cadastro e análise</button>
      </div>
      <Evidencia evidencia={evidenciaItem(item, posicao)} rotulo="Como este número é calculado" />
    </article>
  );
}
