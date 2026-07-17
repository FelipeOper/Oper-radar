import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Radar, LayoutGrid, Crosshair, Building2, Settings, ListChecks,
  MapPin, Truck, Clock, ExternalLink, Search, ChevronRight, Menu, X,
  TrendingDown, ArrowDownRight, ArrowUpRight, Plus, CheckCircle2, Circle,
  Timer, Flame, PackageOpen, Zap, Gauge
} from 'lucide-react';

/* ============================================================
   OPER RADAR — design system "instrumento de precisão"
   (ver docs/OPER_RADAR_Estrategia_e_Design.md)
   ============================================================ */
const STEEL = '#5B8AA6';
const T = {
  bg: '#0B0E13',
  surface: '#141922',
  surface2: '#1B212C',
  ink: '#EDEFF3',
  inkMuted: '#8A94A6',
  signal: '#F5A623',   // âmbar de radar — o único acento
  positive: '#3DD68C', // giro / venda
  alert: '#FF6B4A',    // oportunidade quente
  line: 'rgba(255,255,255,0.07)',
  fontDisplay: "'Space Grotesk', sans-serif",
  fontBody: "'Inter', sans-serif",
  fontMono: "'JetBrains Mono', monospace",
};

const API_BASE_URL = 'https://agenciaoper.com.br/oper-radar-api';

/* ---------- dados de referência ---------- */
const STATE_DATA = [
  ['SP', 'São Paulo', 409], ['PR', 'Paraná', 364], ['SC', 'Santa Catarina', 182], ['MG', 'Minas Gerais', 163],
  ['RS', 'Rio Grande do Sul', 146], ['GO', 'Goiás', 88], ['MT', 'Mato Grosso', 87], ['MS', 'Mato Grosso do Sul', 46],
  ['ES', 'Espírito Santo', 20], ['RJ', 'Rio de Janeiro', 11], ['BA', 'Bahia', 8], ['CE', 'Ceará', 8], ['TO', 'Tocantins', 8],
  ['PE', 'Pernambuco', 6], ['DF', 'Distrito Federal', 5], ['PA', 'Pará', 5], ['RN', 'Rio Grande do Norte', 3],
  ['PB', 'Paraíba', 2], ['PI', 'Piauí', 2], ['RO', 'Rondônia', 2], ['SE', 'Sergipe', 2]
];

const STATUS_DB_PARA_UI = {
  ativo: 'ativo',
  removido_candidato: 'venda_provavel',
  removido_confirmado: 'removido',
};


// Agrupa os 33 "tipos" do portal em 8 categorias de negocio (definidas com base
// nos dados reais do banco em 08/jul). Cada anuncio tem 1 categoria a partir do tipo.
const CATEGORIAS = {
  'caminhoes':      { label: 'Caminhoes',                    icone: '🚛', cor: '#F5A623' },
  'implementos':    { label: 'Implementos rodoviarios',     icone: '🚚', cor: '#D9714F' },
  'onibus_vans':    { label: 'Onibus e vans',                icone: '🚌', cor: '#5B8AA6' },
  'leves':          { label: 'Leves',                        icone: '🚗', cor: '#8A94A6' },
  'agricolas':      { label: 'Maquinas agricolas',           icone: '🌾', cor: '#3DD68C' },
  'construcao':     { label: 'Maquinas construcao',          icone: '🏗️', cor: '#FFB347' },
  'pecas':          { label: 'Pecas e acessorios',           icone: '🔧', cor: '#B98CE0' },
  'outros':         { label: 'Outros',                       icone: '🌀', cor: '#6B7280' },
};

// De qual categoria e cada tipo. Fonte: consulta ao banco pro93061_radar_oper em 08/jul.
const TIPO_PARA_CATEGORIA = {
  'Caminhao': 'caminhoes', 'Motorhome': 'caminhoes',
  'Implemento': 'implementos', 'Carroceria-sobre-chassi': 'implementos', 'Trailer': 'implementos',
  'Onibus': 'onibus_vans', 'Micro-onibus': 'onibus_vans', 'Vans': 'onibus_vans', 'Utilitarios': 'onibus_vans',
  'Carro': 'leves',
  'Trator': 'agricolas', 'Trator-esteira': 'agricolas', 'Micro-trator': 'agricolas',
  'Plantadeira': 'agricolas', 'Colheitadeira': 'agricolas', 'Plataforma-colheitadeira': 'agricolas',
  'Pulverizador': 'agricolas', 'Semeadeira': 'agricolas', 'Distribuidor-autopropelido': 'agricolas',
  'Forragem-e-feno': 'agricolas', 'Florestal': 'agricolas',
  'Pa-carregadeira': 'construcao', 'Escavadeira': 'construcao', 'Retro-escavadeira': 'construcao',
  'Motoniveladora': 'construcao', 'Rolo-compactador': 'construcao', 'Guindaste': 'construcao',
  'Mini-carregadeira': 'construcao', 'Auto-carregavel': 'construcao', 'Mini-escavadeira': 'construcao',
  'Empilhadeira': 'construcao', 'Plataforma-elevatoria': 'construcao', 'Maquinas': 'construcao',
  'Equipamentos': 'construcao',
  'Pecas-a-venda': 'pecas',
  'Moto': 'outros', 'Imoveis': 'outros', 'Quadriciclo': 'outros', 'Nautico': 'outros',
};

function categoriaDe(tipo) {
  return TIPO_PARA_CATEGORIA[tipo] || 'outros';
}

function mapeiaAnuncioReal(a) {
  const dias = Math.max(0, Math.round((Date.now() - new Date(a.primeira_vez_visto)) / 86400000));
  return {
    id: a.anuncio_portal_id,
    url: a.url,
    tipo: a.tipo || '—',
    categoria: categoriaDe(a.tipo),
    marca: a.marca || '',
    titulo: a.titulo,
    ano: a.ano_inicial ? `${a.ano_inicial}/${a.ano_final}` : '',
    preco: a.preco,
    precoFipe: a.preco_fipe ?? null,
    revenda: a.revenda,
    cidade: a.cidade,
    uf: a.uf,
    primeiraVez: a.primeira_vez_visto,
    ultimaVez: a.ultima_vez_ativo,
    dataRemocao: a.data_remocao,
    status: STATUS_DB_PARA_UI[a.status] || 'ativo',
    dias,
  };
}

const fmtBRL = v => v == null ? 'A consultar' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const fmtN = v => v == null ? '—' : v.toLocaleString('pt-BR');

