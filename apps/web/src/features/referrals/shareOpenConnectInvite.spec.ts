import { describe, expect, it, vi } from 'vitest';
import type { ReferralView } from '@ekum/domain-types';
import { shareOpenConnectInvite } from './shareOpenConnectInvite';

vi.mock('@/lib/shareInvite', () => ({
  inviteShareCopy: vi.fn(() => ({
    title: 'Ekum · Connect with Jaipur Emporium',
    text: 'Jaipur Emporium invites you to connect on Ekum',
  })),
  shareOrCopyInvite: vi.fn(async () => 'shared' as const),
}));

import { inviteShareCopy, shareOrCopyInvite } from '@/lib/shareInvite';

describe('shareOpenConnectInvite', () => {
  it('creates an open invite then shares with business copy', async () => {
    const postReferral = vi.fn(
      async (): Promise<ReferralView> => ({
        id: 'ref1',
        token: 'tok1',
        note: null,
        referrer: {
          id: 'c1',
          name: 'Jaipur Emporium',
          city: '',
          logoUrl: null,
          verification: 'unverified',
        },
        target: null,
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
    );

    const result = await shareOpenConnectInvite({
      postReferral,
      origin: 'https://beta.ekum.app',
      companyName: 'Jaipur Emporium',
    });

    expect(result).toBe('shared');
    expect(postReferral).toHaveBeenCalledOnce();
    expect(inviteShareCopy).toHaveBeenCalledWith({
      kind: 'connect',
      companyName: 'Jaipur Emporium',
    });
    expect(shareOrCopyInvite).toHaveBeenCalledWith({
      url: 'https://beta.ekum.app/r/tok1',
      title: 'Ekum · Connect with Jaipur Emporium',
      text: 'Jaipur Emporium invites you to connect on Ekum',
    });
  });
});
