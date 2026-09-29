import { describe, expect, it } from 'vitest';
import {
  EXPLORE_POST_ARTICLE_CLASS,
  EXPLORE_POST_AVATAR,
  EXPLORE_POST_HEADER_CLASS,
  EXPLORE_POST_INSET_CLASS,
  EXPLORE_POST_MEDIA_INSET_CLASS,
} from './cards';

describe('Explore post density', () => {
  it('keeps feed chrome tighter than the old 40px / py-2.5 / pb-3.5 cards', () => {
    expect(EXPLORE_POST_AVATAR).toBe(36);
    expect(EXPLORE_POST_HEADER_CLASS).toContain('py-1.5');
    expect(EXPLORE_POST_HEADER_CLASS).toContain('gap-2.5');
    expect(EXPLORE_POST_ARTICLE_CLASS).toContain('pb-2.5');
    expect(EXPLORE_POST_INSET_CLASS).toBe('px-4');
    expect(EXPLORE_POST_HEADER_CLASS).toContain(EXPLORE_POST_INSET_CLASS);
    expect(EXPLORE_POST_MEDIA_INSET_CLASS).toBe(EXPLORE_POST_INSET_CLASS);
  });
});
