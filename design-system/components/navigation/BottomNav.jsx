import React from 'react';
import { Icon } from '../core/Icon.jsx';
const cx=(...a)=>a.filter(Boolean).join(' ');
export function BottomNav({ items = [], value, onChange, floating, showLabels = true, className, style }) {
  return (
    <nav className={cx('or-bottomnav', floating && 'or-bottomnav--floating', className)} style={style} aria-label="Principal">
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button key={it.value} type="button" aria-label={it.label} aria-current={active ? 'page' : undefined} className={cx('or-bottomnav__item', active && 'or-bottomnav__item--active')} onClick={() => onChange && onChange(it.value)}>
            <span className="or-bottomnav__ic"><Icon name={it.icon} weight="fill" /></span>
            {showLabels && !floating && <span>{it.label}</span>}
          </button>
        );
      })}
    </nav>
  );
}
