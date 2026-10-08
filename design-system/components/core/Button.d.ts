/**
 * Pill-shaped action button.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary = radar green (one per view); secondary = surface; outline; ghost; inverse = white pill; danger */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'inverse' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  /** Leading Phosphor icon name */
  icon?: string;
  /** Trailing Phosphor icon name */
  iconEnd?: string;
  /** Render trailing icon inside a black circle (hero CTA style). Defaults icon to arrow-right */
  endCircle?: boolean;
  block?: boolean;
  href?: string;
  as?: any;
  children?: React.ReactNode;
}
export declare function Button(props: ButtonProps): JSX.Element;
