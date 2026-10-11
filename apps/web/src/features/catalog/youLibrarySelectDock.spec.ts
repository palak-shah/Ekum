import { describe, expect, it } from 'vitest';
import { youLibraryPublishedSelectChrome } from './youLibrarySelectDock';

describe('youLibraryPublishedSelectChrome', () => {
  it('published picks: Share · Order dock; Hide · Archive in ⋯ (no Message)', () => {
    expect(
      youLibraryPublishedSelectChrome({
        hideableCount: 2,
        archivableCount: 2,
        canCurate: false,
      }),
    ).toEqual({
      dock: ['share', 'order'],
      more: ['hide', 'archive'],
    });
  });

  it('puts Repost last in ⋯ when selling/trading', () => {
    expect(
      youLibraryPublishedSelectChrome({
        hideableCount: 1,
        archivableCount: 1,
        canCurate: true,
      }).more,
    ).toEqual(['hide', 'archive', 'repost']);
  });

  it('draft/archived selections have no Share · Order dock', () => {
    expect(
      youLibraryPublishedSelectChrome({
        hideableCount: 0,
        archivableCount: 1,
        canCurate: false,
      }).dock,
    ).toEqual([]);
  });
});
