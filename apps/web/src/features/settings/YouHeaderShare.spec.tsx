import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { YouHeaderShare } from './YouHeaderShare';

vi.mock('@/lib/queries', () => ({
  useMyCompany: () => ({
    data: { id: 'c1', name: 'Surat Silk House' },
  }),
}));

vi.mock('@/features/company/CompanyShareSheet', () => ({
  CompanyShareSheet: ({ open }: { open: boolean }) =>
    open ? <div data-testid="you-share-sheet">Share sheet</div> : null,
}));

describe('YouHeaderShare', () => {
  it('is an icon that opens the same shop share sheet', async () => {
    const user = userEvent.setup();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <YouHeaderShare />
      </QueryClientProvider>,
    );
    const share = screen.getByTestId('you-share');
    expect(share).toHaveAttribute('aria-label', 'Share');
    expect(share.textContent).not.toMatch(/Share/);
    await user.click(share);
    expect(screen.getByTestId('you-share-sheet')).toBeInTheDocument();
  });
});
