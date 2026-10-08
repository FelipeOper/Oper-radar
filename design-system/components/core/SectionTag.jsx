import React from 'react';
const cx=(...a)=>a.filter(Boolean).join(' ');
export function SectionTag({ variant = 'outline', className, children, ...rest }) {
  return <span className={cx('or-sectiontag', variant !== 'outline' && 'or-sectiontag--' + variant, className)} {...rest}>{children}</span>;
}
