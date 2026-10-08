/** Radio button — group with a shared `name`. */
export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: React.ReactNode;
}
export declare function Radio(props: RadioProps): JSX.Element;
