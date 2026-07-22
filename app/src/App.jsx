import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Radar, LayoutGrid, Crosshair, Building2, Settings, ListChecks,
  MapPin, ExternalLink, Search,
  TrendingDown, ArrowDownRight, ArrowUpRight, Plus, CheckCircle2, Circle,
  Timer, Flame, PackageOpen, Zap, Gauge, MoreHorizontal, RotateCcw,
  ShieldCheck, Store, Trash2, LogOut, UserRound, LockKeyhole,
  Monitor, Moon, Sun, Palette, Save, X, ScanLine, BadgeInfo,
  ChevronUp, ChevronDown, Smartphone, Eye, EyeOff, UploadCloud, FileText,
  Pencil, History, Undo2, Ruler, Check
} from 'lucide-react';
import {
  T, THEMES, COMING_THEMES, DEFAULT_UI_PREFERENCES,
  loadUiPreferences, saveUiPreferences, resolveTheme,
  activateTheme, applyUiPreferences,
} from './theme.js';
import {
  DASHBOARD_KPIS, DASHBOARD_SECTIONS, DASHBOARD_PRESETS,
  DEFAULT_DASHBOARD_LAYOUT, layoutFromPreset, moveDashboardItem,
  normalizeDashboardLayout,
} from './dashboardLayout.js';

/* ============================================================
   OPER RADAR — design system "instrumento de precisão"
   (ver docs/OPER_RADAR_Estrategia_e_Design.md)
   ============================================================ */
const API_BASE_URL = 'https://agenciaoper.com.br/oper-radar-api';

/* ---------- dados de referência ---------- */
const REGIOES_UFS = {
  Sul: ['PR', 'SC', 'RS'],
  Sudeste: ['SP', 'RJ', 'MG', 'ES'],
  'Centro-Oeste': ['MT', 'MS', 'GO', 'DF'],
  Nordeste: ['BA', 'PE', 'CE', 'MA', 'PB', 'RN', 'AL', 'PI', 'SE'],
  Norte: ['AM', 'PA', 'RO', 'RR', 'AC', 'AP', 'TO'],
};
const NOMES_UF = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará',
  DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná',
  PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo',
  SE: 'Sergipe', TO: 'Tocantins',
};

const STATUS_DB_PARA_UI = {
  ativo: 'ativo',
  removido_candidato: 'em_verificacao',
  removido_confirmado: 'saida_detectada',
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
const ROTULOS_CATEGORIA_FILTRO = {
  caminhoes: 'Caminhões', implementos: 'Implementos', onibus_vans: 'Ônibus e vans',
  leves: 'Leves', agricolas: 'Agrícolas', construcao: 'Construção', pecas: 'Peças', outros: 'Outros',
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
    dbId: a.anuncio_id,
    id: a.anuncio_portal_id,
    url: a.url,
    tipo: a.tipo || '—',
    categoria: categoriaDe(a.tipo),
    marca: a.marca || '',
    modelo: a.modelo || '',
    cor: a.cor || '',
    titulo: a.titulo,
    ano: a.ano_inicial ? `${a.ano_inicial}/${a.ano_final}` : '',
    preco: a.preco,
    precoFipe: a.preco_fipe ?? null,
    codigoFipe: a.codigo_fipe ?? null,
    desvioFipePct: a.desvio_fipe_pct ?? null,
    fipeStatus: a.fipe_match_status ?? null,
    fipeConfianca: a.fipe_match_confianca ?? null,
    fipeMotivo: a.fipe_match_motivo ?? null,
    fipeOrigem: a.fipe_vinculo_origem || 'automatico',
    marcaFipe: a.marca_fipe || '',
    modeloFipe: a.modelo_fipe || '',
    anoFipe: a.ano_fipe || '',
    referenciaFipe: a.referencia_fipe || '',
    quilometragem: a.quilometragem || null,
    quilometragemOrigem: a.quilometragem_origem || null,
    precoMercado: a.preco_medio_mercado ?? null,
    menorMercado: a.menor_preco_mercado ?? null,
    maiorMercado: a.maior_preco_mercado ?? null,
    desvioMercadoPct: a.desvio_mercado_pct ?? null,
    mercadoTotal: Number(a.anuncios_comparaveis || 0),
    revendaId: a.revenda_id ?? null,
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
    const controller = new AbortController();
    setErro(false);
    fetch(`${API_BASE_URL}/${path}`, { signal: controller.signal, credentials: 'same-origin' })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setData)
      .catch(e => { if (e.name !== 'AbortError') setErro(true); });
    return () => controller.abort();
  }, [path]);
  return { data, erro };
}

