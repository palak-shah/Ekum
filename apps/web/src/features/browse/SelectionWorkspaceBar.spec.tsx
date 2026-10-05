import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SELECTION_FLOATER_MIN_H, SelectionWorkspaceBar } from './SelectionWorkspaceBar';

vi.mock('@/features/browse/useBrowseShortlist', () => ({
  useBrowseShortlist: () => ({
    count: 1,
    entries: [
      {
        productId: 'p1',
        name: 'Navy',
        thumbUrl: null,
        companyId: 'c1',
        companyName: 'Mill',
      },
    ],
  }),
}));

vi.mock('@/features/browse/useBrowseAlbumPick', () => ({
  useBrowseAlbumPick: () => ({ count: 0, entries: [] }),
}));

vi.mock('@/lib/queries', () => ({
  useMyCompany: () => ({ data: { id: 'me' } }),
}));

vi.mock('@/features/browse/prefetchSelectionPage', () => ({
  prefetchSelectionPage: vi.fn(),
}));

vi.mock('@/features/browse/resumeAfterAlbumPick', () => ({
  readResumeAfterAlbumPick: () => null,
}));

describe('SelectionWorkspaceBar', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('keeps View and Order at least kit 40px tall for phone thumbs (BM tap)', () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/explore']}>
          <SelectionWorkspaceBar />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(SELECTION_FLOATER_MIN_H).toBe('min-h-10');
    const shell = screen.getByTestId('selection-workspace-bar').firstElementChild;
    expect(shell?.className).toContain('min-h-10');
    expect(screen.getByTestId('selection-workspace-view').className).toContain('min-h-10');
    expect(screen.getByTestId('selection-workspace-order').className).toContain('min-h-10');
    expect(screen.getByTestId('selection-workspace-order').className).toContain('text-sm');
    expect(screen.getByTestId('selection-workspace-view').querySelector('span.truncate')?.className).toContain(
      'text-sm',
    );
  });
});
