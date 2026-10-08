import React from 'react';
export function Sparkline({ data = [], height = 36, color = 'var(--chart-1)', area = true, className, style }) {
  const gid = React.useMemo(() => 'sp' + Math.random().toString(36).slice(2, 8), []);
  if (!data.length) return null;
  const min = Math.min(...data), max = Math.max(...data), r = max - min || 1, n = data.length - 1 || 1;
  const pts = data.map((v, i) => [(i / n) * 100, 100 - ((v - min) / r) * 90 - 5]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join(' ');
  return (
    <svg className={className} style={{ display: 'block', width: '100%', height, overflow: 'visible', ...style }} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".28" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      {area && <path d={d + ' L100 100 L0 100 Z'} fill={'url(#' + gid + ')'} />}
      <path d={d} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
