import React, { useEffect, useMemo, useState } from 'react';
import { apiGet } from './apiClient.js';
import { Evidencia } from './Evidencia.jsx';
import { SecaoHoje } from './HojeBlocos.jsx';
import { MODOS, diferencasMovimento, evidenciaLado, inteiro, linhasComparacao, pct, seletorValido, veredito } from './comparadorModel.js';

/* Tela Comparador no formato da DEMO: dois lados, veredito com regra de amostra mínima, métricas lado a lado
   e evidência recolhida. Os dados vêm de comparador.php; a regra do mínimo mora em comparadorModel.js. */

const PERIODOS_PADRAO = [
  { codigo: '7d', rotulo: '7 dias' }, { codigo: '30d', rotulo: '30 dias' }, { codigo: '90d', rotulo: '90 dias' },
  { codigo: '180d', rotulo: '180 dias' }, { codigo: '12m', rotulo: '12 meses' },
];

const ladoVazio = () => ({ modo: 'marca_modelo', marca: '', modelo: '', ano: '' });

const rotuloModelo = (modelo, marca) => {
  const prefixo = `${marca || ''} `.trimStart();
  return prefixo && modelo.startsWith(prefixo) ? modelo.slice(prefixo.length) : modelo;
};

function Campo({ rotulo, children }) {
  return <label className="or-field"><span className="or-field__label">{rotulo}</span>{children}</label>;
}

function SeletorLado({ titulo, lado, onChange, facetas }) {
  let modelos = (facetas?.modelos || []).filter(item => lado.modo !== 'marca_modelo' || !lado.marca || item.marca === lado.marca);
  if (lado.modo === 'modelo') {
    const agrupados = new Map();
    modelos.forEach(item => {
      const atual = agrupados.get(item.modelo) || { modelo: item.modelo, anuncios: 0, marcas: new Set() };
      atual.anuncios += Number(item.anuncios || 0); atual.marcas.add(item.marca); agrupados.set(item.modelo, atual);
    });
    modelos = [...agrupados.values()].map(item => ({ ...item, marca: [...item.marcas].join('/') }));
  }
  const anosAgrupados = new Map();
  (facetas?.anos || []).filter(item => {
    if (lado.modo === 'marca') return lado.marca && item.marca === lado.marca;
    if (lado.modo === 'modelo') return lado.modelo && item.modelo === lado.modelo;
    return lado.marca && lado.modelo && item.marca === lado.marca && item.modelo === lado.modelo;
  }).forEach(item => anosAgrupados.set(Number(item.ano), (anosAgrupados.get(Number(item.ano)) || 0) + Number(item.anuncios || 0)));
  const anos = [...anosAgrupados.entries()].sort((a, b) => b[0] - a[0]);
  const recortePronto = lado.modo === 'marca' ? Boolean(lado.marca) : lado.modo === 'modelo' ? Boolean(lado.modelo) : Boolean(lado.marca && lado.modelo);
  return (
    <div className="oc-cmp__lado">
      <div role="radiogroup" aria-label={`Escopo ${titulo}`} className="oc-cmp__modos">
        {MODOS.map(([id, rotulo]) => (
          <button key={id} type="button" role="radio" aria-checked={lado.modo === id} className={`oc-cmp__modo${lado.modo === id ? ' is-on' : ''}`}
            onClick={() => onChange({ modo: id, marca: '', modelo: '', ano: '' })}>{rotulo}</button>
        ))}
      </div>
      <div className="oc-cmp__campos">
        {lado.modo !== 'modelo' && (
          <Campo rotulo="Marca">
            <select aria-label={`Marca ${titulo}`} className="oc-cmp__select" value={lado.marca}
              onChange={e => onChange({ ...lado, marca: e.target.value, modelo: lado.modo === 'marca_modelo' ? '' : lado.modelo, ano: '' })}>
              <option value="">Selecione a marca</option>
              {(facetas?.marcas || []).map(item => <option key={item.marca} value={item.marca}>{item.marca} · {inteiro(item.anuncios)}</option>)}
            </select>
          </Campo>
        )}
        {lado.modo !== 'marca' && (
          <Campo rotulo="Modelo">
            <select aria-label={`Modelo ${titulo}`} className="oc-cmp__select" value={lado.modelo} disabled={lado.modo === 'marca_modelo' && !lado.marca}
              onChange={e => onChange({ ...lado, modelo: e.target.value, ano: '' })}>
              <option value="">{lado.modo === 'marca_modelo' && !lado.marca ? 'Escolha a marca primeiro' : 'Selecione o modelo'}</option>
              {modelos.map(item => <option key={`${item.marca}-${item.modelo}`} value={item.modelo}>{rotuloModelo(item.modelo, lado.modo === 'modelo' ? item.marca.split('/')[0] : item.marca)}{lado.modo === 'modelo' ? ` · ${item.marca}` : ''} · {inteiro(item.anuncios)}</option>)}
            </select>
          </Campo>
        )}
        <Campo rotulo="Ano-modelo">
          <select aria-label={`Ano-modelo ${titulo}`} className="oc-cmp__select" value={lado.ano} disabled={!recortePronto} onChange={e => onChange({ ...lado, ano: e.target.value })}>
            <option value="">{recortePronto ? 'Selecione o ano-modelo' : 'Defina o recorte primeiro'}</option>
            {anos.map(([ano, anuncios]) => <option key={ano} value={ano}>{ano} · {inteiro(anuncios)} anúncios</option>)}
          </select>
        </Campo>
      </div>
    </div>
  );
}

