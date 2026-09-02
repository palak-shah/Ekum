import { Link } from 'react-router-dom';
import { EXPLORE_BUSINESSES_SEARCH_HREF } from '@/features/explore/exploreDiscoveryHref';
import { cx } from '@/ui/kit';

type Props = {
  href?: string;
  label?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  fullWidth?: boolean;
  className?: string;
};

const VARIANT_CLASS: Record<NonNullable<Props['variant']>, string> = {
  primary: 'bg-accent text-white hover:bg-accent-dark active:bg-accent-dark',
  secondary:
    'bg-surface text-accent border-[1.5px] border-accent hover:bg-foam active:bg-foam',
  ghost: 'text-accent hover:bg-foam active:bg-foam',
};

/** Shared CTA when the user has no connections/chats yet. */
export function FindInExploreLink({
  href = EXPLORE_BUSINESSES_SEARCH_HREF,
  label = 'Find in Explore',
  variant = 'primary',
  fullWidth = true,
  className,
}: Props) {
  return (
    <Link
      to={href}
      data-testid="find-in-explore-link"
      className={cx(
        'inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[13px] px-4 text-sm font-bold tracking-tight transition-colors',
        VARIANT_CLASS[variant],
        fullWidth && 'w-full',
        className,
      )}
    >
      {label}
    </Link>
  );
}
