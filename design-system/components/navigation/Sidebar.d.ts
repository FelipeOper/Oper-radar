export interface SidebarItem { value: string; label: string; icon?: string; badge?: React.ReactNode; href?: string }
export interface SidebarSection { title?: string; items: SidebarItem[] }
/**
 * Desktop app navigation rail. Active item = radar-green pill with filled icon.
 */
export interface SidebarProps {
  /** Logo slot (use <Logo />) */
  brand?: React.ReactNode;
  sections: SidebarSection[];
  /** value of the active item */
  value?: string;
  onNavigate?: (value: string) => void;
  /** 76px icon-only rail */
  collapsed?: boolean;
  footer?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
export declare function Sidebar(props: SidebarProps): JSX.Element;
export interface NavItemProps extends SidebarItem { active?: boolean; collapsed?: boolean; onClick?: () => void }
export declare function NavItem(props: NavItemProps): JSX.Element;
