import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Radar, LayoutGrid, Crosshair, Building2, Settings, ListChecks,
  MapPin, Truck, Clock, ExternalLink, Search, ChevronRight, Menu, X,
  TrendingDown, ArrowDownRight, ArrowUpRight, Plus, CheckCircle2, Circle,
  Timer, Flame, PackageOpen, Zap
} from 'lucide-react';

/* ============================================================
   OPER RADAR — design system "instrumento de precisão"
   (ver docs/OPER_RADAR_Estrategia_e_Design.md)
   ============================================================ */
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

function mapeiaAnuncioReal(a) {
  const dias = Math.max(0, Math.round((Date.now() - new Date(a.primeira_vez_visto)) / 86400000));
  return {
    id: a.anuncio_portal_id,
    url: a.url,
    tipo: a.tipo || '—',
    marca: a.marca || '',
    titulo: a.titulo,
    ano: a.ano_inicial ? `${a.ano_inicial}/${a.ano_final}` : '',
    preco: a.preco,
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
   HOJE — feed de sinais + estado do radar
   ============================================================ */
function PageHoje({ kpis, anuncios, usandoReais }) {
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
    return lista.sort((x, y) => new Date(y.quando) - new Date(x.quando)).slice(0, 30);
  }, [anuncios]);

  const config = {
    novo:  { icone: Zap,          cor: T.signal,   rotulo: 'ENTROU NO MERCADO' },
    sumiu: { icone: Timer,        cor: T.alert,    rotulo: 'SUMIU — VENDA PROVÁVEL' },
    venda: { icone: CheckCircle2, cor: T.positive, rotulo: 'VENDA CONFIRMADA' },
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <Kpi label="Revendas no radar" value={kpis ? fmtN(kpis.revendas_monitoradas) : '—'} sub={usandoReais ? 'Paraná · coleta 2x/dia' : 'conectando…'} />
        <Kpi label="Anúncios ativos" value={kpis ? fmtN(kpis.anuncios_ativos) : '—'} sub="no mercado agora" />
        <Kpi label="Vendas estimadas" value={kpis ? fmtN(kpis.vendas_estimadas_mes) : '—'} sub="este mês · confirmadas 2×" tone={T.positive} />
        <Kpi label="Sinais nas últimas 48h" value={fmtN(sinais.length)} sub="novos + removidos" tone={T.signal} />
      </div>

      <SectionTitle sub="Tudo que mudou no mercado desde a última varredura — mais recente primeiro">O que o radar captou</SectionTitle>

      {sinais.length === 0 ? (
        <EmptyState icon={Radar} titulo="Coletando os primeiros sinais"
          texto="O radar precisa de pelo menos dois ciclos de coleta (manhã e noite) para começar a detectar movimento — anúncios novos, removidos e vendas prováveis aparecem aqui." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sinais.map((s, i) => {
            const C = config[s.tipo];
            return (
              <Card key={i} style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <C.icone size={17} style={{ color: C.cor, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 3 }}>
                    <Tag tone={s.tipo === 'venda' ? 'positivo' : s.tipo === 'sumiu' ? 'alerta' : 'sinal'}>{C.rotulo}</Tag>
                    <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.inkMuted }}>
                      {new Date(s.quando).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.a.titulo}
                  </div>
                  <div style={{ fontSize: 12, color: T.inkMuted }}>{s.a.revenda} · {s.a.cidade}/{s.a.uf} · {fmtBRL(s.a.preco)}</div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MERCADO — estoque regional completo
   ============================================================ */
function PageMercado({ anuncios, usandoReais }) {
  const [q, setQ] = useState('');
  const [tipo, setTipo] = useState('todos');
  const [status, setStatus] = useState('todos');

  const tipos = useMemo(() => ['todos', ...new Set(anuncios.map(a => a.tipo).filter(t => t && t !== '—'))], [anuncios]);
  const filtrados = anuncios.filter(a => {
    if (tipo !== 'todos' && a.tipo !== tipo) return false;
    if (status !== 'todos' && a.status !== status) return false;
    if (q && !(`${a.marca} ${a.titulo} ${a.cidade} ${a.revenda}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', top: 12, left: 12, color: T.inkMuted }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar modelo, marca, cidade ou revenda…"
            style={{ ...inputStyle, width: '100%', paddingLeft: 34 }} />
        </div>
        <select value={tipo} onChange={e => setTipo(e.target.value)} style={inputStyle}>
          {tipos.map(t => <option key={t} value={t}>{t === 'todos' ? 'Todos os tipos' : t}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
          <option value="todos">Todos os status</option>
          <option value="ativo">No mercado</option>
          <option value="venda_provavel">Venda provável</option>
          <option value="removido">Vendido</option>
        </select>
      </div>
      <div style={{ fontFamily: T.fontMono, fontSize: 11, color: T.inkMuted, margin: '10px 2px 14px' }}>
        {fmtN(filtrados.length)} ANÚNCIOS {usandoReais ? '· DADOS REAIS DA COLETA' : '· CONECTANDO À API…'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 12 }}>
        {filtrados.slice(0, 60).map(a => (
          <Card key={a.id} style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
              <Tag tone={a.status === 'removido' ? 'positivo' : a.status === 'venda_provavel' ? 'alerta' : 'neutro'}>
                {a.status === 'removido' ? 'VENDIDO' : a.status === 'venda_provavel' ? 'VENDA PROVÁVEL' : `NO AR HÁ ${a.dias}D`}
              </Tag>
              <span style={{ fontFamily: T.fontMono, fontSize: 10.5, color: T.inkMuted }}>#{a.id}</span>
            </div>
            <div style={{ fontFamily: T.fontDisplay, fontSize: 15, fontWeight: 600, lineHeight: 1.35, marginBottom: 4 }}>
              {a.titulo}
            </div>
            <div style={{ fontSize: 12, color: T.inkMuted, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
              <MapPin size={11} /> {a.revenda} · {a.cidade}/{a.uf}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontFamily: T.fontMono, fontSize: 17, fontWeight: 600, color: a.preco ? T.ink : T.inkMuted }}>
                  {fmtBRL(a.preco)}
                </div>
                <div style={{ fontSize: 11, color: T.inkMuted, marginTop: 2 }}>vs FIPE: aguardando Fase 2</div>
              </div>
              {a.url && (
                <a href={a.url} target="_blank" rel="noreferrer" style={{ color: T.signal, display: 'flex' }} title="Abrir anúncio no portal">
                  <ExternalLink size={15} />
                </a>
              )}
            </div>
          </Card>
        ))}
      </div>
      {filtrados.length > 60 && (
        <div style={{ textAlign: 'center', fontSize: 12, color: T.inkMuted, marginTop: 16 }}>
          Mostrando 60 de {fmtN(filtrados.length)} — refine a busca para ver mais específicos
        </div>
      )}
    </div>
  );
}

/* ============================================================
   OPORTUNIDADES — onde há dinheiro na mesa
   ============================================================ */
function PageOportunidades({ anuncios, onCriarAcao }) {
  const maduros = anuncios
    .filter(a => a.status === 'ativo' && a.dias >= 30)
    .sort((x, y) => y.dias - x.dias)
    .slice(0, 12);

  return (
    <div>
      <SectionTitle sub="Anúncio parado há 30+ dias: o vendedor tende a aceitar negociação — oportunidade de compra abaixo do anunciado">
        Anúncios maduros no mercado
      </SectionTitle>
      {maduros.length === 0 ? (
        <EmptyState icon={Timer} titulo="Construindo o histórico de idade dos anúncios"
          texto="O radar registra quando cada anúncio apareceu pela primeira vez. Conforme as coletas diárias se acumulam, os anúncios parados há 30+ dias aparecem aqui como oportunidades de negociação." />
      ) : (
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

      <SectionTitle sub="Anúncios abaixo da tabela FIPE — exige o mapeamento marca/modelo da Fase 2">
        Preço abaixo da FIPE
      </SectionTitle>
      <EmptyState icon={TrendingDown} titulo="Aguardando Fase 2 — mapeamento FIPE"
        texto="Quando o catálogo de marcas e modelos estiver cruzado com a tabela FIPE, esta seção mostra automaticamente cada anúncio abaixo da referência — os candidatos mais óbvios a arbitragem." />

      <SectionTitle sub="Reduções de preço detectadas entre uma varredura e outra">
        Quedas de preço
      </SectionTitle>
      <EmptyState icon={ArrowDownRight} titulo="Coletando histórico de preços"
        texto="A cada varredura o radar registra o preço de cada anúncio. Assim que houver histórico suficiente (alguns dias de coleta), toda queda de preço aparece aqui em ordem de relevância." />
    </div>
  );
}

/* ============================================================
   CONCORRENTES — quem são os players e quem gira
   ============================================================ */
function PageConcorrentes() {
  const { data, erro } = useApi('lojistas.php?uf=PR');
  const [q, setQ] = useState('');
  const lojistas = (data?.lojistas || []).filter(l => !q || l.nome.toLowerCase().includes(q.toLowerCase()));
  const ordenados = [...lojistas].sort((a, b) => b.anuncios_ativos - a.anuncios_ativos);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', top: 12, left: 12, color: T.inkMuted }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar revenda…" style={{ ...inputStyle, width: '100%', paddingLeft: 34 }} />
        </div>
        <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.inkMuted }}>
          {data ? `${fmtN(ordenados.length)} REVENDAS · PR` : erro ? 'API INDISPONÍVEL' : 'CARREGANDO…'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {ordenados.slice(0, 48).map((l, i) => (
          <Card key={l.id} style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: T.fontMono, fontSize: 11, color: i < 3 ? T.signal : T.inkMuted }}>#{String(i + 1).padStart(2, '0')}</span>
              <Tag tone={l.anuncios_ativos > 30 ? 'sinal' : 'neutro'}>{fmtN(l.anuncios_ativos)} ATIVOS</Tag>
            </div>
            <div style={{ fontFamily: T.fontDisplay, fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{l.nome}</div>
            <div style={{ fontSize: 12, color: T.inkMuted, display: 'flex', alignItems: 'center', gap: 5 }}>
              <MapPin size={11} /> {l.cidade}/{l.uf}
            </div>
            {l.url_perfil && (
              <a href={l.url_perfil} target="_blank" rel="noreferrer"
                style={{ fontSize: 12, color: T.signal, display: 'inline-flex', gap: 5, alignItems: 'center', marginTop: 10, textDecoration: 'none' }}>
                Ver estoque no portal <ExternalLink size={11} />
              </a>
            )}
          </Card>
        ))}
      </div>
      {!data && !erro && <EmptyState icon={Building2} titulo="Carregando concorrentes…" texto="Buscando a lista de revendas monitoradas na API." />}
      {erro && <EmptyState icon={Building2} titulo="API indisponível" texto={`Não foi possível buscar os lojistas em ${API_BASE_URL}. Confirme se a API está publicada.`} />}
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

      <SectionTitle sub="Presença por estado no portal monitorado">Cobertura nacional</SectionTitle>
      <Card style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={STATE_DATA.map(([uf, , qtd]) => ({ name: uf, qtd }))} margin={{ left: -22, top: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: T.inkMuted, fontSize: 10, fontFamily: T.fontMono }} axisLine={{ stroke: T.line }} tickLine={false} />
            <YAxis tick={{ fill: T.inkMuted, fontSize: 10, fontFamily: T.fontMono }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: T.surface2, border: `1px solid ${T.line}`, borderRadius: 10, color: T.ink, fontSize: 12 }} />
            <Bar dataKey="qtd" fill={T.signal} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
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
    mercado: <PageMercado anuncios={anuncios} usandoReais={usandoReais} />,
    oportunidades: <PageOportunidades anuncios={anuncios} onCriarAcao={criarAcao} />,
    concorrentes: <PageConcorrentes />,
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
