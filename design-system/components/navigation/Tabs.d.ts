/** Pill tab / filter group. Active = inverse fill. */
export interface TabItem { value: string; label: React.ReactNode; icon?: string; count?: number | string }
export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  items: Array<string | TabItem>;
  value: string;
  onChange?: (value: string) => void;
  /** chips = separate pills (reference style); segmented = pills inside a track; underline = text tabs */
  variant?: 'chips' | 'segmented' | 'underline';
}
export declare function Tabs(props: TabsProps): JSX.Element;
