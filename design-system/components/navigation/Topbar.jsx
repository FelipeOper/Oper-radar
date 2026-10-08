import React from 'react';
const cx=(...a)=>a.filter(Boolean).join(' ');
export function Topbar({ title, breadcrumb, leading, actions, children, className, style }) {
  return (
    <header className={cx('or-topbar', className)} style={style}>
      {leading}
      <div className="or-topbar__title">
        {breadcrumb && <div className="or-topbar__crumb">{breadcrumb}</div>}
        {title && <h1 className="or-topbar__h">{title}</h1>}
      </div>
      {children}
      {actions && <div className="or-topbar__actions">{actions}</div>}
    </header>
  );
}
