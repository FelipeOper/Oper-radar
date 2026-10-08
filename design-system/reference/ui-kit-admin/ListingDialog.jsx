function ListingDialog({ listing, onClose, onAlert }) {
  const { Dialog, Button, Badge, Card, AreaChart, ListRow } = ORK;
  const D = window.OR_DATA;
  if (!listing) return null;
  const l = listing, diff = vsFipe(l);
  return (
    <Dialog size="lg" title={l.model} description={l.year + ' · ' + l.km.toLocaleString('pt-BR') + ' km · ' + l.city} onClose={onClose}
      footer={<><Button variant="secondary" icon="arrow-square-out">Abrir na {l.src}</Button><Button icon="bell-simple-ringing" onClick={() => onAlert(l)}>Monitorar preço</Button></>}>
      <div className="kit-detail">
        <Card variant="sunken" style={{ gap: 6 }}>
          <span style={{ font: '500 12px var(--font-sans)', color: 'var(--text-secondary)' }}>Preço anunciado</span>
          <span style={{ font: '700 32px/1 var(--font-sans)', letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}>{D.fmtBRL(l.price)}</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}><Badge tone={diff < 0 ? 'success' : 'warning'}>{pct(diff)} vs. FIPE</Badge><span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>FIPE {D.fmtBRL(l.fipe)}</span></div>
        </Card>
        <Card variant="sunken" style={{ gap: 10 }}>
          <span style={{ font: '500 12px var(--font-sans)', color: 'var(--text-secondary)' }}>Histórico de preço (mil R$)</span>
          <AreaChart height={92} yTicks={2} baseline="auto" series={[{ name: 'Preço', data: l.hist }]} labels={['30d', '15d', 'hoje']} />
        </Card>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <ListRow icon="storefront" title={l.dealer} subtitle="Anunciante · 214 anúncios ativos" arrow onClick={() => {}} />
        <ListRow icon="clock" title={l.days === 0 ? 'Publicado hoje' : 'No ar há ' + l.days + ' dias'} subtitle={'Fonte: ' + l.src + ' · coletado há 4 min'} trailing={<StatusBadge s={l.status} />} />
      </div>
    </Dialog>
  );
}
window.ListingDialog = ListingDialog;
