import React from 'react';
import { Icon } from './Icon.jsx';
const cx=(...a)=>a.filter(Boolean).join(' ');
export function Button({ variant = 'primary', size = 'md', icon, iconEnd, endCircle, block, as, className, children, ...rest }) {
  const Tag = as || (rest.href ? 'a' : 'button');
  return (
    <Tag className={cx('or-btn', 'or-btn--' + variant, size !== 'md' && 'or-btn--' + size, block && 'or-btn--block', className)} {...(Tag === 'button' ? { type: rest.type || 'button' } : {})} {...rest}>
      {icon && <Icon name={icon} />}
      {children != null && <span>{children}</span>}
      {iconEnd && !endCircle && <Icon name={iconEnd} />}
      {endCircle && <span className="or-btn__end"><Icon name={iconEnd || 'arrow-right'} weight="bold" /></span>}
    </Tag>
  );
}
