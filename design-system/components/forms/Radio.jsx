import React from 'react';
const cx=(...a)=>a.filter(Boolean).join(' ');
export function Radio({ label, description, disabled, className, style, ...rest }) {
  return (
    <label className={cx('or-check', 'or-check--radio', disabled && 'or-check--disabled', className)} style={style}>
      <input type="radio" disabled={disabled} {...rest} />
      <span className="or-check__box" />
      {label && <span>{label}{description && <span className="or-check__desc">{description}</span>}</span>}
    </label>
  );
}
