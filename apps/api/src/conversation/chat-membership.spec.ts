import { describe, expect, it } from 'vitest';
import { countedMemberIds, membershipKey, sameGroupFingerprint } from '@ekum/domain-types';

describe('group fingerprint', () => {
  it('sorts company ids so order does not create a new group', () => {
    expect(membershipKey(['b', 'a'])).toBe(membershipKey(['a', 'b']));
  });

  it('counts left people and drops removed', () => {
    expect(
      countedMemberIds([
        { userId: 'priya', state: 'left' },
        { userId: 'ravi', state: 'active' },
        { userId: 'gone', state: 'removed' },
      ]),
    ).toEqual(['priya', 'ravi']);
  });

  it('treats same shops + same people as a clone', () => {
    expect(
      sameGroupFingerprint(['mill', 'buyer'], ['priya'], ['buyer', 'mill'], ['priya']),
    ).toBe(true);
    expect(
      sameGroupFingerprint(['mill', 'buyer'], ['priya'], ['buyer', 'mill'], ['amit']),
    ).toBe(false);
  });
});