async function apiPost(path, dados, csrf) {
  const resposta = await fetch(`${API_BASE_URL}/${path}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
    },
    body: JSON.stringify(dados),
  });
  const payload = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const erro = new Error(payload.erro || 'Não foi possível concluir a operação.');
    erro.codigo = payload.codigo;
    throw erro;
  }
  return payload;
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
  const usaPaddingPadrao = style?.padding == null;
  return (
    <div className={usaPaddingPadrao ? 'or-card or-card-density' : 'or-card'} onClick={onClick}
      role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e); } }) : undefined}
      style={{
      background: T.surface, border: `1px solid ${T.line}`, borderRadius: 14,
      padding: 20, transition: 'border-color 160ms ease',
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.borderColor = `${T.signal}59`; }}
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

function textoStatusFipe(anuncio) {
  if (anuncio.precoFipe) return '';
  const status = anuncio.fipeStatus;
  if (status === 'ambiguo') return 'Versão FIPE precisa de validação';
  if (status === 'sem_match') return 'Sem referência FIPE segura';
  if (status === 'sem_ano') return 'Ano não disponível na referência';
  if (status === 'erro_api') return 'Comparativo aguardando nova tentativa';
  return anuncio.categoria === 'caminhoes' ? 'Comparativo em processamento' : 'FIPE não aplicável a esta categoria';
}

function ComparativoAnuncio({ anuncio, compacto = false }) {
  const temFipe = Number(anuncio.precoFipe || 0) > 0;
  const temMercado = Number(anuncio.precoMercado || 0) > 0 && anuncio.mercadoTotal > 0;
  const desvioFipe = anuncio.desvioFipePct == null ? null : Number(anuncio.desvioFipePct);
  const desvioMercado = anuncio.desvioMercadoPct == null ? null : Number(anuncio.desvioMercadoPct);
  const tom = valor => valor == null ? T.inkMuted : valor < 0 ? T.positive : valor >= 20 ? T.alert : T.signal;
  const diferenca = valor => valor == null ? '—' : `${valor > 0 ? '+' : ''}${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

  if (!temFipe) {
    return <div style={{ marginTop: compacto ? 7 : 11, padding: compacto ? '7px 9px' : '9px 10px', borderRadius: 8, background: T.surface2, border: `1px solid ${T.line}`, color: T.inkMuted, fontSize: 10.5, display: 'flex', alignItems: 'center', gap: 6 }}>
      <BadgeInfo size={12} style={{ flexShrink: 0 }} /> {textoStatusFipe(anuncio)}
    </div>;
  }

  return <div style={{ marginTop: compacto ? 7 : 11, padding: compacto ? 8 : 10, borderRadius: 9, background: `${T.steel}0F`, border: `1px solid ${T.line}` }}>
    <div style={{ display: 'grid', gridTemplateColumns: temMercado ? 'repeat(2, minmax(0, 1fr))' : '1fr', gap: 8 }}>
      <div>
        <div style={{ color: T.inkMuted, fontSize: 9.5, letterSpacing: '0.05em', fontFamily: T.fontMono }}>TABELA FIPE{anuncio.fipeOrigem === 'manual' ? ' · VALIDADA' : ''}</div>
        <div style={{ color: T.ink, fontFamily: T.fontMono, fontSize: compacto ? 11 : 12, marginTop: 3 }}>{fmtBRL(anuncio.precoFipe)}</div>
        <div style={{ color: tom(desvioFipe), fontSize: 10.5, marginTop: 2 }}>{diferenca(desvioFipe)} vs anúncio</div>
      </div>
      {temMercado && <div style={{ borderLeft: `1px solid ${T.line}`, paddingLeft: 8 }}>
        <div style={{ color: T.inkMuted, fontSize: 9.5, letterSpacing: '0.05em', fontFamily: T.fontMono }}>MERCADO EQUIVALENTE</div>
        <div style={{ color: T.ink, fontFamily: T.fontMono, fontSize: compacto ? 11 : 12, marginTop: 3 }}>{fmtBRL(anuncio.precoMercado)}</div>
        <div style={{ color: tom(desvioMercado), fontSize: 10.5, marginTop: 2 }}>{diferenca(desvioMercado)} · {fmtN(anuncio.mercadoTotal)} ofertas</div>
      </div>}
    </div>
  </div>;
}

function PainelAnuncio({ anuncio, sessao, onClose, onAtualizado }) {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  const [buscaFipe, setBuscaFipe] = useState('');
  const [resultadosFipe, setResultadosFipe] = useState([]);
  const [buscandoFipe, setBuscandoFipe] = useState(false);
  const [fipeSelecionada, setFipeSelecionada] = useState(null);
  const [quilometragem, setQuilometragem] = useState('');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const podeEditar = ['admin', 'gestor'].includes(String(sessao?.usuario?.papel || '').toLowerCase());

  const carregar = async () => {
    setErro('');
    try {
      const resposta = await fetch(`${API_BASE_URL}/anuncio_detalhe.php?id=${anuncio.dbId}`, { credentials: 'same-origin' });
      const payload = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(payload.erro || 'Não foi possível carregar o anúncio.');
      setDados(payload);
      setQuilometragem(payload.anuncio.quilometragem_manual ?? '');
      setObservacao(payload.anuncio.curadoria_observacao || '');
      setFipeSelecionada(null);
    } catch (e) { setErro(e.message); }
  };

  useEffect(() => { carregar(); }, [anuncio.dbId]);
  useEffect(() => {
    const fechar = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fechar);
    return () => window.removeEventListener('keydown', fechar);
  }, [onClose]);

  useEffect(() => {
    const termo = buscaFipe.trim();
    if (termo.length < 2) { setResultadosFipe([]); return undefined; }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setBuscandoFipe(true);
      fetch(`${API_BASE_URL}/fipe_consulta.php?modo=buscar&q=${encodeURIComponent(termo)}&ordem=mercado&limit=8`, {
        signal: controller.signal, credentials: 'same-origin',
      })
        .then(r => r.ok ? r.json() : Promise.reject(new Error()))
        .then(d => setResultadosFipe(d.itens || []))
        .catch(e => { if (e.name !== 'AbortError') setResultadosFipe([]); })
        .finally(() => setBuscandoFipe(false));
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [buscaFipe]);

  const salvar = async () => {
    const atual = dados?.anuncio;
    if (!atual || !podeEditar) return;
    setSalvando(true); setErro(''); setMensagem('');
    try {
      const alterarFipe = Boolean(fipeSelecionada && Number(fipeSelecionada.id) !== Number(atual.fipe_preco_id));
      const atualKm = atual.quilometragem_manual == null ? '' : String(atual.quilometragem_manual);
      const alterarKm = String(quilometragem) !== atualKm;
      const payload = await apiPost('anuncio_detalhe.php', {
        acao: 'salvar_curadoria', id: atual.id,
        alterar_fipe: alterarFipe,
        fipe_preco_id: alterarFipe ? fipeSelecionada.id : null,
        alterar_quilometragem: alterarKm,
        quilometragem_manual: quilometragem,
        observacao,
      }, sessao.csrf);
      setDados(payload); setFipeSelecionada(null);
      setQuilometragem(payload.anuncio.quilometragem_manual ?? '');
      setMensagem('Curadoria salva. Os comparativos foram recalculados.');
      onAtualizado?.();
    } catch (e) { setErro(e.message); }
    finally { setSalvando(false); }
  };

  const restaurarAutomatico = async () => {
    if (!dados?.anuncio || !podeEditar) return;
    setSalvando(true); setErro(''); setMensagem('');
    try {
      const payload = await apiPost('anuncio_detalhe.php', {
        acao: 'restaurar_fipe_automatico', id: dados.anuncio.id,
      }, sessao.csrf);
      setDados(payload); setFipeSelecionada(null);
      setMensagem('Vínculo automático restaurado.');
      onAtualizado?.();
    } catch (e) { setErro(e.message); }
    finally { setSalvando(false); }
  };

  const a = dados?.anuncio;
  const diferenca = (valor, base) => valor && base ? ((valor - base) / base) * 100 : null;
  const desvioFipe = a ? diferenca(Number(a.preco), Number(a.preco_fipe)) : null;
  const desvioMercado = a ? diferenca(Number(a.preco), Number(a.preco_medio_mercado)) : null;
  const pct = valor => valor == null || !Number.isFinite(valor) ? '—' : `${valor > 0 ? '+' : ''}${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

  return <div onClick={onClose} role="presentation" style={{
    position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(2, 6, 12, .68)',
    backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'flex-end',
  }}>
    <aside onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Detalhes de ${anuncio.titulo}`} style={{
      width: 'min(620px, 100vw)', height: '100%', overflowY: 'auto', background: T.bg,
      borderLeft: `1px solid ${T.line}`, boxShadow: '-20px 0 60px rgba(0,0,0,.35)', color: T.ink,
    }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 2, background: `${T.bg}F2`, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${T.line}`, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: T.fontMono, fontSize: 10, color: T.signal, marginBottom: 4 }}>LEITURA DO ANÚNCIO · #{anuncio.id}</div>
          <strong style={{ fontFamily: T.fontDisplay, fontSize: 18, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{anuncio.titulo}</strong>
        </div>
        <button onClick={onClose} aria-label="Fechar painel" style={{ ...inputStyle, padding: 8, cursor: 'pointer', flexShrink: 0 }}><X size={18} /></button>
      </div>

      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {!dados && !erro && <Card style={{ textAlign: 'center', color: T.inkMuted }}>Carregando leitura completa…</Card>}
        {erro && <div role="alert" style={{ padding: 12, borderRadius: 9, color: T.alert, background: `${T.alert}15`, border: `1px solid ${T.alert}40` }}>{erro}</div>}
        {mensagem && <div role="status" style={{ padding: 12, borderRadius: 9, color: T.positive, background: `${T.positive}15`, border: `1px solid ${T.positive}40` }}><Check size={15} style={{ verticalAlign: -3, marginRight: 6 }} />{mensagem}</div>}

        {a && <>
          <Card style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <Tag tone={a.status === 'ativo' ? 'positivo' : 'alerta'}>{String(a.status).toUpperCase()}</Tag>
                <div style={{ fontFamily: T.fontDisplay, fontSize: 19, fontWeight: 650, marginTop: 10 }}>{a.titulo}</div>
                <div style={{ color: T.inkMuted, fontSize: 12, marginTop: 5 }}><MapPin size={12} style={{ verticalAlign: -2 }} /> {a.revenda} · {a.cidade}/{a.uf}</div>
              </div>
              {a.url && <a href={a.url} target="_blank" rel="noreferrer" style={{ ...inputStyle, color: T.signal, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}><ExternalLink size={14} /> Ver original</a>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))', gap: 8, marginTop: 14 }}>
              {[
                ['Ano', a.ano_inicial ? `${a.ano_inicial}/${a.ano_final || a.ano_inicial}` : 'Não informado'],
                ['Preço', fmtBRL(a.preco)],
                ['KM / uso', a.quilometragem_exibida || 'Não informado'],
                ['Origem KM', a.quilometragem_origem === 'curadoria' ? 'Curadoria' : a.quilometragem_origem === 'coleta' ? 'Coleta' : '—'],
              ].map(([label, value]) => <div key={label} style={{ padding: 10, borderRadius: 9, background: T.surface2, border: `1px solid ${T.line}` }}>
                <div style={{ color: T.inkMuted, fontSize: 9.5, fontFamily: T.fontMono }}>{label.toUpperCase()}</div>
                <div style={{ marginTop: 4, fontFamily: label === 'Preço' ? T.fontMono : T.fontBody, fontSize: 12.5 }}>{value}</div>
              </div>)}
            </div>
          </Card>

          <div>
            <SectionTitle sub="O anúncio contra a referência oficial e ofertas equivalentes">Comparação de produto</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
              {[
                ['ANÚNCIO', fmtBRL(a.preco), 'Preço publicado'],
                ['FIPE', fmtBRL(a.preco_fipe), `${pct(desvioFipe)} vs anúncio`],
                ['MERCADO', fmtBRL(a.preco_medio_mercado), `${pct(desvioMercado)} vs anúncio`],
                ['OFERTAS', fmtN(a.anuncios_comparaveis || 0), a.fipe_preco_id ? 'mesma referência' : 'sem vínculo'],
              ].map(([label, value, sub]) => <Card key={label} style={{ padding: 13 }}>
                <div style={{ color: T.inkMuted, fontSize: 9.5, fontFamily: T.fontMono }}>{label}</div>
                <div style={{ fontFamily: T.fontMono, fontSize: 15, marginTop: 7 }}>{value}</div>
                <div style={{ color: T.inkMuted, fontSize: 10, marginTop: 4 }}>{sub}</div>
              </Card>)}
            </div>
          </div>

          <Card style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: T.fontDisplay, fontWeight: 600 }}>Referência FIPE</div>
                <div style={{ color: T.inkMuted, fontSize: 11, marginTop: 3 }}>Vínculo atual e correção assistida</div>
              </div>
              <Tag tone={a.fipe_vinculo_origem === 'manual' ? 'sinal' : 'neutro'}>{a.fipe_vinculo_origem === 'manual' ? 'CURADORIA MANUAL' : 'AUTOMÁTICO'}</Tag>
            </div>
            {a.fipe_preco_id ? <div style={{ marginTop: 12, padding: 11, borderRadius: 9, background: T.surface2, border: `1px solid ${T.line}` }}>
              <strong style={{ display: 'block', fontSize: 13 }}>{a.marca_fipe} · {a.modelo_fipe}</strong>
              <div style={{ color: T.inkMuted, fontSize: 11, marginTop: 4 }}>{a.ano_codigo} · {a.codigo_fipe} · {a.mes_referencia}</div>
              <div style={{ fontFamily: T.fontMono, marginTop: 7 }}>{fmtBRL(a.preco_fipe)}</div>
            </div> : <div style={{ marginTop: 12, color: T.inkMuted, fontSize: 12 }}>Nenhuma referência vinculada com segurança.</div>}

            {podeEditar && <div style={{ marginTop: 14 }}>
              <label style={{ color: T.inkMuted, fontSize: 11 }}>Localizar outra FIPE por marca, modelo, código ou ano</label>
              <div style={{ position: 'relative', marginTop: 6 }}>
                <Search size={14} style={{ position: 'absolute', left: 11, top: 12, color: T.inkMuted }} />
                <input value={buscaFipe} onChange={e => setBuscaFipe(e.target.value)} placeholder={`Ex.: ${a.marca || ''} ${a.titulo || ''}`} style={{ ...inputStyle, width: '100%', paddingLeft: 33 }} />
              </div>
              {buscandoFipe && <div style={{ color: T.inkMuted, fontSize: 10.5, marginTop: 7 }}>Buscando no catálogo local…</div>}
              {resultadosFipe.length > 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, maxHeight: 260, overflowY: 'auto' }}>
                {resultadosFipe.map(item => {
                  const escolhido = Number(fipeSelecionada?.id) === Number(item.id);
                  return <button key={item.id} onClick={() => setFipeSelecionada(item)} style={{
                    textAlign: 'left', padding: 10, borderRadius: 9, cursor: 'pointer', color: T.ink,
                    background: escolhido ? `${T.signal}18` : T.surface2,
                    border: `1px solid ${escolhido ? T.signal : T.line}`, fontFamily: T.fontBody,
                  }}>
                    <strong style={{ display: 'block', fontSize: 12 }}>{item.marca} · {item.modelo}</strong>
                    <span style={{ color: T.inkMuted, fontSize: 10.5 }}>{item.ano_codigo} · {item.codigo_fipe} · {fmtBRL(item.preco_fipe)}</span>
                  </button>;
                })}
              </div>}
              {fipeSelecionada && <div style={{ marginTop: 8, color: T.signal, fontSize: 11 }}><Check size={13} style={{ verticalAlign: -3 }} /> Nova referência selecionada. Salve para aplicar.</div>}
            </div>}
          </Card>

          {podeEditar && <Card style={{ padding: 16 }}>
            <div style={{ fontFamily: T.fontDisplay, fontWeight: 600 }}><Pencil size={14} style={{ verticalAlign: -2, marginRight: 6 }} />Curadoria interna</div>
            <div style={{ color: T.inkMuted, fontSize: 11, marginTop: 3 }}>Não altera os dados originais coletados.</div>
            <label style={{ display: 'block', color: T.inkMuted, fontSize: 11, marginTop: 13 }}>Quilometragem confirmada</label>
            <div style={{ position: 'relative', marginTop: 6 }}>
              <Ruler size={14} style={{ position: 'absolute', left: 11, top: 12, color: T.inkMuted }} />
              <input type="number" min="0" max="5000000" value={quilometragem} onChange={e => setQuilometragem(e.target.value)} placeholder="Ex.: 385000" style={{ ...inputStyle, width: '100%', paddingLeft: 33 }} />
            </div>
            <label style={{ display: 'block', color: T.inkMuted, fontSize: 11, marginTop: 12 }}>Observação da equipe</label>
            <textarea value={observacao} onChange={e => setObservacao(e.target.value)} maxLength={500} rows={3} placeholder="Por que a FIPE foi ajustada? O que devemos observar neste veículo?" style={{ ...inputStyle, width: '100%', marginTop: 6, resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <button onClick={salvar} disabled={salvando} style={{ ...inputStyle, border: 'none', background: T.signal, color: T.signalInk, fontWeight: 700, cursor: salvando ? 'wait' : 'pointer', flex: '1 1 180px' }}><Save size={14} style={{ verticalAlign: -3, marginRight: 6 }} />{salvando ? 'Salvando…' : 'Salvar curadoria'}</button>
              {a.fipe_vinculo_origem === 'manual' && <button onClick={restaurarAutomatico} disabled={salvando} style={{ ...inputStyle, cursor: salvando ? 'wait' : 'pointer', flex: '1 1 180px' }}><Undo2 size={14} style={{ verticalAlign: -3, marginRight: 6 }} />Restaurar automático</button>}
            </div>
          </Card>}

          <div>
            <SectionTitle sub="Ofertas ativas ligadas à mesma referência">Produtos comparáveis</SectionTitle>
            {dados.similares.length > 0 ? <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {dados.similares.map(item => <a key={item.id} href={item.url} target="_blank" rel="noreferrer" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 10, padding: 11, borderRadius: 9, border: `1px solid ${T.line}`, background: T.surface, color: T.ink, textDecoration: 'none' }}>
                <span style={{ minWidth: 0 }}><strong style={{ display: 'block', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.titulo}</strong><small style={{ color: T.inkMuted }}>{item.revenda} · {item.cidade}/{item.uf}{item.quilometragem ? ` · ${item.quilometragem}` : ''}</small></span>
                <span style={{ fontFamily: T.fontMono, fontSize: 12 }}>{fmtBRL(item.preco)}</span>
              </a>)}
            </div> : <div style={{ color: T.inkMuted, fontSize: 12 }}>Vincule uma referência FIPE para encontrar produtos realmente comparáveis.</div>}
          </div>

          {dados.historico.length > 0 && <Card style={{ padding: 16 }}>
            <div style={{ fontFamily: T.fontDisplay, fontWeight: 600 }}><History size={14} style={{ verticalAlign: -2, marginRight: 6 }} />Histórico de curadoria</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 12 }}>
              {dados.historico.map(item => <div key={item.id} style={{ borderLeft: `2px solid ${T.line}`, paddingLeft: 10 }}>
                <div style={{ fontSize: 11.5 }}>{String(item.acao).replaceAll('_', ' ')}</div>
                <div style={{ color: T.inkMuted, fontSize: 10, marginTop: 2 }}>{item.usuario} · {new Date(item.criado_em).toLocaleString('pt-BR')}</div>
                {item.observacao && <div style={{ color: T.inkMuted, fontSize: 10.5, marginTop: 3 }}>{item.observacao}</div>}
              </div>)}
            </div>
          </Card>}
        </>}
      </div>
    </aside>
  </div>;
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
  get background() { return T.surface2; },
  get color() { return T.ink; },
  get border() { return `1px solid ${T.line}`; },
  borderRadius: 10, padding: '10px 14px', fontSize: 13.5, fontFamily: T.fontBody, outline: 'none',
  boxSizing: 'border-box', maxWidth: '100%',
};

const filtroGridRegiaoStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 122px), 1fr))', gap: 7 };
const filtroGridUfStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 92px), 1fr))', gap: 7 };
const filtroGridSegmentoStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 138px), 1fr))', gap: 7 };
const rotuloFiltroStyle = { fontSize: 10.5, color: T.inkMuted, marginBottom: 6, fontFamily: T.fontMono, letterSpacing: '0.06em' };

function ufsDoContexto(regiao, uf) {
  if (uf !== 'todas') return [uf];
  if (regiao !== 'todas') return REGIOES_UFS[regiao] || [];
  return Object.values(REGIOES_UFS).flat();
}

function somaPorUfs(facetas, regiao, uf, campo) {
  if (!facetas) return {};
  if (regiao === 'todas' && uf === 'todas' && campo === 'categorias') return facetas.categorias || {};
  return ufsDoContexto(regiao, uf).reduce((acc, sigla) => {
    Object.entries(facetas.ufs?.[sigla]?.[campo] || {}).forEach(([chave, valor]) => {
      acc[chave] = (acc[chave] || 0) + Number(valor || 0);
    });
    return acc;
  }, {});
}

function SeletorGeografico({ facetas, regiao, uf, onRegiao, onUf, metrica = 'anuncios' }) {
  return (
    <Card style={{ padding: 14, marginBottom: 12 }}>
      <div style={rotuloFiltroStyle}>1. REGIÃO</div>
      <div style={filtroGridRegiaoStyle}>
        {['todas', ...Object.keys(REGIOES_UFS)].map(nome => {
          const dados = nome === 'todas' ? null : facetas?.regioes?.[nome];
          const quantidade = nome === 'todas'
            ? (metrica === 'revendas' ? Object.values(facetas?.revendas_por_uf || {}).reduce((a, b) => a + Number(b), 0) : facetas?.total_geral)
            : dados?.[metrica];
          const disponivel = nome === 'todas' || Number(quantidade || 0) > 0;
          const ativo = regiao === nome;
          return (
            <button key={nome} disabled={!disponivel} onClick={() => disponivel && onRegiao(nome)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 40, padding: '7px 9px',
              background: ativo ? `${T.steel}22` : T.surface2, border: `1px solid ${ativo ? T.steel : T.line}`,
              borderRadius: 10, color: ativo ? T.steel : T.ink,
              cursor: disponivel ? 'pointer' : 'not-allowed', opacity: disponivel ? 1 : 0.35,
              fontFamily: T.fontBody, fontSize: 12, fontWeight: ativo ? 600 : 450, minWidth: 0,
            }} title={disponivel ? '' : 'Coleta ainda não iniciada nesta região'}>
              <MapPin size={12} /> {nome === 'todas' ? 'Brasil' : nome}
              <span style={{ fontFamily: T.fontMono, color: T.inkMuted, fontSize: 10 }}>{fmtN(quantidade || 0)}</span>
            </button>
          );
        })}
      </div>

      <div style={{ ...rotuloFiltroStyle, marginTop: 10 }}>2. ESTADO</div>
      {regiao === 'todas' ? (
        <div style={{ color: T.inkMuted, fontSize: 12.5, padding: '8px 2px' }}>Escolha uma região para ver seus estados.</div>
      ) : (
        <div style={filtroGridUfStyle}>
          <button onClick={() => onUf('todas')} style={{
            minHeight: 40, padding: '7px 9px', borderRadius: 10, cursor: 'pointer',
            background: uf === 'todas' ? `${T.signal}20` : T.surface2,
            border: `1px solid ${uf === 'todas' ? T.signal : T.line}`,
            color: uf === 'todas' ? T.signal : T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontFamily: T.fontBody, fontWeight: uf === 'todas' ? 600 : 450,
          }}><LayoutGrid size={12} /> Todos</button>
          {(REGIOES_UFS[regiao] || []).map(sigla => {
            const dados = facetas?.ufs?.[sigla];
            const quantidade = Number(dados?.[metrica] || 0);
            const disponivel = quantidade > 0;
            const ativo = uf === sigla;
            return (
              <button key={sigla} disabled={!disponivel} onClick={() => disponivel && onUf(sigla)} style={{
                minHeight: 40, padding: '7px 9px', borderRadius: 10,
                background: ativo ? `${T.signal}20` : T.surface2,
                border: `1px solid ${ativo ? T.signal : T.line}`,
                color: ativo ? T.signal : T.ink, cursor: disponivel ? 'pointer' : 'not-allowed',
                opacity: disponivel ? 1 : 0.35, fontFamily: T.fontBody,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minWidth: 0,
              }} title={`${NOMES_UF[sigla]}${disponivel ? '' : ' — ainda sem dados coletados'}`} aria-label={`${NOMES_UF[sigla]}, ${fmtN(quantidade)} ${metrica}`}>
                <MapPin size={12} style={{ color: ativo ? T.signal : T.steel, flexShrink: 0 }} />
                <strong style={{ fontSize: 12 }}>{sigla}</strong>
                <span style={{ color: T.inkMuted, fontFamily: T.fontMono, fontSize: 9.5, overflow: 'hidden', textOverflow: 'ellipsis' }}>{fmtN(quantidade)}</span>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}

/* ============================================================
   HOJE — feed compacto + KPIs de mercado
   ============================================================ */
function PainelKpi({ titulo, subtitulo, dados, renderItem, style }) {
  return (
    <Card style={{ padding: 16, height: '100%', ...style }}>
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

function PageHoje({ kpis, anuncios, usandoReais, layout: layoutInput, onPersonalizar }) {
  const { data: stats } = useApi('hoje_stats.php');
  const { data: facetas } = useApi('facetas.php?status=ativo');
  const [sinalAberto, setSinalAberto] = useState(null);
  const layout = normalizeDashboardLayout(layoutInput);

  const sinais = useMemo(() => {
    const lista = [];
    const agora = Date.now();
    anuncios.forEach(a => {
      const horasDesdePrimeira = (agora - new Date(a.primeiraVez)) / 3600000;
      if (a.status === 'saida_detectada') {
        lista.push({ tipo: 'saida', a, quando: a.dataRemocao || a.ultimaVez });
      } else if (a.status === 'em_verificacao') {
        lista.push({ tipo: 'verificacao', a, quando: a.ultimaVez });
      } else if (horasDesdePrimeira < 48) {
        lista.push({ tipo: 'novo', a, quando: a.primeiraVez });
      }
    });
    return lista.sort((x, y) => new Date(y.quando) - new Date(x.quando)).slice(0, 40);
  }, [anuncios]);

  const config = {
    novo:  { icone: Zap,          cor: T.signal,   rotulo: 'NOVO' },
    verificacao: { icone: Timer,        cor: T.alert,    rotulo: 'VERIFICAR' },
    saida:       { icone: CheckCircle2, cor: T.positive, rotulo: 'SAIU' },
  };
  const cobertura = kpis?.ufs_ativas?.length
    ? `${kpis.ufs_ativas.length} UFs · ${kpis.regioes_ativas?.length || 0} regiões`
    : usandoReais ? `${Object.keys(facetas?.por_uf || {}).length || 1} UFs` : 'conectando…';

  const kpiWidgets = {
    revendas: <Kpi label="Revendas no radar" value={kpis ? fmtN(kpis.revendas_monitoradas) : '—'} sub={`${cobertura} · 2×/dia`} />,
    anuncios: <Kpi label="Anúncios ativos" value={kpis ? fmtN(kpis.anuncios_ativos) : '—'} sub="no mercado agora" />,
    saidas: <Kpi label="Saídas detectadas" value={kpis ? fmtN(kpis.saidas_detectadas_mes ?? kpis.vendas_estimadas_mes) : '—'} sub="este mês · ausência confirmada" tone={T.positive} />,
    movimento: <KpiEntradaSaida entrou={kpis?.entradas_48h ?? sinais.filter(s => s.tipo === 'novo').length} saiu={kpis?.saidas_48h ?? sinais.filter(s => s.tipo === 'saida').length} />,
  };

  const sectionWidgets = {
    feed: (
      <Card style={{ padding: 16, height: '100%' }}>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 600, color: T.ink, marginBottom: 4 }}>Movimento do mercado</div>
        <div style={{ fontSize: 11.5, color: T.inkMuted, marginBottom: 12 }}>O que mudou desde ontem — selecione um anúncio para ver detalhes</div>
        {sinais.length === 0 ? (
          <EmptyState icon={Radar} titulo="Sem sinais ainda" texto="Aguardando o próximo ciclo do radar detectar movimento." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 520, overflowY: 'auto', paddingRight: 4 }}>
            {sinais.map((s, i) => {
              const C = config[s.tipo];
              const aberto = sinalAberto === i;
              return (
                <div key={`${s.a.id}-${s.tipo}-${i}`} style={{ background: aberto ? T.surface2 : T.surface, border: `1px solid ${aberto ? `${T.signal}4D` : T.line}`, borderRadius: 8, overflow: 'hidden' }}>
                  <button type="button" aria-expanded={aberto} onClick={() => setSinalAberto(aberto ? null : i)} style={{ width: '100%', display: 'flex', gap: 10, alignItems: 'center', minHeight: 40, padding: '8px 12px', border: 'none', background: 'transparent', color: T.ink, cursor: 'pointer', fontFamily: T.fontBody, textAlign: 'left' }}>
                    <C.icone size={13} style={{ color: C.cor, flexShrink: 0 }} />
                    <span style={{ fontFamily: T.fontMono, fontSize: 9.5, color: C.cor, letterSpacing: '0.05em', minWidth: 55 }}>{C.rotulo}</span>
                    <span style={{ fontSize: 12.5, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.a.titulo}</span>
                    <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.inkMuted, whiteSpace: 'nowrap' }}>{new Date(s.quando).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                  </button>
                  {aberto && <div style={{ padding: '2px 12px 12px 35px', fontSize: 12, color: T.inkMuted, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div><span style={{ color: T.ink }}>{s.a.revenda}</span> · {s.a.cidade}/{s.a.uf}</div>
                    <div><span style={{ fontFamily: T.fontMono, color: T.ink }}>{fmtBRL(s.a.preco)}</span> · {s.a.dias} dias no ar</div>
                    <ComparativoAnuncio anuncio={s.a} compacto />
                    {s.a.url && <a href={s.a.url} target="_blank" rel="noreferrer" style={{ color: T.signal, textDecoration: 'none', display: 'inline-flex', gap: 5, alignItems: 'center', marginTop: 4 }}>Ver no portal <ExternalLink size={11} /></a>}
                  </div>}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    ),
    modelos: <PainelKpi titulo="Modelos mais anunciados" subtitulo="Volume ativo · preço médio de mercado" dados={stats?.top_modelos} renderItem={(m, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12.5 }}><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{m.modelo}</span><span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.inkMuted, whiteSpace: 'nowrap' }}>{m.n}× · <span style={{ color: T.ink }}>{fmtBRL(m.preco_medio)}</span></span></div>} />,
    regioes: <PainelKpi titulo="Regiões com mais saídas" subtitulo="Anúncios que deixaram o portal nos últimos 30 dias" dados={stats?.regioes_saidas ?? stats?.regioes_vendas} renderItem={(c, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12.5 }}><span style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}><MapPin size={11} style={{ color: T.inkMuted, flexShrink: 0 }} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.cidade}/{c.uf}</span></span><span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.positive, whiteSpace: 'nowrap' }}>{c.n} saídas</span></div>} />,
    lojas_novos: <PainelKpi titulo="Lojas mais ativas" subtitulo="Anúncios novos nos últimos 7 dias" dados={stats?.top_lojas_novos} renderItem={(l, i) => <div key={i} style={{ fontSize: 12.5, display: 'flex', justifyContent: 'space-between', gap: 6 }}><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{l.nome}</span><span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.signal }}>+{l.n}</span></div>} />,
    lojas_saidas: <PainelKpi titulo="Lojas com mais saídas" subtitulo="Anúncios que deixaram o portal nos últimos 30 dias" dados={stats?.top_lojas_saidas ?? stats?.top_lojas_vendas} renderItem={(l, i) => <div key={i} style={{ fontSize: 12.5, display: 'flex', justifyContent: 'space-between', gap: 6 }}><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{l.nome}</span><span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.positive }}>{l.n} saídas</span></div>} />,
  };

  const presetLabel = DASHBOARD_PRESETS[layout.preset]?.label || 'Personalizado';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: T.inkMuted, fontSize: 11.5 }}><LayoutGrid size={14} />Visão: {presetLabel}</div>
        {onPersonalizar && <button type="button" onClick={onPersonalizar} style={{ ...inputStyle, minHeight: 34, padding: '6px 10px', cursor: 'pointer', color: T.signal }}><Settings size={13} style={{ verticalAlign: -2, marginRight: 6 }} />Personalizar painel</button>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))', gap: 10, marginBottom: 22 }}>
        {layout.kpis.map(id => <React.Fragment key={id}>{kpiWidgets[id]}</React.Fragment>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: 12, alignItems: 'stretch' }}>
        {layout.sections.map(section => <div key={section.id} style={{ gridColumn: section.size === 'wide' ? '1 / -1' : 'auto', minWidth: 0 }}>{sectionWidgets[section.id]}</div>)}
      </div>
    </div>
  );
}

/* ============================================================
   MERCADO — busca paginada no servidor (todos os 7k+ anuncios)
   ============================================================ */
const PAGINA = 60;

function PageMercado({ sessao }) {
  const [q, setQ] = useState('');
  const [qDebounced, setQDebounced] = useState('');
  const [categoria, setCategoria] = useState('todas');
  const [tipo, setTipo] = useState('todos');
  const [status, setStatus] = useState('ativo');
  const [regiao, setRegiao] = useState('todas');
  const [uf, setUf] = useState('todas');
  const [cidade, setCidade] = useState('todas');
  const [revendaId, setRevendaId] = useState('todas');
  const [precoMin, setPrecoMin] = useState('');
  const [precoMax, setPrecoMax] = useState('');
  const [ordem, setOrdem] = useState('aleatorio');
  const [maisFiltros, setMaisFiltros] = useState(false);
  const [anuncioAberto, setAnuncioAberto] = useState(null);
  const [versaoDados, setVersaoDados] = useState(0);

  const statusDb = {
    ativo: 'ativo', em_verificacao: 'removido_candidato',
    saida_detectada: 'removido_confirmado', todos: 'todos',
  }[status] || 'ativo';
  const { data: facetas } = useApi(`facetas.php?status=${statusDb}`);

  const [anuncios, setAnuncios] = useState([]);
  const [total, setTotal] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [fim, setFim] = useState(false);
  const carregandoRef = useRef(false);
  const sentinelaRef = useRef(null);

  // Debounce da busca — evita disparar uma requisicao por tecla digitada
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const queryBase = useMemo(() => {
    const p = new URLSearchParams();
    if (categoria !== 'todas') p.set('categoria', categoria);
    if (uf !== 'todas') p.set('uf', uf);
    else if (regiao !== 'todas') p.set('regiao', regiao);
    if (tipo !== 'todos') p.set('tipo', tipo);
    if (statusDb !== 'todos') p.set('status', statusDb);
    if (cidade !== 'todas') p.set('cidade', cidade);
    if (revendaId !== 'todas') p.set('revenda_id', revendaId);
    if (precoMin) p.set('preco_min', precoMin);
    if (precoMax) p.set('preco_max', precoMax);
    if (qDebounced) p.set('q', qDebounced);
    p.set('ordem', ordem);
    return p.toString();
  }, [categoria, regiao, uf, tipo, statusDb, cidade, revendaId, precoMin, precoMax, qDebounced, ordem]);

  // Busca a primeira pagina sempre que qualquer filtro muda
  useEffect(() => {
    let cancelado = false;
    carregandoRef.current = true;
    setCarregando(true); setFim(false);
    document.getElementById('app-scroll-container')?.scrollTo({ top: 0 });
    fetch(`${API_BASE_URL}/anuncios.php?${queryBase}&limit=${PAGINA}&offset=0`)
      .then(r => r.json())
      .then(d => {
        if (cancelado) return;
        setAnuncios((d.anuncios || []).map(mapeiaAnuncioReal));
        setTotal(d.total ?? 0);
        setFim((d.anuncios || []).length >= (d.total ?? 0));
      })
      .catch(() => { if (!cancelado) { setAnuncios([]); setTotal(0); } })
      .finally(() => {
        carregandoRef.current = false;
        if (!cancelado) setCarregando(false);
      });
    return () => { cancelado = true; };
  }, [queryBase, versaoDados]);

  const carregaMais = () => {
    if (carregandoRef.current || fim) return;
    carregandoRef.current = true;
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
      .finally(() => {
        carregandoRef.current = false;
        setCarregando(false);
      });
  };

  // O app rola dentro de <main>, nao na janela. A sentinela observa esse container
  // e pede a proxima pagina quando chega perto do fim da grade.
  useEffect(() => {
    const root = document.getElementById('app-scroll-container');
    const alvo = sentinelaRef.current;
    if (!root || !alvo) return undefined;

    const observer = new IntersectionObserver(([entrada]) => {
      if (entrada.isIntersecting) carregaMais();
    }, { root, rootMargin: '600px 0px' });

    observer.observe(alvo);
    return () => observer.disconnect();
  }, [queryBase, anuncios.length, carregando, fim]);

  const catCounts = useMemo(() => somaPorUfs(facetas, regiao, uf, 'categorias'), [facetas, regiao, uf]);
  const totalGeral = regiao === 'todas' && uf === 'todas'
    ? (facetas?.total_geral ?? 0)
    : ufsDoContexto(regiao, uf).reduce((n, sigla) => n + Number(facetas?.ufs?.[sigla]?.anuncios || 0), 0);
  const cidades = uf === 'todas' ? [] : (facetas?.ufs?.[uf]?.cidades || []);
  const revendas = uf === 'todas' ? [] : (facetas?.ufs?.[uf]?.lojistas || []);
  const tiposContexto = useMemo(() => somaPorUfs(facetas, regiao, uf, 'tipos'), [facetas, regiao, uf]);
  const subtipos = categoria === 'todas' ? [] : Object.entries(tiposContexto)
    .filter(([nome]) => categoriaDe(nome) === categoria)
    .map(([nome, n]) => ({ tipo: nome, n }))
    .sort((a, b) => b.n - a.n);

  const filtrosAtivos = [categoria !== 'todas', tipo !== 'todos', status !== 'ativo',
    regiao !== 'todas', uf !== 'todas', cidade !== 'todas', revendaId !== 'todas', !!precoMin, !!precoMax].filter(Boolean).length;
  const chipsCategorias = ['todas', ...Object.keys(CATEGORIAS)];
  const limparFiltros = () => {
    setQ(''); setCategoria('todas'); setTipo('todos'); setStatus('ativo'); setRegiao('todas');
    setUf('todas'); setCidade('todas'); setRevendaId('todas'); setPrecoMin(''); setPrecoMax(''); setOrdem('aleatorio');
  };

  return (
    <div>
      <SeletorGeografico facetas={facetas} regiao={regiao} uf={uf}
        onRegiao={valor => { setRegiao(valor); setUf('todas'); setCidade('todas'); setRevendaId('todas'); }}
        onUf={valor => { setUf(valor); setCidade('todas'); setRevendaId('todas'); }} />

      <div style={rotuloFiltroStyle}>3. SEGMENTO</div>
      <div style={{ ...filtroGridSegmentoStyle, marginBottom: 14 }}>
        {chipsCategorias.map(cat => {
          const info = cat === 'todas' ? { label: 'Todos', icone: '📊', cor: T.ink } : CATEGORIAS[cat];
          const rotulo = cat === 'todas' ? info.label : ROTULOS_CATEGORIA_FILTRO[cat];
          const ativa = categoria === cat;
          const n = cat === 'todas' ? totalGeral : (catCounts[cat] || 0);
          return (
            <button key={cat} onClick={() => { setCategoria(cat); setTipo('todos'); }} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 40, padding: '7px 9px', minWidth: 0,
              background: ativa ? `${info.cor}22` : T.surface,
              border: `1px solid ${ativa ? info.cor : T.line}`,
              borderRadius: 10, cursor: 'pointer', fontSize: 12, fontFamily: T.fontBody,
              color: ativa ? info.cor : T.ink, fontWeight: ativa ? 600 : 400,
              transition: 'all 140ms',
            }}>
              <span>{info.icone}</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{rotulo}</span>
              <span style={{ fontFamily: T.fontMono, fontSize: 9.5, color: T.inkMuted }}>{fmtN(n)}</span>
            </button>
          );
        })}
      </div>

      <div style={{ ...rotuloFiltroStyle, marginTop: 2 }}>4. BUSCA E ORDENAÇÃO</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', top: 12, left: 12, color: T.inkMuted }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar veículo, marca ou modelo..."
            style={{ ...inputStyle, width: '100%', paddingLeft: 34 }} />
        </div>
        <select value={ordem} onChange={e => setOrdem(e.target.value)} style={{ ...inputStyle, flex: '1 1 190px' }}>
          <option value="aleatorio">Amostra do mercado</option>
          <option value="recente">Mais recentes</option>
          <option value="preco_asc">Menor preço</option>
          <option value="preco_desc">Maior preço</option>
          <option value="mais_tempo">Há mais tempo no ar</option>
        </select>
        <button onClick={() => setMaisFiltros(!maisFiltros)} style={{
          ...inputStyle, cursor: 'pointer', display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center', flex: '0 1 auto',
          borderColor: filtrosAtivos ? T.signal : T.line, color: filtrosAtivos ? T.signal : T.ink,
        }}>
          Filtros{filtrosAtivos ? ` · ${filtrosAtivos}` : ''} {maisFiltros ? '▴' : '▾'}
        </button>
        {filtrosAtivos > 0 && <button onClick={limparFiltros} style={{ ...inputStyle, cursor: 'pointer', color: T.inkMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
          <RotateCcw size={13} /> Limpar
        </button>}
      </div>

      {maisFiltros && (
        <Card style={{ padding: 14, marginBottom: 8, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
          <select value={tipo} onChange={e => setTipo(e.target.value)} style={inputStyle} disabled={categoria === 'todas'}>
            <option value="todos">{categoria === 'todas' ? 'Escolha uma categoria' : 'Todos os subtipos'}</option>
            {subtipos.map(s => <option key={s.tipo} value={s.tipo}>{s.tipo} ({s.n})</option>)}
          </select>
          <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
            <option value="ativo">No mercado</option>
            <option value="em_verificacao">Em verificação</option>
            <option value="saida_detectada">Saídas detectadas</option>
            <option value="todos">Todos (histórico)</option>
          </select>
          <select value={cidade} onChange={e => setCidade(e.target.value)} style={inputStyle} disabled={uf === 'todas'}>
            <option value="todas">{uf === 'todas' ? 'Escolha um estado primeiro' : `Todas as cidades de ${uf}`}</option>
            {cidades.map(c => <option key={`${c.uf}-${c.cidade}`} value={c.cidade}>{c.cidade} ({fmtN(c.n)})</option>)}
          </select>
          <select value={revendaId} onChange={e => setRevendaId(e.target.value)} style={inputStyle} disabled={uf === 'todas'}>
            <option value="todas">{uf === 'todas' ? 'Escolha um estado primeiro' : `Todas as revendas de ${uf}`}</option>
            {revendas.map(r => <option key={r.id} value={String(r.id)}>{r.nome} · {r.cidade} ({fmtN(r.n)})</option>)}
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
            <Card key={`${a.dbId}-${a.id}`} onClick={() => setAnuncioAberto(a)} style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                <Tag tone={a.status === 'saida_detectada' ? 'positivo' : a.status === 'em_verificacao' ? 'alerta' : a.dias >= 30 ? 'sinal' : 'neutro'}>
                  {a.status === 'saida_detectada' ? 'SAIU DO PORTAL'
                    : a.status === 'em_verificacao' ? 'EM VERIFICAÇÃO'
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
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', color: T.inkMuted, fontSize: 10.5, marginBottom: 7 }}>
                {a.ano && <span>{a.ano}</span>}
                {a.quilometragem && <span><Ruler size={10} style={{ verticalAlign: -1 }} /> {a.quilometragem}{a.quilometragemOrigem === 'curadoria' ? ' · validado' : ''}</span>}
                <span style={{ color: T.steel }}>Clique para comparar</span>
              </div>
              <div style={{ fontSize: 12, color: T.inkMuted, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 12 }}>
                <MapPin size={11} />
                <button onClick={e => { e.stopPropagation(); setRegiao(facetas?.ufs?.[a.uf]?.regiao || regiao); setUf(a.uf); setCidade('todas'); setRevendaId(String(a.revendaId)); setMaisFiltros(true); document.getElementById('app-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  style={{ background: 'none', border: 'none', color: T.inkMuted, cursor: 'pointer', padding: 0, fontSize: 12,
                           textDecoration: 'underline', textDecorationColor: 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.textDecorationColor = T.signal}
                  onMouseLeave={e => e.currentTarget.style.textDecorationColor = 'transparent'}
                  title="Filtrar por essa revenda">{a.revenda}</button>
                <span>· {a.cidade}/{a.uf}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div style={{ fontFamily: T.fontMono, fontSize: 17, fontWeight: 600, color: a.preco ? T.ink : T.inkMuted }}>{fmtBRL(a.preco)}</div>
                {a.url && <a href={a.url} onClick={e => e.stopPropagation()} target="_blank" rel="noreferrer" style={{ color: T.signal, display: 'flex' }} title="Abrir anúncio no portal"><ExternalLink size={15} /></a>}
              </div>
              <ComparativoAnuncio anuncio={a} />
            </Card>
          );
        })}
      </div>

      <div ref={sentinelaRef} aria-hidden="true" style={{ height: 1 }} />

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
      {anuncioAberto && <PainelAnuncio anuncio={anuncioAberto} sessao={sessao}
        onClose={() => setAnuncioAberto(null)} onAtualizado={() => setVersaoDados(v => v + 1)} />}
    </div>
  );
}

/* ============================================================
   OPORTUNIDADES — onde há dinheiro na mesa
   ============================================================ */
function PageOportunidades({ onCriarAcao }) {
  const [regiao, setRegiao] = useState('todas');
  const [uf, setUf] = useState('todas');
  const { data: facetas } = useApi('facetas.php?status=ativo');
  const escopo = uf !== 'todas' ? `&uf=${uf}` : regiao !== 'todas' ? `&regiao=${encodeURIComponent(regiao)}` : '';
  // Busca no servidor os anuncios ativos ha mais tempo — nao depende do que o Mercado carregou
  const { data, erro } = useApi(`anuncios.php?status=ativo&ordem=mais_tempo&limit=40${escopo}`);
  const lista = useMemo(() => (data?.anuncios || []).map(mapeiaAnuncioReal), [data]);
  const maduros = lista.filter(a => a.dias >= 30).slice(0, 15);
  const { data: fipeData, erro: fipeErro } = useApi(`anuncios.php?status=ativo&abaixo_fipe=1&ordem=desvio_fipe&limit=20${escopo}`);
  const abaixoFipe = useMemo(() => (fipeData?.anuncios || []).map(mapeiaAnuncioReal), [fipeData]);

  return (
    <div>
      <SeletorGeografico facetas={facetas} regiao={regiao} uf={uf}
        onRegiao={valor => { setRegiao(valor); setUf('todas'); }} onUf={setUf} />
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
                <ComparativoAnuncio anuncio={a} compacto />
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

      <SectionTitle sub="Diferença entre preço anunciado e referência FIPE — valide modelo, estado e configuração antes de negociar">
        Preço abaixo da FIPE
      </SectionTitle>
      {!fipeData && !fipeErro && <EmptyState icon={TrendingDown} titulo="Consultando referências FIPE..." texto="Buscando anúncios ativos já vinculados ao catálogo FIPE." />}
      {fipeErro && <EmptyState icon={TrendingDown} titulo="FIPE temporariamente indisponível" texto="Não foi possível consultar os vínculos FIPE agora." />}
      {fipeData && abaixoFipe.length === 0 && (
        <EmptyState icon={TrendingDown} titulo="Nenhum anúncio abaixo da FIPE ainda"
          texto="A sincronização FIPE está sendo ampliada gradualmente. Esta seção preencherá automaticamente conforme os vínculos forem auditados." />
      )}
      {abaixoFipe.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {abaixoFipe.map(a => (
            <Card key={a.id} style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <TrendingDown size={17} style={{ color: T.positive, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 230 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{a.titulo}</div>
                <div style={{ fontSize: 12, color: T.inkMuted }}>{a.revenda} · {a.cidade}/{a.uf} · anunciado {fmtBRL(a.preco)}</div>
                <ComparativoAnuncio anuncio={a} compacto />
              </div>
              <Tag tone="positivo">{Math.abs(a.desvioFipePct ?? 0).toLocaleString('pt-BR')}% ABAIXO</Tag>
              <Tag tone={a.fipeConfianca === 'alto' ? 'positivo' : 'alerta'}>
                MATCH {a.fipeConfianca?.toUpperCase() || '—'}
              </Tag>
              <button onClick={() => onCriarAcao(`Validar oportunidade FIPE: ${a.titulo} (${a.revenda})`)}
                style={{ ...inputStyle, cursor: 'pointer', display: 'flex', gap: 6, alignItems: 'center', padding: '8px 12px' }}>
                <Plus size={13} /> Criar ação
              </button>
            </Card>
          ))}
        </div>
      )}

      <SectionTitle sub="Reduções de preço detectadas entre uma varredura e outra">Quedas de preço</SectionTitle>
      <EmptyState icon={ArrowDownRight} titulo="Coletando histórico de preços"
        texto="A cada varredura o radar registra o preço de cada anúncio. Assim que houver histórico suficiente (alguns dias de coleta), toda queda de preço aparece aqui em ordem de relevância." />
    </div>
  );
}


/* ============================================================
   CONCORRENTES — quem sao os players + metricas de giro
   ============================================================ */
function PageConcorrentes() {
  const [regiao, setRegiao] = useState('todas');
  const [uf, setUf] = useState('todas');
  const { data: facetas } = useApi('facetas.php');
  const urlLojistas = uf !== 'todas' ? `lojistas.php?uf=${uf}`
    : regiao === 'todas' ? 'lojistas.php' : `lojistas.php?regiao=${encodeURIComponent(regiao)}`;
  const { data, erro } = useApi(urlLojistas);
  const [q, setQ] = useState('');
  const [categoria, setCategoria] = useState('todas');
  const [cidade, setCidade] = useState('todas');
  const [ordem, setOrdem] = useState('ativos');
  const [mostrados, setMostrados] = useState(48);
  const sentinelaRef = useRef(null);

  const lojistas = data?.lojistas || [];

  // Classifica cada tipo dentro de uma categoria e monta o mix de categorias por revenda
  const lojistasComCat = useMemo(() => lojistas.map(l => {
    const catMix = {};
    Object.entries(l.mix_categorias || {}).forEach(([tipo, n]) => {
      const cat = categoriaDe(tipo);
      catMix[cat] = (catMix[cat] || 0) + n;
    });
    return {
      ...l,
      saidas_detectadas: l.saidas_detectadas ?? l.vendidos ?? 0,
      saidas_30d: l.saidas_30d ?? l.vendidos_30d ?? 0,
      catMix,
      cidades: [l.cidade],
    };
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
      saidas: (a, b) => b.saidas_detectadas - a.saidas_detectadas,
      saidas_30d: (a, b) => b.saidas_30d - a.saidas_30d,
      giro: (a, b) => (a.idade_media_estoque ?? 999) - (b.idade_media_estoque ?? 999),
      historico: (a, b) => b.total_historico - a.total_historico,
    };
    return [...lista].sort(ordens[ordem]);
  }, [lojistasComCat, categoria, cidade, q, ordem]);

  useEffect(() => { setMostrados(48); }, [regiao, uf, categoria, cidade, q, ordem]);

  useEffect(() => {
    const root = document.getElementById('app-scroll-container');
    const alvo = sentinelaRef.current;
    if (!root || !alvo) return undefined;

    const observer = new IntersectionObserver(([entrada]) => {
      if (entrada.isIntersecting) {
        setMostrados(m => Math.min(m + 60, 500));
      }
    }, { root, rootMargin: '800px 0px' });

    observer.observe(alvo);
    return () => observer.disconnect();
  }, [mostrados, filtrados.length]);

  const chipsCategorias = ['todas', ...Object.keys(CATEGORIAS)];
  const cidadesTop = cidades.filter(c => c !== 'todas').sort((a, b) => (contCidade[b] || 0) - (contCidade[a] || 0)).slice(0, 8);

  return (
    <div>
      <SeletorGeografico facetas={facetas} regiao={regiao} uf={uf} metrica="revendas"
        onRegiao={valor => { setRegiao(valor); setUf('todas'); setCidade('todas'); }}
        onUf={valor => { setUf(valor); setCidade('todas'); }} />

      {/* Chips de categorias — quais lojistas atuam em cada segmento */}
      <div style={{ marginBottom: 14 }}>
        <div style={rotuloFiltroStyle}>3. SEGMENTO DE ATUAÇÃO</div>
        <div style={filtroGridSegmentoStyle}>
          {chipsCategorias.map(cat => {
            const info = cat === 'todas' ? { label: 'Todas', icone: '📊', cor: T.ink } : CATEGORIAS[cat];
            const rotulo = cat === 'todas' ? info.label : ROTULOS_CATEGORIA_FILTRO[cat];
            const ativa = categoria === cat;
            const n = cat === 'todas' ? lojistasComCat.length : (contCat[cat] || 0);
            return (
              <button key={cat} onClick={() => setCategoria(cat)} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 40, padding: '7px 9px', minWidth: 0,
                background: ativa ? `${info.cor}22` : T.surface,
                border: `1px solid ${ativa ? info.cor : T.line}`,
                borderRadius: 10, cursor: 'pointer', fontSize: 12, fontFamily: T.fontBody,
                color: ativa ? info.cor : T.ink, fontWeight: ativa ? 600 : 400,
                transition: 'all 140ms',
              }}>
                <span>{info.icone}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{rotulo}</span>
                <span style={{ fontFamily: T.fontMono, fontSize: 9.5, color: T.inkMuted }}>{fmtN(n)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cidades aparecem apenas depois do estado: hierarquia previsivel no mobile. */}
      <div style={{ marginBottom: 14 }}>
        <div style={rotuloFiltroStyle}>4. CIDADE</div>
        {uf === 'todas' ? <div style={{ color: T.inkMuted, fontSize: 12.5, padding: '7px 2px' }}>Escolha um estado para filtrar por cidade.</div> : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 128px), 1fr))', gap: 7 }}>
          <button onClick={() => setCidade('todas')} style={{
            minHeight: 38, padding: '6px 9px', background: cidade === 'todas' ? `${T.signal}22` : T.surface,
            border: `1px solid ${cidade === 'todas' ? T.signal : T.line}`, borderRadius: 10,
            cursor: 'pointer', fontSize: 11.5, color: cidade === 'todas' ? T.signal : T.ink,
            fontWeight: cidade === 'todas' ? 600 : 400,
          }}>Todas ({fmtN(lojistasComCat.length)})</button>
          {cidadesTop.map(c => (
            <button key={c} onClick={() => setCidade(c)} style={{
              minHeight: 38, padding: '6px 9px', background: cidade === c ? `${T.signal}22` : T.surface,
              border: `1px solid ${cidade === c ? T.signal : T.line}`, borderRadius: 10,
              cursor: 'pointer', fontSize: 11.5, color: cidade === c ? T.signal : T.ink,
              fontWeight: cidade === c ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }} title={c}>{c} <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.inkMuted }}>{contCidade[c]}</span></button>
          ))}
        </div>}
      </div>

      {/* Busca + ordenacao */}
      <div style={rotuloFiltroStyle}>5. BUSCA E ORDENAÇÃO</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', top: 12, left: 12, color: T.inkMuted }} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar revenda..." style={{ ...inputStyle, width: '100%', paddingLeft: 34 }} />
        </div>
        <select value={ordem} onChange={e => setOrdem(e.target.value)} style={{ ...inputStyle, flex: '1 1 210px' }}>
          <option value="ativos">Mais anuncios ativos</option>
          <option value="saidas_30d">Mais saídas (30d)</option>
          <option value="saidas">Mais saídas (total)</option>
          <option value="giro">Melhor giro (menor idade)</option>
          <option value="historico">Maior historico</option>
        </select>
      </div>

      <div style={{ fontFamily: T.fontMono, fontSize: 11, color: T.inkMuted, margin: '2px 2px 14px' }}>
        {data ? `${fmtN(filtrados.length)} REVENDAS · ${uf !== 'todas' ? `${NOMES_UF[uf]} / ${regiao}` : regiao === 'todas' ? 'BRASIL' : regiao}`.toUpperCase() : erro ? 'API INDISPONÍVEL' : 'CARREGANDO...'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: 12 }}>
        {filtrados.slice(0, mostrados).map((l, i) => (
          <Card key={l.id} style={{ padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: T.fontMono, fontSize: 11, color: i < 3 ? T.signal : T.inkMuted }}>#{String(i + 1).padStart(2, '0')}</span>
              <Tag tone={l.saidas_30d > 3 ? 'positivo' : l.ativos > 30 ? 'sinal' : 'neutro'}>
                {l.saidas_30d > 0 ? `${l.saidas_30d} SAÍDAS/30D` : `${fmtN(l.ativos)} ATIVOS`}
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
                <div style={{ color: T.inkMuted, fontSize: 10 }}>SAÍDAS</div>
                <div style={{ fontFamily: T.fontMono, fontSize: 13, color: T.positive }}>{fmtN(l.saidas_detectadas)}</div>
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

      <div ref={sentinelaRef} aria-hidden="true" style={{ height: 1 }} />

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
      {erro && <EmptyState icon={Building2} titulo="API indisponível" texto="Não foi possível carregar as revendas agora. Tente novamente em instantes." />}
    </div>
  );
}

/* ============================================================
   AÇÕES — o insight vira tarefa rastreável
   ============================================================ */
function PageAcoes({ acoes, onAdicionar, onAlternar, salvando }) {
  const [novo, setNovo] = useState('');
  const adicionar = async () => {
    if (!novo.trim()) return;
    await onAdicionar(novo.trim(), 'manual');
    setNovo('');
  };
  const pendentes = acoes.filter(a => !a.feita);
  const feitas = acoes.filter(a => a.feita);

  return (
    <div>
      <div style={{ fontSize: 13, color: T.inkMuted, lineHeight: 1.6, maxWidth: 640, marginBottom: 20 }}>
        Dado de mercado diz <em>o que</em> fazer; esta lista registra <em>se foi feito</em>. Crie ações a partir das
        Oportunidades (botão "Criar ação") ou manualmente aqui. As ações ficam salvas com privacidade neste navegador.
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <input value={novo} onChange={e => setNovo(e.target.value)} onKeyDown={e => e.key === 'Enter' && adicionar()}
          placeholder="Nova ação — ex: ligar pra revenda X sobre a carreta parada há 40 dias…" style={{ ...inputStyle, flex: 1 }} />
        <button onClick={adicionar} disabled={salvando} style={{ ...inputStyle, cursor: salvando ? 'wait' : 'pointer', background: T.signal, color: T.signalInk, fontWeight: 600, border: 'none', display: 'flex', gap: 6, alignItems: 'center', opacity: salvando ? 0.6 : 1 }}>
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
            <Card key={a.id} onClick={() => onAlternar(a)} style={{ padding: '13px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
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
              <Card key={a.id} onClick={() => onAlternar(a)} style={{ padding: '13px 16px', display: 'flex', gap: 12, alignItems: 'center', opacity: 0.55 }}>
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
   CENTRAL FIPE — placa e catálogo local em fluxos separados
   ============================================================ */
function PageFipe() {
  const { data: statusPlaca } = useApi('placa_consulta.php?modo=status');
  const [modo, setModo] = useState('placa');
  const [placa, setPlaca] = useState('');
  const [consultando, setConsultando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');

  const placaFormatada = placa.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 7);
  const consultarPlaca = async e => {
    e.preventDefault();
    setErro(''); setResultado(null);
    if (!/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(placaFormatada)) {
      setErro('Digite uma placa válida com 7 caracteres. Exemplo: ABC1D23.');
      return;
    }
    setConsultando(true);
    try {
      const resposta = await fetch(`${API_BASE_URL}/placa_consulta.php?placa=${encodeURIComponent(placaFormatada)}`, { credentials: 'same-origin' });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(dados.erro || 'Não foi possível consultar esta placa.');
      setResultado(dados);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setConsultando(false);
    }
  };

  return <div style={{ maxWidth: 1400 }}>
    <div style={{ color: T.inkMuted, fontSize: 13, lineHeight: 1.6, margin: '-8px 0 16px', maxWidth: 820 }}>
      Consulte um veículo pela placa ou pesquise diretamente no catálogo nacional de caminhões. Os dois caminhos cruzam a FIPE com o mercado monitorado pelo radar.
    </div>

    <div role="tablist" aria-label="Forma de consulta FIPE" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginBottom: 18, maxWidth: 640 }}>
      {[
        { id: 'placa', titulo: 'Consultar por placa', texto: 'Identifique o veículo e encontre a FIPE', icone: ScanLine },
        { id: 'catalogo', titulo: 'Catálogo FIPE', texto: 'Busque por marca, modelo, ano ou código', icone: Search },
      ].map(item => {
        const Icone = item.icone;
        const ativo = modo === item.id;
        return <button key={item.id} role="tab" aria-selected={ativo} onClick={() => setModo(item.id)} style={{
          display: 'flex', alignItems: 'center', gap: 11, minWidth: 0, textAlign: 'left', padding: '12px 14px', cursor: 'pointer',
          background: ativo ? `${T.signal}18` : T.surface, border: `1px solid ${ativo ? T.signal : T.line}`,
          borderRadius: 12, color: ativo ? T.signal : T.ink, fontFamily: T.fontBody,
        }}>
          <Icone size={19} style={{ flexShrink: 0 }} />
          <span style={{ minWidth: 0 }}>
            <strong style={{ display: 'block', fontSize: 13 }}>{item.titulo}</strong>
            <span style={{ display: 'block', color: T.inkMuted, fontSize: 10.5, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.texto}</span>
          </span>
        </button>;
      })}
    </div>

    {modo === 'catalogo' ? <PageFipeCatalogo /> : <>
      <Card style={{ padding: 18, maxWidth: 820 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: T.fontDisplay, fontSize: 17, fontWeight: 600 }}>Identificar veículo</div>
            <div style={{ color: T.inkMuted, fontSize: 12, marginTop: 4 }}>Placa antiga ou Mercosul. Não armazenamos dados pessoais do proprietário.</div>
          </div>
          <Tag tone={statusPlaca?.configurado ? 'positivo' : 'neutro'}>{statusPlaca?.configurado ? 'CONSULTA ATIVA' : 'AGUARDANDO CONECTOR'}</Tag>
        </div>
        <form onSubmit={consultarPlaca} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <ScanLine size={17} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: T.inkMuted }} />
            <input value={placaFormatada} onChange={e => setPlaca(e.target.value)} autoCapitalize="characters" autoCorrect="off" spellCheck="false"
              placeholder="Digite a placa — ABC1D23" aria-label="Placa do veículo" maxLength={7}
              style={{ ...inputStyle, width: '100%', paddingLeft: 40, fontFamily: T.fontMono, fontSize: 17, letterSpacing: '0.12em', textTransform: 'uppercase' }} />
          </div>
          <button disabled={consultando || statusPlaca?.configurado === false} style={{ ...inputStyle, flex: '0 0 auto', border: 'none', background: T.signal, color: T.signalInk, fontWeight: 700, cursor: consultando ? 'wait' : 'pointer', opacity: statusPlaca?.configurado === false ? 0.5 : 1 }}>
            {consultando ? 'Consultando…' : 'Consultar placa'}
          </button>
        </form>
        {statusPlaca?.configurado === false && <div style={{ color: T.inkMuted, background: T.surface2, border: `1px solid ${T.line}`, borderRadius: 9, padding: 11, fontSize: 11.5, lineHeight: 1.55, marginTop: 12 }}>
          A tela está pronta. Para consultar placas, falta somente ativar no servidor a chave de um provedor veicular. O catálogo FIPE continua disponível na opção ao lado.
        </div>}
        {erro && <div role="alert" style={{ color: T.alert, background: `${T.alert}12`, border: `1px solid ${T.alert}30`, borderRadius: 9, padding: 11, fontSize: 12.5, marginTop: 12 }}>{erro}</div>}
      </Card>

      {resultado && <div style={{ marginTop: 18 }}>
        <Card style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div>
              <Tag tone="positivo">PLACA {resultado.placa}</Tag>
              <div style={{ fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 650, marginTop: 12 }}>{[resultado.veiculo?.marca, resultado.veiculo?.modelo].filter(Boolean).join(' ') || 'Veículo identificado'}</div>
              <div style={{ color: T.inkMuted, fontSize: 12, marginTop: 5 }}>{resultado.veiculo?.ano_fabricacao || '—'}/{resultado.veiculo?.ano_modelo || '—'} · {resultado.veiculo?.cor || 'cor não informada'} · {[resultado.veiculo?.cidade, resultado.veiculo?.uf].filter(Boolean).join('/') || 'localidade não informada'}</div>
            </div>
            <div style={{ color: T.inkMuted, fontFamily: T.fontMono, fontSize: 10.5 }}>consulta {new Date(resultado.consultado_em).toLocaleString('pt-BR')}</div>
          </div>
        </Card>

        <SectionTitle sub="A placa pode retornar mais de uma versão compatível; confirme configuração e ano antes de negociar">Referências encontradas</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 310px), 1fr))', gap: 12 }}>
          {(resultado.fipes || []).map((item, indice) => {
            const mercado = item.mercado;
            const fipe = mercado?.preco_local ?? item.preco_fipe;
            const desvio = mercado?.preco_medio_mercado && fipe ? ((mercado.preco_medio_mercado - fipe) / fipe) * 100 : null;
            return <Card key={`${item.codigo_fipe}-${item.codigo_ano}-${indice}`} style={{ padding: 17 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><Tag tone="sinal">{item.marca || resultado.veiculo?.marca || 'FIPE'}</Tag><span style={{ fontFamily: T.fontMono, color: T.inkMuted, fontSize: 11 }}>{item.ano || item.codigo_ano || '—'}</span></div>
              <div style={{ fontFamily: T.fontDisplay, fontWeight: 600, lineHeight: 1.4, marginTop: 12 }}>{item.modelo || resultado.veiculo?.modelo || 'Versão não informada'}</div>
              <div style={{ color: T.inkMuted, fontFamily: T.fontMono, fontSize: 10.5, marginTop: 5 }}>{item.codigo_fipe || 'sem código'} · {mercado?.mes_referencia || item.referencia || 'referência atual'}</div>
              <div style={{ fontFamily: T.fontDisplay, fontSize: 25, fontWeight: 650, marginTop: 16 }}>{fmtBRL(fipe)}</div>
              <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 12, marginTop: 14 }}>
                {mercado?.anuncios_ativos > 0 ? <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12 }}><span style={{ color: T.inkMuted }}>Média no radar</span><strong>{fmtBRL(mercado.preco_medio_mercado)}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11, marginTop: 7 }}><span style={{ color: T.inkMuted }}>{fmtN(mercado.anuncios_ativos)} ofertas equivalentes</span><span style={{ color: desvio <= 0 ? T.positive : T.signal }}>{desvio == null ? '—' : `${desvio > 0 ? '+' : ''}${desvio.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% vs FIPE`}</span></div>
                </> : <div style={{ color: T.inkMuted, fontSize: 11.5 }}>Sem ofertas equivalentes ativas no radar.</div>}
              </div>
            </Card>;
          })}
        </div>
        {resultado.fipes?.length === 0 && <EmptyState icon={Search} titulo="Veículo identificado, sem FIPE retornada" texto="Use o catálogo por marca e modelo para localizar a referência manualmente." />}
      </div>}
    </>}
  </div>;
}

function PageFipeCatalogo() {
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [marca, setMarca] = useState('todas');
  const [modeloId, setModeloId] = useState('todos');
  const [ano, setAno] = useState('todos');
  const [ordem, setOrdem] = useState('mercado');
  const [pagina, setPagina] = useState(0);
  const porPagina = 40;

  useEffect(() => {
    const timer = setTimeout(() => setBuscaAplicada(busca.trim()), 350);
    return () => clearTimeout(timer);
  }, [busca]);

  useEffect(() => setPagina(0), [buscaAplicada, marca, modeloId, ano, ordem]);

  const facetasPath = useMemo(() => {
    const p = new URLSearchParams({ modo: 'facetas' });
    if (marca !== 'todas') p.set('marca', marca);
    if (modeloId !== 'todos') p.set('modelo_id', modeloId);
    return `fipe_consulta.php?${p.toString()}`;
  }, [marca, modeloId]);
  const { data: facetas, erro: erroFacetas } = useApi(facetasPath);

  const buscaPath = useMemo(() => {
    const p = new URLSearchParams({ modo: 'buscar', ordem, limit: String(porPagina), offset: String(pagina * porPagina) });
    if (buscaAplicada) p.set('q', buscaAplicada);
    if (marca !== 'todas') p.set('marca', marca);
    if (modeloId !== 'todos') p.set('modelo_id', modeloId);
    if (ano !== 'todos') p.set('ano', ano);
    return `fipe_consulta.php?${p.toString()}`;
  }, [buscaAplicada, marca, modeloId, ano, ordem, pagina]);
  const { data: resultado, erro: erroBusca } = useApi(buscaPath);

  const limpar = () => {
    setBusca(''); setMarca('todas'); setModeloId('todos'); setAno('todos'); setOrdem('mercado'); setPagina(0);
  };
  const total = Number(resultado?.total || 0);
  const inicio = total ? pagina * porPagina + 1 : 0;
  const fim = Math.min((pagina + 1) * porPagina, total);
  const temFiltros = busca || marca !== 'todas' || modeloId !== 'todos' || ano !== 'todos';

  return (
    <div style={{ maxWidth: 1400 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 210px), 1fr))', gap: 12 }}>
        <Kpi label="Modelos de caminhão" value={facetas ? fmtN(facetas.resumo?.modelos) : '—'} sub={`${fmtN(facetas?.resumo?.marcas)} marcas no catálogo`} />
        <Kpi label="Preços disponíveis" value={facetas ? fmtN(facetas.resumo?.precos) : '—'} sub="anos e versões consultáveis" />
        <Kpi label="Referência vigente" value={facetas?.resumo?.referencia || '—'} sub={facetas?.resumo?.referencia_codigo ? `código ${facetas.resumo.referencia_codigo}` : 'carregando referência'} tone={T.positive} />
      </div>

      <SectionTitle sub="Marca, versão e ano refinam a referência sem sair do OPER RADAR">Encontrar veículo</SectionTitle>
      <Card style={{ padding: 16 }}>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={17} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: T.inkMuted }} />
          <input value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Busque por modelo, marca ou código FIPE — ex: Actros 2651"
            style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', paddingLeft: 40, minHeight: 44 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))', gap: 10 }}>
          <label>
            <div style={rotuloFiltroStyle}>MARCA</div>
            <select value={marca} onChange={e => { setMarca(e.target.value); setModeloId('todos'); setAno('todos'); }} style={{ ...inputStyle, width: '100%' }}>
              <option value="todas">Todas as marcas</option>
              {(facetas?.marcas || []).map(item => <option key={item.marca} value={item.marca}>{item.marca} · {fmtN(item.modelos)}</option>)}
            </select>
          </label>
          <label>
            <div style={rotuloFiltroStyle}>MODELO / VERSÃO</div>
            <select value={modeloId} disabled={marca === 'todas'} onChange={e => { setModeloId(e.target.value); setAno('todos'); }} style={{ ...inputStyle, width: '100%', opacity: marca === 'todas' ? 0.5 : 1 }}>
              <option value="todos">Todos os modelos</option>
              {(facetas?.modelos || []).map(item => <option key={item.id} value={item.id}>{item.modelo}</option>)}
            </select>
          </label>
          <label>
            <div style={rotuloFiltroStyle}>ANO MODELO</div>
            <select value={ano} disabled={modeloId === 'todos'} onChange={e => setAno(e.target.value)} style={{ ...inputStyle, width: '100%', opacity: modeloId === 'todos' ? 0.5 : 1 }}>
              <option value="todos">Todos os anos</option>
              {(facetas?.anos || []).map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <div style={rotuloFiltroStyle}>ORDENAR</div>
            <select value={ordem} onChange={e => setOrdem(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
              <option value="mercado">Mais presentes no radar</option>
              <option value="modelo">Marca e modelo</option>
              <option value="ano_desc">Ano mais recente</option>
              <option value="preco_asc">Menor valor FIPE</option>
              <option value="preco_desc">Maior valor FIPE</option>
            </select>
          </label>
        </div>
        {temFiltros && <button onClick={limpar} style={{ ...inputStyle, marginTop: 12, cursor: 'pointer', color: T.inkMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
          <RotateCcw size={13} /> Limpar consulta
        </button>}
      </Card>

      <SectionTitle sub={resultado ? `${fmtN(total)} referências encontradas · mostrando ${fmtN(inicio)}–${fmtN(fim)}` : 'Consultando o catálogo local'}>Resultados</SectionTitle>
      {(erroFacetas || erroBusca) ? (
        <EmptyState icon={Gauge} titulo="Consulta FIPE indisponível" texto="O catálogo está preservado. Confirme a publicação do endpoint fipe_consulta.php no servidor." />
      ) : !resultado ? (
        <EmptyState icon={Search} titulo="Consultando catálogo" texto="Carregando modelos, anos e comparação com o mercado monitorado." />
      ) : resultado.itens?.length === 0 ? (
        <EmptyState icon={Search} titulo="Nenhuma referência encontrada" texto="Tente somente o número do modelo, outra marca ou remova alguns filtros." />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 12 }}>
            {resultado.itens.map(item => {
              const desvio = item.desvio_medio_pct;
              const tomDesvio = desvio == null ? 'neutro' : desvio <= 0 ? 'positivo' : desvio >= 20 ? 'alerta' : 'sinal';
              return <Card key={item.id} style={{ padding: 17, display: 'flex', flexDirection: 'column', minHeight: 252 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                  <Tag tone="sinal">{item.marca}</Tag>
                  <span style={{ fontFamily: T.fontMono, color: T.inkMuted, fontSize: 11 }}>{item.ano}</span>
                </div>
                <div style={{ fontFamily: T.fontDisplay, fontWeight: 600, fontSize: 16, lineHeight: 1.35, margin: '13px 0 5px' }}>{item.modelo}</div>
                <div style={{ fontFamily: T.fontMono, color: T.inkMuted, fontSize: 10.5 }}>FIPE {item.codigo_fipe} · {item.mes_referencia}</div>
                <div style={{ fontFamily: T.fontDisplay, fontSize: 27, fontWeight: 650, marginTop: 16, color: T.ink }}>{fmtBRL(item.preco_fipe)}</div>
                <div style={{ borderTop: `1px solid ${T.line}`, marginTop: 15, paddingTop: 13 }}>
                  {item.anuncios_ativos > 0 ? <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 9, alignItems: 'center' }}>
                      <span style={{ color: T.inkMuted, fontSize: 12 }}>{fmtN(item.anuncios_ativos)} no radar</span>
                      <Tag tone={tomDesvio}>{desvio > 0 ? '+' : ''}{desvio ?? '—'}% vs FIPE</Tag>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11.5 }}>
                      <div><span style={{ color: T.inkMuted }}>média</span><br /><strong>{fmtBRL(item.preco_medio_mercado)}</strong></div>
                      <div><span style={{ color: T.inkMuted }}>menor oferta</span><br /><strong>{fmtBRL(item.menor_anuncio)}</strong></div>
                    </div>
                    <div style={{ color: T.inkMuted, fontSize: 10.5, marginTop: 10 }}>{item.abaixo_fipe ? `${fmtN(item.abaixo_fipe)} abaixo da FIPE` : 'nenhum abaixo da FIPE'}{item.ufs?.length ? ` · ${item.ufs.join(', ')}` : ''}</div>
                  </> : <div style={{ color: T.inkMuted, fontSize: 12, lineHeight: 1.5 }}>Sem anúncio vinculado no radar nesta versão.</div>}
                </div>
              </Card>;
            })}
          </div>
          {total > porPagina && <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 18 }}>
            <button disabled={pagina === 0} onClick={() => setPagina(v => Math.max(0, v - 1))} style={{ ...inputStyle, cursor: pagina === 0 ? 'default' : 'pointer', opacity: pagina === 0 ? 0.45 : 1 }}>Anterior</button>
            <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.inkMuted }}>Página {pagina + 1} de {Math.ceil(total / porPagina)}</span>
            <button disabled={fim >= total} onClick={() => setPagina(v => v + 1)} style={{ ...inputStyle, cursor: fim >= total ? 'default' : 'pointer', opacity: fim >= total ? 0.45 : 1 }}>Próxima</button>
          </div>}
        </>
      )}

      <Card style={{ marginTop: 22, background: `${T.steel}12`, padding: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <ShieldCheck size={18} style={{ color: T.steel, flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: T.inkMuted, lineHeight: 1.65 }}>
            <strong style={{ color: T.ink }}>Leitura correta:</strong> a FIPE é uma referência nacional. Configuração, implementos, estado de conservação, região e condição comercial podem explicar diferenças. A comparação do radar usa somente anúncios vinculados à mesma versão e ao mesmo ano FIPE.
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ============================================================
   ACESSO, CONTA E ESTOQUE PRÓPRIO
   ============================================================ */
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const entrar = async e => {
    e.preventDefault();
    setErro(''); setEnviando(true);
    try {
      const sessao = await apiPost('auth.php', { acao: 'login', email, senha });
      onLogin(sessao);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setEnviando(false);
    }
  };

  return <div style={{ minHeight: '100%', display: 'grid', placeItems: 'center', padding: 20, background: `radial-gradient(circle at 72% 18%, ${T.signal}18, transparent 34%), ${T.bg}`, color: T.ink, fontFamily: T.fontBody }}>
    <div style={{ width: 'min(100%, 430px)' }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontFamily: T.fontDisplay, fontWeight: 700, fontSize: 20 }}>OPER<span style={{ color: T.signal }}> RADAR</span></div>
        <div style={{ color: T.inkMuted, fontSize: 12.5, marginTop: 5 }}>Inteligência de mercado para transporte pesado</div>
      </div>
      <Card style={{ padding: 26, boxShadow: T.shadow }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, display: 'grid', placeItems: 'center', background: `${T.signal}18`, color: T.signal, marginBottom: 18 }}><LockKeyhole size={20} /></div>
        <h1 style={{ fontFamily: T.fontDisplay, fontSize: 23, margin: '0 0 7px' }}>Acesse sua área</h1>
        <p style={{ color: T.inkMuted, fontSize: 13, lineHeight: 1.55, margin: '0 0 20px' }}>Dados de mercado, FIPE e seu estoque em um ambiente privado.</p>
        <form onSubmit={entrar} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <label style={{ fontSize: 12, color: T.inkMuted }}>E-mail
            <input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} style={{ ...inputStyle, width: '100%', marginTop: 6 }} placeholder="seu@email.com" />
          </label>
          <label style={{ fontSize: 12, color: T.inkMuted }}>Senha
            <input type="password" autoComplete="current-password" required value={senha} onChange={e => setSenha(e.target.value)} style={{ ...inputStyle, width: '100%', marginTop: 6 }} placeholder="Sua senha" />
          </label>
          {erro && <div role="alert" style={{ color: T.alert, background: `${T.alert}12`, border: `1px solid ${T.alert}30`, borderRadius: 9, padding: 10, fontSize: 12.5 }}>{erro}</div>}
          <button disabled={enviando} style={{ ...inputStyle, border: 'none', background: T.signal, color: T.signalInk, fontWeight: 700, cursor: enviando ? 'wait' : 'pointer' }}>{enviando ? 'Entrando…' : 'Entrar no radar'}</button>
        </form>
      </Card>
      <div style={{ display: 'flex', gap: 7, alignItems: 'center', justifyContent: 'center', color: T.inkMuted, fontSize: 11.5, marginTop: 16 }}><ShieldCheck size={14} /> Sessão protegida e senha criptografada</div>
    </div>
  </div>;
}

function PageConta({ sessao, onSessao, onLogout }) {
  const [nome, setNome] = useState(sessao.usuario.nome);
  const [senhas, setSenhas] = useState({ atual: '', nova: '' });
  const [aviso, setAviso] = useState(null);
  const [salvando, setSalvando] = useState(false);

  const salvarPerfil = async () => {
    setSalvando(true); setAviso(null);
    try {
      const d = await apiPost('auth.php', { acao: 'perfil', nome }, sessao.csrf);
      onSessao({ ...sessao, usuario: d.usuario, csrf: d.csrf });
      setAviso({ ok: true, texto: 'Perfil atualizado.' });
    } catch (e) { setAviso({ ok: false, texto: e.message }); }
    finally { setSalvando(false); }
  };
  const trocarSenha = async () => {
    setSalvando(true); setAviso(null);
    try {
      const d = await apiPost('auth.php', { acao: 'senha', senha_atual: senhas.atual, nova_senha: senhas.nova }, sessao.csrf);
      onSessao({ ...sessao, csrf: d.csrf });
      setSenhas({ atual: '', nova: '' });
      setAviso({ ok: true, texto: 'Senha alterada com segurança.' });
    } catch (e) { setAviso({ ok: false, texto: e.message }); }
    finally { setSalvando(false); }
  };

  return <div style={{ maxWidth: 820 }}>
    <SectionTitle sub="Seus dados, nível de acesso e segurança da conta">Área de membros</SectionTitle>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 12 }}>
      <Card>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', background: `${T.signal}18`, color: T.signal }}><UserRound size={21} /></div>
          <div><strong>{sessao.usuario.nome}</strong><div style={{ color: T.inkMuted, fontSize: 12 }}>{sessao.usuario.email}</div></div>
          <Tag tone="sinal">{String(sessao.usuario.papel || 'membro').toUpperCase()}</Tag>
        </div>
        <label style={{ fontSize: 12, color: T.inkMuted }}>Nome
          <input value={nome} onChange={e => setNome(e.target.value)} style={{ ...inputStyle, width: '100%', marginTop: 6 }} />
        </label>
        <button onClick={salvarPerfil} disabled={salvando || nome.trim() === sessao.usuario.nome} style={{ ...inputStyle, marginTop: 12, border: 'none', background: T.signal, color: T.signalInk, fontWeight: 700, cursor: 'pointer' }}><Save size={15} style={{ verticalAlign: -3, marginRight: 6 }} />Salvar perfil</button>
      </Card>
      <Card>
        <div style={{ display: 'flex', gap: 9, alignItems: 'center', marginBottom: 16 }}><LockKeyhole size={18} color={T.steel} /><strong>Alterar senha</strong></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          <input type="password" autoComplete="current-password" value={senhas.atual} onChange={e => setSenhas(s => ({ ...s, atual: e.target.value }))} style={inputStyle} placeholder="Senha atual" />
          <input type="password" autoComplete="new-password" value={senhas.nova} onChange={e => setSenhas(s => ({ ...s, nova: e.target.value }))} style={inputStyle} placeholder="Nova senha · mínimo 10 caracteres" />
          <button onClick={trocarSenha} disabled={salvando || !senhas.atual || senhas.nova.length < 10} style={{ ...inputStyle, cursor: 'pointer', fontWeight: 650 }}>Atualizar senha</button>
        </div>
      </Card>
    </div>
    {aviso && <div style={{ color: aviso.ok ? T.positive : T.alert, fontSize: 12.5, marginTop: 12 }}>{aviso.texto}</div>}
    <Card style={{ marginTop: 16, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
      <div><strong>Sessão atual</strong><div style={{ color: T.inkMuted, fontSize: 12, marginTop: 3 }}>Ao sair, será necessário informar a senha novamente.</div></div>
      <button onClick={onLogout} style={{ ...inputStyle, color: T.alert, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}><LogOut size={15} />Sair da conta</button>
    </Card>
  </div>;
}

const NOVO_VEICULO = { referencia_interna: '', marca: '', modelo: '', ano: '', preco_anunciado: '', cidade: '', uf: '', data_entrada: new Date().toISOString().slice(0, 10), status: 'estoque', fipe_preco_id: null };

function PageMinhaLoja({ sessao }) {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [formAberto, setFormAberto] = useState(false);
  const [form, setForm] = useState(NOVO_VEICULO);
  const [comparacao, setComparacao] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [xmlAberto, setXmlAberto] = useState(false);
  const [xmlEstado, setXmlEstado] = useState({ arquivo: null, analisando: false, importando: false, analise: null, resultado: null, erro: '' });
  const [xmlOpcoes, setXmlOpcoes] = useState({ usar_comparativo: true, marcar_ausentes: false });

  const carregar = async () => {
    setCarregando(true); setErro('');
    try {
      const r = await fetch(`${API_BASE_URL}/minha_loja.php`, { credentials: 'same-origin' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro || 'Estoque indisponível.');
      setItens(d.itens || []);
    } catch (e) { setErro(e.message); }
    finally { setCarregando(false); }
  };
  useEffect(() => { carregar(); }, []);

  const comparar = async () => {
    if (form.modelo.trim().length < 2) return null;
    setComparacao({ carregando: true });
    try {
      const q = [form.marca, form.modelo, form.ano].filter(Boolean).join(' ');
      const r = await fetch(`${API_BASE_URL}/fipe_consulta.php?modo=buscar&q=${encodeURIComponent(q)}&limit=1`, { credentials: 'same-origin' });
      const d = await r.json();
      const item = d.itens?.[0] || null;
      setComparacao(item || { vazio: true });
      return item;
    } catch { setComparacao({ vazio: true }); return null; }
  };
  const salvar = async () => {
    if (form.modelo.trim().length < 2) { setErro('Informe o modelo do veículo.'); return; }
    setSalvando(true); setErro('');
    try {
      const sugestao = comparacao && !comparacao.carregando && !comparacao.vazio ? comparacao : null;
      await apiPost('minha_loja.php', { acao: 'criar', ...form, fipe_preco_id: sugestao?.id || null }, sessao.csrf);
      setForm(NOVO_VEICULO); setComparacao(null); setFormAberto(false);
      await carregar();
    } catch (e) { setErro(e.message); }
    finally { setSalvando(false); }
  };
  const excluir = async id => {
    if (!window.confirm('Remover este veículo do seu estoque?')) return;
    try { await apiPost('minha_loja.php', { acao: 'excluir', id }, sessao.csrf); setItens(v => v.filter(i => i.id !== id)); }
    catch (e) { setErro(e.message); }
  };
  const alterarStatus = async (item, status) => {
    const anterior = item.status;
    setItens(lista => lista.map(i => i.id === item.id ? { ...i, status } : i));
    try {
      await apiPost('minha_loja.php', {
        acao: 'atualizar', id: item.id, referencia_interna: item.referencia_interna,
        marca: item.marca, modelo: item.modelo, ano: item.ano,
        preco_anunciado: item.preco_anunciado, cidade: item.cidade, uf: item.uf,
        data_entrada: item.data_entrada, status, fipe_preco_id: item.fipe_preco_id,
      }, sessao.csrf);
    } catch (e) {
      setItens(lista => lista.map(i => i.id === item.id ? { ...i, status: anterior } : i));
      setErro(e.message);
    }
  };

  const enviarXml = async (arquivo, acao) => {
    const corpo = new FormData();
    corpo.append('arquivo', arquivo);
    corpo.append('usar_comparativo', xmlOpcoes.usar_comparativo ? '1' : '0');
    corpo.append('marcar_ausentes', xmlOpcoes.marcar_ausentes ? '1' : '0');
    const r = await fetch(`${API_BASE_URL}/minha_loja_xml.php?acao=${acao}`, {
      method: 'POST', body: corpo, credentials: 'same-origin', headers: { 'X-CSRF-Token': sessao.csrf },
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.erro || 'Não foi possível processar o XML.');
    return d;
  };

  const selecionarXml = async e => {
    const arquivo = e.target.files?.[0] || null;
    if (!arquivo) return;
    if (arquivo.size > 20 * 1024 * 1024) {
      setXmlEstado({ arquivo: null, analisando: false, importando: false, analise: null, resultado: null, erro: 'O XML deve ter no máximo 20 MB.' });
      return;
    }
    setXmlEstado({ arquivo, analisando: true, importando: false, analise: null, resultado: null, erro: '' });
    try {
      const analise = await enviarXml(arquivo, 'analisar');
      setXmlEstado({ arquivo, analisando: false, importando: false, analise, resultado: null, erro: '' });
    } catch (e2) {
      setXmlEstado({ arquivo, analisando: false, importando: false, analise: null, resultado: null, erro: e2.message });
    }
  };

  const importarXml = async () => {
    if (!xmlEstado.arquivo || !xmlEstado.analise) return;
    setXmlEstado(v => ({ ...v, importando: true, erro: '', resultado: null }));
    try {
      const resultado = await enviarXml(xmlEstado.arquivo, 'importar');
      setXmlEstado(v => ({ ...v, importando: false, resultado }));
      await carregar();
    } catch (e) { setXmlEstado(v => ({ ...v, importando: false, erro: e.message })); }
  };

  const ativos = itens.filter(i => i.status !== 'vendido');
  const valor = ativos.reduce((s, i) => s + Number(i.preco_anunciado || 0), 0);
  const mediaDias = ativos.length ? Math.round(ativos.reduce((s, i) => s + Number(i.dias_estoque || 0), 0) / ativos.length) : 0;
  const vinculados = ativos.filter(i => i.fipe_preco_id && Number(i.usar_comparativo ?? 1) === 1).length;

  return <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
      <SectionTitle sub="Seu estoque publicado como base interna de comparação com FIPE e mercado">Meu estoque</SectionTitle>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => { setXmlAberto(v => !v); setFormAberto(false); }} style={{ ...inputStyle, cursor: 'pointer', display: 'flex', gap: 7, alignItems: 'center' }}><UploadCloud size={16} />{xmlAberto ? 'Fechar XML' : 'Importar XML'}</button>
        <button onClick={() => { setFormAberto(v => !v); setXmlAberto(false); }} style={{ ...inputStyle, border: 'none', background: T.signal, color: T.signalInk, fontWeight: 700, cursor: 'pointer', display: 'flex', gap: 7, alignItems: 'center' }}>{formAberto ? <X size={16} /> : <Plus size={16} />}{formAberto ? 'Fechar' : 'Adicionar veículo'}</button>
      </div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))', gap: 10 }}>
      <Kpi label="No estoque" value={fmtN(ativos.length)} sub="veículos próprios" />
      <Kpi label="Valor anunciado" value={fmtBRL(valor)} sub="soma do estoque ativo" />
      <Kpi label="Idade média" value={`${mediaDias}d`} sub="tempo em estoque" />
      <Kpi label="Comparados" value={`${vinculados}/${ativos.length}`} sub="vínculo FIPE automático" tone={T.positive} />
    </div>

    {xmlAberto && <Card style={{ marginTop: 16, borderColor: `${T.signal}55` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, marginBottom: 15 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center', background: `${T.signal}16`, color: T.signal, flex: '0 0 auto' }}><FileText size={19} /></div>
        <div><strong>Sincronizar estoque por XML</strong><div style={{ color: T.inkMuted, fontSize: 12, lineHeight: 1.5, marginTop: 3 }}>Primeiro analisamos o arquivo. Nada é alterado até sua confirmação. Limite de 20 MB.</div></div>
      </div>
      <label style={{ display: 'grid', placeItems: 'center', minHeight: 104, padding: 16, border: `1px dashed ${T.lineStrong}`, borderRadius: 11, background: T.surface2, cursor: 'pointer', textAlign: 'center' }}>
        <UploadCloud size={23} color={T.steel} />
        <strong style={{ fontSize: 12.5, marginTop: 7 }}>{xmlEstado.arquivo?.name || 'Selecionar arquivo XML'}</strong>
        <span style={{ color: T.inkMuted, fontSize: 11, marginTop: 3 }}>veículos, preços e localização serão reconhecidos automaticamente</span>
        <input type="file" accept=".xml,text/xml,application/xml" onChange={selecionarXml} style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }} />
      </label>
      {xmlEstado.analisando && <div style={{ color: T.inkMuted, fontSize: 12, marginTop: 12 }}>Analisando estrutura e validando veículos…</div>}
      {xmlEstado.erro && <div role="alert" style={{ color: T.alert, fontSize: 12, marginTop: 12 }}>{xmlEstado.erro}</div>}
      {xmlEstado.analise && <div style={{ marginTop: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
          {[['Válidos', xmlEstado.analise.resumo.validos], ['Com preço', xmlEstado.analise.resumo.com_preco], ['Identificados', xmlEstado.analise.resumo.com_referencia], ['Ignorados', xmlEstado.analise.resumo.ignorados + xmlEstado.analise.resumo.duplicados]].map(([rotulo, valor]) => <div key={rotulo} style={{ padding: 10, borderRadius: 8, background: T.surface2 }}><small style={{ color: T.inkMuted }}>{rotulo}</small><div style={{ fontFamily: T.fontMono, fontSize: 16, marginTop: 3 }}>{fmtN(valor)}</div></div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 7, marginTop: 12 }}>{(xmlEstado.analise.amostra || []).slice(0, 5).map((i, idx) => <div key={`${i.referencia_interna}-${idx}`} style={{ minWidth: 0, padding: 10, border: `1px solid ${T.line}`, borderRadius: 8, background: T.surface2 }}><div style={{ color: T.inkMuted, fontFamily: T.fontMono, fontSize: 9.5 }}>{i.referencia_interna || i.placa || 'SEM REFERÊNCIA'}</div><strong style={{ display: 'block', fontSize: 11.5, marginTop: 4, overflowWrap: 'anywhere' }}>{[i.marca, i.modelo].filter(Boolean).join(' ')}</strong><div style={{ color: T.inkMuted, fontSize: 10.5, marginTop: 4 }}>{i.ano || '—'} · {fmtBRL(i.preco_anunciado)} · {[i.cidade, i.uf].filter(Boolean).join('/') || '—'}</div></div>)}</div>
        <div style={{ display: 'grid', gap: 9, marginTop: 13 }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, color: T.ink, fontSize: 12 }}><input type="checkbox" checked={xmlOpcoes.usar_comparativo} onChange={e => setXmlOpcoes(v => ({ ...v, usar_comparativo: e.target.checked }))} /> <span><strong>Publicar no comparativo do Radar</strong><br /><span style={{ color: T.inkMuted }}>Usa preço, FIPE e mercado dentro da área autenticada; placa não é exposta.</span></span></label>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, color: T.ink, fontSize: 12 }}><input type="checkbox" checked={xmlOpcoes.marcar_ausentes} onChange={e => setXmlOpcoes(v => ({ ...v, marcar_ausentes: e.target.checked }))} /> <span><strong>Marcar ausentes como vendidos</strong><br /><span style={{ color: T.inkMuted }}>Ative apenas quando o XML representar todo o estoque atual da loja.</span></span></label>
        </div>
        <button onClick={importarXml} disabled={xmlEstado.importando} style={{ ...inputStyle, marginTop: 14, border: 'none', background: T.signal, color: T.signalInk, fontWeight: 700, cursor: 'pointer' }}>{xmlEstado.importando ? 'Sincronizando…' : `Confirmar ${fmtN(xmlEstado.analise.resumo.validos)} veículos`}</button>
      </div>}
      {xmlEstado.resultado && <div role="status" style={{ marginTop: 13, padding: 11, borderRadius: 9, background: `${T.positive}12`, border: `1px solid ${T.positive}35`, color: T.positive, fontSize: 12.5 }}><strong>Estoque sincronizado.</strong> {fmtN(xmlEstado.resultado.novos)} novos, {fmtN(xmlEstado.resultado.atualizados)} atualizados e {fmtN(xmlEstado.resultado.ausentes_marcados_vendidos)} ausentes marcados como vendidos.</div>}
    </Card>}

    {formAberto && <Card style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}><Store size={18} color={T.signal} /><strong>Novo veículo</strong></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 170px), 1fr))', gap: 10 }}>
        <input value={form.referencia_interna} onChange={e => setForm(f => ({ ...f, referencia_interna: e.target.value }))} style={inputStyle} placeholder="Referência interna" />
        <input value={form.marca} onChange={e => { setForm(f => ({ ...f, marca: e.target.value })); setComparacao(null); }} style={inputStyle} placeholder="Marca · ex: Scania" />
        <input value={form.modelo} onChange={e => { setForm(f => ({ ...f, modelo: e.target.value })); setComparacao(null); }} style={inputStyle} placeholder="Modelo · ex: R450" />
        <input type="number" min="1950" max="2030" value={form.ano} onChange={e => { setForm(f => ({ ...f, ano: e.target.value })); setComparacao(null); }} style={inputStyle} placeholder="Ano" />
        <input type="number" min="0" step="1000" value={form.preco_anunciado} onChange={e => setForm(f => ({ ...f, preco_anunciado: e.target.value }))} style={inputStyle} placeholder="Preço anunciado" />
        <input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} style={inputStyle} placeholder="Cidade" />
        <select value={form.uf} onChange={e => setForm(f => ({ ...f, uf: e.target.value }))} style={inputStyle}><option value="">UF</option>{Object.keys(NOMES_UF).sort().map(uf => <option key={uf}>{uf}</option>)}</select>
        <input type="date" value={form.data_entrada} onChange={e => setForm(f => ({ ...f, data_entrada: e.target.value }))} style={inputStyle} />
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 13 }}>
        <button onClick={comparar} disabled={form.modelo.trim().length < 2} style={{ ...inputStyle, cursor: 'pointer' }}><Search size={15} style={{ verticalAlign: -3, marginRight: 6 }} />Comparar com FIPE</button>
        <button onClick={salvar} disabled={salvando} style={{ ...inputStyle, border: 'none', background: T.signal, color: T.signalInk, fontWeight: 700, cursor: 'pointer' }}>{salvando ? 'Salvando…' : 'Salvar no estoque'}</button>
      </div>
      {comparacao?.carregando && <div style={{ color: T.inkMuted, fontSize: 12, marginTop: 12 }}>Procurando a melhor referência…</div>}
      {comparacao?.vazio && <div style={{ color: T.inkMuted, fontSize: 12, marginTop: 12 }}>Nenhuma referência segura encontrada. O veículo pode ser salvo sem vínculo.</div>}
      {comparacao?.id && <div style={{ marginTop: 12, padding: 12, borderRadius: 10, background: `${T.positive}0F`, border: `1px solid ${T.positive}2A`, fontSize: 12.5 }}><strong style={{ color: T.positive }}>Referência encontrada:</strong> {comparacao.marca} {comparacao.modelo} · {comparacao.ano} · FIPE {fmtBRL(comparacao.preco_fipe)} · mercado {fmtBRL(comparacao.preco_medio_mercado)}</div>}
    </Card>}

    {erro && <div role="alert" style={{ color: T.alert, fontSize: 12.5, marginTop: 12 }}>{erro}</div>}
    <SectionTitle sub="Preço próprio versus referência e anúncios ativos equivalentes">Comparativo da loja</SectionTitle>
    {carregando ? <Card><span style={{ color: T.inkMuted }}>Carregando seu estoque…</span></Card> : itens.length === 0 ? <EmptyState icon={Store} titulo="Seu estoque começa aqui" texto="Adicione os veículos da sua loja para comparar preço, idade e posicionamento contra a FIPE e o mercado monitorado." /> :
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 290px), 1fr))', gap: 11 }}>
        {itens.map(item => {
          const mercado = Number(item.preco_medio_mercado || 0);
          const preco = Number(item.preco_anunciado || 0);
          const delta = mercado && preco ? Math.round((preco / mercado - 1) * 100) : null;
          return <Card key={item.id} style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><select aria-label="Status do veículo" value={item.status} onChange={e => alterarStatus(item, e.target.value)} style={{ ...inputStyle, minHeight: 30, padding: '4px 8px', fontSize: 10.5, color: item.status === 'estoque' ? T.positive : T.inkMuted }}><option value="estoque">NO ESTOQUE</option><option value="reservado">RESERVADO</option><option value="vendido">VENDIDO</option></select>{item.origem === 'xml' && <Tag tone="sinal">XML</Tag>}</div><button aria-label="Excluir veículo" onClick={() => excluir(item.id)} style={{ border: 'none', background: 'transparent', color: T.inkMuted, cursor: 'pointer', minHeight: 30 }}><Trash2 size={15} /></button></div>
            <div style={{ fontFamily: T.fontDisplay, fontSize: 16, fontWeight: 650, marginTop: 12 }}>{[item.marca, item.modelo].filter(Boolean).join(' ')}</div>
            <div style={{ color: T.inkMuted, fontSize: 11.5, marginTop: 4 }}>{item.ano || 'Ano não informado'} · {[item.cidade, item.uf].filter(Boolean).join('/') || 'local não informado'} · {item.dias_estoque} dias{item.quilometragem ? ` · ${fmtN(item.quilometragem)} km` : ''}</div>
            <div style={{ fontFamily: T.fontMono, fontSize: 19, fontWeight: 650, marginTop: 15 }}>{fmtBRL(item.preco_anunciado)}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
              <div style={{ background: T.surface2, borderRadius: 8, padding: 9 }}><small style={{ color: T.inkMuted }}>FIPE</small><div style={{ fontFamily: T.fontMono, fontSize: 11.5, marginTop: 3 }}>{fmtBRL(item.preco_fipe)}</div></div>
              <div style={{ background: T.surface2, borderRadius: 8, padding: 9 }}><small style={{ color: T.inkMuted }}>Mercado</small><div style={{ fontFamily: T.fontMono, fontSize: 11.5, marginTop: 3 }}>{fmtBRL(item.preco_medio_mercado)}</div></div>
            </div>
            <div style={{ marginTop: 11, color: delta == null ? T.inkMuted : delta <= 0 ? T.positive : T.alert, fontSize: 12 }}>{Number(item.usar_comparativo ?? 1) !== 1 ? 'Fora da base comparativa' : delta == null ? 'Aguardando comparação compatível' : `${Math.abs(delta)}% ${delta <= 0 ? 'abaixo' : 'acima'} da média · ${fmtN(item.anuncios_ativos)} anúncios comparáveis`}</div>
          </Card>;
        })}
      </div>}
  </div>;
}

/* ============================================================
   CONFIGURAÇÕES
   ============================================================ */
function DashboardPreview({ layout, mode }) {
  const sectionLabel = Object.fromEntries(DASHBOARD_SECTIONS.map(item => [item.id, item.label]));
  const mobile = mode === 'mobile';
  return (
    <div aria-hidden="true" style={{ width: mobile ? 270 : '100%', maxWidth: '100%', margin: '0 auto', border: `1px solid ${T.lineStrong}`, borderRadius: 12, background: T.bg, padding: mobile ? 10 : 14, transition: 'width 180ms ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: T.inkMuted, fontFamily: T.fontMono, fontSize: 8.5, marginBottom: 9 }}><span>HOJE</span><span>{mobile ? 'MOBILE' : 'DESKTOP'}</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : `repeat(${Math.min(4, layout.kpis.length)}, minmax(0, 1fr))`, gap: 5 }}>
        {layout.kpis.map(id => <div key={id} style={{ minHeight: 42, borderRadius: 6, background: T.surface2, border: `1px solid ${T.line}`, padding: 6 }}><div style={{ width: '65%', height: 4, borderRadius: 3, background: T.inkMuted, opacity: 0.7 }} /><div style={{ width: '40%', height: 9, borderRadius: 3, background: T.signal, opacity: 0.75, marginTop: 8 }} /></div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 5, marginTop: 5 }}>
        {layout.sections.map(section => <div key={section.id} title={sectionLabel[section.id]} style={{ gridColumn: !mobile && section.size === 'wide' ? '1 / -1' : 'auto', minHeight: section.id === 'feed' ? 70 : 52, borderRadius: 6, background: T.surface, border: `1px solid ${T.line}`, padding: 7 }}><div style={{ color: T.ink, fontSize: 8.5, fontWeight: 650 }}>{sectionLabel[section.id]}</div><div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 7 }}>{[1, 2, 3].map(item => <span key={item} style={{ height: 3, width: `${95 - item * 12}%`, borderRadius: 2, background: T.inkMuted, opacity: 0.35 }} />)}</div></div>)}
      </div>
    </div>
  );
}

function DashboardOrderRow({ label, active, index, total, onToggle, onMove, size, onSize }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', border: `1px solid ${active ? T.lineStrong : T.line}`, borderRadius: 9, background: active ? T.surface2 : 'transparent', opacity: active ? 1 : 0.62 }}>
      <button type="button" aria-label={active ? `Ocultar ${label}` : `Mostrar ${label}`} aria-pressed={active} onClick={onToggle} style={{ minHeight: 30, minWidth: 30, padding: 4, border: 'none', borderRadius: 6, background: active ? `${T.positive}14` : T.surface2, color: active ? T.positive : T.inkMuted, cursor: 'pointer' }}>{active ? <Eye size={15} /> : <EyeOff size={15} />}</button>
      <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: active ? T.ink : T.inkMuted }}>{label}</span>
      {active && size && <button type="button" aria-label={`Alterar largura de ${label}`} onClick={onSize} style={{ minHeight: 30, padding: '4px 8px', border: `1px solid ${T.line}`, borderRadius: 6, background: 'transparent', color: T.inkMuted, fontFamily: T.fontMono, fontSize: 9.5, cursor: 'pointer' }}>{size === 'wide' ? 'LARGO' : '½'}</button>}
      {active && <div style={{ display: 'flex', gap: 3 }}><button type="button" aria-label={`Mover ${label} para cima`} disabled={index === 0} onClick={() => onMove(-1)} style={{ minHeight: 30, minWidth: 30, border: `1px solid ${T.line}`, borderRadius: 6, background: 'transparent', color: T.inkMuted, cursor: index === 0 ? 'default' : 'pointer', opacity: index === 0 ? 0.35 : 1 }}><ChevronUp size={14} /></button><button type="button" aria-label={`Mover ${label} para baixo`} disabled={index === total - 1} onClick={() => onMove(1)} style={{ minHeight: 30, minWidth: 30, border: `1px solid ${T.line}`, borderRadius: 6, background: 'transparent', color: T.inkMuted, cursor: index === total - 1 ? 'default' : 'pointer', opacity: index === total - 1 ? 0.35 : 1 }}><ChevronDown size={14} /></button></div>}
    </div>
  );
}

function DashboardLayoutEditor({ value, onSave }) {
  const normalizedValue = normalizeDashboardLayout(value);
  const [draft, setDraft] = useState(normalizedValue);
  const [previewMode, setPreviewMode] = useState('desktop');
  const [saved, setSaved] = useState(false);
  useEffect(() => setDraft(normalizeDashboardLayout(value)), [value]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(normalizedValue);
  const kpiById = Object.fromEntries(DASHBOARD_KPIS.map(item => [item.id, item]));
  const sectionById = Object.fromEntries(DASHBOARD_SECTIONS.map(item => [item.id, item]));
  const orderedKpis = [...draft.kpis, ...DASHBOARD_KPIS.map(item => item.id).filter(id => !draft.kpis.includes(id))];
  const activeSections = draft.sections.map(item => item.id);
  const orderedSections = [...activeSections, ...DASHBOARD_SECTIONS.map(item => item.id).filter(id => !activeSections.includes(id))];

  const updateDraft = next => { setDraft(normalizeDashboardLayout({ ...next, preset: next.preset || 'personalizado' })); setSaved(false); };
  const toggleKpi = id => {
    const active = draft.kpis.includes(id);
    if (active && draft.kpis.length === 1) return;
    updateDraft({ ...draft, preset: 'personalizado', kpis: active ? draft.kpis.filter(item => item !== id) : [...draft.kpis, id] });
  };
  const toggleSection = id => {
    const active = activeSections.includes(id);
    if (active && draft.sections.length === 1) return;
    updateDraft({ ...draft, preset: 'personalizado', sections: active ? draft.sections.filter(item => item.id !== id) : [...draft.sections, { id, size: 'half' }] });
  };
  const save = () => {
    const clean = normalizeDashboardLayout(draft);
    onSave({ dashboardHoje: clean });
    setDraft(clean);
    setSaved(true);
  };

  return (
    <Card style={{ padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div><div style={{ fontFamily: T.fontDisplay, fontSize: 15, fontWeight: 650 }}>Página Hoje</div><div style={{ color: T.inkMuted, fontSize: 11.5, marginTop: 4 }}>Escolha o que aparece e a ordem de leitura. O celular respeita a mesma ordem em uma coluna.</div></div>
        <Tag tone={dirty ? 'alerta' : 'positivo'}>{dirty ? 'ALTERAÇÕES NÃO SALVAS' : saved ? 'SALVO' : 'ATIVO'}</Tag>
      </div>

      <div style={{ fontSize: 11, color: T.inkMuted, margin: '18px 0 8px', letterSpacing: '0.06em' }}>MODELOS PRONTOS</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: 8 }}>
        {Object.values(DASHBOARD_PRESETS).map(preset => {
          const active = draft.preset === preset.id;
          return <button type="button" aria-pressed={active} key={preset.id} onClick={() => updateDraft(layoutFromPreset(preset.id))} style={{ minHeight: 78, padding: 11, textAlign: 'left', border: `1px solid ${active ? T.signal : T.line}`, borderRadius: 10, background: active ? `${T.signal}10` : T.surface2, color: T.ink, cursor: 'pointer', fontFamily: T.fontBody }}><div style={{ fontWeight: 650, fontSize: 12.5 }}>{preset.label}</div><div style={{ color: T.inkMuted, fontSize: 10.5, lineHeight: 1.45, marginTop: 5 }}>{preset.description}</div></button>;
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 18, marginTop: 20 }}>
        <div>
          <div style={{ fontSize: 11, color: T.inkMuted, marginBottom: 8, letterSpacing: '0.06em' }}>KPIs DO TOPO</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{orderedKpis.map(id => {
            const index = draft.kpis.indexOf(id); const active = index >= 0;
            return <DashboardOrderRow key={id} label={kpiById[id].label} active={active} index={index} total={draft.kpis.length} onToggle={() => toggleKpi(id)} onMove={direction => updateDraft({ ...draft, preset: 'personalizado', kpis: moveDashboardItem(draft.kpis, index, direction) })} />;
          })}</div>
          <div style={{ color: T.inkMuted, fontSize: 10.5, marginTop: 7 }}>Ao menos um KPI deve permanecer ativo.</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: T.inkMuted, marginBottom: 8, letterSpacing: '0.06em' }}>BLOCOS DE CONTEÚDO</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{orderedSections.map(id => {
            const index = draft.sections.findIndex(item => item.id === id); const active = index >= 0; const section = draft.sections[index];
            return <DashboardOrderRow key={id} label={sectionById[id].label} active={active} index={index} total={draft.sections.length} size={section?.size} onToggle={() => toggleSection(id)} onSize={() => updateDraft({ ...draft, preset: 'personalizado', sections: draft.sections.map(item => item.id === id ? { ...item, size: item.size === 'wide' ? 'half' : 'wide' } : item) })} onMove={direction => updateDraft({ ...draft, preset: 'personalizado', sections: moveDashboardItem(draft.sections, index, direction) })} />;
          })}</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, margin: '20px 0 9px', flexWrap: 'wrap' }}><div style={{ fontSize: 11, color: T.inkMuted, letterSpacing: '0.06em' }}>PRÉVIA</div><div style={{ display: 'flex', gap: 5 }}><button type="button" aria-pressed={previewMode === 'desktop'} onClick={() => setPreviewMode('desktop')} style={{ ...inputStyle, minHeight: 34, padding: '5px 9px', cursor: 'pointer', color: previewMode === 'desktop' ? T.signal : T.inkMuted, borderColor: previewMode === 'desktop' ? T.signal : T.line }}><Monitor size={14} style={{ verticalAlign: -3, marginRight: 5 }} />Desktop</button><button type="button" aria-pressed={previewMode === 'mobile'} onClick={() => setPreviewMode('mobile')} style={{ ...inputStyle, minHeight: 34, padding: '5px 9px', cursor: 'pointer', color: previewMode === 'mobile' ? T.signal : T.inkMuted, borderColor: previewMode === 'mobile' ? T.signal : T.line }}><Smartphone size={14} style={{ verticalAlign: -3, marginRight: 5 }} />Mobile</button></div></div>
      <div style={{ background: T.surface2, borderRadius: 12, padding: 12 }}><DashboardPreview layout={draft} mode={previewMode} /></div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 16 }}>
        <button type="button" onClick={() => updateDraft(DEFAULT_DASHBOARD_LAYOUT)} style={{ ...inputStyle, cursor: 'pointer' }}><RotateCcw size={14} style={{ verticalAlign: -3, marginRight: 6 }} />Restaurar página Hoje</button>
        <button type="button" disabled={!dirty} onClick={save} style={{ ...inputStyle, minWidth: 140, cursor: dirty ? 'pointer' : 'default', border: 'none', background: T.signal, color: T.signalInk, fontWeight: 700, opacity: dirty ? 1 : 0.45 }}><Save size={14} style={{ verticalAlign: -3, marginRight: 6 }} />Salvar layout</button>
      </div>
    </Card>
  );
}

function PageConfiguracoes({ preferencias, onPreferencias, onReset, temaResolvido }) {
  const { data: fipeStatus, erro: fipeErro } = useApi('fipe_status.php');
  const { data: facetas } = useApi('facetas.php?status=ativo');
  const ufsAtivas = Object.entries(facetas?.por_uf || {}).filter(([, n]) => n > 0).map(([uf]) => uf).sort();
  const regioesAtivas = Object.values(facetas?.regioes || {}).filter(r => r.anuncios > 0).length;
  const cobertura = Object.entries(NOMES_UF).map(([uf, nome]) => ({
    name: uf, nome, qtd: Number(facetas?.revendas_por_uf?.[uf] || 0),
  })).filter(item => item.qtd > 0).sort((a, b) => b.qtd - a.qtd);
  const progressoFipe = fipeStatus?.elegiveis
    ? Math.min(100, Math.round((Number(fipeStatus.vinculados_ativos || 0) / Number(fipeStatus.elegiveis)) * 100)) : 0;
  return (
    <div style={{ maxWidth: 980 }}>
      <SectionTitle sub="Modelos prontos, KPIs e ordem dos blocos para desktop e celular">Personalização do painel</SectionTitle>
      <DashboardLayoutEditor value={preferencias.dashboardHoje} onSave={onPreferencias} />
      <SectionTitle sub="Tema, densidade e conforto de uso — preferências salvas neste navegador">Aparência</SectionTitle>
      <Card>
        <div style={{ fontSize: 12, color: T.inkMuted, marginBottom: 12 }}>TEMA</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))', gap: 9 }}>
          {[
            { id: 'auto', label: 'Automático', description: 'Segue o aparelho', icon: Monitor, colors: ['#0B0E13', '#FFFFFF', '#5B8AA6'] },
            { ...THEMES.radar, icon: Radar, colors: [THEMES.radar.tokens.bg, THEMES.radar.tokens.surface, THEMES.radar.tokens.signal] },
            { ...THEMES.dark, icon: Moon, colors: [THEMES.dark.tokens.bg, THEMES.dark.tokens.surface, THEMES.dark.tokens.signal] },
            { ...THEMES.white, icon: Sun, colors: [THEMES.white.tokens.bg, THEMES.white.tokens.surface, THEMES.white.tokens.signal] },
          ].map(opcao => {
            const ativo = preferencias.theme === opcao.id;
            const Icon = opcao.icon;
            return <button key={opcao.id} onClick={() => onPreferencias({ theme: opcao.id })} style={{ textAlign: 'left', padding: 13, borderRadius: 11, border: `1px solid ${ativo ? T.signal : T.line}`, background: ativo ? `${T.signal}10` : T.surface2, color: T.ink, cursor: 'pointer', fontFamily: T.fontBody }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}><Icon size={17} color={ativo ? T.signal : T.inkMuted} /><div style={{ display: 'flex' }}>{opcao.colors.map((c, i) => <span key={i} style={{ width: 15, height: 15, borderRadius: '50%', background: c, marginLeft: -3, border: `1px solid ${T.lineStrong}` }} />)}</div></div>
              <div style={{ fontWeight: 650, fontSize: 13, marginTop: 10 }}>{opcao.label}</div><div style={{ color: T.inkMuted, fontSize: 10.5, marginTop: 3 }}>{opcao.description}</div>
            </button>;
          })}
        </div>
        <div style={{ fontSize: 12, color: T.inkMuted, margin: '18px 0 9px' }}>PRÓXIMOS TEMAS</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{COMING_THEMES.map(t => <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${T.line}`, background: T.surface2, borderRadius: 9, padding: '8px 10px', color: T.inkMuted, fontSize: 11.5 }}><Palette size={14} />{t.label}<Tag tone="neutro">EM BREVE</Tag></div>)}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: 14, marginTop: 20, paddingTop: 18, borderTop: `1px solid ${T.line}` }}>
          <div><div style={{ fontSize: 12, color: T.inkMuted, marginBottom: 8 }}>DENSIDADE</div><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{[['compact','Compacta'],['standard','Padrão'],['comfortable','Confortável']].map(([id,label]) => <button key={id} onClick={() => onPreferencias({ density: id })} style={{ ...inputStyle, cursor: 'pointer', color: preferencias.density === id ? T.signal : T.ink, borderColor: preferencias.density === id ? T.signal : T.line }}>{label}</button>)}</div></div>
          <div><div style={{ fontSize: 12, color: T.inkMuted, marginBottom: 8 }}>MOVIMENTO</div><button onClick={() => onPreferencias({ reduceMotion: !preferencias.reduceMotion })} style={{ ...inputStyle, cursor: 'pointer', width: '100%', textAlign: 'left', color: preferencias.reduceMotion ? T.positive : T.ink }}>{preferencias.reduceMotion ? '✓ Animações reduzidas' : 'Animações normais'}</button></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 16 }}><span style={{ color: T.inkMuted, fontSize: 11.5 }}>Tema ativo: {THEMES[temaResolvido]?.label || temaResolvido}</span><button onClick={onReset} style={{ ...inputStyle, cursor: 'pointer' }}><RotateCcw size={14} style={{ verticalAlign: -3, marginRight: 6 }} />Restaurar padrão</button></div>
      </Card>
      <SectionTitle sub="Saúde operacional, cobertura e frequência da varredura">Radar</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 12 }}>
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13.5 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: T.inkMuted }}>Estados monitorados</span>
            <span style={{ fontFamily: T.fontMono, textAlign: 'right', marginLeft: 16 }}>
              {ufsAtivas.length ? ufsAtivas.join(', ') : 'aguardando dados'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: T.inkMuted }}>Frequência</span>
            <span style={{ fontFamily: T.fontMono }}>07h/19h · expansão 07h30/19h30</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: T.inkMuted }}>Regra de saída</span>
            <span style={{ fontFamily: T.fontMono }}>2 varreduras sem o anúncio</span>
          </div>
        </div>
      </Card>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, color: T.positive, marginBottom: 14 }}>
          <ShieldCheck size={18} /><strong>Leitura dos dados</strong>
        </div>
        <div style={{ color: T.inkMuted, fontSize: 12.5, lineHeight: 1.6 }}>
          “Saída” significa que o anúncio deixou o portal após duas varreduras. É um sinal de mercado, não uma venda comprovada. O giro amadurece após 14 dias de histórico.
        </div>
      </Card>
      </div>

      <SectionTitle sub="Cobertura e saúde do vínculo com a referência de caminhões">FIPE</SectionTitle>
      <Card>
        {fipeErro ? (
          <div style={{ color: T.alert, fontSize: 13 }}>Status FIPE indisponível — confirme a migração e o endpoint no servidor.</div>
        ) : !fipeStatus ? (
          <div style={{ color: T.inkMuted, fontSize: 13 }}>Consultando sincronização FIPE...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: T.inkMuted }}>Caminhões elegíveis</span>
              <span style={{ fontFamily: T.fontMono }}>{fmtN(fipeStatus.elegiveis)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: T.inkMuted }}>Vinculados ativos</span>
              <span style={{ fontFamily: T.fontMono, color: T.positive }}>{fmtN(fipeStatus.vinculados_ativos)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: T.inkMuted }}>Ainda não tentados</span>
              <span style={{ fontFamily: T.fontMono }}>{fmtN(fipeStatus.nunca_tentados)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: T.inkMuted }}>Preços em cache</span>
              <span style={{ fontFamily: T.fontMono }}>{fmtN(fipeStatus.precos_cache)}</span>
            </div>
            <div style={{ height: 8, borderRadius: 99, background: T.surface2, overflow: 'hidden' }}>
              <div style={{ width: `${progressoFipe}%`, height: '100%', background: T.positive, borderRadius: 99 }} />
            </div>
            <div style={{ color: T.inkMuted, fontSize: 11.5 }}>{progressoFipe}% dos caminhões elegíveis vinculados · referência {fipeStatus.referencia_mais_recente || '—'}</div>
          </div>
        )}
      </Card>

      <SectionTitle sub={`${ufsAtivas.length} UFs com dados · ${regioesAtivas} regiões ativas · somente coleta real`}>Cobertura nacional</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 12, marginBottom: 12 }}>
        {Object.entries(REGIOES_UFS).map(([nome, ufs]) => {
          const dados = facetas?.regioes?.[nome];
          return <Card key={nome} style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
              <strong>{nome}</strong><Tag tone={dados?.anuncios > 0 ? 'positivo' : 'neutro'}>{fmtN(dados?.anuncios || 0)} ANÚNCIOS</Tag>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {ufs.map(sigla => <span key={sigla} style={{
                padding: '4px 7px', borderRadius: 6, fontFamily: T.fontMono, fontSize: 10.5,
                color: facetas?.ufs?.[sigla]?.anuncios > 0 ? T.positive : T.inkMuted,
                background: facetas?.ufs?.[sigla]?.anuncios > 0 ? `${T.positive}12` : T.surface2,
              }}>{sigla} · {fmtN(facetas?.ufs?.[sigla]?.revendas || 0)} lojas</span>)}
            </div>
          </Card>;
        })}
      </div>
      <Card style={{ padding: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(86px, 1fr))', gap: 12, alignItems: 'end' }}>
          {cobertura.map(item => {
            const max = Math.max(1, ...cobertura.map(c => c.qtd));
            return <div key={item.name} title={`${item.nome}: ${item.qtd} revendas coletadas`} style={{ minWidth: 0 }}>
              <div style={{ height: 96, display: 'flex', alignItems: 'flex-end', background: T.surface2, borderRadius: 7, overflow: 'hidden' }}>
                <div style={{ width: '100%', height: `${Math.max(5, item.qtd / max * 100)}%`, background: `linear-gradient(180deg, ${T.positive}, #23865A)`, borderRadius: '6px 6px 0 0' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4, marginTop: 6, fontFamily: T.fontMono, fontSize: 10.5 }}>
                <span>{item.name}</span><span style={{ color: T.inkMuted }}>{fmtN(item.qtd)}</span>
              </div>
            </div>;
          })}
        </div>
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
  const { data: analistaStatus } = useApi('analista_status.php');
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

      {ins && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 190px), 1fr))', gap: 10, marginBottom: 14 }}>
          <Kpi label="FIPE vinculados" value={fmtN(ins.fipe?.vinculados || 0)} sub="ativos com preço comparável" />
          <Kpi label="Abaixo da FIPE" value={fmtN(ins.fipe?.abaixo_fipe || 0)} sub="candidatos para validação" tone={T.positive} />
          <Kpi label="Desvio médio FIPE" value={ins.fipe?.desvio_medio_pct == null ? '—' : `${ins.fipe.desvio_medio_pct.toLocaleString('pt-BR')}%`} sub="anúncio vs referência" />
          <Kpi label="Atualizado" value={ins.gerado_em ? new Date(ins.gerado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'} sub="leitura calculada agora" />
        </div>
      )}

      {ins?.parciais_indisponiveis?.length > 0 && <Card style={{ padding: 12, marginBottom: 12, color: T.inkMuted, fontSize: 12 }}>
        Parte da análise está em atualização: {ins.parciais_indisponiveis.join(', ')}. Os demais blocos continuam válidos.
      </Card>}

      {ins && ins.descobertas && ins.descobertas.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <SectionTitle sub="Insights cruzados calculados a partir dos dados reais desta semana">Descobertas do dia</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
            {ins.descobertas.map((d, i) => {
              const cores = { conversao: T.positive, concentracao: T.signal, movimento: T.alert, faixa: T.steel };
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 12 }}>
          <Card>
            <SectionTitle sub="Onde a oferta se concentra">Marcas com mais anúncios</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(ins.por_marca || []).slice(0, 8).map(m => (
                <BarraH key={m.marca} rotulo={m.marca} valor={m.anuncios} max={ins.por_marca[0]?.anuncios || 1} />
              ))}
            </div>
          </Card>
          <Card>
            <SectionTitle sub="Concentração geográfica da oferta ativa">Cidades com mais estoque</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(ins.por_cidade || []).slice(0, 8).map(c => (
                <BarraH key={`${c.uf}-${c.cidade}`} rotulo={`${c.cidade}/${c.uf}`} valor={c.anuncios} max={ins.por_cidade[0]?.anuncios || 1} cor={T.positive} />
              ))}
            </div>
          </Card>
          <Card>
            <SectionTitle sub="Saídas detectadas · estoque · idade média — sinais do movimento do mercado">Giro dos concorrentes</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(ins.giro_por_revenda || []).slice(0, 8).map(g => (
                <div key={`${g.uf}-${g.revenda}`} style={{ fontSize: 12.5, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.revenda} <small style={{ color: T.inkMuted }}>{g.uf}</small></span>
                  <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.inkMuted, whiteSpace: 'nowrap' }}>
                    <span style={{ color: T.positive }}>{g.saidas_detectadas ?? 0} saídas</span> · {g.estoque_ativo} ativos · {g.idade_media_dias ?? '—'}d
                  </span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <SectionTitle sub="Distribuição do estoque ativo por preço">Faixas de preço</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(ins.faixas_preco || []).map(f => (
                <BarraH key={f.faixa} rotulo={f.faixa} valor={f.anuncios} max={Math.max(1, ...(ins.faixas_preco || []).map(x => x.anuncios))} cor={T.alert} />
              ))}
            </div>
          </Card>
        </div>
      )}

      <SectionTitle sub="Converse com os dados: peça planos de ação, priorização e leitura de concorrência">Analista IA</SectionTitle>
      {analistaStatus && !analistaStatus.ativo ? (
        <EmptyState icon={Gauge} titulo="Analista opcional desativado"
          texto="Os insights calculados acima continuam funcionando normalmente. O chat só deve ser ativado depois de proteger o acesso com autenticação." />
      ) : <Card style={{ padding: 0, overflow: 'hidden' }}>
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
              background: m.role === 'user' ? `${T.signal}1F` : T.surface2,
              border: `1px solid ${m.role === 'user' ? `${T.signal}40` : T.line}`,
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
        <div style={{ display: 'flex', gap: 8, padding: 14, borderTop: `1px solid ${T.line}`, flexWrap: 'wrap' }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && enviar()}
            placeholder="Pergunte ao analista — ex: onde devo focar as vendas esta semana?" style={{ ...inputStyle, flex: 1 }} />
          <button onClick={enviar} disabled={pensando} style={{
            ...inputStyle, cursor: 'pointer', background: T.signal, color: T.signalInk,
            fontWeight: 600, border: 'none', opacity: pensando ? 0.6 : 1,
          }}>Enviar</button>
        </div>
      </Card>}
    </div>
  );
}

