import { describe, expect, it } from 'vitest';
import {
  CATALOG_STATUS_FILTERS,
  DEFAULT_CATALOG_LIST_FILTER,
  publishedDesignsElsewhereHint,
  uniqueById,
} from './catalogListFilter';

describe('catalog status chips', () => {
  it('defaults to Published, then Draft, then Archived', () => {
    expect(DEFAULT_CATALOG_LIST_FILTER).toBe('published');
    expect(CATALOG_STATUS_FILTERS.map((row) => row.id)).toEqual([
      'published',
      'draft',
      'archived',
    ]);
  });
});

describe('uniqueById', () => {
  it('keeps a design once when it sits in several collections', () => {
    expect(
      uniqueById([
        { id: 'd1', name: 'Silk' },
        { id: 'd1', name: 'Silk again' },
        { id: 'd2', name: 'Cotton' },
      ]),
    ).toEqual([
      { id: 'd1', name: 'Silk' },
      { id: 'd2', name: 'Cotton' },
    ]);
  });
});

describe('publishedDesignsElsewhereHint', () => {
  it('is silent when Published is also empty', () => {
    expect(publishedDesignsElsewhereHint(0)).toBeNull();
  });

  it('points Draft-empty at pack designs on Published', () => {
    expect(publishedDesignsElsewhereHint(1)).toBe(
      '1 design is on Published (including packs).',
    );
    expect(publishedDesignsElsewhereHint(3)).toBe(
      '3 designs are on Published (including packs).',
    );
  });
});
