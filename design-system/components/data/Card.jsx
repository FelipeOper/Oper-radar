import React from 'react';
const cx=(...a)=>a.filter(Boolean).join(' ');
export function Card({ title, subtitle, actions, variant = 'default', flush, interactive, className, children, ...rest }) {
  return (
    <section className={cx('or-card', variant !== 'default' && 'or-card--' + variant, flush && 'or-card--flush', interactive && 'or-card--interactive', className)} {...rest}>
      {(title || actions) && (
        <div className="or-card__head">
          <div style={{ minWidth: 0 }}>{title && <h3 className="or-card__title">{title}</h3>}{subtitle && <div className="or-card__sub">{subtitle}</div>}</div>
          {actions && <div className="or-card__actions">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
