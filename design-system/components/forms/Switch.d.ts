/** On/off toggle for settings that apply immediately. */
export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}
export declare function Switch(props: SwitchProps): JSX.Element;
