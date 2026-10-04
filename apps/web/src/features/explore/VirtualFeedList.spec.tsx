import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VirtualFeedList } from './VirtualFeedList';

vi.mock('@tanstack/react-virtual', () => ({
  useWindowVirtualizer: ({ count }: { count: number }) => ({
    getTotalSize: () => count * 100,
    getVirtualItems: () =>
      Array.from({ length: Math.min(count, 3) }, (_, index) => ({
        index,
        start: index * 100,
        size: 100,
        key: index,
        end: (index + 1) * 100,
        lane: 0,
      })),
    measureElement: () => undefined,
  }),
}));

describe('VirtualFeedList', () => {
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
  });
});
