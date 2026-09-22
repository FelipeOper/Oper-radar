import React from 'react';
import { Icon } from '../core/Icon.jsx';
const cx=(...a)=>a.filter(Boolean).join(' ');
export function Tabs({ items = [], value, onChange, variant = 'chips', className, ...rest }) {
  return (
    <div role="tablist" className={cx('or-tabs', variant !== 'chips' && 'or-tabs--' + variant, className)} {...rest}>
      {items.map((it) => {
        const t = typeof it === 'string' ? { value: it, label: it } : it;
        const active = t.value === value;
        return (
          <button key={t.value} role="tab" type="button" aria-selected={active} className={cx('or-tab', active && 'or-tab--active')} onClick={() => onChange && onChange(t.value)}>
            {t.icon && <Icon name={t.icon} />}{t.label}{t.count != null && <span className="or-tab__count">{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
