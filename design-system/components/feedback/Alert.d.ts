/** Inline banner with a solid colored icon disc. */
export interface AlertProps {
  tone?: 'info' | 'success' | 'warning' | 'danger';
  title?: React.ReactNode;
  children?: React.ReactNode;
  icon?: string;
  actions?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
export declare function Alert(props: AlertProps): JSX.Element;