function Alerta({ tom, titulo, texto }) {
  return (
    <div role={tom === 'danger' ? 'alert' : 'status'} className={`or-alert or-alert--${tom}`}>
      <span className="or-alert__ic"><i className={`ph-bold ph-${tom === 'warning' ? 'warning' : tom === 'success' ? 'check-circle' : 'info'}`} aria-hidden="true" /></span>
      <div className="or-alert__body"><span className="or-alert__t">{titulo}</span><span className="or-alert__d">{texto}</span></div>
    </div>
  );
}

function Resultado({ resultado, ladoA, ladoB }) {
  const conclusao = useMemo(() => veredito(resultado, ladoA, ladoB), [resultado, ladoA, ladoB]);
  const linhasA = linhasComparacao(resultado.lado_a);
  const linhasB = linhasComparacao(resultado.lado_b);
  return (
    <SecaoHoje titulo="Resultado" subtitulo={`Estoque ativo hoje · movimento em ${resultado.periodo?.rotulo || '30 dias'} · mediana qualificada`}>
      <div className="oc-cmp__resultado">
        {conclusao && <Alerta {...conclusao} />}
        <div className="or-card or-card--sunken oc-cmp__tabela" role="table" aria-label="Comparação lado a lado">
          <div className="oc-cmp__linha oc-cmp__linha--cab" role="row">
            <span role="columnheader" className="oc-cmp__rotulo">Métrica</span>
            <span role="columnheader"><span className="or-badge or-badge--accent">A</span> <strong>{resultado.lado_a.rotulo}</strong></span>
            <span role="columnheader"><span className="or-badge or-badge--accent">B</span> <strong>{resultado.lado_b.rotulo}</strong></span>
          </div>
          {linhasA.map(([rotulo, valorA], i) => (
            <div className="oc-cmp__linha" role="row" key={rotulo}>
              <span role="rowheader" className="oc-cmp__rotulo">{rotulo}</span>
              <strong role="cell">{valorA}</strong>
              <strong role="cell">{linhasB[i][1]}</strong>
            </div>
          ))}
        </div>
        <div className="oc-cmp__difs">
          {diferencasMovimento(resultado).map(([rotulo, valor, sub]) => (
            <div className="or-card or-stat oc-kpi" key={rotulo}>
              <div className="or-stat__top"><span className="or-stat__label">{rotulo} (A vs B)</span></div>
              <div className="or-stat__row"><span className="or-stat__value">{valor == null ? 'Sem base' : pct(valor)}</span></div>
              <p className="or-card__sub" style={{ margin: 0 }}>{sub}</p>
            </div>
          ))}
        </div>
        <p className="or-card__sub" style={{ margin: 0 }}>"Insuficiente" e "—": menos de 5 preços válidos, não comparamos preço. Volume e tempo observado são contagens e aparecem sempre. Saída observada não é venda.</p>
        <div className="oc-cmp__evidencias">
          <Evidencia evidencia={evidenciaLado('Lado A', resultado.lado_a)} rotulo="Como o lado A é calculado" />
          <Evidencia evidencia={evidenciaLado('Lado B', resultado.lado_b)} rotulo="Como o lado B é calculado" />
        </div>
      </div>
    </SecaoHoje>
  );
}

