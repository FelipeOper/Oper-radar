import React from 'react';
const cx=(...a)=>a.filter(Boolean).join(' ');
export function ProgressBar({ value = 0, max = 100, label, valueLabel, tone = 'accent', size = 'md', className, style }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cx('or-progress', tone !== 'accent' && 'or-progress--' + tone, size === 'lg' && 'or-progress--lg', className)} style={style}>
      {(label || valueLabel) && <div className="or-progress__top"><span>{label}</span><b>{valueLabel != null ? valueLabel : Math.round(pct) + '%'}</b></div>}
      <div className="or-progress__track" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}><div className="or-progress__bar" style={{ width: pct + '%' }} /></div>
    </div>
  );
}
