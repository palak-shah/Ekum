import { describe, expect, it } from 'vitest';
import { PublishAudience } from '@ekum/domain-types';
import {
  clampAudienceToCeiling,
  isAudienceWithinCeiling,
  maxPublishAudienceForCuratedPack,
} from './curationAudienceCeiling';

describe('maxPublishAudienceForCuratedPack', () => {
  it('returns null when all members are owned', () => {
    expect(
      maxPublishAudienceForCuratedPack('me', [
        { companyId: 'me', audience: PublishAudience.Everyone },
      ]),
    ).toBeNull();
  });

  it('uses the narrowest foreign audience', () => {
    expect(
      maxPublishAudienceForCuratedPack('me', [
        { companyId: 'a', audience: PublishAudience.Followers },
        { companyId: 'b', audience: PublishAudience.Connections },
        { companyId: 'me', audience: PublishAudience.Everyone },
      ]),
    ).toBe(PublishAudience.Connections);
  });
});

describe('isAudienceWithinCeiling / clampAudienceToCeiling', () => {
  it('allows equal or narrower', () => {
    expect(
      isAudienceWithinCeiling(PublishAudience.Connections, PublishAudience.Connections),
    ).toBe(true);
    expect(
      isAudienceWithinCeiling(PublishAudience.Selected, PublishAudience.Connections),
    ).toBe(true);
    expect(
      isAudienceWithinCeiling(PublishAudience.Everyone, PublishAudience.Connections),
    ).toBe(false);
  });

  it('clamps down to the ceiling', () => {
    expect(
      clampAudienceToCeiling(PublishAudience.Everyone, PublishAudience.Connections),
    ).toBe(PublishAudience.Connections);
    expect(
      clampAudienceToCeiling(PublishAudience.Connections, PublishAudience.Connections),
    ).toBe(PublishAudience.Connections);
  });
});