/* ---------- hooks de dados ---------- */
function useApi(path) {
  const [data, setData] = useState(null);
  const [erro, setErro] = useState(false);
  useEffect(() => {
    fetch(`${API_BASE_URL}/${path}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(() => setErro(true));
  }, [path]);
  return { data, erro };
}

/* ============================================================
   componentes base
   ============================================================ */

/* Assinatura: o pulso de radar "ao vivo" */
function RadarPulse({ ultimaColeta }) {
  const horasAtras = ultimaColeta
    ? Math.round((Date.now() - new Date(ultimaColeta)) / 3600000)
    : null;
  const ativo = horasAtras != null && horasAtras < 24;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ position: 'relative', width: 10, height: 10, flexShrink: 0 }}>
        <span style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: ativo ? T.positive : T.inkMuted,
        }} />
        {ativo && <span style={{
          position: 'absolute', inset: -4, borderRadius: '50%',
          border: `1px solid ${T.positive}`,
          animation: 'radarPing 2.4s ease-out infinite',
        }} />}
      </span>
      <div style={{ fontFamily: T.fontMono, fontSize: 11, color: T.inkMuted, lineHeight: 1.4 }}>
        {ativo ? 'RADAR ATIVO' : 'AGUARDANDO COLETA'}<br />
        <span style={{ color: ativo ? T.positive : T.inkMuted }}>
          {horasAtras != null ? `última varredura há ${horasAtras}h` : 'sem dados ainda'}
        </span>
      </div>
      <style>{`@keyframes radarPing { 0% { transform: scale(0.6); opacity: 0.9; } 100% { transform: scale(2.2); opacity: 0; } }`}</style>
    </div>
  );
}

function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: T.surface, border: `1px solid ${T.line}`, borderRadius: 14,
      padding: 20, transition: 'border-color 160ms ease',
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.borderColor = 'rgba(245,166,35,0.35)'; }}
      onMouseLeave={e => { if (onClick) e.currentTarget.style.borderColor = T.line; }}
    >
      {children}
    </div>
  );
}

function Kpi({ label, value, sub, tone }) {
  return (
    <Card style={{ padding: '18px 20px' }}>
      <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.inkMuted, fontFamily: T.fontBody, marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: T.fontDisplay, fontSize: 32, fontWeight: 600, color: tone || T.ink, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: T.inkMuted, marginTop: 8 }}>{sub}</div>}
    </Card>
  );
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ margin: '28px 0 14px' }}>
      <div style={{ fontFamily: T.fontDisplay, fontSize: 17, fontWeight: 600, color: T.ink }}>{children}</div>
      {sub && <div style={{ fontSize: 12.5, color: T.inkMuted, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function Tag({ children, tone }) {
  const cores = { positivo: T.positive, alerta: T.alert, sinal: T.signal, neutro: T.inkMuted };
  const c = cores[tone] || T.inkMuted;
  return (
    <span style={{
      fontFamily: T.fontMono, fontSize: 10.5, padding: '3px 8px', borderRadius: 6,
      color: c, background: `${c}18`, border: `1px solid ${c}30`, whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

function EmptyState({ icon: Icon, titulo, texto }) {
  return (
    <Card style={{ textAlign: 'center', padding: '40px 24px' }}>
      <Icon size={26} style={{ color: T.inkMuted, marginBottom: 12 }} />
      <div style={{ fontFamily: T.fontDisplay, fontSize: 15, fontWeight: 600, marginBottom: 6, color: T.ink }}>{titulo}</div>
      <div style={{ fontSize: 13, color: T.inkMuted, maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>{texto}</div>
    </Card>
  );
}

const inputStyle = {
  background: T.surface2, color: T.ink, border: `1px solid ${T.line}`,
  borderRadius: 10, padding: '10px 14px', fontSize: 13.5, fontFamily: T.fontBody, outline: 'none',
};

/* ============================================================
   HOJE — feed compacto + KPIs de mercado
   ============================================================ */
function PainelKpi({ titulo, subtitulo, dados, renderItem }) {
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ fontFamily: T.fontDisplay, fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 2 }}>{titulo}</div>
      {subtitulo && <div style={{ fontSize: 11, color: T.inkMuted, marginBottom: 12 }}>{subtitulo}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {dados && dados.length > 0
          ? dados.map(renderItem)
          : <div style={{ fontSize: 12, color: T.inkMuted, fontStyle: 'italic' }}>ainda sem dados suficientes</div>}
      </div>
    </Card>
  );
}


function KpiEntradaSaida({ entrou, saiu }) {
  return (
    <Card style={{ padding: '18px 20px' }}>
      <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.inkMuted, fontFamily: T.fontBody, marginBottom: 10 }}>
        Movimento 48h
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.fontDisplay, fontSize: 24, fontWeight: 600, color: T.signal, lineHeight: 1, fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ArrowUpRight size={18} strokeWidth={2.5} />{fmtN(entrou)}
          </div>
          <div style={{ fontSize: 11, color: T.inkMuted, marginTop: 6 }}>entrou</div>
        </div>
        <div style={{ width: 1, alignSelf: 'stretch', background: T.line, margin: '4px 0' }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: T.fontDisplay, fontSize: 24, fontWeight: 600, color: T.positive, lineHeight: 1, fontVariantNumeric: 'tabular-nums', display: 'flex', alignItems: 'center', gap: 4 }}>
            <ArrowDownRight size={18} strokeWidth={2.5} />{fmtN(saiu)}
          </div>
          <div style={{ fontSize: 11, color: T.inkMuted, marginTop: 6 }}>saiu</div>
        </div>
      </div>
    </Card>
  );
}

function PageHoje({ kpis, anuncios, usandoReais }) {
  const { data: stats } = useApi('hoje_stats.php');
  const [sinalAberto, setSinalAberto] = useState(null);

  const sinais = useMemo(() => {
    const lista = [];
    const agora = Date.now();
    anuncios.forEach(a => {
      const horasDesdePrimeira = (agora - new Date(a.primeiraVez)) / 3600000;
      if (a.status === 'removido') {
        lista.push({ tipo: 'venda', a, quando: a.dataRemocao || a.ultimaVez });
      } else if (a.status === 'venda_provavel') {
        lista.push({ tipo: 'sumiu', a, quando: a.ultimaVez });
      } else if (horasDesdePrimeira < 48) {
        lista.push({ tipo: 'novo', a, quando: a.primeiraVez });
      }
    });
    return lista.sort((x, y) => new Date(y.quando) - new Date(x.quando)).slice(0, 40);
  }, [anuncios]);

  const config = {
    novo:  { icone: Zap,          cor: T.signal,   rotulo: 'NOVO' },
    sumiu: { icone: Timer,        cor: T.alert,    rotulo: 'SUMIU' },
    venda: { icone: CheckCircle2, cor: T.positive, rotulo: 'VENDIDO' },
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 22 }}>
        <Kpi label="Revendas no radar" value={kpis ? fmtN(kpis.revendas_monitoradas) : '—'} sub={usandoReais ? 'PR · 2×/dia' : 'conectando…'} />
        <Kpi label="Anúncios ativos" value={kpis ? fmtN(kpis.anuncios_ativos) : '—'} sub="no mercado agora" />
        <Kpi label="Vendas estimadas" value={kpis ? fmtN(kpis.vendas_estimadas_mes) : '—'} sub="este mês · confirmadas" tone={T.positive} />
        <KpiEntradaSaida
          entrou={sinais.filter(s => s.tipo === 'novo').length}
          saiu={sinais.filter(s => s.tipo === 'sumiu' || s.tipo === 'venda').length}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1.1fr) 1.4fr', gap: 16, alignItems: 'start' }}>

        {/* COLUNA ESQUERDA: feed compacto */}
        <div>
          <div style={{ fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 600, color: T.ink, marginBottom: 4 }}>Feed do mercado</div>
          <div style={{ fontSize: 11.5, color: T.inkMuted, marginBottom: 12 }}>O que mudou desde ontem — clique para expandir</div>

          {sinais.length === 0 ? (
            <EmptyState icon={Radar} titulo="Sem sinais ainda"
              texto="Aguardando o próximo ciclo do radar detectar movimento." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 640, overflowY: 'auto', paddingRight: 4 }}>
              {sinais.map((s, i) => {
                const C = config[s.tipo];
                const aberto = sinalAberto === i;
                return (
                  <div key={i} onClick={() => setSinalAberto(aberto ? null : i)} style={{
                    background: aberto ? T.surface2 : T.surface,
                    border: `1px solid ${aberto ? 'rgba(245,166,35,0.3)' : T.line}`,
                    borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
                    transition: 'border-color 140ms',
                  }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <C.icone size={13} style={{ color: C.cor, flexShrink: 0 }} />
                      <span style={{ fontFamily: T.fontMono, fontSize: 9.5, color: C.cor, letterSpacing: '0.05em', minWidth: 46 }}>{C.rotulo}</span>
                      <span style={{ fontSize: 12.5, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.a.titulo}</span>
                      <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.inkMuted, whiteSpace: 'nowrap' }}>
                        {new Date(s.quando).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {aberto && (
                      <div style={{ marginTop: 10, paddingLeft: 24, fontSize: 12, color: T.inkMuted, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div><span style={{ color: T.ink }}>{s.a.revenda}</span> · {s.a.cidade}/{s.a.uf}</div>
                        <div><span style={{ fontFamily: T.fontMono, color: T.ink }}>{fmtBRL(s.a.preco)}</span> · {s.a.dias} dias no ar</div>
                        {s.a.url && <a href={s.a.url} target="_blank" rel="noreferrer" style={{ color: T.signal, textDecoration: 'none', display: 'inline-flex', gap: 5, alignItems: 'center', marginTop: 4 }}>Ver no portal <ExternalLink size={11} /></a>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* COLUNA DIREITA: KPIs de mercado */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <PainelKpi titulo="Modelos mais anunciados" subtitulo="Volume ativo · preço médio de mercado"
            dados={stats?.top_modelos}
            renderItem={(m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12.5 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{m.modelo}</span>
                <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.inkMuted, whiteSpace: 'nowrap' }}>
                  {m.n}× · <span style={{ color: T.ink }}>{fmtBRL(m.preco_medio)}</span>
                </span>
              </div>
            )}
          />

          <PainelKpi titulo="Regiões com mais vendas" subtitulo="Vendas confirmadas nos últimos 30 dias"
            dados={stats?.regioes_vendas}
            renderItem={(c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={11} style={{ color: T.inkMuted }} />{c.cidade}/{c.uf}</span>
                <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.positive }}>{c.n} vendas</span>
              </div>
            )}
          />

          <PainelKpi titulo="Lojas mais ativas" subtitulo="Anúncios novos nos últimos 7 dias"
            dados={stats?.top_lojas_novos}
            renderItem={(l, i) => (
              <div key={i} style={{ fontSize: 12.5, display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{l.nome}</span>
                <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.signal }}>+{l.n}</span>
              </div>
            )}
          />

          <PainelKpi titulo="Lojas que mais venderam" subtitulo="Vendas confirmadas nos últimos 30 dias"
            dados={stats?.top_lojas_vendas}
            renderItem={(l, i) => (
              <div key={i} style={{ fontSize: 12.5, display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{l.nome}</span>
                <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.positive }}>{l.n}v</span>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MERCADO — busca paginada no servidor (todos os 7k+ anuncios)
   ============================================================ */
const PAGINA = 60;

function PageMercado() {
  const { data: facetas } = useApi('facetas.php');

  const [q, setQ] = useState('');
  const [qDebounced, setQDebounced] = useState('');
  const [categoria, setCategoria] = useState('todas');
  const [tipo, setTipo] = useState('todos');
  const [status, setStatus] = useState('todos');
  const [regiao, setRegiao] = useState('todas');
  const [cidade, setCidade] = useState('todas');
  const [revenda, setRevenda] = useState('todas');
  const [precoMin, setPrecoMin] = useState('');
  const [precoMax, setPrecoMax] = useState('');
  const [ordem, setOrdem] = useState('aleatorio');
  const [maisFiltros, setMaisFiltros] = useState(false);

  const [anuncios, setAnuncios] = useState([]);
  const [total, setTotal] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [fim, setFim] = useState(false);

  // Debounce da busca — evita disparar uma requisicao por tecla digitada
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const queryBase = useMemo(() => {
    const p = new URLSearchParams();
    if (categoria !== 'todas') p.set('categoria', categoria);
    if (regiao !== 'todas') p.set('regiao', regiao);
    if (tipo !== 'todos') p.set('tipo', tipo);
    if (status !== 'todos') {
      const mapa = { ativo: 'ativo', venda_provavel: 'removido_candidato', removido: 'removido_confirmado' };
      p.set('status', mapa[status] || status);
    }
    if (cidade !== 'todas') p.set('cidade', cidade);
    if (revenda !== 'todas') p.set('revenda', revenda);
    if (precoMin) p.set('preco_min', precoMin);
    if (precoMax) p.set('preco_max', precoMax);
    if (qDebounced) p.set('q', qDebounced);
    p.set('ordem', ordem);
    return p.toString();
  }, [categoria, regiao, tipo, status, cidade, revenda, precoMin, precoMax, qDebounced, ordem]);

  // Busca a primeira pagina sempre que qualquer filtro muda
  useEffect(() => {
    let cancelado = false;
    setCarregando(true); setFim(false);
    fetch(`${API_BASE_URL}/anuncios.php?${queryBase}&limit=${PAGINA}&offset=0`)
      .then(r => r.json())
      .then(d => {
        if (cancelado) return;
        setAnuncios((d.anuncios || []).map(mapeiaAnuncioReal));
        setTotal(d.total ?? 0);
        setFim((d.anuncios || []).length >= (d.total ?? 0));
      })
      .catch(() => { if (!cancelado) { setAnuncios([]); setTotal(0); } })
      .finally(() => { if (!cancelado) setCarregando(false); });
    return () => { cancelado = true; };
  }, [queryBase]);

  const carregaMais = () => {
    if (carregando || fim) return;
    setCarregando(true);
    fetch(`${API_BASE_URL}/anuncios.php?${queryBase}&limit=${PAGINA}&offset=${anuncios.length}`)
      .then(r => r.json())
      .then(d => {
        const novos = (d.anuncios || []).map(mapeiaAnuncioReal);
        setAnuncios(prev => {
          const juntos = [...prev, ...novos];
          if (novos.length === 0 || juntos.length >= (d.total ?? 0)) setFim(true);
          return juntos;
        });
      })
      .catch(() => setFim(true))
      .finally(() => setCarregando(false));
  };

  // Scroll infinito de verdade — dispara nova requisicao ao chegar perto do fim
  useEffect(() => {
    const onScroll = () => {
      const el = document.scrollingElement || document.documentElement;
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 600) carregaMais();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  });

  const catCounts = facetas?.categorias || {};
  const totalGeral = facetas?.total_geral ?? 0;
  const cidades = ['todas', ...(facetas?.cidades || []).map(c => c.cidade)];
  const revendas = ['todas', ...(facetas?.revendas || []).map(r => r.nome)];
  const subtipos = categoria === 'todas'
    ? []
    : (facetas?.subtipos?.[categoria] || []);

  const filtrosAtivos = [categoria !== 'todas', tipo !== 'todos', status !== 'todos',
    cidade !== 'todas', revenda !== 'todas', !!precoMin, !!precoMax].filter(Boolean).length;
  const chipsCategorias = ['todas', ...Object.keys(CATEGORIAS)];

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12, marginBottom: 4 }}>
        {chipsCategorias.map(cat => {
          const info = cat === 'todas' ? { label: 'Todas', icone: '📊', cor: T.ink } : CATEGORIAS[cat];
          const ativa = categoria === cat;
          const n = cat === 'todas' ? totalGeral : (catCounts[cat] || 0);
          return (
            <button key={cat} onClick={() => { setCategoria(cat); setTipo('todos'); }} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px',
              background: ativa ? `${info.cor}22` : T.surface,
              border: `1px solid ${ativa ? info.cor : T.line}`,
              borderRadius: 999, cursor: 'pointer', fontSize: 12.5, fontFamily: T.fontBody,
              color: ativa ? info.cor : T.ink, whiteSpace: 'nowrap', fontWeight: ativa ? 600 : 400,
              transition: 'all 140ms',
            }}>
              <span>{info.icone}</span><span>{info.label}</span>
              <span style={{ fontFamily: T.fontMono, fontSize: 10.5, color: T.inkMuted }}>{fmtN(n)}</span>
            </button>
          );
        })}
      </div>

      {/* Chips de regiao — so aparecem regioes que ja tem dados coletados */}
      {facetas?.regioes && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12, marginBottom: 4 }}>
          {['todas', ...Object.keys(facetas.regioes)].map(rg => {
            const dados = rg === 'todas' ? null : facetas.regioes[rg];
            const temDados = rg === 'todas' || (dados && dados.anuncios > 0);
            const ativa = regiao === rg;
            const n = rg === 'todas' ? totalGeral : (dados?.anuncios || 0);
            return (
              <button key={rg} onClick={() => temDados && setRegiao(rg)} disabled={!temDados} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 11px',
                background: ativa ? `${STEEL}22` : T.surface,
                border: `1px solid ${ativa ? STEEL : T.line}`,
                borderRadius: 999, cursor: temDados ? 'pointer' : 'not-allowed',
                fontSize: 12, fontFamily: T.fontBody,
                color: ativa ? STEEL : (temDados ? T.ink : T.inkMuted),
                opacity: temDados ? 1 : 0.4, whiteSpace: 'nowrap', fontWeight: ativa ? 600 : 400,
              }} title={temDados ? '' : 'Regiao ainda nao coletada'}>
                <MapPin size={11} />
                <span>{rg === 'todas' ? 'Brasil' : rg}</span>
                <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.inkMuted }}>{fmtN(n)}</span>
              </button>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', top: 12, left: 12, color: T.inkMuted }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar modelo, marca, cidade ou revenda..."
            style={{ ...inputStyle, width: '100%', paddingLeft: 34 }} />
        </div>
        <select value={ordem} onChange={e => setOrdem(e.target.value)} style={inputStyle}>
          <option value="aleatorio">Amostra do mercado</option>
          <option value="recente">Mais recentes</option>
          <option value="preco_asc">Menor preço</option>
          <option value="preco_desc">Maior preço</option>
          <option value="mais_tempo">Há mais tempo no ar</option>
        </select>
        <button onClick={() => setMaisFiltros(!maisFiltros)} style={{
          ...inputStyle, cursor: 'pointer', display: 'flex', gap: 6, alignItems: 'center',
          borderColor: filtrosAtivos ? T.signal : T.line, color: filtrosAtivos ? T.signal : T.ink,
        }}>
          Filtros{filtrosAtivos ? ` · ${filtrosAtivos}` : ''} {maisFiltros ? '▴' : '▾'}
        </button>
      </div>

      {maisFiltros && (
        <Card style={{ padding: 14, marginBottom: 8, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
          <select value={tipo} onChange={e => setTipo(e.target.value)} style={inputStyle} disabled={categoria === 'todas'}>
            <option value="todos">{categoria === 'todas' ? 'Escolha uma categoria' : 'Todos os subtipos'}</option>
            {subtipos.map(s => <option key={s.tipo} value={s.tipo}>{s.tipo} ({s.n})</option>)}
          </select>
          <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
            <option value="todos">Todos os status</option>
            <option value="ativo">No mercado</option>
            <option value="venda_provavel">Venda provável</option>
            <option value="removido">Vendido</option>
          </select>
          <select value={cidade} onChange={e => setCidade(e.target.value)} style={inputStyle}>
            {cidades.map(c => <option key={c} value={c}>{c === 'todas' ? 'Todas as cidades' : c}</option>)}
          </select>
          <select value={revenda} onChange={e => setRevenda(e.target.value)} style={inputStyle}>
            {revendas.map(r => <option key={r} value={r}>{r === 'todas' ? 'Todas as revendas' : r}</option>)}
          </select>
          <input type="number" value={precoMin} onChange={e => setPrecoMin(e.target.value)} placeholder="Preço mín. (R$)" style={inputStyle} />
          <input type="number" value={precoMax} onChange={e => setPrecoMax(e.target.value)} placeholder="Preço máx. (R$)" style={inputStyle} />
        </Card>
      )}

      <div style={{ fontFamily: T.fontMono, fontSize: 11, color: T.inkMuted, margin: '10px 2px 14px' }}>
        {total === null ? 'CONSULTANDO O BANCO...' : `${fmtN(total)} ANÚNCIOS ENCONTRADOS · MOSTRANDO ${fmtN(anuncios.length)}`}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 12 }}>
        {anuncios.map(a => {
          const cat = CATEGORIAS[a.categoria] || CATEGORIAS.outros;
          return (
            <Card key={a.id} style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                <Tag tone={a.status === 'removido' ? 'positivo' : a.status === 'venda_provavel' ? 'alerta' : a.dias >= 30 ? 'sinal' : 'neutro'}>
                  {a.status === 'removido' ? 'VENDIDO'
                    : a.status === 'venda_provavel' ? 'VENDA PROVÁVEL'
                    : a.dias >= 30 ? `${a.dias}D NO AR`
                    : a.dias < 2 ? 'NOVO' : 'ATIVO'}
                </Tag>
                <span style={{ fontFamily: T.fontMono, fontSize: 10.5, color: T.inkMuted }}>#{a.id}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 12 }}>{cat.icone}</span>
                <span style={{ fontFamily: T.fontMono, fontSize: 10, color: cat.cor, letterSpacing: '0.04em' }}>{cat.label.toUpperCase()}</span>
              </div>
              <div style={{ fontFamily: T.fontDisplay, fontSize: 15, fontWeight: 600, lineHeight: 1.35, marginBottom: 4 }}>{a.titulo}</div>
              <div style={{ fontSize: 12, color: T.inkMuted, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
                <MapPin size={11} />
                <button onClick={() => { setRevenda(a.revenda); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  style={{ background: 'none', border: 'none', color: T.inkMuted, cursor: 'pointer', padding: 0, fontSize: 12,
                           textDecoration: 'underline', textDecorationColor: 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.textDecorationColor = T.signal}
                  onMouseLeave={e => e.currentTarget.style.textDecorationColor = 'transparent'}
                  title="Filtrar por essa revenda">{a.revenda}</button>
                <span>· {a.cidade}/{a.uf}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontFamily: T.fontMono, fontSize: 17, fontWeight: 600, color: a.preco ? T.ink : T.inkMuted }}>{fmtBRL(a.preco)}</div>
                  <div style={{ fontSize: 11, marginTop: 2, color: a.precoFipe ? (a.preco < a.precoFipe ? T.positive : T.inkMuted) : T.inkMuted }}>
                    {a.precoFipe
                      ? `FIPE ${fmtBRL(a.precoFipe)} · ${a.preco < a.precoFipe ? '▼' : '▲'} ${Math.abs(Math.round((a.preco - a.precoFipe) / a.precoFipe * 100))}%`
                      : 'vs FIPE: aguardando Fase 2'}
                  </div>
                </div>
                {a.url && <a href={a.url} target="_blank" rel="noreferrer" style={{ color: T.signal, display: 'flex' }} title="Abrir anúncio no portal"><ExternalLink size={15} /></a>}
              </div>
            </Card>
          );
        })}
      </div>

      {carregando && <div style={{ textAlign: 'center', fontFamily: T.fontMono, fontSize: 11, color: T.inkMuted, marginTop: 18 }}>CARREGANDO...</div>}
      {!carregando && fim && anuncios.length > 0 && (
        <div style={{ textAlign: 'center', fontSize: 12, color: T.inkMuted, marginTop: 18 }}>
          Fim da lista — {fmtN(anuncios.length)} de {fmtN(total)} anúncios
        </div>
      )}
      {!carregando && anuncios.length === 0 && total === 0 && (
        <EmptyState icon={PackageOpen} titulo="Nenhum anúncio com esses filtros"
          texto="Tente ampliar a busca — remova filtros de preço, cidade ou revenda." />
      )}
    </div>
  );
}

/* ============================================================
   OPORTUNIDADES — onde há dinheiro na mesa
   ============================================================ */
function PageOportunidades({ onCriarAcao }) {
  // Busca no servidor os anuncios ativos ha mais tempo — nao depende do que o Mercado carregou
  const { data, erro } = useApi('anuncios.php?status=ativo&ordem=mais_tempo&limit=40');
  const lista = useMemo(() => (data?.anuncios || []).map(mapeiaAnuncioReal), [data]);
  const maduros = lista.filter(a => a.dias >= 30).slice(0, 15);

  return (
    <div>
      <SectionTitle sub="Anúncio parado há 30+ dias: o vendedor tende a aceitar negociação — oportunidade de compra abaixo do anunciado">
        Anúncios maduros no mercado
      </SectionTitle>
      {!data && !erro && <EmptyState icon={Timer} titulo="Consultando o mercado..." texto="Buscando os anúncios que estão no ar há mais tempo." />}
      {data && maduros.length === 0 && (
        <EmptyState icon={Timer} titulo="Ainda sem anúncios com 30+ dias registrados"
          texto={`O mais antigo do radar hoje está há ${lista[0]?.dias ?? 0} dias. A idade só conta a partir da primeira coleta (07/jul) — conforme os dias passam, os anúncios realmente parados aparecem aqui.`} />
      )}
      {maduros.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {maduros.map(a => (
            <Card key={a.id} style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <Flame size={17} style={{ color: T.alert, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{a.titulo}</div>
                <div style={{ fontSize: 12, color: T.inkMuted }}>{a.revenda} · {a.cidade}/{a.uf} · {fmtBRL(a.preco)}</div>
              </div>
              <Tag tone="alerta">{a.dias} DIAS NO AR</Tag>
              <button onClick={() => onCriarAcao(`Negociar: ${a.titulo} (${a.revenda}, ${a.dias}d no ar)`)}
                style={{ ...inputStyle, cursor: 'pointer', display: 'flex', gap: 6, alignItems: 'center', padding: '8px 12px' }}>
                <Plus size={13} /> Criar ação
              </button>
            </Card>
          ))}
        </div>
      )}

      <SectionTitle sub="Anúncios abaixo da tabela FIPE — exige o mapeamento marca/modelo da Fase 2">Preço abaixo da FIPE</SectionTitle>
      <EmptyState icon={TrendingDown} titulo="Aguardando Fase 2 — mapeamento FIPE"
        texto="Quando o catálogo de marcas e modelos estiver cruzado com a tabela FIPE, esta seção mostra automaticamente cada anúncio abaixo da referência — os candidatos mais óbvios a arbitragem." />

      <SectionTitle sub="Reduções de preço detectadas entre uma varredura e outra">Quedas de preço</SectionTitle>
      <EmptyState icon={ArrowDownRight} titulo="Coletando histórico de preços"
        texto="A cada varredura o radar registra o preço de cada anúncio. Assim que houver histórico suficiente (alguns dias de coleta), toda queda de preço aparece aqui em ordem de relevância." />
    </div>
  );
}


/* ============================================================
   CONCORRENTES — quem sao os players + metricas de giro
   ============================================================ */
const REGIOES_UI = ['Sul', 'Sudeste', 'Centro-Oeste', 'Nordeste', 'Norte'];

function PageConcorrentes() {
  const [regiao, setRegiao] = useState('todas');
  const { data: facetas } = useApi('facetas.php');
  const urlLojistas = regiao === 'todas' ? 'lojistas.php' : `lojistas.php?regiao=${encodeURIComponent(regiao)}`;
  const { data, erro } = useApi(urlLojistas);
  const [q, setQ] = useState('');
  const [categoria, setCategoria] = useState('todas');
  const [cidade, setCidade] = useState('todas');
  const [ordem, setOrdem] = useState('ativos');
  const [mostrados, setMostrados] = useState(48);

  const lojistas = data?.lojistas || [];

  // Classifica cada tipo dentro de uma categoria e monta o mix de categorias por revenda
  const lojistasComCat = useMemo(() => lojistas.map(l => {
    const catMix = {};
    Object.entries(l.mix_categorias || {}).forEach(([tipo, n]) => {
      const cat = categoriaDe(tipo);
      catMix[cat] = (catMix[cat] || 0) + n;
    });
    return { ...l, catMix, cidades: [l.cidade] };
  }), [lojistas]);

  // Chips: contagem por categoria (revendas que TEM ao menos 1 anuncio da categoria)
  const contCat = useMemo(() => {
    const c = {};
    lojistasComCat.forEach(l => {
      Object.keys(l.catMix).forEach(cat => { c[cat] = (c[cat] || 0) + 1; });
    });
    return c;
  }, [lojistasComCat]);

  const cidades = useMemo(() => ['todas', ...[...new Set(lojistasComCat.map(l => l.cidade).filter(Boolean))].sort()], [lojistasComCat]);
  const contCidade = useMemo(() => {
    const c = {};
    lojistasComCat.forEach(l => { c[l.cidade] = (c[l.cidade] || 0) + 1; });
    return c;
  }, [lojistasComCat]);

  const filtrados = useMemo(() => {
    let lista = lojistasComCat.filter(l => {
      if (categoria !== 'todas' && !l.catMix[categoria]) return false;
      if (cidade !== 'todas' && l.cidade !== cidade) return false;
      if (q && !l.nome.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
    const ordens = {
      ativos: (a, b) => b.ativos - a.ativos,
      vendidos: (a, b) => b.vendidos - a.vendidos,
      vendidos_30d: (a, b) => b.vendidos_30d - a.vendidos_30d,
      giro: (a, b) => (a.idade_media_estoque ?? 999) - (b.idade_media_estoque ?? 999),
      historico: (a, b) => b.total_historico - a.total_historico,
    };
    return [...lista].sort(ordens[ordem]);
  }, [lojistasComCat, categoria, cidade, q, ordem]);

  useEffect(() => { setMostrados(48); }, [categoria, cidade, q, ordem]);

  useEffect(() => {
    const onScroll = () => {
      const el = document.scrollingElement || document.documentElement;
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 800) {
        setMostrados(m => Math.min(m + 60, 500));
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const chipsCategorias = ['todas', ...Object.keys(CATEGORIAS)];
  const cidadesTop = cidades.filter(c => c !== 'todas').sort((a, b) => (contCidade[b] || 0) - (contCidade[a] || 0)).slice(0, 8);

  return (
    <div>
      {/* Chips de regiao — refiltram os lojistas por regiao do Brasil */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: T.inkMuted, marginBottom: 6, fontFamily: T.fontMono, letterSpacing: '0.05em' }}>REGIAO DO BRASIL</div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8 }}>
          {['todas', ...REGIOES_UI].map(rg => {
            const dados = rg === 'todas' ? null : facetas?.regioes?.[rg];
            const temDados = rg === 'todas' || (dados && dados.revendas > 0);
            const ativa = regiao === rg;
            const n = rg === 'todas' ? '' : (dados?.revendas || 0);
            return (
              <button key={rg} onClick={() => temDados && setRegiao(rg)} disabled={!temDados} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                background: ativa ? `${STEEL}22` : T.surface,
                border: `1px solid ${ativa ? STEEL : T.line}`, borderRadius: 999,
                cursor: temDados ? 'pointer' : 'not-allowed', fontSize: 12, fontFamily: T.fontBody,
                color: ativa ? STEEL : (temDados ? T.ink : T.inkMuted),
                opacity: temDados ? 1 : 0.4, whiteSpace: 'nowrap', fontWeight: ativa ? 600 : 400,
              }} title={temDados ? '' : 'Regiao ainda nao coletada'}>
                <MapPin size={11} />
                <span>{rg === 'todas' ? 'Brasil inteiro' : rg}</span>
                {n !== '' && <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.inkMuted }}>{fmtN(n)}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chips de categorias — quais lojistas atuam em cada segmento */}
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 11, color: T.inkMuted, marginBottom: 6, fontFamily: T.fontMono, letterSpacing: '0.05em' }}>SEGMENTO DE ATUACAO</div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8 }}>
          {chipsCategorias.map(cat => {
            const info = cat === 'todas' ? { label: 'Todas', icone: '📊', cor: T.ink } : CATEGORIAS[cat];
            const ativa = categoria === cat;
            const n = cat === 'todas' ? lojistasComCat.length : (contCat[cat] || 0);
            return (
              <button key={cat} onClick={() => setCategoria(cat)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 11px',
                background: ativa ? `${info.cor}22` : T.surface,
                border: `1px solid ${ativa ? info.cor : T.line}`,
                borderRadius: 999, cursor: 'pointer', fontSize: 12, fontFamily: T.fontBody,
                color: ativa ? info.cor : T.ink, whiteSpace: 'nowrap', fontWeight: ativa ? 600 : 400,
                transition: 'all 140ms',
              }}>
                <span>{info.icone}</span>
                <span>{info.label}</span>
                <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.inkMuted }}>{fmtN(n)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chips de cidade — top 8 regioes com mais lojistas */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: T.inkMuted, marginBottom: 6, fontFamily: T.fontMono, letterSpacing: '0.05em' }}>REGIAO</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setCidade('todas')} style={{
            padding: '5px 10px', background: cidade === 'todas' ? `${T.signal}22` : T.surface,
            border: `1px solid ${cidade === 'todas' ? T.signal : T.line}`, borderRadius: 999,
            cursor: 'pointer', fontSize: 11.5, color: cidade === 'todas' ? T.signal : T.ink,
            fontWeight: cidade === 'todas' ? 600 : 400,
          }}>Todas ({fmtN(lojistasComCat.length)})</button>
          {cidadesTop.map(c => (
            <button key={c} onClick={() => setCidade(c)} style={{
              padding: '5px 10px', background: cidade === c ? `${T.signal}22` : T.surface,
              border: `1px solid ${cidade === c ? T.signal : T.line}`, borderRadius: 999,
              cursor: 'pointer', fontSize: 11.5, color: cidade === c ? T.signal : T.ink,
              fontWeight: cidade === c ? 600 : 400,
            }}>{c} <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.inkMuted }}>{contCidade[c]}</span></button>
          ))}
        </div>
      </div>

      {/* Busca + ordenacao */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', top: 12, left: 12, color: T.inkMuted }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar revenda..." style={{ ...inputStyle, width: '100%', paddingLeft: 34 }} />
        </div>
        <select value={ordem} onChange={e => setOrdem(e.target.value)} style={inputStyle}>
          <option value="ativos">Mais anuncios ativos</option>
          <option value="vendidos_30d">Mais vendas (30d)</option>
          <option value="vendidos">Mais vendas (total)</option>
          <option value="giro">Melhor giro (menor idade)</option>
          <option value="historico">Maior historico</option>
        </select>
      </div>

      <div style={{ fontFamily: T.fontMono, fontSize: 11, color: T.inkMuted, margin: '2px 2px 14px' }}>
        {data ? `${fmtN(filtrados.length)} REVENDAS · PR` : erro ? 'API INDISPONIVEL' : 'CARREGANDO...'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {filtrados.slice(0, mostrados).map((l, i) => (
          <Card key={l.id} style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: T.fontMono, fontSize: 11, color: i < 3 ? T.signal : T.inkMuted }}>#{String(i + 1).padStart(2, '0')}</span>
              <Tag tone={l.vendidos_30d > 3 ? 'positivo' : l.ativos > 30 ? 'sinal' : 'neutro'}>
                {l.vendidos_30d > 0 ? `${l.vendidos_30d} VENDAS/30D` : `${fmtN(l.ativos)} ATIVOS`}
              </Tag>
            </div>
            <div style={{ fontFamily: T.fontDisplay, fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{l.nome}</div>
            <div style={{ fontSize: 12, color: T.inkMuted, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
              <MapPin size={11} /> {l.cidade}/{l.uf}
            </div>

            {/* Mix de categorias — pequenas tags coloridas */}
            {Object.keys(l.catMix).length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                {Object.entries(l.catMix).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([cat, n]) => {
                  const info = CATEGORIAS[cat] || CATEGORIAS.outros;
                  return (
                    <span key={cat} title={info.label} style={{
                      fontSize: 10, padding: '2px 6px', borderRadius: 4,
                      background: `${info.cor}18`, color: info.cor,
                      fontFamily: T.fontMono, whiteSpace: 'nowrap',
                    }}>{info.icone} {n}</span>
                  );
                })}
              </div>
            )}

            {/* Grade de metricas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 11, marginBottom: 12 }}>
              <div>
                <div style={{ color: T.inkMuted, fontSize: 10 }}>ATIVOS</div>
                <div style={{ fontFamily: T.fontMono, fontSize: 13, color: T.ink }}>{fmtN(l.ativos)}</div>
              </div>
              <div>
                <div style={{ color: T.inkMuted, fontSize: 10 }}>VENDIDOS</div>
                <div style={{ fontFamily: T.fontMono, fontSize: 13, color: T.positive }}>{fmtN(l.vendidos)}</div>
              </div>
              <div>
                <div style={{ color: T.inkMuted, fontSize: 10 }} title={l.giro_confiavel ? '' : 'Aguardando 14+ dias de coleta pra ser confiavel'}>GIRO MEDIO</div>
                <div style={{ fontFamily: T.fontMono, fontSize: 13, color: l.giro_confiavel ? T.ink : T.inkMuted }}>{l.giro_confiavel && l.idade_media_estoque != null ? `${Math.round(l.idade_media_estoque)}d` : '—'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11.5 }}>
              {l.url_perfil && (
                <a href={l.url_perfil} target="_blank" rel="noreferrer"
                  style={{ color: T.signal, display: 'inline-flex', gap: 4, alignItems: 'center', textDecoration: 'none' }}>
                  Ver estoque <ExternalLink size={11} />
                </a>
              )}
              {l.telefone && (
                <span style={{ color: T.inkMuted, fontFamily: T.fontMono, fontSize: 11 }}>· {l.telefone}</span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {mostrados < filtrados.length && (
        <div style={{ textAlign: 'center', fontSize: 12, color: T.inkMuted, marginTop: 16 }}>
          {fmtN(Math.min(mostrados, filtrados.length))} de {fmtN(filtrados.length)} — role para carregar mais
        </div>
      )}
      {mostrados >= filtrados.length && filtrados.length > 48 && (
        <div style={{ textAlign: 'center', fontSize: 12, color: T.inkMuted, marginTop: 16 }}>
          Fim da lista — {fmtN(filtrados.length)} revendas
        </div>
      )}

      {!data && !erro && <EmptyState icon={Building2} titulo="Carregando concorrentes..." texto="Buscando a lista de revendas monitoradas na API." />}
      {erro && <EmptyState icon={Building2} titulo="API indisponivel" texto={`Nao foi possivel buscar os lojistas em ${API_BASE_URL}. Confirme se a API esta publicada.`} />}
    </div>
  );
}

/* ============================================================
   AÇÕES — o insight vira tarefa rastreável
   ============================================================ */
function PageAcoes({ acoes, setAcoes }) {
  const [novo, setNovo] = useState('');
  const alternar = id => setAcoes(acoes.map(a => a.id === id ? { ...a, feita: !a.feita } : a));
  const adicionar = () => {
    if (!novo.trim()) return;
    setAcoes([{ id: Date.now(), texto: novo.trim(), feita: false, criadaEm: new Date().toISOString() }, ...acoes]);
    setNovo('');
  };
  const pendentes = acoes.filter(a => !a.feita);
  const feitas = acoes.filter(a => a.feita);

  return (
    <div>
      <div style={{ fontSize: 13, color: T.inkMuted, lineHeight: 1.6, maxWidth: 640, marginBottom: 20 }}>
        Dado de mercado diz <em>o que</em> fazer; esta lista registra <em>se foi feito</em>. Crie ações a partir das
        Oportunidades (botão "Criar ação") ou manualmente aqui — e marque quando executar.
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input value={novo} onChange={e => setNovo(e.target.value)} onKeyDown={e => e.key === 'Enter' && adicionar()}
          placeholder="Nova ação — ex: ligar pra revenda X sobre a carreta parada há 40 dias…" style={{ ...inputStyle, flex: 1 }} />
        <button onClick={adicionar} style={{ ...inputStyle, cursor: 'pointer', background: T.signal, color: '#14171C', fontWeight: 600, border: 'none', display: 'flex', gap: 6, alignItems: 'center' }}>
          <Plus size={14} /> Adicionar
        </button>
      </div>

      {pendentes.length === 0 && feitas.length === 0 && (
        <EmptyState icon={ListChecks} titulo="Nenhuma ação ainda"
          texto="Quando o radar apontar uma oportunidade, transforme-a em ação aqui — assim o insight não morre no dashboard." />
      )}

      {pendentes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {pendentes.map(a => (
            <Card key={a.id} onClick={() => alternar(a.id)} style={{ padding: '13px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
              <Circle size={17} style={{ color: T.inkMuted, flexShrink: 0 }} />
              <span style={{ fontSize: 14, flex: 1 }}>{a.texto}</span>
              <span style={{ fontFamily: T.fontMono, fontSize: 10.5, color: T.inkMuted }}>
                {new Date(a.criadaEm).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </span>
            </Card>
          ))}
        </div>
      )}

      {feitas.length > 0 && (
        <>
          <SectionTitle>Concluídas</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {feitas.map(a => (
              <Card key={a.id} onClick={() => alternar(a.id)} style={{ padding: '13px 16px', display: 'flex', gap: 12, alignItems: 'center', opacity: 0.55 }}>
                <CheckCircle2 size={17} style={{ color: T.positive, flexShrink: 0 }} />
                <span style={{ fontSize: 14, flex: 1, textDecoration: 'line-through' }}>{a.texto}</span>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================
   AJUSTES
   ============================================================ */
function PageAjustes() {
  const [papel, setPapel] = useState('Admin');
  const papeis = ['Admin', 'Gestor', 'Analista', 'Visualizador'];
  const permissoes = {
    Admin: ['Tudo: coleta, usuários, exportação, configuração'],
    Gestor: ['Vê tudo · cria ações · exporta relatórios'],
    Analista: ['Vê mercado e oportunidades · cria ações'],
    Visualizador: ['Somente leitura do painel Hoje'],
  };
  return (
    <div style={{ maxWidth: 640 }}>
      <SectionTitle sub="Estados e frequência da varredura">Coleta</SectionTitle>
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13.5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: T.inkMuted }}>Estados monitorados</span>
            <span style={{ fontFamily: T.fontMono }}>PR <span style={{ color: T.inkMuted }}>(SC e SP na fila)</span></span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: T.inkMuted }}>Frequência</span>
            <span style={{ fontFamily: T.fontMono }}>07h · 19h (2×/dia)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: T.inkMuted }}>Regra de venda</span>
            <span style={{ fontFamily: T.fontMono }}>2 varreduras sem o anúncio</span>
          </div>
        </div>
      </Card>

      <SectionTitle sub="O que cada papel pode ver e fazer">Papéis de acesso</SectionTitle>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {papeis.map(p => (
          <button key={p} onClick={() => setPapel(p)} style={{
            ...inputStyle, cursor: 'pointer', padding: '8px 14px',
            background: papel === p ? T.signal : T.surface2,
            color: papel === p ? '#14171C' : T.ink,
            fontWeight: papel === p ? 600 : 400, border: 'none',
          }}>{p}</button>
        ))}
      </div>
      <Card><div style={{ fontSize: 13.5, color: T.inkMuted }}>{permissoes[papel]}</div></Card>

      <SectionTitle sub="Estados em coleta (verde) vs. na fila (cinza) — hoje só PR é coletado">Cobertura nacional</SectionTitle>
      <Card style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={STATE_DATA.map(([uf, , qtd]) => ({ name: uf, qtd, coletando: uf === 'PR' }))} margin={{ left: -22, top: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: T.inkMuted, fontSize: 10, fontFamily: T.fontMono }} axisLine={{ stroke: T.line }} tickLine={false} />
            <YAxis tick={{ fill: T.inkMuted, fontSize: 10, fontFamily: T.fontMono }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: T.surface2, border: `1px solid ${T.line}`, borderRadius: 10, color: T.ink, fontSize: 12 }}
              formatter={(v, name, props) => [`${v} revendas${props.payload.coletando ? ' · em coleta' : ' · na fila'}`, 'Total']}
            />
            <Bar dataKey="qtd" radius={[3, 3, 0, 0]}
              shape={(props) => {
                const { x, y, width, height, payload } = props;
                return <rect x={x} y={y} width={width} height={height} rx={3} fill={payload.coletando ? T.positive : 'rgba(138,148,166,0.3)'} />;
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

/* ============================================================
   ANÁLISE — insights agregados + Analista IA
   ============================================================ */
function BarraH({ rotulo, valor, max, cor }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5 }}>
      <span style={{ width: 130, color: T.inkMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rotulo}</span>
      <div style={{ flex: 1, height: 8, background: T.surface2, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${Math.max(3, valor / max * 100)}%`, height: '100%', background: cor || T.signal, borderRadius: 4 }} />
      </div>
      <span style={{ fontFamily: T.fontMono, fontSize: 11.5, width: 46, textAlign: 'right' }}>{fmtN(valor)}</span>
    </div>
  );
}

