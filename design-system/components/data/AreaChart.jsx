import React from 'react';
export function AreaChart({ series = [], labels = [], height = 220, yTicks = 4, format = (v) => v.toLocaleString('pt-BR'), legend = true, baseline = 'zero', className, style }) {
  const uid = React.useMemo(() => 'ac' + Math.random().toString(36).slice(2, 8), []);
  const all = series.flatMap((s) => s.data);
  if (!all.length) return null;
  const lo = Math.min(...all), hi = Math.max(...all), pad = (hi - lo || hi || 1) * 0.12;
  const max = hi + pad, min = baseline === 'auto' ? lo - pad : Math.min(0, lo);
  const n = Math.max(1, (series[0]?.data.length || 1) - 1);
  const y = (v) => 100 - ((v - min) / (max - min || 1)) * 100;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => min + ((max - min) * i) / yTicks).reverse();
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 12, ...style }}>
      {legend && series.length > 1 && <div className="or-legend">{series.map((s, i) => <span key={i}><i style={{ background: s.color || 'var(--chart-' + (i + 1) + ')' }} />{s.name}</span>)}</div>}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height, font: '500 10.5px var(--font-sans)', color: 'var(--chart-axis)', textAlign: 'right', fontVariantNumeric: 'tabular-nums', margin: '-6px 0' }}>{ticks.map((t, i) => <span key={i}>{format(Math.round(t))}</span>)}</div>
        <div style={{ position: 'relative', flex: 1, height, minWidth: 0 }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>{ticks.map((_, i) => <div key={i} style={{ borderTop: '1px dashed var(--chart-grid)' }} />)}</div>
          <svg className="or-chart" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} aria-hidden>
            <defs>{series.map((s, i) => <linearGradient key={i} id={uid + i} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={s.color || 'var(--chart-' + (i + 1) + ')'} stopOpacity={i === 0 ? '.30' : '.08'} /><stop offset="1" stopColor={s.color || 'var(--chart-' + (i + 1) + ')'} stopOpacity="0" /></linearGradient>)}</defs>
            {series.map((s, i) => {
              const d = s.data.map((v, j) => (j ? 'L' : 'M') + ((j / n) * 100).toFixed(2) + ' ' + y(v).toFixed(2)).join(' ');
              const c = s.color || 'var(--chart-' + (i + 1) + ')';
              return <g key={i}>{s.area !== false && <path d={d + ' L100 100 L0 100 Z'} fill={'url(#' + uid + i + ')'} />}<path d={d} fill="none" stroke={c} strokeWidth={i === 0 ? 2.25 : 1.5} strokeDasharray={s.dashed ? '4 4' : undefined} vectorEffect="non-scaling-stroke" strokeLinejoin="round" /></g>;
            })}
          </svg>
        </div>
      </div>
      {labels.length > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 40, font: '500 10.5px var(--font-sans)', color: 'var(--chart-axis)' }}>{labels.map((l, i) => <span key={i}>{l}</span>)}</div>}
    </div>
  );
}
