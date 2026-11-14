import { describe, expect, it } from 'vitest';
import { allowedFollowSome, isLookOnlyFollowBlock, isPackFollow } from './follow-access';

describe('follow-access', () => {
  it('filters audience to allowed rows', () => {
    expect(allowedFollowSome('viewer')).toEqual({
      some: { followerCompanyId: 'viewer', status: 'allowed' },
    });
  });

  it('blocks curate for look-only even when connected', () => {
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
    ).toBe(true);
    expect(isPackFollow({ status: 'allowed', accessKind: 'pack' })).toBe(true);
    expect(
      isLookOnlyFollowBlock({
        follow: { status: 'allowed', accessKind: 'pack' },
      }),
    ).toBe(false);
  });
});
