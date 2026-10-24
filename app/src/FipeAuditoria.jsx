import React, { useEffect, useState } from 'react';
import { Check, ChevronDown, ChevronRight, ExternalLink, Pencil, ShieldCheck, Undo2, X } from './icons.jsx';
import { apiGet, apiPost } from './apiClient.js';
import {
  CONFIANCAS_VINCULO, ESTADOS_AUDITORIA, FILTROS_INICIAIS, REGIOES, UFS, aplicaVeredito, contextoParaCorrigir,
  montaConsulta, podeAuditar, progressoGrupo, recalculaResumo, rotuloPrecisao, statusGrupo,
} from './fipeAuditoriaModel.js';

const inteiro = v => Number(v ?? 0).toLocaleString('pt-BR');
const brl = v => v == null ? '—' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const anoDaReferencia = codigo => {
  const ano = String(codigo || '').split('-')[0];
  return ['32000', '3200'].includes(ano) ? 'Zero km' : ano || '—';
};
const ROTULO_CONFIANCA = { alto: 'Automático · alto', medio: 'Automático · médio', provisorio: 'Provisório' };
const rotuloVinculo = a => a.origem === 'manual' ? 'Manual' : ROTULO_CONFIANCA[a.fipe_match_confianca] || 'Automático';
const ROTULO_STATUS = { pendente: 'Pendente', em_andamento: 'Em andamento', completo: 'Completo', com_erro: 'Com erro' };

function Indicador({ titulo, valor, detalhe, tom }) {
  return <article className={`or-card or-stat oc-aud__stat${tom ? ` oc-aud__stat--${tom}` : ''}`}>
    <div className="or-stat__top"><span className="or-stat__label">{titulo}</span></div>
    <div className="or-stat__row"><span className="or-stat__value">{valor}</span></div>
    <p className="or-card__sub" style={{ margin: 0 }}>{detalhe}</p>
  </article>;
}

function Filtros({ rascunho, setRascunho, onAplicar, onLimpar }) {
  const campo = (chave, rotulo, extra = {}) => <label className="oc-aud__campo">
    <span>{rotulo}</span>
    <input className="or-input" value={rascunho[chave]} onChange={e => setRascunho({ ...rascunho, [chave]: e.target.value })} {...extra} />
  </label>;
  const lista = (chave, rotulo, opcoes) => <label className="oc-aud__campo">
    <span>{rotulo}</span>
    <select className="or-input" value={rascunho[chave]} onChange={e => setRascunho({ ...rascunho, [chave]: e.target.value })}>
      {opcoes.map(([valor, texto]) => <option key={valor} value={valor}>{texto}</option>)}
    </select>
  </label>;
  return <form className="or-card oc-aud__filtros" onSubmit={e => { e.preventDefault(); onAplicar(); }} aria-label="Filtros da auditoria">
    {campo('marca', 'Marca', { placeholder: 'Ex.: DAF' })}
    {campo('modelo', 'Modelo', { placeholder: 'Ex.: XF 530' })}
    {campo('revenda', 'Lojista', { placeholder: 'Nome da loja' })}
    {campo('cidade', 'Cidade', { placeholder: 'Ex.: Curitiba' })}
    {lista('uf', 'Estado', [['', 'Todos os estados'], ...UFS.map(uf => [uf, uf])])}
    {lista('regiao', 'Região', [['', 'Todas as regiões'], ...REGIOES.map(r => [r, r])])}
    {lista('confianca', 'Tipo de vínculo', CONFIANCAS_VINCULO)}
    {lista('estado', 'Situação', ESTADOS_AUDITORIA)}
    <div className="oc-aud__filtros-acoes">
      <button type="submit" className="or-btn or-btn--primary">Aplicar filtros</button>
      <button type="button" className="or-btn or-btn--ghost" onClick={onLimpar}>Limpar</button>
    </div>
  </form>;
}

