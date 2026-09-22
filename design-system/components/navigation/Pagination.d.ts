/** Compact page navigator for tables. */
export interface PaginationProps {
  page: number;
  pageCount: number;
  onChange?: (page: number) => void;
  /** Left-aligned summary, e.g. "1–20 de 1.284" */
  info?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}
export declare function Pagination(props: PaginationProps): JSX.Element;
