import React from 'react';
const cx=(...a)=>a.filter(Boolean).join(' ');
export function Tooltip({ content, placement = 'top', open, children, className, style }) {
  return <span className={cx('or-tooltip', placement === 'bottom' && 'or-tooltip--bottom', open && 'or-tooltip--open', className)} style={style}>{children}<span role="tooltip" className="or-tooltip__b">{content}</span></span>;
}
