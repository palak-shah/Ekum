import { describe, expect, it } from 'vitest';
import {
  groupReceivedByDay,
  isCuratedCollection,
  isDirectedAudience,
  isEligibleStoryPublisher,
  pickReceivedCurated,
  utcDayKey,
} from './exploreReceived';

describe('exploreReceived', () => {
  it('treats connections/followers/selected as directed, not everyone', () => {
    expect(isDirectedAudience('connections')).toBe(true);
    expect(isDirectedAudience('followers')).toBe(true);
    expect(isDirectedAudience('selected')).toBe(true);
    expect(isDirectedAudience('everyone')).toBe(false);
  });

  it('detects curated when any member is foreign', () => {
    expect(isCuratedCollection('trader', ['mill', 'trader'])).toBe(true);
    expect(isCuratedCollection('owner', ['owner', 'owner'])).toBe(false);
  });

  it('groups by UTC day then company, newest first', () => {
    const grouped = groupReceivedByDay([
      { postedAt: '2026-08-21T10:00:00.000Z', companyId: 'a', curated: false, payload: 'a1' },
      { postedAt: '2026-08-22T08:00:00.000Z', companyId: 'b', curated: true, payload: 'b1' },
      { postedAt: '2026-08-22T12:00:00.000Z', companyId: 'a', curated: false, payload: 'a2' },
    ]);
    expect(grouped.map((row) => row.day)).toEqual(['2026-08-22', '2026-08-21']);
    expect(grouped[0]!.groups.map((g) => g.companyId)).toEqual(['a', 'b']);
    expect(grouped[0]!.groups[0]!.items).toEqual(['a2']);
  });

  it('picks curated received in the last 7 days, cap 5', () => {
    const now = Date.parse('2026-08-22T12:00:00.000Z');
    const picked = pickReceivedCurated(
      [
        { postedAt: '2026-08-22T00:00:00.000Z', companyId: 'a', curated: true, payload: 'new' },
        { postedAt: '2026-08-01T00:00:00.000Z', companyId: 'a', curated: true, payload: 'old' },
        { postedAt: '2026-08-21T00:00:00.000Z', companyId: 'b', curated: false, payload: 'own' },
      ],
      now,
    );
    expect(picked).toEqual(['new']);
  });

  it('Stories only for follow or connected', () => {
    const followed = new Set(['f1']);
    const connected = new Set(['c1']);
    expect(isEligibleStoryPublisher('f1', followed, connected)).toBe(true);
    expect(isEligibleStoryPublisher('c1', followed, connected)).toBe(true);
    expect(isEligibleStoryPublisher('market', followed, connected)).toBe(false);
  });

  it('utcDayKey uses the ISO date', () => {
    expect(utcDayKey('2026-08-21T23:15:00.000Z')).toBe('2026-08-21');
  });
});
