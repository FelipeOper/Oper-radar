/** Circular user / company avatar with initials fallback. */
export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string;
  name?: string;
  /** px, default 36 */
  size?: number;
  /** Radar-green ring (current user / online) */
  ring?: boolean;
  tone?: 'default' | 'accent';
}
export declare function Avatar(props: AvatarProps): JSX.Element;
