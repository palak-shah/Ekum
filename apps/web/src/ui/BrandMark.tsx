import { cx } from './kit';

type BrandMarkProps = {
  className?: string;
  title?: string;
  /** login = hero mark; header = compact shell */
  size?: 'header' | 'login';
};

/**
 * Teal + orange ekum badge.
 * Login: white wordmark for the teal-gradient panel (badge chrome is the panel).
 * Header: compact so it doesn't crowd notifications.
 */
export function BrandMark({ className, title = 'ekum', size = 'header' }: BrandMarkProps) {
  if (size === 'login') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 150 56"
        role="img"
        aria-label={title}
        className={cx('h-14 w-auto max-w-[min(90vw,220px)]', className)}
      >
        <circle cx="28" cy="28" r="27" fill="#F8A12C" />
        <text
          x="28"
          y="38"
          textAnchor="middle"
          fontFamily="Inter, Segoe UI, Helvetica Neue, Arial, sans-serif"
          fontSize="30"
          fontWeight="700"
          fill="#fff"
        >
          ek
        </text>
        <text
          x="56"
          y="39"
          fontFamily="Inter, Segoe UI, Helvetica Neue, Arial, sans-serif"
          fontSize="34"
          fontWeight="700"
          fill="#fff"
        >
          um
        </text>
      </svg>
    );
  }

  return (
    <img
      src="/brand/logo-primary.png"
      alt={title}
      className={cx('h-10 w-auto max-w-[156px] object-contain object-left', className)}
      draggable={false}
    />
  );
}