function PageAnalise() {
  const { data: ins, erro } = useApi('insights.php');
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [pensando, setPensando] = useState(false);
  const [chatErro, setChatErro] = useState(null);

  const enviar = async () => {
    const texto = input.trim();
    if (!texto || pensando) return;
    const novas = [...msgs, { role: 'user', content: texto }];
    setMsgs(novas); setInput(''); setPensando(true); setChatErro(null);
    try {
      const r = await fetch(`${API_BASE_URL}/analista.php`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: novas }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.mensagem || d.erro || 'falha');
      setMsgs([...novas, { role: 'assistant', content: d.resposta }]);
    } catch (e) {
      setChatErro(String(e.message || e));
    } finally {
      setPensando(false);
    }
  };

  const sugestoes = [
    'Monte um plano de ação de vendas para esta semana com base no giro dos concorrentes',
    'Quais anúncios parados valem uma proposta agressiva de compra?',
    'Onde está a maior oferta e o que isso diz sobre preço na região?',
  ];

  return (
    <div>
      {!ins && !erro && <EmptyState icon={Gauge} titulo="Calculando insights…" texto="Agregando os dados reais da coleta." />}
      {erro && <EmptyState icon={Gauge} titulo="API indisponível" texto={`Não foi possível buscar ${API_BASE_URL}/insights.php — confirme se o arquivo foi publicado.`} />}

      {ins && ins.descobertas && ins.descobertas.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <SectionTitle sub="Insights cruzados calculados a partir dos dados reais desta semana">Descobertas do dia</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
            {ins.descobertas.map((d, i) => {
              const cores = { conversao: T.positive, concentracao: T.signal, movimento: T.alert, faixa: STEEL };
              const c = cores[d.tipo] || T.signal;
              return (
                <Card key={i} style={{ padding: 16, borderLeft: `2px solid ${c}` }}>
                  <div style={{ fontFamily: T.fontMono, fontSize: 10, color: c, letterSpacing: '0.06em', marginBottom: 5 }}>{d.titulo.toUpperCase()}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.55, color: T.ink }}>{d.texto}</div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {ins && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
          <Card>
            <SectionTitle sub="Onde a oferta se concentra">Marcas com mais anúncios</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ins.por_marca.slice(0, 8).map(m => (
                <BarraH key={m.marca} rotulo={m.marca} valor={m.anuncios} max={ins.por_marca[0]?.anuncios || 1} />
              ))}
            </div>
          </Card>
          <Card>
            <SectionTitle sub="Concentração geográfica da oferta ativa">Cidades com mais estoque</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ins.por_cidade.slice(0, 8).map(c => (
                <BarraH key={c.cidade} rotulo={c.cidade} valor={c.anuncios} max={ins.por_cidade[0]?.anuncios || 1} cor={T.positive} />
              ))}
            </div>
          </Card>
          <Card>
            <SectionTitle sub="Vendas confirmadas · estoque · idade média — o que ninguém mais enxerga">Giro dos concorrentes</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ins.giro_por_revenda.slice(0, 8).map(g => (
                <div key={g.revenda} style={{ fontSize: 12.5, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.revenda}</span>
                  <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.inkMuted, whiteSpace: 'nowrap' }}>
                    <span style={{ color: T.positive }}>{g.vendas_confirmadas}v</span> · {g.estoque_ativo}a · {g.idade_media_dias ?? '—'}d
                  </span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <SectionTitle sub="Distribuição do estoque ativo por preço">Faixas de preço</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ins.faixas_preco.map(f => (
                <BarraH key={f.faixa} rotulo={f.faixa} valor={f.anuncios} max={Math.max(...ins.faixas_preco.map(x => x.anuncios))} cor={T.alert} />
              ))}
            </div>
          </Card>
        </div>
      )}

      <SectionTitle sub="Converse com os dados: peça planos de ação, priorização e leitura de concorrência">Analista IA</SectionTitle>
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ maxHeight: 380, overflowY: 'auto', padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {msgs.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 13, color: T.inkMuted }}>Sugestões para começar:</div>
              {sugestoes.map((s, i) => (
                <button key={i} onClick={() => setInput(s)} style={{
                  ...inputStyle, cursor: 'pointer', textAlign: 'left', fontSize: 12.5, color: T.inkMuted,
                }}>{s}</button>
              ))}
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%',
              background: m.role === 'user' ? 'rgba(245,166,35,0.12)' : T.surface2,
              border: `1px solid ${m.role === 'user' ? 'rgba(245,166,35,0.25)' : T.line}`,
              borderRadius: 12, padding: '10px 14px', fontSize: 13.5, lineHeight: 1.6, whiteSpace: 'pre-wrap',
            }}>{m.content}</div>
          ))}
          {pensando && <div style={{ fontFamily: T.fontMono, fontSize: 11, color: T.inkMuted }}>ANALISANDO OS DADOS…</div>}
          {chatErro && (
            <div style={{ fontSize: 12.5, color: T.alert }}>
              {chatErro.includes('chave') || chatErro.includes('configurada')
                ? 'O Analista precisa de uma chave da API Anthropic configurada no config.php do servidor (console.anthropic.com > API Keys).'
                : `Erro: ${chatErro}`}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, padding: 14, borderTop: `1px solid ${T.line}` }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && enviar()}
            placeholder="Pergunte ao analista — ex: onde devo focar as vendas esta semana?" style={{ ...inputStyle, flex: 1 }} />
          <button onClick={enviar} disabled={pensando} style={{
            ...inputStyle, cursor: 'pointer', background: T.signal, color: '#14171C',
            fontWeight: 600, border: 'none', opacity: pensando ? 0.6 : 1,
          }}>Enviar</button>
        </div>
      </Card>
    </div>
  );
}

