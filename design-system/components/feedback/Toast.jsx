import React from 'react';
import { Icon } from '../core/Icon.jsx';
const cx=(...a)=>a.filter(Boolean).join(' ');
export function Toast({ tone = 'success', icon, title, description, time, action, className, style }) {
  const def = { success: 'check-circle', warning: 'warning', danger: 'x-circle', info: 'bell-simple' }[tone];
  return (
    <div role="status" className={cx('or-toast', tone !== 'success' && 'or-toast--' + tone, className)} style={style}>
      <span className="or-toast__ic"><Icon name={icon || def} weight="fill" /></span>
      <div className="or-toast__body"><span className="or-toast__t">{title}</span>{description && <span className="or-toast__d">{description}</span>}</div>
      {action}
      {time && <span className="or-toast__time">{time}</span>}
    </div>
  );
}
