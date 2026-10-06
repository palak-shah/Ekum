import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CascadeTagsFields } from './CascadeTagsFields';

function wrap(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('CascadeTagsFields', () => {
  it('labels Item and Quality / work as tags', () => {
    wrap(
      <CascadeTagsFields
        items={[]}
        qualities={[]}
        size=""
        parentKeys={[]}
        onItems={() => {}}
        onQualities={() => {}}
        onSize={() => {}}
      />,
    );
    expect(screen.getByText('Item tags')).toBeTruthy();
    expect(screen.getByText('Quality / work tags')).toBeTruthy();
    expect(screen.getByText('Size')).toBeTruthy();
  });
});
