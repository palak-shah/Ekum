import { describe, expect, it } from 'vitest';
import { visitorCollectionMoreIds } from './visitorCollectionMore';

describe('visitorCollectionMoreIds', () => {
  it('idle (no trade dock): Message · Share · Bookmark', () => {
    expect(visitorCollectionMoreIds({ tradeDockUp: false })).toEqual([
      'message',
      'share',
      'bookmark',
    ]);
  });

  it('picks up (dock has Message · Share): Bookmark only', () => {
    expect(visitorCollectionMoreIds({ tradeDockUp: true })).toEqual(['bookmark']);
  });
});
