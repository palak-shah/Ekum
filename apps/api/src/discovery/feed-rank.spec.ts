import { describe, expect, it } from 'vitest';
import {
  compareByMarketRelevance,
  freshnessScore,
  interestStrength,
  marketRelevanceScore,
} from './feed-rank';
import type { ResolvedInterest } from './interest-match';

const sareesInterest: ResolvedInterest = {
  tags: ['Sarees'],
  supers: ['womens_apparel'],
  preferFine: true,
};

describe('feed-rank', () => {
  it('scores fresher posts higher', () => {
    const now = Date.parse('2026-08-05T12:00:00.000Z');
    const fresh = freshnessScore(new Date(now - 2 * 60 * 60 * 1000), now);
    const stale = freshnessScore(new Date(now - 5 * 24 * 60 * 60 * 1000), now);
    expect(fresh).toBeGreaterThan(stale);
  });

  it('prefers fine interest matches over non-matches', () => {
    expect(
      interestStrength({ sellCategories: ['Sarees'], superCategories: [] }, sareesInterest),
    ).toBe(1);
    expect(
      interestStrength({ sellCategories: ['Fabric'], superCategories: [] }, sareesInterest),
    ).toBe(0);
  });

  it('can rank an interest match above a fresher unrelated post', () => {
    const now = Date.parse('2026-08-05T12:00:00.000Z');
    const match = {
      feedId: 'c:match',
      postedAt: new Date(now - 20 * 60 * 60 * 1000),
      company: { sellCategories: ['Sarees'], superCategories: [], city: 'Jaipur' },
    };
    const unrelatedFresh = {
      feedId: 'c:fresh',
      postedAt: new Date(now - 1 * 60 * 60 * 1000),
      company: { sellCategories: ['Fabric'], superCategories: [], city: 'Jaipur' },
    };
    expect(marketRelevanceScore(match, sareesInterest, null, now)).toBeGreaterThan(
      marketRelevanceScore(unrelatedFresh, sareesInterest, null, now),
    );
  });

  it('boosts same-city posts when interest is equal', () => {
    const now = Date.parse('2026-08-05T12:00:00.000Z');
    const local = {
      feedId: 'c:local',
      postedAt: new Date(now - 3 * 60 * 60 * 1000),
      company: { sellCategories: ['Sarees'], superCategories: [], city: 'Surat' },
    };
    const remote = {
      feedId: 'c:remote',
      postedAt: new Date(now - 3 * 60 * 60 * 1000),
      company: { sellCategories: ['Sarees'], superCategories: [], city: 'Jaipur' },
    };
    expect(compareByMarketRelevance(local, remote, sareesInterest, 'Surat', now)).toBeLessThan(0);
  });
});
