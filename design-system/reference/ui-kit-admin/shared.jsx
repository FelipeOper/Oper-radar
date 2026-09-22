// Shared helpers for screens
const ORK = window.OperRadarDesignSystem_f1ea51;
const { Badge: KBadge } = ORK;

function useMedia(q) {
  const [m, setM] = React.useState(() => window.matchMedia(q).matches);
  React.useEffect(() => { const mq = window.matchMedia(q); const f = () => setM(mq.matches); mq.addEventListener('change', f); return () => mq.removeEventListener('change', f); }, [q]);
  return m;
}

const STATUS = {
  new: { tone: 'info', label: 'Novo', dot: true },
  drop: { tone: 'warning', label: 'Preço caiu' },
  opportunity: { tone: 'accent', label: 'Oportunidade' },
  stable: { tone: 'neutral', label: 'Estável' },
  sold: { tone: 'neutral', label: 'Vendido' },
};
function StatusBadge({ s }) { const x = STATUS[s]; return <KBadge tone={x.tone} dot={x.dot}>{x.label}</KBadge>; }

function vsFipe(l) { return ((l.price - l.fipe) / l.fipe) * 100; }
function pct(v) { return (v > 0 ? '+' : '') + v.toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 }) + '%'; }

function PageHead({ eyebrow, title, children }) {
  const { SectionTag } = ORK;
  return (
    <div className="kit-pagehead">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
        {eyebrow && <div><SectionTag>{eyebrow}</SectionTag></div>}
        <h1 className="kit-display">{title}</h1>
      </div>
      {children && <div className="kit-pagehead__act">{children}</div>}
    </div>
  );
}

Object.assign(window, { ORK, useMedia, StatusBadge, vsFipe, pct, PageHead });