function LinhaAnuncio({ anuncio, grupo, podeEditar, onJulgar, onCorrigir }) {
  const veredito = anuncio.veredito || null;
  const ano = anuncio.ano_final || anuncio.ano_inicial || '—';
  return <li className={`oc-aud__item oc-aud__item--${veredito || 'pendente'}`}>
    <div className="oc-aud__item-corpo">
      <a className="oc-aud__item-titulo" href={anuncio.url} target="_blank" rel="noreferrer">{anuncio.titulo} <ExternalLink size={12} /></a>
      <div className="oc-aud__meta">{anuncio.revenda} · {anuncio.cidade}/{anuncio.uf} · ano {ano} · {anuncio.tracao || 'tração não informada'} · {brl(anuncio.preco)}</div>
      <div className="oc-aud__meta"><span className="or-tag">{rotuloVinculo(anuncio)}</span> {anuncio.fipe_match_motivo}</div>
    </div>
    <div className="oc-aud__acoes" role="group" aria-label={`Veredito para ${anuncio.titulo}`}>
      {podeEditar ? <>
        <button type="button" className={`or-btn or-btn--sm or-btn--secondary oc-aud__btn oc-aud__btn--ok${veredito === 'correto' ? ' is-on' : ''}`}
          aria-pressed={veredito === 'correto'} onClick={() => onJulgar(grupo, anuncio, 'correto')}><Check size={14} /> Correto</button>
        <button type="button" className={`or-btn or-btn--sm or-btn--secondary oc-aud__btn oc-aud__btn--erro${veredito === 'errado' ? ' is-on' : ''}`}
          aria-pressed={veredito === 'errado'} onClick={() => onJulgar(grupo, anuncio, 'errado')}><X size={14} /> Errado</button>
        {veredito === 'errado' && <button type="button" className="or-btn or-btn--sm or-btn--ghost" onClick={() => onCorrigir(anuncio)}><Pencil size={14} /> Corrigir</button>}
        {veredito && <button type="button" className="or-btn or-btn--sm or-btn--ghost" aria-label="Desfazer veredito" title="Desfazer veredito" onClick={() => onJulgar(grupo, anuncio, null)}><Undo2 size={14} /></button>}
      </> : <span className="oc-aud__somente-leitura">{veredito === 'correto' ? 'Correto' : veredito === 'errado' ? 'Errado' : 'Não auditado'}</span>}
    </div>
  </li>;
}

function CartaoGrupo({ grupo, aberto, podeEditar, confirmando, onAlternar, onJulgar, onCorrigir, onPedirLote, onConfirmarLote, onCancelarLote }) {
  const status = statusGrupo(grupo);
  const progresso = progressoGrupo(grupo);
  const restantes = aberto?.anuncios?.filter(a => !a.veredito).length || 0;
  return <section className={`or-card oc-aud__grupo oc-aud__grupo--${status}`}>
    <button type="button" className="oc-aud__grupo-cabeca" aria-expanded={!!aberto} onClick={() => onAlternar(grupo)}>
      {aberto ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      <span className="oc-aud__grupo-titulo">
        <strong>{grupo.marca_fipe} · {grupo.modelo_fipe}</strong>
        <span className="oc-aud__meta">Ano {anoDaReferencia(grupo.ano_codigo)} · FIPE {brl(grupo.preco)} · {inteiro(grupo.total)} anúncio{grupo.total === 1 ? '' : 's'}{grupo.manuais ? ` · ${inteiro(grupo.manuais)} manual` : ''}</span>
      </span>
      <span className="oc-aud__grupo-progresso">
        <span className="oc-aud__barra" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progresso} aria-label="Progresso da auditoria"><i style={{ width: `${progresso}%` }} /></span>
        <span className="oc-aud__meta">{inteiro(grupo.auditados)}/{inteiro(grupo.total)} auditados{grupo.errados ? ` · ${inteiro(grupo.errados)} errado${grupo.errados === 1 ? '' : 's'}` : ''}</span>
      </span>
      <span className={`or-tag oc-aud__status oc-aud__status--${status}`}>{ROTULO_STATUS[status]}</span>
    </button>
    {aberto && <div className="oc-aud__grupo-corpo">
      {aberto.status === 'loading' && <p className="oc-aud__meta">Carregando anúncios…</p>}
      {aberto.status === 'erro' && <p role="alert" className="oc-aud__erro">Não foi possível carregar os anúncios deste grupo. {aberto.erro}</p>}
      {aberto.status === 'ready' && <>
        {podeEditar && restantes > 1 && <div className="oc-aud__lote">
          {confirmando
            ? <><span>Marcar {inteiro(restantes)} anúncios ainda sem veredito como corretos?</span>
              <button type="button" className="or-btn or-btn--sm or-btn--primary" onClick={() => onConfirmarLote(grupo)}>Sim, marcar</button>
              <button type="button" className="or-btn or-btn--sm or-btn--ghost" onClick={onCancelarLote}>Cancelar</button></>
            : <button type="button" className="or-btn or-btn--sm or-btn--secondary" onClick={() => onPedirLote(grupo)}><Check size={14} /> Marcar os {inteiro(restantes)} restantes como corretos</button>}
        </div>}
        <ul className="oc-aud__lista or-zebra-list">
          {aberto.anuncios.map(a => <LinhaAnuncio key={a.id} anuncio={a} grupo={grupo} podeEditar={podeEditar} onJulgar={onJulgar} onCorrigir={onCorrigir} />)}
        </ul>
        {aberto.anuncios.length >= 100 && <p className="oc-aud__meta">Mostrando os 100 primeiros anúncios deste grupo. Refine pelos filtros para ver os demais.</p>}
      </>}
    </div>}
  </section>;
}

