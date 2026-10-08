import React from 'react';
import { Icon } from '../core/Icon.jsx';
const cx=(...a)=>a.filter(Boolean).join(' ');
export function ListRow({ title, subtitle, icon, leading, trailing, arrow, variant = 'filled', onClick, href, className, style }) {
  const Tag = href ? 'a' : onClick ? 'button' : 'div';
  return (
    <Tag href={href} onClick={onClick} className={cx('or-listrow', variant === 'plain' && 'or-listrow--plain', Tag === 'div' && 'or-listrow--static', className)} style={style} {...(Tag === 'button' ? { type: 'button' } : {})}>
      {leading || (icon && <span className="or-listrow__lead"><Icon name={icon} /></span>)}
      <span className="or-listrow__body"><span className="or-listrow__t">{title}</span>{subtitle && <span className="or-listrow__s">{subtitle}</span>}</span>
      {(trailing || arrow) && <span className="or-listrow__trail">{trailing}{arrow && <Icon name="arrow-right" weight="bold" className="or-listrow__arrow" />}</span>}
    </Tag>
  );
}