export function PageComparador({ contexto, onContexto }) {
  const [facetas, setFacetas] = useState(null);
  const [erroFacetas, setErroFacetas] = useState(false);
  const [periodo, setPeriodo] = useState(contexto?.periodo || '30d');
  const [ladoA, setLadoA] = useState(ladoVazio);
  const [ladoB, setLadoB] = useState(ladoVazio);
  const [resultado, setResultado] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => setPeriodo(contexto?.periodo || '30d'), [contexto?.periodo]);
  useEffect(() => {
    const c = new AbortController();
    apiGet('comparador.php?facetas=1', { signal: c.signal, ttlMs: 15000 }).then(setFacetas)
      .catch(e => { if (e.name !== 'AbortError') setErroFacetas(true); });
    return () => c.abort();
  }, []);

  const prontos = seletorValido(ladoA) && seletorValido(ladoB);
  // Compara sozinho quando os dois lados estão completos; um resultado antigo nunca sobrevive a uma troca de recorte.
  useEffect(() => {
    if (!prontos) { setResultado(null); setErro(''); setCarregando(false); return undefined; }
    const c = new AbortController();
    let vigente = true; // o adaptador DEMO ignora o signal: resposta de uma escolha anterior nunca sobrescreve a atual
    const p = new URLSearchParams({ periodo });
    for (const [prefixo, lado] of [['a', ladoA], ['b', ladoB]]) {
      p.set(`${prefixo}_modo`, lado.modo);
      if (lado.marca) p.set(`${prefixo}_marca`, lado.marca);
      if (lado.modelo) p.set(`${prefixo}_modelo`, lado.modelo);
      p.set(`${prefixo}_ano`, lado.ano);
    }
    setCarregando(true); setErro(''); setResultado(null);
    apiGet(`comparador.php?${p}`, { ttlMs: 0, useCache: false, signal: c.signal })
      .then(dados => { if (vigente) { setResultado(dados); setCarregando(false); } })
      .catch(e => { if (vigente && e.name !== 'AbortError') { setErro(e.message); setCarregando(false); } });
    return () => { vigente = false; c.abort(); };
  }, [prontos, periodo, ladoA, ladoB]);

  const alteraPeriodo = valor => {
    setPeriodo(valor);
    onContexto?.({ ...contexto, periodo: valor }, { replace: true, preserveScroll: true });
  };
  const periodos = facetas?.periodos || PERIODOS_PADRAO;

  return (
    <div className="oc-cmp">
      <SecaoHoje titulo="O que comparar" subtitulo="Cada lado combina marca, modelo ou marca + modelo com o próprio ano-modelo, para não misturar gerações e faixas de preço diferentes."
        acao={<Campo rotulo="Janela de movimento"><select aria-label="Janela de movimento" className="oc-cmp__select" value={periodo} onChange={e => alteraPeriodo(e.target.value)}>
          {periodos.map(item => <option key={item.codigo} value={item.codigo}>{item.rotulo}</option>)}
        </select></Campo>}>
        {erroFacetas && <Alerta tom="danger" titulo="Catálogo indisponível" texto="Não foi possível carregar marcas e modelos para comparação." />}
        <div className="oc-cmp__lados">
          <div className="or-card or-card--sunken"><h3 className="or-card__title" style={{ margin: '0 0 10px' }}>Lado A</h3><SeletorLado titulo="Lado A" lado={ladoA} onChange={setLadoA} facetas={facetas} /></div>
          <div className="or-card or-card--sunken"><h3 className="or-card__title" style={{ margin: '0 0 10px' }}>Lado B</h3><SeletorLado titulo="Lado B" lado={ladoB} onChange={setLadoB} facetas={facetas} /></div>
        </div>
        {!prontos && !erroFacetas && <p className="or-card__sub" style={{ margin: '12px 0 0' }}>Complete os dois lados, incluindo o ano-modelo: a comparação aparece sozinha.</p>}
      </SecaoHoje>
      {carregando && <p role="status" className="or-card__sub">Calculando a comparação…</p>}
      {erro && <Alerta tom="danger" titulo="Não foi possível comparar" texto={erro} />}
      {resultado && <Resultado resultado={resultado} ladoA={ladoA} ladoB={ladoB} />}
    </div>
  );
}
