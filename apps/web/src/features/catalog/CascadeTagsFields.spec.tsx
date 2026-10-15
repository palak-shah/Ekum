import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { CascadeTagsFields } from './CascadeTagsFields';

vi.mock('@/lib/apiClient', () => ({
  api: {
    get: vi.fn().mockResolvedValue({
      category: {
        id: 'c1',
        slug: 'womens_readymade_ethnic',
        label: 'Womens – Readymade – Ethnic',
        active: true,
        sortOrder: 1,
      },
      itemTypes: ['Kurti'],
      qualities: ['Cotton'],
      sizes: ['M'],
      units: ['pc'],
    }),
  },
}));

describe('CascadeTagsFields', () => {
  it('shows Item / Quality / Size tags labels', () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <CascadeTagsFields
          items={[]}
          qualities={[]}
          sizes={[]}
          masterCategoryId="c1"
          onItems={() => undefined}
          onQualities={() => undefined}
          onSizes={() => undefined}
        />
      </QueryClientProvider>,
    );
    expect(screen.getByText('Item tags')).toBeTruthy();
    expect(screen.getByText('Quality / work tags')).toBeTruthy();
    expect(screen.getByText('Size tags')).toBeTruthy();
  });
});
