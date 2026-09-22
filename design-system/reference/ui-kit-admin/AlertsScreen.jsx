function AlertsScreen() {
  const { Card, Tabs, ListRow, Button, Badge, Switch, IconButton } = ORK;
  const D = window.OR_DATA;
  const [tab, setTab] = React.useState('all');
  const [read, setRead] = React.useState({});
  const items = D.alerts.filter((a) => tab === 'all' || (tab === 'unread' && a.unread && !read[a.id]));
  const toneBg = { success: 'var(--accent)', warning: 'var(--warning)', danger: 'var(--danger)', info: 'var(--surface-inverse)' };
  const toneFg = { success: 'var(--text-on-accent)', warning: 'var(--black-950)', danger: '#fff', info: 'var(--text-inverse)' };
  const rules = [['Abaixo da FIPE > 10%', 'Todas as marcas · Brasil', true], ['Queda de preço > 3%', 'Scania, Volvo · Sul e Sudeste', true], ['Novos concorrentes', 'Lojistas com 20+ anúncios', true], ['Saúde das fontes', 'Falhas e atrasos de coleta', true], ['Resumo diário por e-mail', 'Todo dia às 07:00', false]];
  return (
    <div className="kit-page">
      <PageHead eyebrow="Alertas" title="O que mudou desde ontem">
        <Button variant="secondary" icon="checks" onClick={() => setRead(Object.fromEntries(D.alerts.map((a) => [a.id, 1])))}>Marcar como lidos</Button>
      </PageHead>
      <div className="kit-grid-main">
        <Card style={{ gap: 12 }}>
          <Tabs value={tab} onChange={setTab} items={[{ value: 'all', label: 'Todos' }, { value: 'unread', label: 'Não lidos', count: D.alerts.filter((a) => a.unread && !read[a.id]).length }]} />
          {items.length === 0 && <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-tertiary)' }}>Tudo em dia. Nenhum alerta não lido.</div>}
          {items.map((a) => (
            <ListRow key={a.id} onClick={() => setRead((r) => ({ ...r, [a.id]: 1 }))}
              leading={<span className="or-listrow__lead" style={{ background: toneBg[a.tone], color: toneFg[a.tone] }}><i className={'ph-fill ph-' + a.icon} /></span>}
              title={a.title} subtitle={a.desc}
              trailing={<><span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{a.time}</span>{a.unread && !read[a.id] && <span style={{ width: 8, height: 8, borderRadius: 8, background: 'var(--accent)', boxShadow: 'var(--glow-dot)' }} />}</>} />
          ))}
        </Card>
        <Card title="Regras ativas" subtitle="Quando avisar" actions={<IconButton icon="plus" variant="primary" size="sm" label="Nova regra" />} style={{ gap: 6 }}>
          {rules.map(([t, s, on]) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 600 }}>{t}</div><div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 3 }}>{s}</div></div>
              <Switch defaultChecked={on} aria-label={t} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
window.AlertsScreen = AlertsScreen;