/* ============================================================
   shell — navegação
   ============================================================ */
const NAV = [
  { id: 'hoje', rotulo: 'Hoje', icone: Radar },
  { id: 'mercado', rotulo: 'Mercado', icone: LayoutGrid },
  { id: 'oportunidades', rotulo: 'Oportunidades', icone: Crosshair },
  { id: 'concorrentes', rotulo: 'Concorrentes', icone: Building2 },
  { id: 'analise', rotulo: 'Análise', icone: Gauge },
  { id: 'acoes', rotulo: 'Ações', icone: ListChecks },
  { id: 'ajustes', rotulo: 'Ajustes', icone: Settings },
];

export default function App() {
  const [pagina, setPagina] = useState('hoje');
  const [menuAberto, setMenuAberto] = useState(false);
  const [acoes, setAcoes] = useState([]);
  const [mobile, setMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 760);

  const { data: kpis } = useApi('kpis.php');
  const { data: anunciosData } = useApi('anuncios.php?limit=200');
  const anuncios = useMemo(() => (anunciosData?.anuncios || []).map(mapeiaAnuncioReal), [anunciosData]);
  const usandoReais = anuncios.length > 0;

  useEffect(() => {
    const f = () => setMobile(window.innerWidth <= 760);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);

  const criarAcao = texto => {
    setAcoes(prev => [{ id: Date.now(), texto, feita: false, criadaEm: new Date().toISOString() }, ...prev]);
    setPagina('acoes');
  };

  const paginas = {
    hoje: <PageHoje kpis={kpis} anuncios={anuncios} usandoReais={usandoReais} />,
    mercado: <PageMercado />,
    oportunidades: <PageOportunidades onCriarAcao={criarAcao} />,
    concorrentes: <PageConcorrentes />,
    analise: <PageAnalise />,
    acoes: <PageAcoes acoes={acoes} setAcoes={setAcoes} />,
    ajustes: <PageAjustes />,
  };

  const tituloPagina = NAV.find(n => n.id === pagina)?.rotulo || '';

  return (
    <div style={{ display: 'flex', height: '100%', background: T.bg, color: T.ink, fontFamily: T.fontBody, overflow: 'hidden' }}>
      {/* sidebar desktop */}
      {!mobile && (
        <aside style={{ width: 220, borderRight: `1px solid ${T.line}`, display: 'flex', flexDirection: 'column', padding: '22px 14px', flexShrink: 0 }}>
          <div style={{ fontFamily: T.fontDisplay, fontWeight: 700, fontSize: 17, letterSpacing: '0.02em', padding: '0 10px', marginBottom: 6 }}>
            OPER<span style={{ color: T.signal }}> RADAR</span>
          </div>
          <div style={{ padding: '10px 10px 18px', borderBottom: `1px solid ${T.line}`, marginBottom: 14 }}>
            <RadarPulse ultimaColeta={kpis?.ultima_coleta} />
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV.map(item => {
              const ativo = pagina === item.id;
              return (
                <button key={item.id} onClick={() => setPagina(item.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 11, padding: '10px 10px',
                  background: ativo ? 'rgba(245,166,35,0.10)' : 'transparent',
                  border: 'none', borderRadius: 9, cursor: 'pointer',
                  color: ativo ? T.signal : T.inkMuted, fontSize: 13.5, fontWeight: ativo ? 600 : 450,
                  fontFamily: T.fontBody, transition: 'color 140ms, background 140ms', textAlign: 'left',
                }}>
                  <item.icone size={16} /> {item.rotulo}
                </button>
              );
            })}
          </nav>
          <div style={{ marginTop: 'auto', fontFamily: T.fontMono, fontSize: 10, color: T.inkMuted, padding: '0 10px', lineHeight: 1.6 }}>
            AGÊNCIA OPER<br />inteligência de mercado<br />transporte pesado
          </div>
        </aside>
      )}

      {/* área principal */}
      <main style={{ flex: 1, overflowY: 'auto', padding: mobile ? '18px 16px 90px' : '26px 32px 40px' }}>
        {mobile && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontFamily: T.fontDisplay, fontWeight: 700, fontSize: 16 }}>
              OPER<span style={{ color: T.signal }}> RADAR</span>
            </div>
            <RadarPulse ultimaColeta={kpis?.ultima_coleta} />
          </div>
        )}
        <h1 style={{ fontFamily: T.fontDisplay, fontSize: mobile ? 22 : 26, fontWeight: 700, margin: '0 0 4px' }}>{tituloPagina}</h1>
        <div style={{ height: 2, width: 34, background: T.signal, borderRadius: 1, marginBottom: 22 }} />
        {paginas[pagina]}
      </main>

      {/* bottom nav mobile */}
      {mobile && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex',
          background: 'rgba(11,14,19,0.94)', backdropFilter: 'blur(14px)',
          borderTop: `1px solid ${T.line}`, padding: '8px 4px calc(8px + env(safe-area-inset-bottom))',
        }}>
          {NAV.map(item => {
            const ativo = pagina === item.id;
            return (
              <button key={item.id} onClick={() => setPagina(item.id)} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                background: 'none', border: 'none', cursor: 'pointer',
                color: ativo ? T.signal : T.inkMuted, fontSize: 9.5, fontFamily: T.fontBody,
              }}>
                <item.icone size={18} /> {item.rotulo}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
