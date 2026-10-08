/** Uppercase eyebrow label in an outlined pill — the brand's signature section marker. */
export interface SectionTagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'outline' | 'accent' | 'plain';
  children?: React.ReactNode;
}
export declare function SectionTag(props: SectionTagProps): JSX.Element;
