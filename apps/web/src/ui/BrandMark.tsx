import { cx } from './kit';

type BrandMarkProps = {
  className?: string;
  title?: string;
  /** login = hero mark; header = compact shell */
  size?: 'header' | 'login';
};

/**
 * Teal + orange ekum badge.
 * Login: large, centered hero. Header: compact so it doesn't crowd notifications.
 */
export function BrandMark({ className, title = 'ekum', size = 'header' }: BrandMarkProps) {
  return (
    <img
      src="/brand/logo-primary.png"
      alt={title}
      className={cx(
        'w-auto object-contain',
        size === 'login'
          ? 'h-24 w-auto max-w-[min(90vw,320px)]'
          : 'h-10 max-w-[156px] object-left',
        className,
      )}
      draggable={false}
    />
  );
}
