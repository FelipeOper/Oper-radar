/** Small status pill (non-interactive). */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'inverse';
  size?: 'sm' | 'md';
  /** Leading status dot */
  dot?: boolean;
  children?: React.ReactNode;
}
export declare function Badge(props: BadgeProps): JSX.Element;
