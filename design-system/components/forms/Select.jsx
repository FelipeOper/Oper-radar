import React from 'react';
import { Icon } from '../core/Icon.jsx';
const cx=(...a)=>a.filter(Boolean).join(' ');
export function Select({ label, hint, error, icon, options = [], size = 'md', pill, placeholder, disabled, className, style, children, ...rest }) {
  return (
    <label className={cx('or-field', error && 'or-field--error', className)} style={style}>
      {label && <span className="or-field__label">{label}</span>}
      <span className={cx('or-input', size !== 'md' && 'or-input--' + size, pill && 'or-input--pill', disabled && 'or-input--disabled')}>
        {icon && <Icon name={icon} />}
        <select disabled={disabled} {...rest}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
          {children}
        </select>
        <Icon name="caret-down" className="or-input__caret" />
      </span>
      {(error || hint) && <span className="or-field__hint">{error || hint}</span>}
    </label>
  );
}
