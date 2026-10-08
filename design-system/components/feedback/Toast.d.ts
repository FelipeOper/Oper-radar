/** Glass notification capsule with a square icon tile — transient feedback. */
export interface ToastProps {
  tone?: 'success' | 'warning' | 'danger' | 'info';
  icon?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** e.g. "agora" */
  time?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
export declare function Toast(props: ToastProps): JSX.Element;
