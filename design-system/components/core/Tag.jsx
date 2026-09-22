import React from 'react';
import { Icon } from './Icon.jsx';
const cx=(...a)=>a.filter(Boolean).join(' ');
export function Tag({ selected, tone, icon, count, onRemove, className, children, ...rest }) {
  return (
    <button type="button" aria-pressed={!!selected} className={cx('or-tag', selected && 'or-tag--selected', tone === 'accent' && 'or-tag--accent', className)} {...rest}>
      {icon && <Icon name={icon} />}
      <span>{children}</span>
      {count != null && <span className="or-tag__count">{count}</span>}
      {onRemove && <span role="button" aria-label="Remover" className="or-tag__x" onClick={(e) => { e.stopPropagation(); onRemove(e); }}><Icon name="x" weight="bold" /></span>}
    </button>
  );
}
