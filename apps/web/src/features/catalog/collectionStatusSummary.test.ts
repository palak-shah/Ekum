import { describe, expect, it } from 'vitest';
import { CollectionStatus, PublishAudience } from '@ekum/domain-types';
import { collectionScheduleBadge } from './collectionScheduleBadge';
import {
  collectionListingCaption,
  collectionStatusSummary,
  whoCanSeeLabel,
} from './collectionStatusSummary';

describe('collectionStatusSummary', () => {
  const now = new Date('2026-09-15T12:00:00.000Z');

  it('labels draft (Ready maps to Draft)', () => {
    expect(collectionStatusSummary({ status: CollectionStatus.Draft }, [], now).line).toBe(
      'Draft',
    );
    expect(collectionStatusSummary({ status: CollectionStatus.Ready }, [], now).line).toBe(
      'Draft',
    );
    expect(collectionStatusSummary({ status: CollectionStatus.Ready }, [], now).phase).toBe(
      'draft',
    );
  });

  it('labels deleted', () => {
    expect(collectionStatusSummary({ status: CollectionStatus.Archived }, [], now).line).toBe(
      'Deleted',
    );
  });

  it('shows Starts before the window with who', () => {
    const summary = collectionStatusSummary(
      {
        status: CollectionStatus.Published,
        startsAt: '2026-09-20T00:00:00.000Z',
        endsAt: null,
        audience: PublishAudience.Connections,
      },
      [],
      now,
    );
    expect(summary.line).toMatch(/^Starts /);
    expect(summary.line).toContain('My followers');
    expect(summary.phase).toBe('scheduled');
  });

  it('shows Published · who without schedule when no end date', () => {
    const summary = collectionStatusSummary(
      {
        status: CollectionStatus.Published,
        startsAt: null,
        endsAt: null,
        audience: PublishAudience.Everyone,
      },
      [],
      now,
    );
    expect(summary.line).toBe('Published · My followers');
    expect(summary.scheduleLabel).toBeNull();
  });

  it('shows Ends in Nd when within a week', () => {
    const summary = collectionStatusSummary(
      {
        status: CollectionStatus.Published,
        startsAt: null,
        endsAt: '2026-09-17T23:59:59.999Z',
        audience: PublishAudience.Connections,
      },
      [],
      now,
    );
    expect(summary.line).toBe('Published · My followers · Ends in 3d');
  });

  it('names buyer groups for selected audience', () => {
    const summary = collectionStatusSummary(
      {
        status: CollectionStatus.Published,
        audience: PublishAudience.Selected,
        audienceGroupIds: ['g1', 'g2'],
        audienceCompanyIds: ['c1', 'c2', 'c3'],
      },
      [
        { id: 'g1', name: 'Diwali buyers' },
        { id: 'g2', name: 'North' },
      ],
      now,
    );
    expect(summary.line).toBe('Published · Diwali buyers + 1 more');
  });

  it('uses business count when selected without groups', () => {
    const summary = collectionStatusSummary(
      {
        status: CollectionStatus.Published,
        audience: PublishAudience.Selected,
        audienceGroupIds: [],
        audienceCompanyIds: ['a', 'b'],
      },
      [],
      now,
    );
    expect(summary.whoLabel).toBe('2 businesses');
    expect(summary.line).toContain('2 businesses');
  });
});

describe('whoCanSeeLabel', () => {
  it('uses plain trader words (legacy everyone/connections label as My followers)', () => {
    expect(whoCanSeeLabel({ status: 'published', audience: 'everyone' })).toBe('My followers');
    expect(whoCanSeeLabel({ status: 'published', audience: 'connections' })).toBe(
      'My followers',
    );
    expect(whoCanSeeLabel({ status: 'published', audience: 'followers' })).toBe('My followers');
  });
});

describe('collectionListingCaption', () => {
  const now = new Date('2026-09-15T12:00:00.000Z');

  it('shows designs only for live collections (no audience count)', () => {
    expect(
      collectionListingCaption(
        {
          status: CollectionStatus.Published,
          productCount: 18,
          audience: PublishAudience.Selected,
          audienceCompanyIds: ['a', 'b', 'c', 'd'],
        },
        [],
        now,
      ),
    ).toBe('18 designs');
    expect(
      collectionListingCaption(
        {
          status: CollectionStatus.Published,
          productCount: 10,
          audience: PublishAudience.Followers,
        },
        [],
        now,
      ),
    ).toBe('10 designs');
    expect(
      collectionListingCaption(
        {
          status: CollectionStatus.Published,
          productCount: 1,
          audience: PublishAudience.Selected,
          audienceCompanyIds: [],
        },
        [],
        now,
      ),
    ).toBe('1 design');
  });

  it('keeps Draft / Archived without Published or a date', () => {
    expect(
      collectionListingCaption(
        { status: CollectionStatus.Draft, productCount: 3 },
        [],
        now,
      ),
    ).toBe('3 designs · Draft');
    expect(
      collectionListingCaption(
        { status: CollectionStatus.Archived, productCount: 2 },
        [],
        now,
      ),
    ).toBe('2 designs · Archived');
  });
});

describe('collectionScheduleBadge (thin wrapper)', () => {
  const now = new Date('2026-09-15T12:00:00.000Z');

  it('omits schedule secondary when there is no end date', () => {
    const badge = collectionScheduleBadge(
      {
        status: CollectionStatus.Published,
        startsAt: null,
        endsAt: null,
      },
      now,
    );
    expect(badge.primary).toBe('Live');
    expect(badge.secondary).toBeNull();
  });
});
