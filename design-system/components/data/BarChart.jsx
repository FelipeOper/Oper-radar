import React from 'react';
export function BarChart({ data = [], height = 200, highlight, format = (v) => v.toLocaleString('pt-BR'), showValues, className, style }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 10, ...style }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6%', height }}>
        {data.map((d, i) => {
          const hi = highlight == null ? i === data.findIndex((x) => x.value === max) : highlight === i;
          return <div key={i} title={d.label + ': ' + format(d.value)} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 6, minWidth: 0 }}>
            {(showValues || hi) && <span style={{ font: '600 11px var(--font-sans)', color: hi ? 'var(--text-primary)' : 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>{format(d.value)}</span>}
            <div style={{ width: '100%', maxWidth: 44, height: (d.value / max) * 100 + '%', minHeight: 4, borderRadius: 'var(--radius-pill)', background: hi ? 'var(--chart-1)' : 'var(--surface-3)', transition: 'height var(--dur-slow) var(--ease-out)' }} />
          </div>;
        })}
      </div>
      <div style={{ display: 'flex', gap: '6%' }}>{data.map((d, i) => <span key={i} style={{ flex: 1, textAlign: 'center', font: '500 10.5px var(--font-sans)', color: 'var(--chart-axis)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label}</span>)}</div>
    </div>
  );
}
