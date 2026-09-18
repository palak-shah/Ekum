import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { parentBucketKey, parentTitle, TagsField } from './TagsField';

vi.mock('@/lib/apiClient', () => ({
  api: {
    get: vi.fn(async () => [
      {
        id: 't1',
        scope: 'official',
        companyId: null,
        label: 'Bedsheet',
        parentKey: 'HOME TEXTILES',
        status: 'verified',
        createdAt: new Date().toISOString(),
      },
      {
        id: 't2',
        scope: 'official',
        companyId: null,
        label: '1 Pc Kurti',
        parentKey: 'WOMENS WEAR',
        status: 'verified',
        createdAt: new Date().toISOString(),
      },
      {
        id: 't3',
        scope: 'official',
        companyId: null,
        label: 'Denim Fabric',
        parentKey: 'FABRICS',
        status: 'verified',
        createdAt: new Date().toISOString(),
      },
      {
        id: 't4',
        scope: 'official',
        companyId: null,
        label: 'Misc Cut',
        parentKey: null,
        status: 'verified',
        createdAt: new Date().toISOString(),
      },
    ]),
    post: vi.fn(),
  },
  ApiError: class ApiError extends Error {},
}));

function wrap(ui: React.ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('parentBucketKey / parentTitle', () => {
  it('maps missing parent to Other bucket and label', () => {
    expect(parentBucketKey(null)).toBe('OTHER');
    expect(parentBucketKey('')).toBe('OTHER');
    expect(parentBucketKey('  ')).toBe('OTHER');
    expect(parentTitle(null)).toBe('Other');
    expect(parentTitle('OTHER')).toBe('Other');
    expect(parentTitle('HOME TEXTILES')).toBe('Home textiles');
  });
});

describe('TagsField', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hints sample tags on the closed row', async () => {
    wrap(<TagsField value={[]} onChange={vi.fn()} />);
    expect(await screen.findByText(/Tap to choose · Bedsheet/i)).toBeInTheDocument();
  });

  it('opens sheet grouped by category with parent filters', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    wrap(<TagsField value={[]} onChange={onChange} />);
    await user.click(screen.getByTestId('tags-field-open'));
    expect(await screen.findByText('Choose tags')).toBeInTheDocument();
    expect(screen.getByTestId('tags-parent-filter')).toBeInTheDocument();
    expect(screen.getAllByText('Home textiles').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Womens wear').length).toBeGreaterThanOrEqual(1);
    await user.click(screen.getByRole('button', { name: 'Bedsheet' }));
    expect(onChange).toHaveBeenCalledWith(['Bedsheet']);
  });

  it('includes Other filter pill for tags without parentKey', async () => {
    const user = userEvent.setup();
    wrap(<TagsField value={[]} onChange={vi.fn()} />);
    await user.click(screen.getByTestId('tags-field-open'));
    expect(await screen.findByText('Choose tags')).toBeInTheDocument();
    const otherPills = screen.getAllByRole('button', { name: 'Other' });
    expect(otherPills.length).toBeGreaterThanOrEqual(1);
    await user.click(otherPills[0]!);
    expect(screen.getByRole('button', { name: 'Misc Cut' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Bedsheet' })).not.toBeInTheDocument();
  });
});
