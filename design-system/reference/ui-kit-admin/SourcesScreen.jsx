function SourcesScreen({ toast }) {
  const { Card, LiveIndicator, Switch, Button, Badge, Alert, ProgressBar, IconButton } = ORK;
  const D = window.OR_DATA;
  const [running, setRunning] = React.useState(false);
  const [prog, setProg] = React.useState(0);
  React.useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setProg((p) => { if (p >= 100) { clearInterval(t); setRunning(false); toast({ title: 'Coleta concluída', description: '1.284 anúncios novos · 6 fontes' }); return 100; } return p + 5; }), 120);
    return () => clearInterval(t);
  }, [running]);
  const st = { live: ['live', 'Coletando'], warning: ['warning', 'Atrasado'], idle: ['idle', 'Pausado'] };
  return (
    <div className="kit-page">
      <PageHead eyebrow="Fontes" title="Coleta de dados">
        <Button icon={running ? undefined : 'play'} disabled={running} onClick={() => { setProg(0); setRunning(true); }}>{running ? 'Coletando… ' + prog + '%' : 'Coletar agora'}</Button>
      </PageHead>
      <Alert tone="warning" title="Webmotors respondendo com atraso" actions={<Button size="sm" variant="secondary">Tentar de novo</Button>}>Última coleta completa há 3 h. As demais fontes estão normais.</Alert>
      {running && <Card style={{ gap: 10 }}><ProgressBar size="lg" label="Coleta manual em andamento" value={prog} /></Card>}
      <div className="kit-grid-3">
        {D.sources.map((s) => (
          <Card key={s.id} style={{ gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="or-listrow__lead" style={{ background: 'var(--surface-2)' }}><i className="ph ph-globe-simple" /></span>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600 }}>{s.name}</div><div style={{ marginTop: 6 }}><LiveIndicator status={st[s.status][0]}>{st[s.status][1]} · {s.last}</LiveIndicator></div></div>
              <Switch defaultChecked={s.on} aria-label={'Ativar ' + s.name} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div><div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Anúncios ativos</div><div style={{ font: '700 24px/1 var(--font-sans)', letterSpacing: '-0.02em', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>{s.ads.toLocaleString('pt-BR')}</div></div>
              <Badge tone="neutral">{s.share}% do total</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
window.SourcesScreen = SourcesScreen;
