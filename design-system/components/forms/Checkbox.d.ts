/** Checkbox with radar-green checked state. */
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: React.ReactNode;
}
export declare function Checkbox(props: CheckboxProps): JSX.Element;
