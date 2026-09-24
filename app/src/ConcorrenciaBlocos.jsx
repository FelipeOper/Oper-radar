import React, { useEffect, useMemo, useState } from 'react';
import { Building2, ChevronRight, ExternalLink, MapPin, Search, X } from './icons.jsx';
import { apiGet } from './apiClient.js';
import { Evidencia } from './Evidencia.jsx';
import { CATEGORIAS_MERCADO } from './marketTaxonomy.js';
import { ativosNaCategoria, cidadesDisponiveis, contagemPorCategoria, filtraRevendas, leituraRevenda, panoramaConcorrencia } from './concorrenciaModel.js';

const inteiro = v => Number(v ?? 0).toLocaleString('pt-BR');
const brl = v => v == null ? 'Sob consulta' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

function Metrica({ titulo, valor, evidencia, detalhe }) {
  return <article className="or-card oc-conc__metrica">
    <span className="or-stat__label">{titulo}</span>
    <strong className="or-stat__value">{valor}</strong>
    {detalhe && <small className="or-card__sub">{detalhe}</small>}
    {evidencia && <Evidencia evidencia={evidencia} />}
  </article>;
}

function PainelRevenda({ revenda, categoria = 'todas', onClose }) {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  const [ordem, setOrdem] = useState('idade');
  const [mostrarTodos, setMostrarTodos] = useState(false);
  useEffect(() => {
    const c = new AbortController();
    apiGet(`lojista_detalhe.php?id=${encodeURIComponent(revenda.id)}${categoria !== 'todas' ? `&categoria=${encodeURIComponent(categoria)}` : ''}`, { signal: c.signal })
      .then(setDados).catch(e => { if (e.name !== 'AbortError') setErro(e.message); });
    return () => c.abort();
  }, [revenda.id, categoria]);
  useEffect(() => {
    const fechar = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fechar);
    return () => document.removeEventListener('keydown', fechar);
  }, [onClose]);
  const resumo = dados?.resumo || {};
  const leitura = leituraRevenda({ ...revenda, ...resumo }, dados?._meta?.generated_at);
  const recorte = `${revenda.nome} · ${revenda.cidade}/${revenda.uf}`;
  const ev = (valor, periodo, amostra, explicacao, confianca) => ({ recorte, periodo, valor, base: `${inteiro(resumo.ativos)} anúncios ativos`, amostra, confianca, atualizacao: dados?._meta?.generated_at, explicacao });
  const estoque = useMemo(() => {
    const lista = [...(dados?.estoque_ativo || [])];
    const campo = { idade: 'dias_observados', preco_asc: 'preco', preco_desc: 'preco' }[ordem];
    return lista.sort((a, b) => ordem === 'preco_asc'
      ? (a[campo] == null ? 1 : b[campo] == null ? -1 : Number(a[campo]) - Number(b[campo]))
      : Number(b[campo] ?? -1) - Number(a[campo] ?? -1));
  }, [dados, ordem]);
  return <div className="oc-conc__backdrop" onClick={onClose} role="presentation">
    <aside className="oc-conc__panel" role="dialog" aria-modal="true" aria-label={`Lojista ${revenda.nome}`} onClick={e => e.stopPropagation()}>
      <header className="oc-conc__panelhead">
        <div><span className="oc-conc__eyebrow">CONCORRÊNCIA / LOJISTA</span><h2>{revenda.nome}</h2><p>{revenda.cidade}/{revenda.uf} · histórico observado{categoria !== 'todas' ? ` · ${CATEGORIAS_MERCADO[categoria]?.label || categoria}` : ''}</p></div>
        <button type="button" className="or-btn or-btn--ghost" aria-label="Fechar painel do lojista" onClick={onClose}><X size={18} /></button>
      </header>
      <div className="oc-conc__panelbody">
        {!dados && !erro && <p>Carregando dados do lojista…</p>}
        {erro && <div role="alert" className="or-alert or-alert--danger">{erro}</div>}
        {dados && <>
          <div className="oc-conc__metrics">
            <Metrica titulo="Anúncios ativos" valor={inteiro(resumo.ativos)} evidencia={ev(inteiro(resumo.ativos), 'Estoque atual', `${inteiro(resumo.ativos)} anúncios`, 'Anúncios atualmente ativos no portal.')} />
            <Metrica titulo="Saídas observadas (30 d)" valor={inteiro(resumo.saidas_30d)} evidencia={ev(inteiro(resumo.saidas_30d), 'Últimos 30 dias', `${inteiro(resumo.saidas_30d)} episódios`, 'Ausência confirmada no portal; não comprova venda.', dados.confianca?.nivel)} />
            <Metrica titulo="Reduções de preço (30 d)" valor={leitura.reducoes} evidencia={resumo.reducoes_30d == null ? null : ev(leitura.reducoes, 'Últimos 30 dias', `${leitura.reducoes} anúncios`, 'Anúncios com queda registrada entre coletas; sinal, não prova. Quedas acima de 50% são descartadas.')} />
            <Metrica titulo="Idade média observada" valor={leitura.idade} evidencia={resumo.idade_observada_confiavel ? ev(leitura.idade, 'Estoque atual', `${inteiro(resumo.ativos)} anúncios`, 'Média dos dias desde a primeira observação, liberada após 14 dias de coleta.') : null} />
            <Metrica titulo="Desvio vs FIPE (mediana)" valor={leitura.desvio} evidencia={leitura.evidenciaDesvio} />
          </div>
          {resumo.reducoes_30d != null && resumo.ativos > 0 && resumo.reducoes_30d >= 3 &&
            <div className="or-alert or-alert--warning"><strong>Reduções recentes</strong><span> {inteiro(resumo.reducoes_30d)} anúncios tiveram queda de preço. É um sinal, não prova de urgência ou venda.</span></div>}
          <section className="or-card"><h3 className="or-card__title">Qualidade do histórico</h3><p className="or-card__sub">{dados.confianca?.motivo || 'Cobertura não informada.'}</p><p className="or-card__sub">{dados.nota}</p></section>
          <section className="or-card">
            <div className="or-card__head"><div><h3 className="or-card__title">Estoque do lojista</h3><p className="or-card__sub">{inteiro(resumo.ativos)} anúncios ativos · preços anunciados</p></div></div>
            <label className="oc-conc__sort">Ordenar por <select value={ordem} onChange={e => setOrdem(e.target.value)}><option value="idade">Mais antigos</option><option value="preco_asc">Menor preço</option><option value="preco_desc">Maior preço</option></select></label>
            <div className="oc-conc__rows">{estoque.slice(0, mostrarTodos ? 150 : 20).map(a => <div className="or-listrow or-listrow--static" key={a.anuncio_id}>
              <span className="or-listrow__body"><strong className="or-listrow__t">{a.titulo}</strong><span className="or-listrow__s">{brl(a.preco)} · {inteiro(a.dias_observados)} dias observados · {a.modelo}</span></span>
              {a.url && <a href={a.url} target="_blank" rel="noreferrer" aria-label={`Ver ${a.titulo} no portal`}><ExternalLink size={16} /></a>}
            </div>)}</div>
            {estoque.length > 20 && <button type="button" className="or-btn or-btn--secondary" onClick={() => setMostrarTodos(v => !v)}>{mostrarTodos ? 'Mostrar menos' : `Mostrar até 150 (${inteiro(resumo.ativos)} no total)`}</button>}
            {resumo.ativos > estoque.length && <p className="or-card__sub">A API lista até 150 anúncios; o total acima considera todo o estoque.</p>}
          </section>
          <section className="or-card">
            <div className="or-card__head"><div><h3 className="or-card__title">Saídas observadas</h3><p className="or-card__sub">{inteiro(resumo.saidas_observadas)} episódios no histórico · ausência confirmada, não venda. O preço exibido é o último preço publicado, não o valor de venda</p></div></div>
            <div className="oc-conc__rows">{(dados.saidas_observadas || []).map((a, i) => <div className="or-listrow or-listrow--static" key={`${a.evento_id || a.anuncio_id}-${i}`}>
              <span className="or-listrow__body"><strong className="or-listrow__t">{a.titulo}</strong><span className="or-listrow__s">{brl(a.preco_saida ?? a.preco)} · {inteiro(a.dias_observados)} dias até a saída{a.reapareceu ? ' · reapareceu' : ''}</span></span>
              {a.url && <a href={a.url} target="_blank" rel="noreferrer" aria-label={`Ver ${a.titulo} no portal`}><ExternalLink size={16} /></a>}
            </div>)}</div>
            {!dados.saidas_observadas?.length && <p className="or-card__sub">Nenhuma saída observada neste histórico.</p>}
            {resumo.saidas_observadas > (dados.saidas_observadas?.length || 0) && <p className="or-card__sub">A API lista até 150 episódios; o total acima considera todo o histórico.</p>}
          </section>
          {dados.lojista?.url_perfil && <a className="or-btn or-btn--secondary" href={dados.lojista.url_perfil} target="_blank" rel="noreferrer">Ver estoque no portal <ExternalLink size={14} /></a>}
        </>}
      </div>
    </aside>
  </div>;
}

