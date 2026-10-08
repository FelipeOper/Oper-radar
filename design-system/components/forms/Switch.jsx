import React from 'react';
const cx=(...a)=>a.filter(Boolean).join(' ');
export function Switch({ label, disabled, className, style, ...rest }) {
  return (
    <label className={cx('or-switch', disabled && 'or-switch--disabled', className)} style={style}>
      <input type="checkbox" role="switch" disabled={disabled} {...rest} />
      <span className="or-switch__track" />
      {label && <span>{label}</span>}
    </label>
  );
}
