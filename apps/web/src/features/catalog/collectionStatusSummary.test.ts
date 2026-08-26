import { describe, expect, it } from 'vitest';
import { CollectionStatus, PublishAudience } from '@ekum/domain-types';
import { collectionScheduleBadge } from './collectionScheduleBadge';
import { collectionStatusSummary, whoCanSeeLabel } from './collectionStatusSummary';

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

  it('labels archived', () => {
    expect(collectionStatusSummary({ status: CollectionStatus.Archived }, [], now).line).toBe(
      'Archived',
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
    expect(summary.line).toContain('My connections');
    expect(summary.phase).toBe('scheduled');
  });

  it('shows Published · who · Evergreen', () => {
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
    expect(summary.line).toBe('Published · Everyone · Evergreen');
    expect(summary.scheduleLabel).toBe('Evergreen');
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
    expect(summary.line).toBe('Published · My connections · Ends in 3d');
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
    expect(summary.line).toBe('Published · Diwali buyers + 1 more · Evergreen');
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
  it('uses plain trader words', () => {
    expect(whoCanSeeLabel({ status: 'published', audience: 'everyone' })).toBe('Everyone');
    expect(whoCanSeeLabel({ status: 'published', audience: 'connections' })).toBe(
      'My connections',
    );
    expect(whoCanSeeLabel({ status: 'published', audience: 'followers' })).toBe('My followers');
  });
});

describe('collectionScheduleBadge (thin wrapper)', () => {
  const now = new Date('2026-09-15T12:00:00.000Z');

  it('uses Evergreen when there is no end date', () => {
    const badge = collectionScheduleBadge(
      {
        status: CollectionStatus.Published,
        startsAt: null,
        endsAt: null,
      },
      now,
    );
    expect(badge.primary).toBe('Live');
    expect(badge.secondary).toBe('Evergreen');
  });
});
