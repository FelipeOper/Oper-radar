/** Thin pill progress / share bar. */
export interface ProgressBarProps {
  value: number;
  max?: number;
  label?: React.ReactNode;
  /** Right label; defaults to percentage */
  valueLabel?: React.ReactNode;
  tone?: 'accent' | 'warning' | 'danger' | 'neutral';
  size?: 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}
export declare function ProgressBar(props: ProgressBarProps): JSX.Element;
