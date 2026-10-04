import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';

/** Approximate Explore post card height (header + square mosaic + caption). */
export const EXPLORE_FEED_ESTIMATE_PX = 520;

/** Default overscan — tall cards need several rows ahead to avoid white canvas on fling. */
export const EXPLORE_FEED_OVERSCAN = 6;

/**
 * Window-scrolled virtual list for Explore feeds.
 * Only mounts rows near the viewport so cover images are not all requested at once.
 */
export function VirtualFeedList<T>({
  items,
  getKey,
  estimateSize = EXPLORE_FEED_ESTIMATE_PX,
  overscan = EXPLORE_FEED_OVERSCAN,
  renderItem,
}: {
  items: T[];
  getKey: (item: T, index: number) => string;
  estimateSize?: number;
  overscan?: number;
  renderItem: (item: T, index: number) => ReactNode;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  useLayoutEffect(() => {
    const node = listRef.current;
    if (!node) return;
    const update = () => {
      const top = node.getBoundingClientRect().top + window.scrollY;
      setScrollMargin(top);
    };
    update();
    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => update()) : null;
    ro?.observe(node);
    window.addEventListener('resize', update);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [items.length]);

  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: () => estimateSize,
    overscan,
    scrollMargin,
  });

  if (items.length === 0) return null;

  // Short lists: skip virtualizer chrome (Stories / filters stay simple).
  if (items.length <= 6) {
    return (
      <div ref={listRef} className="flex flex-col" data-testid="explore-feed-list">
        {items.map((item, index) => (
          <div key={getKey(item, index)}>{renderItem(item, index)}</div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      className="relative w-full"
      data-testid="explore-feed-list"
      style={{ height: virtualizer.getTotalSize() }}
    >
      {virtualizer.getVirtualItems().map((row) => (
        <div
          key={getKey(items[row.index]!, row.index)}
          data-index={row.index}
          ref={virtualizer.measureElement}
          className="absolute left-0 top-0 w-full"
          style={{
            transform: `translateY(${row.start - scrollMargin}px)`,
          }}
        >
          {renderItem(items[row.index]!, row.index)}
        </div>
      ))}
    </div>
  );
}
