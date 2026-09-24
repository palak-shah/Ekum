import { describe, expect, it } from 'vitest';
import { allowedFollowSome, isLookOnlyFollowBlock, isPackFollow } from './follow-access';

describe('follow-access', () => {
  it('filters audience to allowed rows', () => {
    expect(allowedFollowSome('viewer')).toEqual({
      some: { followerCompanyId: 'viewer', status: 'allowed' },
    });
  });

  it('blocks curate for look-only when not connected', () => {
    expect(
      isLookOnlyFollowBlock({
        connected: false,
        follow: { status: 'allowed', accessKind: 'look' },
      }),
    ).toBe(true);
    expect(
      isLookOnlyFollowBlock({
        connected: true,
        follow: { status: 'allowed', accessKind: 'look' },
      }),
    ).toBe(false);
    expect(isPackFollow({ status: 'allowed', accessKind: 'pack' })).toBe(true);
  });
});
