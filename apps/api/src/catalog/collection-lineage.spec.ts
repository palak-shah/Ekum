import { describe, expect, it } from 'vitest';
import { CollectionStatus, PublishAudience, RepostOrigin } from '@ekum/domain-types';
import {
  audienceCompanyIdsForPublish,
  pickRootSurvivor,
  shouldReuseRepostChild,
} from './collection-lineage';

describe('pickRootSurvivor', () => {
  it('keeps the oldest published pack when two manuals share a root', () => {
    const survivor = pickRootSurvivor([
      {
        id: 'newer',
        status: CollectionStatus.Published,
        createdAt: new Date('2026-10-02'),
        exploreActivityAt: new Date('2026-10-02'),
      },
      {
        id: 'older',
        status: CollectionStatus.Published,
        createdAt: new Date('2026-10-01'),
        exploreActivityAt: new Date('2026-10-01'),
      },
    ]);
    expect(survivor?.id).toBe('older');
  });
});

describe('shouldReuseRepostChild', () => {
  it('reuses a draft', () => {
    expect(shouldReuseRepostChild({ status: CollectionStatus.Draft })).toBe(true);
  });

  it('reuses automatic Selected so Followers Repost can widen', () => {
    expect(
      shouldReuseRepostChild({
        status: CollectionStatus.Published,
        audience: PublishAudience.Selected,
        repostOrigin: RepostOrigin.Automatic,
      }),
    ).toBe(true);
  });

  it('does not reuse a Followers pack', () => {
    expect(
      shouldReuseRepostChild({
        status: CollectionStatus.Published,
        audience: PublishAudience.Followers,
        repostOrigin: RepostOrigin.Automatic,
      }),
    ).toBe(false);
  });
});

describe('audienceCompanyIdsForPublish', () => {
  it('keeps Direct Link buyers when automatic Selected widens to Followers', () => {
    expect(
      audienceCompanyIdsForPublish({
        nextAudience: PublishAudience.Followers,
        priorAudience: PublishAudience.Selected,
        repostOrigin: RepostOrigin.Automatic,
        priorCompanyIds: ['buyer-1', 'buyer-1'],
      }),
    ).toEqual(['buyer-1']);
  });

  it('keeps the skip list when an automatic hop is Followers again', () => {
    expect(
      audienceCompanyIdsForPublish({
        nextAudience: PublishAudience.Followers,
        priorAudience: PublishAudience.Followers,
        repostOrigin: RepostOrigin.Automatic,
        priorCompanyIds: ['buyer-1'],
      }),
    ).toEqual(['buyer-1']);
  });

  it('clears ids on an ordinary Followers publish', () => {
    expect(
      audienceCompanyIdsForPublish({
        nextAudience: PublishAudience.Followers,
        priorAudience: PublishAudience.Followers,
        priorCompanyIds: ['stale'],
      }),
    ).toEqual([]);
  });

  it('uses the Selected list when publishing Selected', () => {
    expect(
      audienceCompanyIdsForPublish({
        nextAudience: PublishAudience.Selected,
        nextCompanyIds: ['buyer-2'],
        priorAudience: PublishAudience.Selected,
        repostOrigin: RepostOrigin.Automatic,
        priorCompanyIds: ['buyer-1'],
      }),
    ).toEqual(['buyer-2']);
  });
});
