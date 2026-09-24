import { describe, expect, it } from 'vitest';
import { withPrefillSeller } from './orderBuilderPrefillSeller';
import type { ConnectionView, PublicCompanyProfile } from '@ekum/domain-types';

const shop: PublicCompanyProfile = {
  id: 's1',
  name: 'Surat Silk House',
  city: 'Surat',
  about: null,
  logoUrl: null,
  verification: 'gst_verified',
  categories: [],
  superCategories: [],
};

const connected: ConnectionView = {
  id: 'c1',
  company: {
    id: 's1',
    name: 'Surat Silk House',
    city: 'Surat',
    verification: 'gst_verified',
    logoUrl: null,
  },
  status: 'active',
  createdAt: '2026-01-01',
  canPause: true,
  canResume: false,
  canBlock: true,
  canUnblock: false,
};

describe('withPrefillSeller', () => {
  it('returns sellers unchanged when no prefill', () => {
    expect(withPrefillSeller([connected], undefined)).toEqual([connected]);
  });

  it('does not duplicate when the shop is already connected', () => {
    expect(withPrefillSeller([connected], shop)).toEqual([connected]);
  });

  it('injects a stub so the thread shop name still shows', () => {
    const next = withPrefillSeller([], shop);
    expect(next).toHaveLength(1);
    expect(next[0].company.id).toBe('s1');
    expect(next[0].company.name).toBe('Surat Silk House');
  });
});
