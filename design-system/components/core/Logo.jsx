import React from 'react';
export function Logo({ variant = 'lockup', theme = 'dark', base = 'assets/', height = 28, className, style, ...rest }) {
  const b = base.endsWith('/') ? base : base + '/';
  const mark = b + (theme === 'light' ? 'mark-light.png' : 'mark-dark.png');
  const word = b + (theme === 'light' ? 'wordmark-light.png' : 'wordmark-dark.png');
  if (variant === 'mark') return <img src={mark} alt="Oper Radar" className={className} style={{ height, width: 'auto', ...style }} {...rest} />;
  if (variant === 'wordmark') return <img src={word} alt="Oper Radar" className={className} style={{ height, width: 'auto', ...style }} {...rest} />;
  return <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: height * 0.35, ...style }} {...rest}><img src={mark} alt="" style={{ height: height * 1.25, width: 'auto' }} /><img src={word} alt="Oper Radar" style={{ height: height * 0.62, width: 'auto' }} /></span>;
}
