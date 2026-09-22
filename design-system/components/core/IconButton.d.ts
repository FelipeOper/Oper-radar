/** Circular icon-only button. Always pass `label` for accessibility. */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string;
  /** Accessible name + native tooltip */
  label: string;
  variant?: 'secondary' | 'primary' | 'ghost' | 'outline' | 'inverse';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  weight?: 'regular' | 'fill' | 'bold';
  /** Show a radar-green notification dot */
  dot?: boolean;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
