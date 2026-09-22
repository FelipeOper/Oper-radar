/** Sticky glass page header with breadcrumb, title and actions. */
export interface TopbarProps {
  title?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  /** Left slot — e.g. menu IconButton on mobile */
  leading?: React.ReactNode;
  /** Right slot. Add className "or-topbar__hide-sm" to children hidden <900px */
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
export declare function Topbar(props: TopbarProps): JSX.Element;