/* ============================================================
   shell — navegação
   ============================================================ */
const NAV = [
  { id: 'hoje', rotulo: 'Hoje', icone: Radar },
  { id: 'mercado', rotulo: 'Mercado', icone: LayoutGrid },
  { id: 'minha-loja', rotulo: 'Minha Loja', icone: Store },
  { id: 'fipe', rotulo: 'FIPE', icone: Search },
  { id: 'oportunidades', rotulo: 'Oportunidades', icone: Crosshair },
  { id: 'concorrentes', rotulo: 'Concorrentes', icone: Building2 },
  { id: 'analise', rotulo: 'Análise', icone: Gauge },
  { id: 'acoes', rotulo: 'Ações', icone: ListChecks },
  { id: 'ajustes', rotulo: 'Configurações', icone: Settings },
  { id: 'conta', rotulo: 'Minha conta', icone: UserRound },
];
const NAV_MOBILE_PRINCIPAL = NAV.filter(item => ['hoje', 'mercado', 'minha-loja', 'oportunidades'].includes(item.id));
const NAV_MOBILE_MAIS = NAV.filter(item => ['fipe', 'concorrentes', 'analise', 'acoes', 'ajustes', 'conta'].includes(item.id));

function RadarApp({ sessao, onSessao, onLogout, preferencias, onPreferencias, onReset, temaResolvido }) {
  const [pagina, setPagina] = useState('hoje');
  const [menuAberto, setMenuAberto] = useState(false);
  const [acoes, setAcoes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('oper-radar-acoes') || '[]'); } catch { return []; }
  });
  const [mobile, setMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 760);

  const { data: kpis } = useApi('kpis.php');
  const { data: anunciosData } = useApi('anuncios.php?ordem=movimento&limit=200');
  const anuncios = useMemo(() => (anunciosData?.anuncios || []).map(mapeiaAnuncioReal), [anunciosData]);
  const usandoReais = anuncios.length > 0;

  useEffect(() => {
    const f = () => setMobile(window.innerWidth <= 760);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);

  useEffect(() => {
    try { localStorage.setItem('oper-radar-acoes', JSON.stringify(acoes)); } catch {}
  }, [acoes]);

  useEffect(() => {
    document.getElementById('app-scroll-container')?.scrollTo({ top: 0 });
  }, [pagina]);

  const adicionarAcao = async (texto, origem = 'oportunidade') => {
    const local = { id: `local-${Date.now()}`, texto, feita: false, origem, criadaEm: new Date().toISOString() };
    setAcoes(prev => [local, ...prev]);
    return local;
  };

  const alternarAcao = acao => {
    const feita = !acao.feita;
    setAcoes(prev => prev.map(a => a.id === acao.id ? { ...a, feita } : a));
  };

  const criarAcao = async texto => {
    await adicionarAcao(texto, 'oportunidade');
    setPagina('acoes');
  };

  const paginas = {
    hoje: <PageHoje kpis={kpis} anuncios={anuncios} usandoReais={usandoReais} layout={preferencias.dashboardHoje} onPersonalizar={() => setPagina('ajustes')} />,
    mercado: <PageMercado sessao={sessao} />,
    'minha-loja': <PageMinhaLoja sessao={sessao} />,
    fipe: <PageFipe />,
    oportunidades: <PageOportunidades onCriarAcao={criarAcao} />,
    concorrentes: <PageConcorrentes />,
    analise: <PageAnalise />,
    acoes: <PageAcoes acoes={acoes} onAdicionar={adicionarAcao} onAlternar={alternarAcao} salvando={false} />,
    ajustes: <PageConfiguracoes preferencias={preferencias} onPreferencias={onPreferencias} onReset={onReset} temaResolvido={temaResolvido} />,
    conta: <PageConta sessao={sessao} onSessao={onSessao} onLogout={onLogout} />,
  };

  const tituloPagina = NAV.find(n => n.id === pagina)?.rotulo || '';
  const acoesPendentes = acoes.filter(a => !a.feita).length;

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
                  background: ativo ? `${T.signal}1A` : 'transparent',
                  border: 'none', borderRadius: 9, cursor: 'pointer',
                  color: ativo ? T.signal : T.inkMuted, fontSize: 13.5, fontWeight: ativo ? 600 : 450,
                  fontFamily: T.fontBody, transition: 'color 140ms, background 140ms', textAlign: 'left',
                }}>
                  <item.icone size={16} /> {item.rotulo}
                  {item.id === 'acoes' && acoesPendentes > 0 && <span style={{ marginLeft: 'auto', fontFamily: T.fontMono, fontSize: 9, color: T.signal }}>{acoesPendentes}</span>}
                </button>
              );
            })}
          </nav>
          <div style={{ marginTop: 'auto' }}>
            <button onClick={() => setPagina('conta')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '10px', borderRadius: 9, background: pagina === 'conta' ? `${T.signal}12` : 'transparent', border: 'none', color: T.ink, textAlign: 'left', cursor: 'pointer', fontFamily: T.fontBody }}>
              <span style={{ width: 30, height: 30, borderRadius: 9, display: 'grid', placeItems: 'center', background: T.surface2, color: T.signal }}><UserRound size={15} /></span>
              <span style={{ minWidth: 0 }}><strong style={{ display: 'block', fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sessao.usuario.nome}</strong><small style={{ color: T.inkMuted, fontSize: 9.5 }}>{sessao.usuario.papel}</small></span>
            </button>
            <div style={{ fontFamily: T.fontMono, fontSize: 9, color: T.inkMuted, padding: '10px', lineHeight: 1.55 }}>AGÊNCIA OPER · inteligência de mercado</div>
          </div>
        </aside>
      )}

      {/* área principal */}
      <main id="app-scroll-container" style={{ flex: 1, overflowY: 'auto', padding: mobile ? '18px 16px 90px' : '26px 32px 40px' }}>
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
        <>
        {menuAberto && <>
          <div onClick={() => setMenuAberto(false)} style={{ position: 'fixed', inset: 0, background: T.overlay, zIndex: 48 }} />
          <div style={{ position: 'fixed', left: 10, right: 10, bottom: 'calc(72px + env(safe-area-inset-bottom))', zIndex: 49, background: T.surface, border: `1px solid ${T.line}`, borderRadius: 16, padding: 10, boxShadow: T.shadow }}>
            {NAV_MOBILE_MAIS.map(item => <button key={item.id} onClick={() => { setPagina(item.id); setMenuAberto(false); }} style={{
              width: '100%', minHeight: 48, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
              background: pagina === item.id ? `${T.signal}1A` : 'transparent', border: 'none', borderRadius: 10,
              color: pagina === item.id ? T.signal : T.ink, fontFamily: T.fontBody, fontSize: 14, cursor: 'pointer', textAlign: 'left',
            }}><item.icone size={18} /> {item.rotulo}{item.id === 'acoes' && acoesPendentes > 0 && <Tag tone="sinal">{acoesPendentes} PENDENTES</Tag>}</button>)}
          </div>
        </>}
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex',
          background: T.nav, backdropFilter: 'blur(14px)',
          borderTop: `1px solid ${T.line}`, padding: '7px 4px calc(7px + env(safe-area-inset-bottom))', zIndex: 50,
        }}>
          {NAV_MOBILE_PRINCIPAL.map(item => {
            const ativo = pagina === item.id;
            return (
              <button key={item.id} onClick={() => { setPagina(item.id); setMenuAberto(false); }} style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                background: 'none', border: 'none', cursor: 'pointer', minHeight: 46, justifyContent: 'center',
                color: ativo ? T.signal : T.inkMuted, fontSize: 9.5, fontFamily: T.fontBody,
              }}>
                <item.icone size={18} /> {item.rotulo}
              </button>
            );
          })}
          <button onClick={() => setMenuAberto(v => !v)} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minHeight: 46, justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer', position: 'relative',
            color: NAV_MOBILE_MAIS.some(item => item.id === pagina) || menuAberto ? T.signal : T.inkMuted, fontSize: 9.5, fontFamily: T.fontBody,
          }}><MoreHorizontal size={19} /> Mais{acoesPendentes > 0 && <span style={{ position: 'absolute', top: 3, right: '25%', width: 7, height: 7, borderRadius: '50%', background: T.signal }} />}</button>
        </nav>
        </>
      )}
    </div>
  );
}

