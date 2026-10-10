import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  EXPLORE_FEED_ESTIMATE_PX,
  EXPLORE_FEED_OVERSCAN,
  EXPLORE_FEED_VIRTUALIZE_AFTER,
  VirtualFeedList,
} from './VirtualFeedList';

const virtualizerArgs: {
  count?: number;
  overscan?: number;
  estimateSize?: () => number;
  scrollMargin?: number;
}[] = [];

vi.mock('@tanstack/react-virtual', () => ({
  useWindowVirtualizer: (args: {
    count: number;
    overscan?: number;
    estimateSize?: () => number;
    scrollMargin?: number;
  }) => {
    virtualizerArgs.push(args);
    const count = args.count;
    return {
      getTotalSize: () => (count > 0 ? args.scrollMargin! + count * 100 : 0),
      getVirtualItems: () =>
        count <= 0
          ? []
          : Array.from({ length: Math.min(count, 3) }, (_, index) => ({
              index,
              start: (args.scrollMargin ?? 0) + index * 100,
              size: 100,
              key: index,
              end: (args.scrollMargin ?? 0) + (index + 1) * 100,
              lane: 0,
            })),
      measureElement: () => undefined,
      measure: () => undefined,
    };
  },
}));

describe('VirtualFeedList', () => {
  it('exports taller estimate, overscan, and virtualize threshold', () => {
    expect(EXPLORE_FEED_ESTIMATE_PX).toBe(640);
    expect(EXPLORE_FEED_OVERSCAN).toBe(10);
    expect(EXPLORE_FEED_VIRTUALIZE_AFTER).toBe(24);
  });

  it('keeps the buying / More posts window in real layout (no phantom height)', () => {
    const items = Array.from({ length: 12 }, (_, i) => `row-${i}`);
    render(
      <VirtualFeedList
        items={items}
        getKey={(item) => item}
        renderItem={(item) => <p>{item}</p>}
      />,
    );
    const list = screen.getByTestId('explore-feed-list');
    expect(list.style.height).toBe('');
    expect(list.className).toMatch(/flex/);
    expect(screen.getByText('row-0')).toBeInTheDocument();
    expect(screen.getByText('row-11')).toBeInTheDocument();
  });

  it('virtualizes longer feeds and subtracts scrollMargin from spacer height', () => {
    virtualizerArgs.length = 0;
    const items = Array.from({ length: 30 }, (_, i) => `row-${i}`);
    render(
      <VirtualFeedList
        items={items}
        getKey={(item) => item}
        renderItem={(item) => <p>{item}</p>}
      />,
    );
    const list = screen.getByTestId('explore-feed-list');
    const sized = list.firstElementChild as HTMLElement | null;
    // Mock: scrollMargin 0 on first render → height = count * 100
    expect(sized?.style.height).toBe('3000px');
    expect(screen.getByText('row-0')).toBeInTheDocument();
    expect(screen.queryByText('row-10')).not.toBeInTheDocument();
    expect(virtualizerArgs.at(-1)?.count).toBe(30);
    expect(virtualizerArgs.at(-1)?.overscan).toBe(10);
    expect(virtualizerArgs.at(-1)?.estimateSize?.()).toBe(640);
  });
});
