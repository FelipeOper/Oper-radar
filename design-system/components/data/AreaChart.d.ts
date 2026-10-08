export interface ChartSeries { name: string; data: number[]; color?: string; area?: boolean; dashed?: boolean }
/** Line/area chart for time series. Series 1 = radar green with glow fill; others quieter. */
export interface AreaChartProps {
  series: ChartSeries[];
  /** X-axis labels, spread evenly (show 5–8, not every point) */
  labels?: string[];
  height?: number;
  yTicks?: number;
  format?: (v: number) => string;
  legend?: boolean;
  /** zero = y-axis starts at 0 (volumes); auto = fit to data range (prices) */
  baseline?: 'zero' | 'auto';
  className?: string;
  style?: React.CSSProperties;
}
export declare function AreaChart(props: AreaChartProps): JSX.Element;
