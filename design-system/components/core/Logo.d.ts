/** Oper Radar logo from the supplied brand PNGs. Consumers must copy /assets and point `base` at it. */
export interface LogoProps extends React.HTMLAttributes<HTMLElement> {
  /** lockup = mark + wordmark inline; mark = radar only; wordmark = text only */
  variant?: 'lockup' | 'mark' | 'wordmark';
  /** dark = neon green for dark bg; light = navy/green for white bg */
  theme?: 'dark' | 'light';
  /** URL of the assets folder (default "assets/") */
  base?: string;
  height?: number;
}
export declare function Logo(props: LogoProps): JSX.Element;