export default function App() {
  const [preferencias, setPreferencias] = useState(loadUiPreferences);
  const [sistemaEscuro, setSistemaEscuro] = useState(() => typeof window === 'undefined' || !window.matchMedia || window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [sessao, setSessao] = useState(null);
  const [checandoSessao, setChecandoSessao] = useState(true);
  const temaResolvido = resolveTheme(preferencias.theme, sistemaEscuro);
  activateTheme(temaResolvido);

  useEffect(() => {
    applyUiPreferences(preferencias, temaResolvido);
    saveUiPreferences(preferencias);
  }, [preferencias, temaResolvido]);

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const atualiza = e => setSistemaEscuro(e.matches);
    media.addEventListener?.('change', atualiza);
    return () => media.removeEventListener?.('change', atualiza);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/auth.php`, { credentials: 'same-origin' })
      .then(r => r.json())
      .then(setSessao)
      .catch(() => setSessao({ autenticado: false, erro: true }))
      .finally(() => setChecandoSessao(false));
  }, []);

  const alterarPreferencias = patch => setPreferencias(atual => ({ ...atual, ...patch }));
  const resetarPreferencias = () => setPreferencias({ ...DEFAULT_UI_PREFERENCES });
  const sair = async () => {
    try { await apiPost('auth.php', { acao: 'logout' }, sessao?.csrf); } catch {}
    setSessao({ autenticado: false });
  };

  if (checandoSessao) return <div style={{ minHeight: '100%', display: 'grid', placeItems: 'center', background: T.bg, color: T.inkMuted, fontFamily: T.fontMono, fontSize: 12 }}>INICIANDO RADAR…</div>;
  if (!sessao?.autenticado) return <LoginScreen onLogin={setSessao} />;
  return <RadarApp sessao={sessao} onSessao={setSessao} onLogout={sair} preferencias={preferencias} onPreferencias={alterarPreferencias} onReset={resetarPreferencias} temaResolvido={temaResolvido} />;
}
