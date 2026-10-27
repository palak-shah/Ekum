import { describe, expect, it } from 'vitest';
import {
  youLibraryCreateRowDisabled,
  youLibraryShowsDesignAdd,
  youLibraryShowsDesignSelectMore,
} from './youLibraryAdd';

describe('youLibraryShowsDesignAdd', () => {
  it('shows New design on idle Designs', () => {
    expect(youLibraryShowsDesignAdd({ tab: 'products', youSaved: false })).toBe(true);
  });

  it('still shows New design while Selecting', () => {
    expect(youLibraryShowsDesignAdd({ tab: 'products', youSaved: false })).toBe(true);
    expect(youLibraryCreateRowDisabled(true)).toBe(true);
    expect(youLibraryCreateRowDisabled(false)).toBe(false);
  });

  it('hides on Collections, Catalogs, and Bookmark', () => {
    expect(youLibraryShowsDesignAdd({ tab: 'collections', youSaved: false })).toBe(false);
    expect(youLibraryShowsDesignAdd({ tab: 'catalogs', youSaved: false })).toBe(false);
    expect(youLibraryShowsDesignAdd({ tab: 'products', youSaved: true })).toBe(false);
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
