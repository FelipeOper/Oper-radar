function OverviewScreen({ onOpen, go }) {
  const { StatCard, Card, AreaChart, BarChart, ProgressBar, DataTable, Tabs, IconButton, Button, LiveIndicator, Badge } = ORK;
  const D = window.OR_DATA;
  const [range, setRange] = React.useState('30d');
  const opps = D.listings.filter((l) => vsFipe(l) < -4).sort((a, b) => vsFipe(a) - vsFipe(b));
  return (
    <div className="kit-page">
      <PageHead eyebrow="Visão geral" title={<>Mercado de pesados <span style={{ color: 'var(--text-accent)' }}>hoje.</span></>}>
        <Tabs variant="segmented" items={['7d', '30d', '90d', '12m']} value={range} onChange={setRange} />
        <Button icon="export" variant="secondary" className="kit-hide-sm">Exportar</Button>
      </PageHead>
      <div className="kit-grid-4">
        <StatCard label="Anúncios ativos" value="18.742" delta={4.8} deltaLabel="vs. semana ant." icon="tag" spark={[12, 13, 13, 15, 14, 16, 17, 18.7]} />
        <StatCard label="Novos hoje" value="884" delta={9.2} deltaLabel="vs. ontem" icon="plus-circle" spark={[610, 655, 690, 702, 754, 801, 856, 884]} />
        <StatCard label="Preço médio" value="R$ 412" unit="mil" delta={-1.9} deltaLabel="30 dias" icon="currency-circle-dollar" />
        <StatCard variant="accent" label="Oportunidades" value="37" delta={12} deltaLabel="abaixo da FIPE" icon="lightning" onClick={() => go('ads')} style={{ cursor: 'pointer' }} />
      </div>
      <div className="kit-grid-main">
        <Card title="Novos anúncios por dia" subtitle="Setembro 2026 · todas as fontes" actions={<IconButton icon="dots-three" variant="ghost" size="sm" label="Mais opções" />}>
          <AreaChart height={230} labels={['01/09', '08/09', '15/09', '22/09', '30/09']} series={[{ name: 'Este mês', data: D.daily }, { name: 'Mês anterior', data: D.prev, dashed: true, area: false }]} />
        </Card>
        <Card title="Participação por fonte" subtitle="Anúncios ativos" actions={<LiveIndicator>Ao vivo</LiveIndicator>} style={{ gap: 14 }}>
          {D.sources.slice(0, 5).map((s, i) => <ProgressBar key={s.id} label={s.name} value={s.share} max={45} valueLabel={s.ads.toLocaleString('pt-BR')} tone={i === 0 ? 'accent' : 'neutral'} />)}
          <Button variant="ghost" size="sm" iconEnd="arrow-right" onClick={() => go('sources')} style={{ alignSelf: 'flex-start', marginLeft: -10 }}>Ver fontes</Button>
        </Card>
      </div>
      <div className="kit-grid-main kit-grid-main--rev">
        <Card title="Anúncios por marca" subtitle="Cavalos mecânicos · 30 dias">
          <BarChart height={180} data={D.byBrand} />
        </Card>
        <Card flush title="Oportunidades abaixo da FIPE" subtitle="Ordenado pela maior diferença" actions={<Button size="sm" variant="secondary" onClick={() => go('ads')}>Ver todas</Button>}>
          <DataTable onRowClick={onOpen} rows={opps} columns={[
            { key: 'model', header: 'Modelo', primary: true, render: (l) => <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><b style={{ fontWeight: 600 }}>{l.model}</b><span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{l.year} · {l.city}</span></div> },
            { key: 'src', header: 'Fonte', muted: true },
            { key: 'price', header: 'Preço', align: 'right', render: (l) => D.fmtBRL(l.price) },
            { key: 'fipe', header: 'vs. FIPE', align: 'right', render: (l) => <Badge tone="success">{pct(vsFipe(l))}</Badge> },
          ]} />
        </Card>
      </div>
    </div>
  );
}
window.OverviewScreen = OverviewScreen;