export function PageConcorrencia() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  const [ufs, setUfs] = useState([]);
  const [categoria, setCategoria] = useState('todas');
  const [cidade, setCidade] = useState('todas');
  const [busca, setBusca] = useState('');
  const [ordem, setOrdem] = useState('estoque');
  const [aberta, setAberta] = useState(null);
  useEffect(() => {
    const c = new AbortController();
    apiGet('lojistas.php', { signal: c.signal }).then(setDados)
      .catch(e => { if (e.name !== 'AbortError') setErro(e.message); });
    return () => c.abort();
  }, []);
  const lojistas = useMemo(() => dados?.lojistas || [], [dados]);
  const contagemUf = useMemo(() => lojistas.reduce((m, l) => ({ ...m, [l.uf]: (m[l.uf] || 0) + 1 }), {}), [lojistas]);
  const ordemEfetiva = categoria !== 'todas' && ordem === 'idade' ? 'estoque' : ordem;
  const contagemCategoria = useMemo(() => contagemPorCategoria(lojistas), [lojistas]);
  const cidades = useMemo(() => cidadesDisponiveis(lojistas, ufs), [lojistas, ufs]);
  const filtrados = useMemo(() => filtraRevendas(lojistas, { ufs, busca, ordem: ordemEfetiva, categoria, cidade }), [lojistas, ufs, busca, ordemEfetiva, categoria, cidade]);
  const alternaUf = uf => { setCidade('todas'); setUfs(v => v.includes(uf) ? v.filter(x => x !== uf) : [...v, uf].sort()); };
  const cidadeAtiva = cidades.find(c => c.chave === cidade);
  const escopo = `${ufs.length ? ufs.join(', ') : 'Todas as UFs'}${cidadeAtiva ? ` · ${cidadeAtiva.rotulo}` : ''}`;
  const indicadores = panoramaConcorrencia(filtrados, escopo, dados?._meta?.generated_at, { categoria });
  return <div className="oc-conc">
    <section className="or-card"><div className="or-card__head"><div><h2 className="or-card__title">Refinar resultados</h2><p className="or-card__sub">Selecione uma ou mais UFs. Sem seleção, mostramos todas.</p></div></div>
      <div className="oc-conc__chips"><button type="button" className={`or-tag ${ufs.length ? '' : 'or-tag--selected'}`} onClick={() => { setUfs([]); setCidade('todas'); }}>Todas as UFs</button>
        {Object.keys(contagemUf).sort().map(uf => <button type="button" key={uf} className={`or-tag ${ufs.includes(uf) ? 'or-tag--selected' : ''}`} aria-pressed={ufs.includes(uf)} onClick={() => alternaUf(uf)}>{uf} <span className="or-tag__count">{inteiro(contagemUf[uf])}</span></button>)}</div>
      <div className="oc-conc__segmento"><span className="or-sectiontag">SEGMENTO DE ATUAÇÃO</span>
        <div className="oc-conc__chips"><button type="button" className={`or-tag ${categoria === 'todas' ? 'or-tag--selected' : ''}`} aria-pressed={categoria === 'todas'} onClick={() => setCategoria('todas')}>Todos os segmentos</button>
          {Object.entries(CATEGORIAS_MERCADO).filter(([chave]) => contagemCategoria[chave]).map(([chave, info]) => <button type="button" key={chave} className={`or-tag ${categoria === chave ? 'or-tag--selected' : ''}`} aria-pressed={categoria === chave} onClick={() => setCategoria(chave)}>{info.label} <span className="or-tag__count">{inteiro(contagemCategoria[chave])}</span></button>)}</div>
        {categoria !== 'todas' && <p className="or-card__sub">Mostra revendas com anúncios ativos deste segmento. Saídas e reduções contam todo o estoque da revenda; idade média e desvio FIPE por segmento aparecem ao abrir o lojista.</p>}</div>
      <div className="oc-conc__controls"><label><Search size={15} /><input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar revenda" aria-label="Buscar revenda" /></label>
        <select aria-label="Ordenar revendas" value={ordemEfetiva} onChange={e => setOrdem(e.target.value)}><option value="estoque">Maior estoque</option><option value="saidas">Mais saídas observadas</option><option value="reducoes">Mais reduções de preço</option><option value="idade" disabled={categoria !== 'todas'}>Maior idade média{categoria !== 'todas' ? ' (sem segmento)' : ''}</option></select>
        {ufs.length > 0 ? <select aria-label="Filtrar por cidade" value={cidade} onChange={e => setCidade(e.target.value)}><option value="todas">Todas as cidades</option>{cidades.map(c => <option key={c.chave} value={c.chave}>{c.rotulo} ({inteiro(c.revendas)})</option>)}</select>
          : <span className="or-card__sub oc-conc__dica">Escolha uma UF para filtrar por cidade.</span>}</div>
    </section>
    {erro && <div role="alert" className="or-alert or-alert--danger">Não foi possível consultar as revendas: {erro}</div>}
    {!dados && !erro && <p>Carregando concorrência…</p>}
    {dados && <>
      <div className="oc-conc__metrics">{indicadores.map(m => <Metrica key={m.titulo} {...m} />)}</div>
      <section className="or-card"><div className="or-card__head"><div><h2 className="or-card__title">Revendas no recorte</h2><p className="or-card__sub">{inteiro(filtrados.length)} revendas · {escopo}</p></div></div>
        {filtrados.length === 0 && <p className="or-card__sub">Nenhuma revenda neste recorte. Escolha outra UF, segmento ou cidade, ou remova a busca.</p>}
        <div className="oc-conc__rows">{filtrados.map(l => { const leitura = leituraRevenda(l, dados?._meta?.generated_at); return <button type="button" className="or-listrow oc-conc__row" key={l.id} onClick={() => setAberta(l)}>
          <span className="or-listrow__lead"><Building2 size={18} /></span><span className="or-listrow__body"><strong className="or-listrow__t">{l.nome}</strong>
            <span className="or-listrow__s"><MapPin size={12} /> {l.cidade}/{l.uf} · {categoria !== 'todas' ? `${inteiro(ativosNaCategoria(l, categoria))} ativos em ${CATEGORIAS_MERCADO[categoria]?.label || categoria} (de ${inteiro(l.ativos)} no total)` : `${inteiro(l.ativos)} ativos · idade média ${leitura.idade}`}</span>
            <span className="or-listrow__s">{inteiro(l.saidas_30d)} saídas em 30 d · {leitura.reducoes} reduções{categoria !== 'todas' ? ' (estoque total da revenda)' : ` · desvio FIPE ${leitura.desvio}`}</span></span><ChevronRight className="or-listrow__arrow" size={17} />
        </button>; })}</div>
      </section>
      <div className="or-alert or-alert--info">Saída observada não é venda. Redução de preço é sinal, não prova. O desvio FIPE só aparece com ao menos 5 preços válidos.</div>
    </>}
    {aberta && <PainelRevenda revenda={aberta} categoria={categoria} onClose={() => setAberta(null)} />}
  </div>;
}
