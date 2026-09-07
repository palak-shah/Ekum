import { describe, expect, it } from 'vitest';
import { CollectionStatus, PublishAudience } from '@ekum/domain-types';
import { shouldBumpExploreOnPublish } from './explore-activity-bump';

describe('shouldBumpExploreOnPublish', () => {
  it('bumps first publish from draft', () => {
    expect(
      shouldBumpExploreOnPublish({
        priorStatus: CollectionStatus.Draft,
        priorAudience: PublishAudience.Selected,
        nextAudience: PublishAudience.Followers,
        exploreActivityAt: null,
      }),
    ).toBe(true);
  });

  it('bumps when Selected widens to Followers', () => {
    expect(
      shouldBumpExploreOnPublish({
        priorStatus: CollectionStatus.Published,
        priorAudience: PublishAudience.Selected,
        nextAudience: PublishAudience.Followers,
        exploreActivityAt: new Date('2026-08-01T00:00:00.000Z'),
      }),
    ).toBe(true);
  });

  it('does not bump Selected-list-only tweaks', () => {
    expect(
      shouldBumpExploreOnPublish({
        priorStatus: CollectionStatus.Published,
        priorAudience: PublishAudience.Selected,
        nextAudience: PublishAudience.Selected,
        exploreActivityAt: new Date('2026-08-01T00:00:00.000Z'),
      }),
    ).toBe(false);
  });

  it('does not bump Followers → Followers visibility-only update', () => {
    expect(
      shouldBumpExploreOnPublish({
        priorStatus: CollectionStatus.Published,
        priorAudience: PublishAudience.Followers,
        nextAudience: PublishAudience.Followers,
        exploreActivityAt: new Date('2026-08-01T00:00:00.000Z'),
      }),
    ).toBe(false);
  });

  it('bumps when exploreActivityAt was never set', () => {
    expect(
      shouldBumpExploreOnPublish({
        priorStatus: CollectionStatus.Published,
        priorAudience: PublishAudience.Followers,
        nextAudience: PublishAudience.Followers,
        exploreActivityAt: null,
      }),
    ).toBe(true);
  });
});
