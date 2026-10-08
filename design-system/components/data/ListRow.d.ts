/** Rounded row with title/subtitle and trailing value or arrow — settings, rankings, feeds. */
export interface ListRowProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  /** Trailing arrow → (navigable row) */
  arrow?: boolean;
  /** filled = surface pill (reference settings list); plain = transparent, hover only */
  variant?: 'filled' | 'plain';
  onClick?: () => void;
  href?: string;
  className?: string;
  style?: React.CSSProperties;
}
export declare function ListRow(props: ListRowProps): JSX.Element;
