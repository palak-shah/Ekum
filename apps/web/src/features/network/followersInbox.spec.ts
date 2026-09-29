import { describe, expect, it } from 'vitest';
import { filterTheySeeMine, followAccessLabel, followersInboxTabFromSearch, sortAsksNewestFirst } from './followersInbox';

describe('followersInboxTabFromSearch', () => {
  it('honours tab=asked', () => {
    expect(followersInboxTabFromSearch('?tab=asked')).toBe('asked');
  });

  it('defaults to the allowed list even when asks exist', () => {
    expect(followersInboxTabFromSearch('')).toBe('following');
  });
});

describe('sortAsksNewestFirst', () => {
  it('puts the newest ask first', () => {
    expect(
      sortAsksNewestFirst([
        { createdAt: '2026-09-20T00:00:00.000Z', id: 'old' },
        { createdAt: '2026-09-28T00:00:00.000Z', id: 'new' },
      ]).map((row) => row.id),
    ).toEqual(['new', 'old']);
  });
});

describe('filterTheySeeMine', () => {
  const rows = [
    { company: { name: 'Surat Silk House', city: 'Surat' } },
    { company: { name: 'Jaipur Emporium', city: 'Jaipur' } },
  ];

  it('keeps the list until they type', () => {
    expect(filterTheySeeMine(rows, '  ')).toHaveLength(2);
  });

  it('matches name or city', () => {
    expect(filterTheySeeMine(rows, 'jaipur').map((row) => row.company.name)).toEqual([
      'Jaipur Emporium',
    ]);
    expect(filterTheySeeMine(rows, 'Surat').map((row) => row.company.name)).toEqual([
      'Surat Silk House',
    ]);
  });
});

describe('followAccessLabel', () => {
  it('uses trader copy', () => {
    expect(followAccessLabel('look')).toBe('They can see');
    expect(followAccessLabel('pack')).toBe('They can share');
  });
});
