import { describe, expect, it } from 'vitest';
import { selectionRowHref } from './selectionRowHref';

describe('selectionRowHref', () => {
  it('opens the design page', () => {
    expect(selectionRowHref('Design', 'p1')).toBe('/explore/products/p1');
  });

  it('opens the collection page', () => {
    expect(selectionRowHref('Collection', 'a1')).toBe('/collections/a1');
  });
});
