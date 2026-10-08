import React from 'react';
import { Icon } from '../core/Icon.jsx';
const cx=(...a)=>a.filter(Boolean).join(' ');
export function Checkbox({ label, description, disabled, className, style, ...rest }) {
  return (
    <label className={cx('or-check', disabled && 'or-check--disabled', className)} style={style}>
      <input type="checkbox" disabled={disabled} {...rest} />
      <span className="or-check__box"><Icon name="check" weight="bold" /></span>
      {label && <span>{label}{description && <span className="or-check__desc">{description}</span>}</span>}
    </label>
  );
}
