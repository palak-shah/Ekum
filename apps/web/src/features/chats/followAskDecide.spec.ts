import { describe, expect, it } from 'vitest';
import {
  defaultFollowAskGrants,
  followAskAllowDecision,
  followAskGrantsForKind,
  FOLLOW_ASK_GRANT_OPTIONS,
  FOLLOW_ASK_REPOST_LABEL,
} from './followAskDecide';

describe('followAskDecide', () => {
  it('keeps See + Repost options for allowed cards', () => {
    expect(FOLLOW_ASK_GRANT_OPTIONS.map((row) => row.id)).toEqual(['see', 'share']);
    expect(FOLLOW_ASK_REPOST_LABEL).toBe('Allow Repost');
    expect(defaultFollowAskGrants()).toEqual({ see: true, share: false });
  });

  it('Accept always implies look when Allow Repost is off', () => {
    expect(followAskAllowDecision({ see: false, share: false })).toBe('look');
    expect(followAskAllowDecision(defaultFollowAskGrants())).toBe('look');
  });

  it('maps Allow Repost to pack', () => {
    expect(followAskAllowDecision({ see: true, share: true })).toBe('pack');
    expect(followAskAllowDecision({ see: false, share: true })).toBe('pack');
  });

  it('Repost upgrade starts with see and share on', () => {
    expect(followAskGrantsForKind('share')).toEqual({ see: true, share: true });
    expect(followAskAllowDecision(followAskGrantsForKind('share'))).toBe('pack');
  });
});
