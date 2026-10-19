import { describe, expect, it } from 'vitest';
import { youLibraryPublishedSelectChrome } from './youLibrarySelectDock';

describe('youLibraryPublishedSelectChrome', () => {
  it('published picks: Share · Order only', () => {
    expect(youLibraryPublishedSelectChrome({ hideableCount: 2 })).toEqual({
      dock: ['share', 'order'],
    });
  });

  it('draft or archived selections have no Share · Order dock', () => {
    expect(youLibraryPublishedSelectChrome({ hideableCount: 0 }).dock).toEqual([]);
  });
});
