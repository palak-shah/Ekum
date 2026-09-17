import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TagsField } from './TagsField';

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

describe('TagsField', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens sheet and toggles an official tag', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    wrap(<TagsField value={[]} onChange={onChange} />);
    await user.click(screen.getByTestId('tags-field-open'));
    expect(await screen.findByText('Bedsheet')).toBeInTheDocument();
    await user.click(screen.getByText('Bedsheet'));
    expect(onChange).toHaveBeenCalledWith(['Bedsheet']);
  });
});
