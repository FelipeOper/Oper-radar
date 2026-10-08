import React from 'react';
import { Icon } from '../core/Icon.jsx';
const cx=(...a)=>a.filter(Boolean).join(' ');
const IC = { info: 'info', success: 'check', warning: 'exclamation-mark', danger: 'warning' };
export function Alert({ tone = 'info', title, children, icon, actions, className, style }) {
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cx('or-alert', 'or-alert--' + tone, className)} style={style}>
      <span className="or-alert__ic"><Icon name={icon || IC[tone]} weight="bold" /></span>
      <div className="or-alert__body">{title && <span className="or-alert__t">{title}</span>}{children && <span className="or-alert__d">{children}</span>}</div>
      {actions && <div className="or-alert__act">{actions}</div>}
    </div>
  );
}
