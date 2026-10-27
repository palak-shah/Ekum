import { describe, expect, it } from 'vitest';
import { youLibraryShowsDesignAdd, youLibraryShowsDesignSelectMore } from './youLibraryAdd';

describe('youLibraryShowsDesignAdd', () => {
  it('shows the trailing + on idle Designs', () => {
    expect(
      youLibraryShowsDesignAdd({ tab: 'products', youSaved: false, selecting: false }),
    ).toBe(true);
  });

  it('hides on Collections, Catalogs, Bookmark, and Select', () => {
    expect(
      youLibraryShowsDesignAdd({ tab: 'collections', youSaved: false, selecting: false }),
    ).toBe(false);
    expect(
      youLibraryShowsDesignAdd({ tab: 'catalogs', youSaved: false, selecting: false }),
    ).toBe(false);
    expect(
      youLibraryShowsDesignAdd({ tab: 'products', youSaved: true, selecting: false }),
    ).toBe(false);
    expect(
      youLibraryShowsDesignAdd({ tab: 'products', youSaved: false, selecting: true }),
    ).toBe(false);
  });
});

describe('youLibraryShowsDesignSelectMore', () => {
  it('shows Designs ⋯ whenever something is selected', () => {
    expect(
      youLibraryShowsDesignSelectMore({ tab: 'products', selectedCount: 1 }),
    ).toBe(true);
    expect(
      youLibraryShowsDesignSelectMore({ tab: 'products', selectedCount: 0 }),
    ).toBe(false);
    expect(
      youLibraryShowsDesignSelectMore({ tab: 'collections', selectedCount: 2 }),
    ).toBe(false);
  });
});
