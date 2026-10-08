import React, { useState } from 'react';
import {
  Radar, BarChart3, Scale, Store, Search, Crosshair, Building2, Gauge, ListChecks,
  Settings, UserRound, MoreHorizontal, ArrowLeft, ChevronRight, Moon, Sun,
} from './icons.jsx';
import markDark from '../../design-system/assets/mark-dark.png';
import markLight from '../../design-system/assets/mark-light.png';

/* Casca do app (sidebar, topbar, barra inferior) montada com as classes do design system.
   Componente apresentacional: navegacao, titulo e status chegam por props. */

export const NAV = [
  { id: 'hoje', rotulo: 'Hoje', icone: Radar, grupo: 'inteligencia' },
  { id: 'mercado', rotulo: 'Mercado', icone: BarChart3, grupo: 'inteligencia' },
  { id: 'comparador', rotulo: 'Comparador', icone: Scale, grupo: 'inteligencia' },
  { id: 'minha-loja', rotulo: 'Minha Loja', icone: Store, grupo: 'inteligencia' },
  { id: 'fipe', rotulo: 'FIPE', icone: Search, grupo: 'inteligencia' },
  { id: 'oportunidades', rotulo: 'Oportunidades', icone: Crosshair, grupo: 'inteligencia' },
  { id: 'concorrentes', rotulo: 'Concorrência', icone: Building2, grupo: 'inteligencia' },
  { id: 'analise', rotulo: 'Análise', icone: Gauge, grupo: 'inteligencia' },
  { id: 'acoes', rotulo: 'Plano de ação', icone: ListChecks, grupo: 'inteligencia' },
  { id: 'ajustes', rotulo: 'Configurações', icone: Settings, grupo: 'preferencias' },
  { id: 'conta', rotulo: 'Minha conta', icone: UserRound, grupo: 'preferencias' },
];

export const NAV_GRUPOS = [
  { id: 'inteligencia', rotulo: 'Inteligência' },
  { id: 'preferencias', rotulo: 'Preferências' },
];

const IDS_BARRA_INFERIOR = ['hoje', 'mercado', 'minha-loja', 'oportunidades'];
export const NAV_MOBILE_PRINCIPAL = NAV.filter(item => IDS_BARRA_INFERIOR.includes(item.id));
export const NAV_MOBILE_MAIS = NAV.filter(item => !IDS_BARRA_INFERIOR.includes(item.id));

function Marca({ className = '' }) {
  return <>
    <img className={`mark oc-mark-dark ${className}`.trim()} src={markDark} alt="" />
    <img className={`mark oc-mark-light ${className}`.trim()} src={markLight} alt="" />
  </>;
}

export function AppShell({
  pagina, onNavegar, titulo, tituloRef, breadcrumbs = [], onVoltar, sessao, acoesPendentes = 0,
  temaClaro, onAlternarTema, status, children,
}) {
  const [maisAberto, setMaisAberto] = useState(false);
  const navegar = id => { onNavegar(id); setMaisAberto(false); };
  const item = ({ id, rotulo, icone: Icone }) => {
    const ativo = pagina === id;
    return <button key={id} type="button" className={`or-navitem${ativo ? ' or-navitem--active' : ''}`}
      aria-current={ativo ? 'page' : undefined} onClick={() => navegar(id)}>
      <Icone size={19} />
      <span className="or-navitem__label">{rotulo}</span>
      {id === 'acoes' && acoesPendentes > 0 && <span className="or-navitem__badge">{acoesPendentes}</span>}
    </button>;
  };
  const mais = NAV_MOBILE_MAIS.some(n => n.id === pagina) || maisAberto;

  return (
    <div className="oc-shell">
      <nav className="or-sidebar oc-sidebar" aria-label="Principal">
        <div className="or-sidebar__brand"><Marca /><strong>OPER RADAR</strong></div>
        {NAV_GRUPOS.map(grupo => <React.Fragment key={grupo.id}>
          <div className="or-sidebar__section">{grupo.rotulo}</div>
          {NAV.filter(n => n.grupo === grupo.id).map(item)}
        </React.Fragment>)}
        <div className="or-sidebar__foot">
          {status}
          <button type="button" className="oc-user" onClick={() => navegar('conta')} aria-label="Minha conta">
            <span className="oc-user__avatar"><UserRound size={16} /></span>
            <span className="oc-user__text"><strong>{sessao.usuario.nome}</strong><small>{sessao.usuario.papel}</small></span>
          </button>
        </div>
      </nav>

      <div className="oc-shell__col">
        <header className="or-topbar">
          <div className="or-topbar__title">
            <nav aria-label="Breadcrumb" className="or-topbar__crumb">
              <ol className="or-breadcrumb-list">
                {breadcrumbs.map((b, i) => {
                  const atual = i === breadcrumbs.length - 1;
                  return <li key={`${b.label}-${i}`}>
                    {i > 0 && <ChevronRight size={12} />}
                    {!atual && b.page
                      ? <button type="button" onClick={() => onNavegar(b.page)}>{b.label}</button>
                      : <span aria-current={atual ? 'page' : undefined}>{b.label}</span>}
                  </li>;
                })}
              </ol>
            </nav>
            <h1 ref={tituloRef} tabIndex={-1} className="or-topbar__h">{titulo}</h1>
          </div>
          <div className="or-topbar__actions">
            <span className="oc-topbar-status">{status}</span>
            {pagina !== 'hoje' && <button type="button" className="or-iconbtn or-iconbtn--outline" onClick={onVoltar} aria-label="Voltar" title="Voltar"><ArrowLeft size={18} /></button>}
            <button type="button" className="or-iconbtn or-iconbtn--outline" onClick={onAlternarTema}
              aria-label={temaClaro ? 'Usar tema escuro' : 'Usar tema claro'} title={temaClaro ? 'Usar tema escuro' : 'Usar tema claro'}>
              {temaClaro ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        </header>
        <main id="app-scroll-container" className="oc-main">
          {children}
        </main>
      </div>

      {maisAberto && <>
        <div className="oc-sheet-backdrop" onClick={() => setMaisAberto(false)} />
        <div className="oc-sheet" role="menu" aria-label="Mais telas">
          {NAV_MOBILE_MAIS.map(n => <button key={n.id} type="button" role="menuitem"
            className={`or-navitem${pagina === n.id ? ' or-navitem--active' : ''}`} onClick={() => navegar(n.id)}>
            <n.icone size={19} /><span className="or-navitem__label">{n.rotulo}</span>
            {n.id === 'acoes' && acoesPendentes > 0 && <span className="or-navitem__badge">{acoesPendentes}</span>}
          </button>)}
        </div>
      </>}

      <nav className="or-bottomnav oc-bottomnav" aria-label="Principal">
        {NAV_MOBILE_PRINCIPAL.map(({ id, rotulo, icone: Icone }) => {
          const ativo = pagina === id;
          return <button key={id} type="button" className={`or-bottomnav__item${ativo ? ' or-bottomnav__item--active' : ''}`}
            aria-current={ativo ? 'page' : undefined} onClick={() => navegar(id)}>
            <span className="or-bottomnav__ic"><Icone size={20} /></span><span>{rotulo}</span>
          </button>;
        })}
        <button type="button" className={`or-bottomnav__item${mais ? ' or-bottomnav__item--active' : ''}`}
          aria-expanded={maisAberto} onClick={() => setMaisAberto(v => !v)}>
          <span className="or-bottomnav__ic"><MoreHorizontal size={20} />{acoesPendentes > 0 && <i className="oc-dot" />}</span><span>Mais</span>
        </button>
      </nav>
    </div>
  );
}
