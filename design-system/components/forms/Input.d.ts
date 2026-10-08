/** Filled text input with optional label, leading icon, hint/error. */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  /** Error message — also turns the border red */
  error?: React.ReactNode;
  /** Leading Phosphor icon, e.g. "magnifying-glass" */
  icon?: string;
  trailing?: React.ReactNode;
  /** Keyboard shortcut hint, e.g. "⌘K" */
  kbd?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Fully rounded (search bars) */
  pill?: boolean;
}
export declare function Input(props: InputProps): JSX.Element;
