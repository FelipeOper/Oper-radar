import React from 'react';
import { Icon } from '../core/Icon.jsx';
const cx=(...a)=>a.filter(Boolean).join(' ');
export function NavItem({ icon, label, active, badge, href, onClick, collapsed }) {
  const Tag = href ? 'a' : 'button';
  return (
    <Tag href={href} onClick={onClick} title={collapsed ? label : undefined} aria-current={active ? 'page' : undefined} className={cx('or-navitem', active && 'or-navitem--active')} {...(Tag === 'button' ? { type: 'button' } : {})}>
      {icon && <Icon name={icon} weight={active ? 'fill' : 'regular'} />}
      <span className="or-navitem__label">{label}</span>
      {badge != null && <span className="or-navitem__badge">{badge}</span>}
    </Tag>
  );
}
export function Sidebar({ brand, sections = [], value, onNavigate, collapsed, footer, className, style }) {
  return (
    <nav className={cx('or-sidebar', collapsed && 'or-sidebar--collapsed', className)} style={style} aria-label="Principal">
      {brand && <div className="or-sidebar__brand">{brand}</div>}
      {sections.map((s, i) => (
        <React.Fragment key={i}>
          {s.title && <div className="or-sidebar__section">{s.title}</div>}
          {s.items.map((it) => <NavItem key={it.value} {...it} collapsed={collapsed} active={it.value === value} onClick={() => onNavigate && onNavigate(it.value)} />)}
        </React.Fragment>
      ))}
      {footer && <div className="or-sidebar__foot">{footer}</div>}
    </nav>
  );
}
