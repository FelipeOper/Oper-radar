import React from 'react';
import { Icon } from '../core/Icon.jsx';
const cx=(...a)=>a.filter(Boolean).join(' ');
export function Input({ label, hint, error, icon, trailing, kbd, size = 'md', pill, disabled, id, className, style, ...rest }) {
  const fid = id || (label ? 'in-' + String(label).replace(/\W+/g, '-').toLowerCase() : undefined);
  return (
    <label className={cx('or-field', error && 'or-field--error', className)} style={style} htmlFor={fid}>
      {label && <span className="or-field__label">{label}</span>}
      <span className={cx('or-input', size !== 'md' && 'or-input--' + size, pill && 'or-input--pill', disabled && 'or-input--disabled')}>
        {icon && <Icon name={icon} />}
        <input id={fid} disabled={disabled} aria-invalid={!!error} {...rest} />
        {kbd && <span className="or-input__kbd">{kbd}</span>}
        {trailing}
      </span>
      {(error || hint) && <span className="or-field__hint">{error || hint}</span>}
    </label>
  );
}
