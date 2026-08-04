import { describe, expect, it } from 'vitest';
import { canDiscoverCollection, canViewCollectionProducts } from './audience-visibility';

describe('audience visibility', () => {
  it('keeps selected collections private to the list', () => {
    const collection = {
      companyId: 'owner',
      audience: 'selected',
      audienceCompanyIds: ['buyer-a'],
    };
    expect(canDiscoverCollection('buyer-a', collection)).toBe(true);
    expect(canDiscoverCollection('buyer-b', collection)).toBe(false);
    expect(canViewCollectionProducts('buyer-a', collection, false)).toBe(true);
    expect(canViewCollectionProducts('buyer-b', collection, true)).toBe(false);
  });

  it('requires a connection for connections audience', () => {
    const collection = {
      companyId: 'owner',
      audience: 'connections',
      audienceCompanyIds: [],
    };
    expect(canDiscoverCollection('viewer', collection)).toBe(true);
    expect(canViewCollectionProducts('viewer', collection, false)).toBe(false);
    expect(canViewCollectionProducts('viewer', collection, true)).toBe(true);
  });
});
