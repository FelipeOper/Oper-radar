import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle, ListChecks, Plus, Trash2 } from './icons.jsx';
import { SecaoHoje, VazioHoje } from './HojeBlocos.jsx';
import { ORIGENS, carregaAcoes, montaAcao, salvaAcoes, separaPendentesFeitas } from './planoAcaoModel.js';

/* Plano de ação, no layout da DEMO: KPIs de pendentes/concluídas, formulário de nova ação e as duas listas,
   cada linha com origem, evidência e o link de volta ao insight que a gerou. Estado só em localStorage
   (nenhuma ação é enviada ao servidor); ver planoAcaoModel.js para a normalização e a persistência. */

function Kpi({ label, valor, sub, destaque }) {
  return (
    <div className={`or-card or-stat oc-kpi${destaque ? ' or-card--accent' : ''}`}>
      <div className="or-stat__top"><span className="or-stat__label">{label}</span></div>
      <div className="or-stat__row"><span className="or-stat__value">{valor}</span></div>
      {sub && <p className="or-card__sub" style={{ margin: 0 }}>{sub}</p>}
    </div>
  );
}

function LinhaAcao({ acao, onAlternar, onRemover }) {
  return (
    <li className="oc-acoes__item">
      <label className="or-check oc-acoes__check">
        <input type="checkbox" checked={acao.done} onChange={() => onAlternar(acao)} aria-label={`Marcar "${acao.titulo}" como ${acao.done ? 'pendente' : 'concluída'}`} />
        <span className="or-check__box">{acao.done && <CheckCircle2 size={13} />}</span>
        <span className={acao.done ? 'oc-acoes__titulo is-done' : 'oc-acoes__titulo'}>{acao.titulo}</span>
      </label>
      <div className="oc-acoes__meta">
        <span className="or-badge or-badge--neutral">Origem: {acao.origem}</span>
        {acao.evidencia && <span className="or-card__sub oc-acoes__evidencia">{acao.evidencia}</span>}
        <div className="oc-acoes__acoes">
          {acao.href && <a className="or-btn or-btn--ghost" href={acao.href} target={acao.href.startsWith('/') ? undefined : '_blank'} rel={acao.href.startsWith('/') ? undefined : 'noreferrer'}>Ver evidência</a>}
          <button type="button" className="or-btn or-btn--ghost" onClick={() => onRemover(acao)}><Trash2 size={13} /> Remover</button>
        </div>
      </div>
    </li>
  );
}

function Grupo({ titulo, itens, tituloVazio, textoVazio, onAlternar, onRemover }) {
  return (
    <div className="oc-acoes__grupo">
      <h3 className="or-card__title" style={{ margin: 0 }}>{titulo} ({itens.length})</h3>
      {itens.length ? (
        <ul className="oc-acoes__lista">{itens.map(a => <LinhaAcao key={a.id} acao={a} onAlternar={onAlternar} onRemover={onRemover} />)}</ul>
      ) : (
        <VazioHoje icone={titulo === 'Pendentes' ? Circle : CheckCircle2} titulo={tituloVazio} texto={textoVazio} />
      )}
    </div>
  );
}

/* Autocontida: lê o localStorage ao montar e salva a cada mutação — a mesma lista que criarAcao() (em App.jsx)
   escreve quando uma tela como Oportunidades cria uma ação e navega para cá. */
export function PagePlanoAcao() {
  const [acoes, setAcoes] = useState(() => carregaAcoes());
  const [titulo, setTitulo] = useState('');
  const [origem, setOrigem] = useState('Manual');
  const [mensagem, setMensagem] = useState('');

  useEffect(() => { salvaAcoes(acoes); }, [acoes]);

  const adicionar = () => {
    const nova = montaAcao({ titulo, origem });
    if (!nova) { setMensagem('Informe um título para a ação.'); return; }
    setAcoes(lista => [nova, ...lista]);
    setTitulo(''); setMensagem('Ação adicionada.');
  };
  const alternar = acao => setAcoes(lista => lista.map(a => a.id === acao.id ? { ...a, done: !a.done } : a));
  const remover = acao => { setAcoes(lista => lista.filter(a => a.id !== acao.id)); setMensagem('Ação removida.'); };

  const { pendentes, feitas } = separaPendentesFeitas(acoes);

  return (
    <div className="oc-acoes">
      <p className="or-card__sub" style={{ maxWidth: 640, margin: '0 0 16px' }}>
        Dado de mercado diz <em>o que</em> fazer; esta lista registra <em>se foi feito</em>. Ações criadas a partir das
        evidências do radar (botão "Criar ação") guardam a origem e a métrica que motivou. Concluir ou remover não
        altera os dados do mercado; tudo fica salvo só neste navegador.
      </p>
      <SecaoHoje titulo="Nova ação" subtitulo="Registre algo para acompanhar.">
        <div className="oc-acoes__form">
          <label className="or-field"><span className="or-field__label">Título</span>
            <input className="oc-cmp__select" value={titulo} onChange={e => setTitulo(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && adicionar()} placeholder="Ex.: Ligar para o cliente do FH 540" aria-label="Título da nova ação" />
          </label>
          <label className="or-field"><span className="or-field__label">Origem</span>
            <select className="oc-cmp__select" value={origem} onChange={e => setOrigem(e.target.value)} aria-label="Origem da nova ação">
              {ORIGENS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
          <div className="oc-acoes__form-acao">
            <button type="button" className="or-btn or-btn--primary" onClick={adicionar}><Plus size={14} /> Adicionar ação</button>
            {mensagem && <span role="status" className="or-card__sub">{mensagem}</span>}
          </div>
        </div>
      </SecaoHoje>
      {acoes.length === 0 ? (
        <VazioHoje icone={ListChecks} titulo="Nenhuma ação ainda" texto='Crie uma ação a partir das Oportunidades ("Criar ação") ou adicione uma acima.' />
      ) : (
        <div className="or-panorama-cards">
          <Kpi label="Pendentes" valor={pendentes.length} sub="Ações ainda por fazer" destaque={pendentes.length > 0} />
          <Kpi label="Concluídas" valor={feitas.length} sub="Ações já resolvidas" />
        </div>
      )}
      {acoes.length > 0 && (
        <SecaoHoje titulo="Ações" subtitulo="Marque como concluída ao terminar.">
          <div className="oc-acoes__grupos">
            <Grupo titulo="Pendentes" itens={pendentes} tituloVazio="Tudo em dia" textoVazio="Nenhuma ação pendente." onAlternar={alternar} onRemover={remover} />
            <Grupo titulo="Concluídas" itens={feitas} tituloVazio="Nada concluído ainda" textoVazio="As ações concluídas aparecem aqui." onAlternar={alternar} onRemover={remover} />
          </div>
        </SecaoHoje>
      )}
    </div>
  );
}
