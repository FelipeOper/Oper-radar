import React from 'react';
import { Card } from './Card.jsx';
import { Icon } from '../core/Icon.jsx';
import { Sparkline } from './Sparkline.jsx';
const cx=(...a)=>a.filter(Boolean).join(' ');
export function StatCard({ label, value, unit, delta, deltaLabel, trend, icon, spark, variant = 'default', footer, className, ...rest }) {
  const dir = trend || (typeof delta === 'number' ? (delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat') : 'flat');
  const dtxt = typeof delta === 'number' ? (delta > 0 ? '+' : '') + delta.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%' : delta;
  return (
    <Card variant={variant} className={cx('or-stat', className)} {...rest}>
      <div className="or-stat__top"><span className="or-stat__label">{label}</span>{icon && <span className="or-stat__ic"><Icon name={icon} /></span>}</div>
      <div className="or-stat__row">
        <span className="or-stat__value">{value}{unit && <span className="or-stat__unit">{unit}</span>}</span>
        {spark && <div style={{ width: 88, flex: 'none' }}><Sparkline data={spark} height={34} color={variant === 'accent' ? 'var(--black-950)' : undefined} /></div>}
      </div>
      {(delta != null || footer) && (
        <div className="or-stat__foot">
          {delta != null && <span className={'or-stat__delta or-stat__delta--' + dir}><Icon name={dir === 'up' ? 'arrow-up-right' : dir === 'down' ? 'arrow-down-right' : 'minus'} weight="bold" />{dtxt}</span>}
          {deltaLabel && <span>{deltaLabel}</span>}
          {footer}
        </div>
      )}
    </Card>
  );
}
