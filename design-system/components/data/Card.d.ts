/**
 * Content container — radius 20, surface-1, hairline border (dark) / soft shadow (light).
 */
export interface CardProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  /** accent = solid radar green (max 1 per view); inverse = white on dark; sunken = nested */
  variant?: 'default' | 'accent' | 'inverse' | 'sunken';
  /** No padding — for tables / charts edge-to-edge */
  flush?: boolean;
  interactive?: boolean;
  children?: React.ReactNode;
}
export declare function Card(props: CardProps): JSX.Element;
