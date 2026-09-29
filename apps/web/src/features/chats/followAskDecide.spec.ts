import { describe, expect, it } from 'vitest';
import {
  defaultFollowAskGrants,
  followAskAllowDecision,
  FOLLOW_ASK_GRANT_OPTIONS,
} from './followAskDecide';

describe('followAskDecide', () => {
  it('defaults to they can see my collections', () => {
    expect(FOLLOW_ASK_GRANT_OPTIONS.map((row) => row.id)).toEqual(['see', 'share']);
    expect(defaultFollowAskGrants()).toEqual({ see: true, share: false });
    expect(followAskAllowDecision(defaultFollowAskGrants())).toBe('look');
  });

  it('disables Allow when nothing is checked', () => {
    expect(followAskAllowDecision({ see: false, share: false })).toBeNull();
  });

  it('maps share to pack', () => {
    expect(followAskAllowDecision({ see: true, share: true })).toBe('pack');
    expect(followAskAllowDecision({ see: false, share: true })).toBe('pack');
  });
});
