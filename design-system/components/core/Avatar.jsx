import React from 'react';
const cx=(...a)=>a.filter(Boolean).join(' ');
export function Avatar({ src, name = '', size = 36, ring, tone, className, style, ...rest }) {
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return <span className={cx('or-avatar', ring && 'or-avatar--ring', tone === 'accent' && 'or-avatar--accent', className)} style={{ width: size, height: size, fontSize: Math.round(size * 0.38), ...style }} title={name} {...rest}>{src ? <img src={src} alt={name} /> : initials}</span>;
}
