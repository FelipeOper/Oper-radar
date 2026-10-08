import React from 'react';
import { Icon } from '../core/Icon.jsx';
const cx=(...a)=>a.filter(Boolean).join(' ');
export function Pagination({ page = 1, pageCount = 1, onChange, info, className, style }) {
  const go = (p) => onChange && p >= 1 && p <= pageCount && onChange(p);
  const pages = [];
  for (let p = 1; p <= pageCount; p++) if (p === 1 || p === pageCount || Math.abs(p - page) <= 1) pages.push(p); else if (pages[pages.length - 1] !== '…') pages.push('…');
  return (
    <div className={cx('or-pagination', className)} style={style}>
      {info && <span className="or-pagination__info">{info}</span>}
      <button type="button" className="or-pagination__pg" aria-label="Anterior" disabled={page <= 1} onClick={() => go(page - 1)}><Icon name="caret-left" weight="bold" /></button>
      {pages.map((p, i) => p === '…' ? <span key={'e' + i} className="or-pagination__pg" aria-hidden>…</span> : <button key={p} type="button" aria-current={p === page ? 'page' : undefined} className={cx('or-pagination__pg', p === page && 'or-pagination__pg--active')} onClick={() => go(p)}>{p}</button>)}
      <button type="button" className="or-pagination__pg" aria-label="Próxima" disabled={page >= pageCount} onClick={() => go(page + 1)}><Icon name="caret-right" weight="bold" /></button>
    </div>
  );
}
