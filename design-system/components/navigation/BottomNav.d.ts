/** Mobile bottom navigation — circular icon buttons, active one filled radar green. */
export interface BottomNavItem { value: string; label: string; icon: string }
export interface BottomNavProps {
  items: BottomNavItem[];
  value?: string;
  onChange?: (value: string) => void;
  /** Floating glass capsule (icons only) instead of full-width bar */
  floating?: boolean;
  showLabels?: boolean;
  className?: string;
  style?: React.CSSProperties;
}
export declare function BottomNav(props: BottomNavProps): JSX.Element;
