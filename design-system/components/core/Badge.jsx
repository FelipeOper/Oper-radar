import React from 'react';
const cx=(...a)=>a.filter(Boolean).join(' ');
export function Badge({ tone = 'neutral', size = 'sm', dot, className, children, ...rest }) {
  return <span className={cx('or-badge', 'or-badge--' + tone, size === 'md' && 'or-badge--md', className)} {...rest}>{dot && <span className="or-badge__dot" />}{children != null && <span>{children}</span>}</span>;
}
