/** Tiny trend line with fading fill. Stretches to container width. */
export interface SparklineProps {
  data: number[];
  height?: number;
  color?: string;
  area?: boolean;
  className?: string;
  style?: React.CSSProperties;
}
export declare function Sparkline(props: SparklineProps): JSX.Element;
