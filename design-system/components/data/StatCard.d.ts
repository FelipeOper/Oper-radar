/**
 * KPI tile: label, big tabular number, delta vs previous period, optional sparkline.
 */
export interface StatCardProps extends React.HTMLAttributes<HTMLElement> {
  label: React.ReactNode;
  value: React.ReactNode;
  unit?: React.ReactNode;
  /** number = percent (formatted pt-BR, sign added) or preformatted string */
  delta?: number | string;
  deltaLabel?: React.ReactNode;
  /** Override direction when delta is a string, or when "down" is good */
  trend?: 'up' | 'down' | 'flat';
  icon?: string;
  spark?: number[];
  variant?: 'default' | 'accent' | 'inverse';
  footer?: React.ReactNode;
}
export declare function StatCard(props: StatCardProps): JSX.Element;
