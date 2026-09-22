/** Modal dialog; becomes a bottom sheet under 640px. Esc + scrim click close. */
export interface DialogProps {
  open?: boolean;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  onClose?: () => void;
  size?: 'md' | 'lg';
  /** Position absolutely inside nearest positioned parent (for previews) */
  inline?: boolean;
  className?: string;
}
export declare function Dialog(props: DialogProps): JSX.Element;
