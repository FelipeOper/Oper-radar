/** Native select styled as a filled field with caret. */
export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  icon?: string;
  options?: Array<string | { value: string; label: string }>;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  pill?: boolean;
}
export declare function Select(props: SelectProps): JSX.Element;
