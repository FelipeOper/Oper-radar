/** Inverse bubble on hover/focus. Never put essential info only in a tooltip (no hover on touch). */
export interface TooltipProps {
  content: React.ReactNode;
  placement?: 'top' | 'bottom';
  /** Force visible (demos) */
  open?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
export declare function Tooltip(props: TooltipProps): JSX.Element;
