export interface DataTableColumn<T = any> {
  key: string;
  header: React.ReactNode;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'right';
  width?: number | string;
  sortable?: boolean;
  /** secondary text color */
  muted?: boolean;
  /** Title line when stacked on mobile (defaults to first column) */
  primary?: boolean;
}
/**
 * Data table — hairline rows, sticky header, sortable columns; stacks into cards under 640px.
 */
export interface DataTableProps<T = any> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey?: string;
  sort?: { key: string; dir: 'asc' | 'desc' };
  onSort?: (sort: { key: string; dir: 'asc' | 'desc' }) => void;
  onRowClick?: (row: T) => void;
  selectedKey?: string | number;
  dense?: boolean;
  /** Collapse rows into label/value cards on small screens (default true) */
  stackOnMobile?: boolean;
  empty?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
export declare function DataTable(props: DataTableProps): JSX.Element;
