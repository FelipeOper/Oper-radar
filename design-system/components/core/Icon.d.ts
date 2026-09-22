/** Phosphor icon glyph (self-hosted webfont). Use for every UI icon. */
export interface IconProps {
  /** Phosphor icon name without prefix, e.g. "truck", "chart-line-up", "bell-simple" */
  name: string;
  /** regular = inline/UI, fill = nav + active states, bold = tiny sizes */
  weight?: 'regular' | 'fill' | 'bold';
  size?: number | string;
  color?: string;
  /** Accessible label; omit for decorative icons */
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}
export declare function Icon(props: IconProps): JSX.Element;
