import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { ExploreFeedMeasureContext } from './exploreFeedMeasure';

/** Approximate Explore post card height (header + square mosaic + caption). */
export const EXPLORE_FEED_ESTIMATE_PX = 640;

/**
 * Overscan both ways — tall mosaic cards need several rows or fling shows
 * white canvas / overlapping captions.
 */
export const EXPLORE_FEED_OVERSCAN = 10;

/**
 * Real layout until the feed is long. The buying window (12) + a couple of
 * More posts taps stays non-virtual — variable caption heights were leaving a
 * blank band above More posts when getTotalSize overshot.
 */
export const EXPLORE_FEED_VIRTUALIZE_AFTER = 24;

function listScrollMargin(node: HTMLElement): number {
  return node.getBoundingClientRect().top + window.scrollY;
}

function mergeRefs<T>(...refs: Array<Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as { current: T | null }).current = node;
    }
  };
}

/**
 * Window-scrolled virtual list for Explore feeds.
 * Outer node owns scrollMargin (Stories / filters above); inner owns total height.
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
  const virtualize = items.length > EXPLORE_FEED_VIRTUALIZE_AFTER;

  useLayoutEffect(() => {
    if (!virtualize) return;
    const node = listRef.current;
    if (!node) return;
    const update = () => {
      const next = listScrollMargin(node);
      setScrollMargin((prev) => (Math.abs(prev - next) < 0.5 ? prev : next));
    };
    update();
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
    };
  }, [items.length, virtualize]);

  const virtualizer = useWindowVirtualizer({
    count: virtualize ? items.length : 0,
    estimateSize: () => estimateSize,
    overscan,
    scrollMargin,
  });

  const remeasure = useCallback(() => {
    if (!virtualize) return;
    requestAnimationFrame(() => {
      virtualizer.measure();
    });
  }, [virtualizer, virtualize]);

  if (items.length === 0) return null;

  // Normal More-posts windows: real document flow — no phantom list height.
  if (!virtualize) {
    return (
      <ExploreFeedMeasureContext.Provider value={null}>
        <div ref={listRef} className="flex flex-col" data-testid="explore-feed-list">
          {items.map((item, index) => (
            <div key={getKey(item, index)} className="bg-canvas">
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </ExploreFeedMeasureContext.Provider>
    );
  }

  // Window virtualizer item starts include scrollMargin; subtract so the spacer
  // matches the laid-out rows (avoids a blank band before More posts).
  const listHeight = Math.max(0, virtualizer.getTotalSize() - scrollMargin);

  return (
    <ExploreFeedMeasureContext.Provider value={remeasure}>
      <div ref={listRef} data-testid="explore-feed-list">
        <div className="relative w-full" style={{ height: listHeight }}>
          {virtualizer.getVirtualItems().map((row) => (
            <VirtualFeedRow
              key={getKey(items[row.index]!, row.index)}
              index={row.index}
              start={row.start}
              scrollMargin={scrollMargin}
              measureElement={virtualizer.measureElement}
            >
              {renderItem(items[row.index]!, row.index)}
            </VirtualFeedRow>
          ))}
        </div>
      </div>
    </ExploreFeedMeasureContext.Provider>
  );
}

function VirtualFeedRow({
  index,
  start,
  scrollMargin,
  measureElement,
  children,
}: {
  index: number;
  start: number;
  scrollMargin: number;
  measureElement: (node: Element | null) => void;
  children: ReactNode;
}) {
  const nodeRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const node = nodeRef.current;
    if (!node) return;
    const id = requestAnimationFrame(() => {
      measureElement(node);
    });
    return () => cancelAnimationFrame(id);
  }, [measureElement, index]);

  return (
    <div
      data-index={index}
      ref={mergeRefs(nodeRef, measureElement)}
      className="absolute left-0 top-0 w-full bg-canvas"
      style={{
        transform: `translateY(${start - scrollMargin}px)`,
        zIndex: index,
      }}
    >
      {children}
    </div>
  );
}
