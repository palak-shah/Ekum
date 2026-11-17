import { describe, expect, it } from 'vitest';
import { discoverableProfileWhere } from './follow-access';

describe('discoverableProfileWhere', () => {
  it('allows Public companies or Private with an approved follower', () => {
    expect(discoverableProfileWhere('viewer')).toEqual({
      OR: [
        { profileVisibility: 'public' },
        { followers: { some: { followerCompanyId: 'viewer', status: 'allowed' } } },
      ],
    });
  });
});
