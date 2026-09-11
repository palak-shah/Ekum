import { describe, expect, it } from 'vitest';
import type { ReferralView } from '@ekum/domain-types';
import { referralInviteCopy, referralOgHtml } from './referral-og';

const openInvite: ReferralView = {
  id: 'r1',
  token: 'tok',
  note: null,
  referrer: {
    id: 'c1',
    name: 'Jaipur Emporium',
    city: 'Jaipur',
    verification: 'none',
    logoUrl: null,
  },
  target: null,
  createdAt: new Date().toISOString(),
};

describe('referralInviteCopy', () => {
  it('names the business for open invites', () => {
    expect(referralInviteCopy(openInvite)).toEqual({
      title: 'Ekum · Connect with Jaipur Emporium',
      description: 'Jaipur Emporium invites you to connect on Ekum',
    });
  });

  it('names both parties for vouch', () => {
    expect(
      referralInviteCopy({
        ...openInvite,
        target: {
          id: 'c2',
          name: 'Surat Silk House',
          city: 'Surat',
          verification: 'none',
          logoUrl: null,
        },
      }),
    ).toEqual({
      title: 'Ekum · Jaipur Emporium introduces Surat Silk House',
      description: 'Jaipur Emporium introduces Surat Silk House on Ekum',
    });
  });
});

describe('referralOgHtml', () => {
  it('puts Ekum title and app icon when there is no logo', () => {
    const html = referralOgHtml({
      view: openInvite,
      pageUrl: 'https://beta.ekum.app/r/tok',
      mediaBase: 'https://beta.ekum.app/media',
      fallbackImageUrl: 'https://beta.ekum.app/brand/app-icon-512.png',
    });
    expect(html).toContain('og:title" content="Ekum · Connect with Jaipur Emporium"');
    expect(html).toContain(
      'og:description" content="Jaipur Emporium invites you to connect on Ekum"',
    );
    expect(html).toContain('og:image" content="https://beta.ekum.app/brand/app-icon-512.png"');
    expect(html).toContain('summary_large_image');
  });
});
