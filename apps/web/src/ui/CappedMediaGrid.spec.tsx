import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CAPPED_MEDIA_PAGE, CappedMediaGrid } from './CappedMediaGrid';

describe('CappedMediaGrid', () => {
  it('shows all tiles when at or under the page size', () => {
    const items = Array.from({ length: 5 }, (_, i) => ({ id: `i${i}` }));
    render(
      <CappedMediaGrid
        items={items}
        getKey={(x) => x.id}
        renderTile={(x) => <span>{x.id}</span>}
      />,
    );
    expect(screen.queryByTestId('capped-media-load-more')).not.toBeInTheDocument();
    expect(screen.getByText('i0')).toBeInTheDocument();
    expect(screen.getByText('i4')).toBeInTheDocument();
  });

  it('blurs the last cell with +n when over the page size', () => {
    const items = Array.from({ length: CAPPED_MEDIA_PAGE + 3 }, (_, i) => ({
      id: `i${i}`,
      url: `https://example.com/${i}.jpg`,
    }));
    render(
      <CappedMediaGrid
        items={items}
        getKey={(x) => x.id}
        overflowPreviewUrl={(x) => x.url}
        renderTile={(x) => <span>{x.id}</span>}
      />,
    );
    // 8 clear + overflow control
    expect(screen.getByText('i0')).toBeInTheDocument();
    expect(screen.getByText(`i${CAPPED_MEDIA_PAGE - 2}`)).toBeInTheDocument();
    expect(screen.queryByText(`i${CAPPED_MEDIA_PAGE - 1}`)).not.toBeInTheDocument();
    expect(screen.getByTestId('capped-media-load-more')).toHaveTextContent('+4');
    expect(screen.getByTestId('capped-media-load-more')).toHaveTextContent('Load more');
  });

  it('expands by another page on Load more', async () => {
    const user = userEvent.setup();
    const items = Array.from({ length: 15 }, (_, i) => ({ id: `i${i}` }));
    render(
      <CappedMediaGrid
        items={items}
        getKey={(x) => x.id}
        renderTile={(x) => <span>{x.id}</span>}
      />,
    );
    await user.click(screen.getByTestId('capped-media-load-more'));
    // After expand to 18, 15 fits — no load more
    expect(screen.queryByTestId('capped-media-load-more')).not.toBeInTheDocument();
    expect(screen.getByText('i14')).toBeInTheDocument();
  });
});
