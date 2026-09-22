/** Pulsing status dot or mini radar sweep — signals live data collection. */
export interface LiveIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: 'live' | 'idle' | 'warning' | 'error';
  /** dot = pulsing dot + label; radar = animated sweep disc */
  variant?: 'dot' | 'radar';
  /** radar diameter in px */
  size?: number;
  children?: React.ReactNode;
}
export declare function LiveIndicator(props: LiveIndicatorProps): JSX.Element;
