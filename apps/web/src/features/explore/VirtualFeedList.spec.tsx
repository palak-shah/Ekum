import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  EXPLORE_FEED_ESTIMATE_PX,
  EXPLORE_FEED_OVERSCAN,
  VirtualFeedList,
} from './VirtualFeedList';

const virtualizerArgs: { overscan?: number; estimateSize?: () => number }[] = [];

vi.mock('@tanstack/react-virtual', () => ({
  useWindowVirtualizer: (args: { count: number; overscan?: number; estimateSize?: () => number }) => {
    virtualizerArgs.push(args);
    return {
      getTotalSize: () => args.count * 100,
      getVirtualItems: () =>
        Array.from({ length: Math.min(args.count, 3) }, (_, index) => ({
          index,
          start: index * 100,
          size: 100,
          key: index,
          end: (index + 1) * 100,
          lane: 0,
        })),
      measureElement: () => undefined,
    };
  },
}));

describe('VirtualFeedList', () => {
  it('exports taller estimate and larger overscan defaults', () => {
    expect(EXPLORE_FEED_ESTIMATE_PX).toBe(520);
    expect(EXPLORE_FEED_OVERSCAN).toBe(6);
  });

  it('renders short lists without virtual height chrome', () => {
    render(
      <VirtualFeedList
        items={['a', 'b']}
        getKey={(item) => item}
        renderItem={(item) => <p>{item}</p>}
      />,
    );
    expect(screen.getByTestId('explore-feed-list').style.height).toBe('');
    expect(screen.getByText('a')).toBeInTheDocument();
    expect(screen.getByText('b')).toBeInTheDocument();
  });

  it('virtualizes longer feeds so only a window of rows mount', () => {
    virtualizerArgs.length = 0;
    const items = Array.from({ length: 20 }, (_, i) => `row-${i}`);
    render(
      <VirtualFeedList
        items={items}
        getKey={(item) => item}
        renderItem={(item) => <p>{item}</p>}
      />,
    );
    expect(screen.getByTestId('explore-feed-list').style.height).toBe('2000px');
    expect(screen.getByText('row-0')).toBeInTheDocument();
    expect(screen.queryByText('row-10')).not.toBeInTheDocument();
    expect(virtualizerArgs.at(-1)?.overscan).toBe(6);
    expect(virtualizerArgs.at(-1)?.estimateSize?.()).toBe(520);
  });
});
