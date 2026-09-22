import React from 'react';
import { Icon } from './Icon.jsx';
const cx=(...a)=>a.filter(Boolean).join(' ');
export function IconButton({ icon, variant = 'secondary', size = 'md', weight = 'regular', dot, label, className, ...rest }) {
  return (
    <button type="button" aria-label={label} title={label} className={cx('or-iconbtn', 'or-iconbtn--' + variant, size !== 'md' && 'or-iconbtn--' + size, className)} {...rest}>
      <Icon name={icon} weight={weight} />
      {dot && <span className="or-iconbtn__dot" />}
    </button>
  );
}
