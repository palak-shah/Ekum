import { describe, expect, it, vi } from 'vitest';
import { prefetchSelectionPage } from './prefetchSelectionPage';

describe('prefetchSelectionPage', () => {
  it('loads the Selection route module', async () => {
    const mod = await import('@/features/browse/SelectionPage');
    expect(mod.SelectionPage).toBeTypeOf('function');
    expect(() => prefetchSelectionPage()).not.toThrow();
  });
});
