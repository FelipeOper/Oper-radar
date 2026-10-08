/** Rounded pill bars; the peak (or `highlight`) is radar green, the rest neutral. */
export interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  height?: number;
  /** Index to highlight; defaults to the max value */
  highlight?: number;
  format?: (v: number) => string;
  showValues?: boolean;
  className?: string;
  style?: React.CSSProperties;
}
export declare function BarChart(props: BarChartProps): JSX.Element;
