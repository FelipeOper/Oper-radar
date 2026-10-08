function App() {
  const { Sidebar, Topbar, BottomNav, IconButton, Avatar, Input, Logo, LiveIndicator, Toast, Tooltip } = ORK;
  const saved = (() => { try { return JSON.parse(localStorage.getItem('or-kit') || '{}'); } catch (e) { return {}; } })();
  const [authed, setAuthed] = React.useState(saved.authed !== false);
  const [screen, setScreen] = React.useState(saved.screen || 'overview');
  const [theme, setTheme] = React.useState(saved.theme || 'dark');
  const [open, setOpen] = React.useState(null);
  const [toasts, setToasts] = React.useState([]);
  const mobile = useMedia('(max-width: 899px)');
  const compact = useMedia('(max-width: 1199px)');
  React.useEffect(() => { localStorage.setItem('or-kit', JSON.stringify({ authed, screen, theme })); document.documentElement.setAttribute('data-theme', theme); }, [authed, screen, theme]);
  const toast = (t) => { const id = Date.now(); setToasts((x) => [...x, { ...t, id }]); setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 4500); };
  const go = (s) => { setScreen(s); document.querySelector('.kit-main')?.scrollTo(0, 0); };
  const logoBase = '../../assets/';
  const lt = theme === 'light' ? 'light' : 'dark';

  if (!authed) return <LoginScreen onLogin={() => { setAuthed(true); setScreen('overview'); }} />;

  const nav = [
    { value: 'overview', label: 'Visão geral', icon: 'gauge' },
    { value: 'ads', label: 'Anúncios', icon: 'tag', badge: '1,2k' },
    { value: 'alerts', label: 'Alertas', icon: 'bell-simple', badge: 3 },
    { value: 'sources', label: 'Fontes', icon: 'plugs-connected' },
    { value: 'settings', label: 'Configurações', icon: 'gear-six' },
  ];
  const titles = { overview: 'Visão geral', ads: 'Anúncios', alerts: 'Alertas', sources: 'Fontes', settings: 'Configurações' };
  const Screen = { overview: OverviewScreen, ads: ListingsScreen, alerts: AlertsScreen, sources: SourcesScreen, settings: SettingsScreen }[screen];

  return (
    <div className="kit-app">
      {!mobile && (
        <Sidebar collapsed={compact} value={screen} onNavigate={go}
          brand={compact ? <Logo variant="mark" theme={lt} base={logoBase} height={32} /> : <Logo theme={lt} base={logoBase} height={20} />}
          sections={[{ items: nav.slice(0, 2) }, { title: 'Operação', items: nav.slice(2) }]}
          footer={compact ? <LiveIndicator variant="radar" size={32} /> : <div className="kit-sidefoot"><LiveIndicator variant="radar" size={34} /><div><div style={{ fontWeight: 600, fontSize: 13 }}>Coleta ativa</div><div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 3 }}>6 de 7 fontes · há 2 min</div></div></div>} />
      )}
      <div className="kit-main">
        <Topbar
          leading={mobile ? <Logo variant="mark" theme={lt} base={logoBase} height={30} /> : null}
          breadcrumb={mobile ? null : 'Oper Radar / Caminhões e implementos'}
          title={titles[screen]}
          actions={<>
            {!mobile && <Input icon="magnifying-glass" pill size="sm" kbd="⌘K" placeholder="Buscar anúncio, lojista…" style={{ width: 280 }} />}
            {mobile && <IconButton icon="magnifying-glass" label="Buscar" variant="ghost" />}
            <Tooltip content={theme === 'dark' ? 'Tema claro' : 'Tema escuro'} placement="bottom"><IconButton icon={theme === 'dark' ? 'sun' : 'moon'} label="Alternar tema" variant="ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} /></Tooltip>
            <IconButton icon="bell-simple" label="Alertas" dot onClick={() => go('alerts')} />
            {!mobile && <Avatar name="Felipe Souza" size={36} onClick={() => go('settings')} style={{ cursor: 'pointer' }} />}
          </>} />
        <main className="kit-content"><Screen onOpen={setOpen} go={go} toast={toast} theme={theme} setTheme={setTheme} onLogout={() => setAuthed(false)} /></main>
      </div>
      {mobile && <div className="kit-bottom"><BottomNav value={screen} onChange={go} items={nav.map(({ value, label, icon }) => ({ value, label: label === 'Configurações' ? 'Conta' : label === 'Visão geral' ? 'Início' : label, icon: icon === 'gauge' ? 'house' : icon === 'gear-six' ? 'user' : icon }))} /></div>}
      <ListingDialog listing={open} onClose={() => setOpen(null)} onAlert={(l) => { setOpen(null); toast({ title: 'Alerta criado', description: 'Vamos avisar quando o ' + l.model + ' mudar de preço.', time: 'agora', icon: 'bell-simple-ringing' }); }} />
      <div className="kit-toasts">{toasts.map((t) => <Toast key={t.id} {...t} />)}</div>
    </div>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
