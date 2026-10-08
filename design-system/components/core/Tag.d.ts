/** Toggleable filter chip. Selected = inverse (white on dark / black on light). */
export interface TagProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  /** accent = selected state uses radar green instead of inverse */
  tone?: 'default' | 'accent';
  icon?: string;
  count?: number | string;
  /** Shows an × and calls back — for applied-filter chips */
  onRemove?: (e: React.MouseEvent) => void;
  children?: React.ReactNode;
}
export declare function Tag(props: TagProps): JSX.Element;
