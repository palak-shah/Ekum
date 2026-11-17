import { describe, expect, it } from 'vitest';
import {
  profileCompletenessChips,
  profileCompletenessFingerprint,
  profileCompletenessGaps,
} from './profileCompleteness';

describe('profileCompleteness', () => {
  it('lists incomplete optional fields in priority order', () => {
    expect(
      profileCompletenessGaps({
        logoUrl: null,
        coverUrl: null,
        about: '  ',
        sellCategories: [],
      }),
    ).toEqual(['logo', 'cover', 'about', 'sellCategories']);
  });

  it('skips sellCategories when own DTO not loaded', () => {
    expect(
      profileCompletenessGaps({
        logoUrl: 'https://cdn/l.jpg',
        coverUrl: 'https://cdn/c.jpg',
        about: 'Hi',
        sellCategories: undefined,
      }),
    ).toEqual([]);
  });

  it('caps chips at max and fingerprints stably', () => {
    const chips = profileCompletenessChips(
      {
        logoUrl: null,
        coverUrl: null,
        about: null,
        sellCategories: [],
      },
      3,
    );
    expect(chips.map((c) => c.id)).toEqual(['logo', 'cover', 'about']);
    expect(chips[0]?.label).toBe('Add profile photo');
    expect(profileCompletenessFingerprint(['about', 'logo'])).toBe('about|logo');
    expect(profileCompletenessFingerprint(['logo', 'about'])).toBe('about|logo');
  });
});
