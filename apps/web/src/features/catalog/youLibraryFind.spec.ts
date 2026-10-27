import { describe, expect, it } from 'vitest';
import { youLibraryFindStaysOpen, youLibraryPageViewSummary } from './youLibraryFind';

describe('youLibraryFindStaysOpen', () => {
  it('keeps Find open for Bookmarks, Drafts, and Deleted', () => {
    expect(youLibraryFindStaysOpen({ saved: true })).toBe(true);
    expect(youLibraryFindStaysOpen({ view: 'draft' })).toBe(true);
    expect(youLibraryFindStaysOpen({ view: 'archived' })).toBe(true);
  });

  it('does not open Find on the published list', () => {
    expect(youLibraryFindStaysOpen({})).toBe(false);
    expect(youLibraryFindStaysOpen({ saved: false, view: null })).toBe(false);
  });
});

describe('youLibraryPageViewSummary', () => {
  it('names the page ⋯ views for Showing + Clear', () => {
    expect(youLibraryPageViewSummary({ saved: true })).toBe('Bookmark');
    expect(youLibraryPageViewSummary({ view: 'draft' })).toBe('Drafts');
    expect(youLibraryPageViewSummary({ view: 'archived' })).toBe('Deleted');
    expect(youLibraryPageViewSummary({})).toBeNull();
  });

  it('prefers Bookmark when saved even if a view is also set', () => {
    expect(youLibraryPageViewSummary({ saved: true, view: 'draft' })).toBe('Bookmark');
  });
});
