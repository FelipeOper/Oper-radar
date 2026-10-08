import React from 'react';
const cx=(...a)=>a.filter(Boolean).join(' ');
export function LiveIndicator({ status = 'live', variant = 'dot', size = 28, className, children, ...rest }) {
  if (variant === 'radar') {
    return <span className={cx('or-radar', className)} style={{ width: size, height: size }} role="img" aria-label={children || 'Ao vivo'} {...rest}><span className="or-radar__sweep" /><span className="or-radar__c" /></span>;
  }
  return <span className={cx('or-live', status !== 'live' && 'or-live--' + status, className)} {...rest}><span className="or-live__dot" />{children != null && <span>{children}</span>}</span>;
}
