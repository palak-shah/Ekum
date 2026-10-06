import type { DesignBrowseLayout } from '@/lib/designBrowseLayout';
import { FeedLayoutIcon, GridLayoutIcon } from '@/ui/icons';
import { cx } from '@/ui/kit';

/** Icon-only Feed ↔ Grid (Google Photos–style). Shows the layout you switch *to*. */
export function BrowseLayoutToggle({
  layout,
  onToggle,
  testId = 'browse-layout-toggle',
  className,
}: {
  layout: DesignBrowseLayout;
  onToggle: () => void;
  testId?: string;
  className?: string;
}) {
  const toGrid = layout === 'feed';
  return (
    <button
      type="button"
      data-testid={testId}
      aria-label={toGrid ? 'Grid view' : 'Feed view'}
      className={cx(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-accent hover:bg-accent/5',
        className,
      )}
      onClick={onToggle}
    >
      {toGrid ? (
        <GridLayoutIcon width={18} height={18} aria-hidden />
      ) : (
        <FeedLayoutIcon width={18} height={18} aria-hidden />
      )}
    </button>
  );
}