export function FipeAuditoria({ sessao, onNavegar }) {
  const podeEditar = podeAuditar(sessao?.usuario?.papel);
  const [rascunho, setRascunho] = useState(FILTROS_INICIAIS);
  const [filtros, setFiltros] = useState(FILTROS_INICIAIS);
  const [carga, setCarga] = useState({ status: 'loading', resumo: null, grupos: [], temMais: false, proximo: 0, erro: '' });
  const [abertos, setAbertos] = useState({});
  const [confirmando, setConfirmando] = useState(null);
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setCarga(c => ({ ...c, status: 'loading', erro: '' }));
    setAbertos({});
    setConfirmando(null);
    apiGet(montaConsulta(filtros), { signal: controller.signal, useCache: false })
      .then(d => setCarga({ status: 'ready', resumo: d.resumo, grupos: d.grupos || [], temMais: !!d.tem_mais, proximo: d.proximo_offset || 0, erro: '' }))
      .catch(e => {
        if (e.name === 'AbortError') return;
        setCarga(c => ({ ...c, status: e.codigo === 'MIGRACAO_PENDENTE' ? 'migracao' : 'erro', erro: e.message }));
      });
    return () => controller.abort();
  }, [filtros]);

  const carregaMais = () => {
    apiGet(montaConsulta(filtros, { offset: carga.proximo }), { useCache: false })
      .then(d => setCarga(c => ({ ...c, grupos: [...c.grupos, ...(d.grupos || [])], temMais: !!d.tem_mais, proximo: d.proximo_offset || c.proximo })))
      .catch(e => setAviso(e.message));
  };

  const alterna = grupo => {
    const id = grupo.fipe_preco_id;
    if (abertos[id]) {
      setAbertos(a => { const resto = { ...a }; delete resto[id]; return resto; });
      return;
    }
    setAbertos(a => ({ ...a, [id]: { status: 'loading', anuncios: [] } }));
    apiGet(montaConsulta(filtros, { visao: 'anuncios', fipe_preco_id: id, estado: 'todos' }), { useCache: false })
      .then(d => setAbertos(a => a[id] ? { ...a, [id]: { status: 'ready', anuncios: d.anuncios || [] } } : a))
      .catch(e => setAbertos(a => a[id] ? { ...a, [id]: { status: 'erro', anuncios: [], erro: e.message } } : a));
  };

  /* Atualiza lista aberta, cartão do grupo e resumo no mesmo clique; o servidor confirma depois. */
  const aplicaLocal = (idGrupo, idsAnuncios, de, para) => {
    setAbertos(a => a[idGrupo] ? { ...a, [idGrupo]: { ...a[idGrupo], anuncios: a[idGrupo].anuncios.map(x => idsAnuncios.includes(x.id) ? { ...x, veredito: para } : x) } } : a);
    const vezes = idsAnuncios.length;
    const aplicaVarias = contagem => { let atual = contagem; for (let i = 0; i < vezes; i += 1) atual = aplicaVeredito(atual, de, para); return atual; };
    setCarga(c => ({
      ...c,
      grupos: c.grupos.map(g => g.fipe_preco_id === idGrupo ? { ...g, ...aplicaVarias({ total: g.total, auditados: g.auditados, corretos: g.corretos, errados: g.errados }) } : g),
      resumo: c.resumo ? recalculaResumo({ ...c.resumo, ...aplicaVarias({ total: c.resumo.total, auditados: c.resumo.auditados, corretos: c.resumo.corretos, errados: c.resumo.errados }) }) : c.resumo,
    }));
  };

  const julga = async (grupo, anuncio, veredito) => {
    const id = grupo.fipe_preco_id;
    const antes = anuncio.veredito || null;
    setAviso('');
    aplicaLocal(id, [anuncio.id], antes, veredito);
    try {
      if (veredito) await apiPost('fipe_auditoria.php', { acao: 'veredito', anuncio_id: anuncio.id, fipe_preco_id: id, veredito }, sessao.csrf);
      else await apiPost('fipe_auditoria.php', { acao: 'limpar', anuncio_id: anuncio.id, fipe_preco_id: id }, sessao.csrf);
    } catch (e) {
      aplicaLocal(id, [anuncio.id], veredito, antes);
      setAviso(e.message);
    }
  };

  const confirmaLote = async grupo => {
    const id = grupo.fipe_preco_id;
    const ids = (abertos[id]?.anuncios || []).filter(a => !a.veredito).map(a => a.id);
    setConfirmando(null);
    if (!ids.length) return;
    setAviso('');
    aplicaLocal(id, ids, null, 'correto');
    try {
      await apiPost('fipe_auditoria.php', { acao: 'veredito_lote', fipe_preco_id: id, anuncio_ids: ids, veredito: 'correto' }, sessao.csrf);
    } catch (e) {
      aplicaLocal(id, ids, 'correto', null);
      setAviso(e.message);
    }
  };

  const resumo = carga.resumo;
  const aplicar = () => setFiltros({ ...rascunho });
  const limpar = () => { setRascunho(FILTROS_INICIAIS); setFiltros(FILTROS_INICIAIS); };

  return <div className="oc-aud">
    <div className="oc-lede" style={{ margin: '-4px 0 16px' }}>
      Confira se cada anúncio está ligado à referência FIPE certa. Cada grupo abaixo é uma referência (modelo e ano) com os anúncios
      vinculados a ela, então um olhar rápido pega o que destoa. Filtre por modelo, lojista, estado, região ou cidade. O veredito vale
      para o par anúncio e referência: se o vínculo mudar, o anúncio volta a aparecer como não auditado.
    </div>

    {!podeEditar && <div className="or-card oc-aud__aviso" role="note"><ShieldCheck size={16} /> Seu perfil pode consultar a auditoria, mas só administradores e gestores registram vereditos.</div>}

    {carga.status === 'migracao' && <div className="or-card oc-aud__aviso" role="status">A auditoria será liberada assim que o servidor for atualizado. Nada foi perdido: os vínculos atuais continuam valendo.</div>}

    {carga.status !== 'migracao' && <>
      <div className="oc-aud__indicadores">
        <Indicador titulo="PRECISÃO AUDITADA" valor={rotuloPrecisao(resumo)} detalhe={resumo ? `${inteiro(resumo.corretos)} corretos · ${inteiro(resumo.errados)} errados` : 'aguardando dados'} />
        <Indicador titulo="AUDITADOS" valor={resumo ? inteiro(resumo.auditados) : '—'} detalhe={resumo ? `de ${inteiro(resumo.total)} vinculados` : ' '} />
        <Indicador titulo="FALTAM AUDITAR" valor={resumo ? inteiro(resumo.nao_auditados) : '—'} detalhe={resumo ? `em ${inteiro(resumo.grupos)} referências FIPE` : ' '} />
        <Indicador titulo="ERRADOS" valor={resumo ? inteiro(resumo.errados) : '—'} detalhe="para corrigir na curadoria" tom={resumo?.errados ? 'alerta' : undefined} />
      </div>

      <Filtros rascunho={rascunho} setRascunho={setRascunho} onAplicar={aplicar} onLimpar={limpar} />

      {aviso && <div role="alert" className="oc-aud__erro">{aviso}</div>}
      {carga.status === 'loading' && <p className="oc-aud__meta" role="status">Carregando referências…</p>}
      {carga.status === 'erro' && <div role="alert" className="oc-aud__erro">Não foi possível carregar a auditoria agora. {carga.erro}</div>}
      {carga.status === 'ready' && carga.grupos.length === 0 && <div className="or-card oc-aud__vazio">
        <strong>Nada para auditar neste recorte.</strong>
        <span className="oc-aud__meta">Mude os filtros ou a situação para ver anúncios já auditados.</span>
      </div>}

      <div className="oc-aud__grupos">
        {carga.grupos.map(g => <CartaoGrupo key={g.fipe_preco_id} grupo={g} aberto={abertos[g.fipe_preco_id]} podeEditar={podeEditar}
          confirmando={confirmando === g.fipe_preco_id} onAlternar={alterna} onJulgar={julga}
          onCorrigir={anuncio => onNavegar?.('mercado', contextoParaCorrigir(anuncio))}
          onPedirLote={grupo => setConfirmando(grupo.fipe_preco_id)} onConfirmarLote={confirmaLote} onCancelarLote={() => setConfirmando(null)} />)}
      </div>
      {carga.temMais && <button type="button" className="or-btn or-btn--secondary oc-aud__mais" onClick={carregaMais}>Carregar mais referências</button>}
    </>}
  </div>;
}
