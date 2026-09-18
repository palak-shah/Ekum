import { useState, type ReactNode } from 'react';
import { cx } from '@/ui/kit';

/** Initial visible tiles (3×3) and expand step for multi-image grids. */
export const CAPPED_MEDIA_PAGE = 9;

export type CappedMediaGridProps<T> = {
  items: T[];
  getKey: (item: T, index: number) => string;
  renderTile: (item: T, index: number) => ReactNode;
  /** Image URL for the overflow (blurred) tile — usually the item at the overflow index. */
  overflowPreviewUrl?: (item: T, index: number) => string | null | undefined;
  className?: string;
  /** Test id on the load-more control. */
  loadMoreTestId?: string;
};

/**
 * 3-col media grid: show up to 9 tiles; if more remain, the last cell is blurred
 * with Load more / +n. Expands in steps of 9.
 */
export function CappedMediaGrid<T>({
  items,
  getKey,
  renderTile,
  overflowPreviewUrl,
  className,
  loadMoreTestId = 'capped-media-load-more',
}: CappedMediaGridProps<T>) {
  const [visibleCap, setVisibleCap] = useState(CAPPED_MEDIA_PAGE);
  const total = items.length;
  const needsCap = total > visibleCap;
  const clearCount = needsCap ? visibleCap - 1 : total;
  const overflowIndex = clearCount;
  const remaining = needsCap ? total - clearCount : 0;
  const overflowItem = needsCap ? items[overflowIndex] : undefined;
  const preview =
    overflowItem && overflowPreviewUrl
      ? overflowPreviewUrl(overflowItem, overflowIndex)
      : null;

  return (
    <div className={cx('grid grid-cols-3 gap-2', className)}>
      {items.slice(0, clearCount).map((item, index) => (
        <div key={getKey(item, index)} className="min-w-0 overflow-hidden">
          {renderTile(item, index)}
        </div>
      ))}
      {needsCap && overflowItem ? (
        <button
          type="button"
          data-testid={loadMoreTestId}
          onClick={() => setVisibleCap((c) => c + CAPPED_MEDIA_PAGE)}
          className="relative aspect-square overflow-hidden rounded-xl bg-foam text-left"
          aria-label={`Load more, ${remaining} left`}
        >
          {preview ? (
            <img
              src={preview}
              alt=""
              className="h-full w-full object-cover blur-sm scale-105"
            />
          ) : (
            <div className="h-full w-full bg-foam" />
          )}
          <span className="absolute inset-0 flex flex-col items-center justify-center bg-ink/45 px-1 text-center">
            <span className="text-sm font-bold text-white">+{remaining}</span>
            <span className="text-[11px] font-semibold text-white/90">Load more</span>
          </span>
        </button>
      ) : null}
    </div>
  );
}
