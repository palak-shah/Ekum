import { describe, expect, it } from 'vitest';
import { visitorCollectionMoreIds } from './visitorCollectionMore';

describe('visitorCollectionMoreIds', () => {
  it('idle without Repost: Message · Share · Bookmark', () => {
    expect(visitorCollectionMoreIds({ tradeDockUp: false })).toEqual([
      'message',
      'share',
      'bookmark',
    ]);
  });

  it('idle with canRepost: Repost · Message · Share · Bookmark', () => {
    expect(
      visitorCollectionMoreIds({ tradeDockUp: false, canRepost: true }),
    ).toEqual(['repost', 'message', 'share', 'bookmark']);
  });

  it('picks up (dock has Message · Share · Repost): Bookmark only', () => {
    expect(
      visitorCollectionMoreIds({ tradeDockUp: true, canRepost: true }),
    ).toEqual(['bookmark']);
  });
});
