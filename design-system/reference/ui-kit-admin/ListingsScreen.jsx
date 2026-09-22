function ListingsScreen({ onOpen }) {
  const { Card, DataTable, Tabs, Tag, Input, Select, Pagination, Button, IconButton, Sparkline } = ORK;
  const D = window.OR_DATA;
  const [tab, setTab] = React.useState('all');
  const [q, setQ] = React.useState('');
  const [brands, setBrands] = React.useState(['Scania', 'Volvo']);
  const [sort, setSort] = React.useState({ key: 'price', dir: 'desc' });
  const [page, setPage] = React.useState(1);
  const all = ['Scania', 'Volvo', 'Mercedes-Benz', 'DAF', 'Iveco', 'Volkswagen'];
  let rows = D.listings.filter((l) => (tab === 'all' || l.status === tab) && (!q || (l.model + l.dealer + l.city).toLowerCase().includes(q.toLowerCase())));
  if (brands.length) rows = rows.filter((l) => brands.includes(l.brand));
  rows = [...rows].sort((a, b) => (sort.dir === 'asc' ? 1 : -1) * ((a[sort.key] > b[sort.key]) - (a[sort.key] < b[sort.key])));
  const count = (s) => D.listings.filter((l) => s === 'all' || l.status === s).length;
  return (
    <div className="kit-page">
      <PageHead eyebrow="Anúncios" title="18.742 anúncios monitorados">
        <Button icon="bell-simple-ringing" variant="secondary" className="kit-hide-sm">Criar alerta</Button>
        <Button icon="export">Exportar CSV</Button>
      </PageHead>
      <Card style={{ gap: 14 }}>
        <div className="kit-filters">
          <Input icon="magnifying-glass" pill placeholder="Modelo, lojista ou cidade" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: 2, minWidth: 220 }} />
          <Select pill icon="map-pin" options={['Todo o Brasil', 'Sul', 'Sudeste', 'Centro-Oeste', 'Nordeste', 'Norte']} style={{ flex: 1, minWidth: 160 }} />
          <Select pill icon="calendar-blank" options={['Ano: todos', '2022+', '2019–2021', 'Até 2018']} style={{ flex: 1, minWidth: 140 }} />
          <IconButton icon="sliders-horizontal" variant="outline" label="Mais filtros" />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {all.map((b) => <Tag key={b} selected={brands.includes(b)} onClick={() => setBrands((x) => x.includes(b) ? x.filter((y) => y !== b) : [...x, b])}>{b}</Tag>)}
          {brands.length > 0 && <Button variant="ghost" size="sm" onClick={() => setBrands([])}>Limpar</Button>}
        </div>
      </Card>
      <Card flush>
        <div style={{ padding: '16px 16px 4px' }}>
          <Tabs value={tab} onChange={setTab} items={[{ value: 'all', label: 'Todos', count: count('all') }, { value: 'opportunity', label: 'Oportunidades', count: count('opportunity') }, { value: 'drop', label: 'Preço caiu', count: count('drop') }, { value: 'new', label: 'Novos', count: count('new') }, { value: 'sold', label: 'Vendidos', count: count('sold') }]} />
        </div>
        <DataTable onRowClick={onOpen} sort={sort} onSort={setSort} rows={rows} empty="Nenhum anúncio com esses filtros" columns={[
          { key: 'model', header: 'Modelo', primary: true, sortable: true, render: (l) => <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}><b style={{ fontWeight: 600 }}>{l.model}</b><span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{l.dealer}</span></div> },
          { key: 'year', header: 'Ano', sortable: true, muted: true },
          { key: 'km', header: 'Km', align: 'right', sortable: true, muted: true, render: (l) => l.km.toLocaleString('pt-BR') },
          { key: 'city', header: 'Cidade', muted: true },
          { key: 'src', header: 'Fonte', muted: true },
          { key: 'hist', header: 'Preço 30d', render: (l) => <div style={{ width: 72 }}><Sparkline data={l.hist} height={22} area={false} color={l.hist[0] > l.hist[6] ? 'var(--warning)' : 'var(--chart-3)'} /></div> },
          { key: 'price', header: 'Preço', align: 'right', sortable: true, render: (l) => <b style={{ fontWeight: 600 }}>{D.fmtBRL(l.price)}</b> },
          { key: 'status', header: 'Status', align: 'right', render: (l) => <StatusBadge s={l.status} /> },
        ]} />
        <div style={{ padding: 14, borderTop: '1px solid var(--border-subtle)' }}>
          <Pagination page={page} pageCount={937} onChange={setPage} info={'Mostrando ' + rows.length + ' de 18.742'} />
        </div>
      </Card>
    </div>
  );
}
window.ListingsScreen = ListingsScreen;
