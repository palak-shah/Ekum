import { describe, expect, it } from 'vitest';
import { canDiscoverCollection, canViewCollectionProducts } from './audience-visibility';

describe('audience visibility', () => {
  it('keeps selected collections private to the list', () => {
    const collection = {
      companyId: 'owner',
      audience: 'selected',
      audienceCompanyIds: ['buyer-a'],
    };
    expect(
      canDiscoverCollection('buyer-a', collection, { connected: false, following: false }),
    ).toBe(true);
    expect(
      canDiscoverCollection('buyer-b', collection, { connected: true, following: true }),
    ).toBe(false);
    expect(
      canViewCollectionProducts('buyer-a', collection, { connected: false, following: false }),
    ).toBe(true);
  });

  it('requires a connection for connections audience', () => {
    const collection = {
      companyId: 'owner',
      audience: 'connections',
      audienceCompanyIds: [],
    };
    expect(
      canDiscoverCollection('viewer', collection, { connected: false, following: false }),
    ).toBe(false);
    expect(
      canDiscoverCollection('viewer', collection, { connected: true, following: false }),
    ).toBe(true);
    expect(canViewCollectionProducts('viewer', collection, true)).toBe(true);
  });

  it('requires follow for followers audience', () => {
    const collection = {
      companyId: 'owner',
      audience: 'followers',
      audienceCompanyIds: [],
    };
    expect(
      canDiscoverCollection('viewer', collection, { connected: true, following: false }),
    ).toBe(false);
    expect(
      canDiscoverCollection('viewer', collection, { connected: false, following: true }),
    ).toBe(true);
  });

  it('everyone is discoverable', () => {
    const collection = {
      companyId: 'owner',
      audience: 'everyone',
      audienceCompanyIds: [],
    };
    expect(
      canDiscoverCollection('viewer', collection, { connected: false, following: false }),
    ).toBe(true);
  });

  it('hides curated pack from source supplier companies', () => {
    const collection = {
      companyId: 'trader',
      audience: 'connections',
      audienceCompanyIds: [],
    };
    expect(
      canDiscoverCollection(
        'supplier-a',
        collection,
        { connected: true, following: false },
        ['supplier-a'],
      ),
    ).toBe(false);
    expect(
      canDiscoverCollection(
        'buyer-b',
        collection,
        { connected: true, following: false },
        ['supplier-a'],
      ),
    ).toBe(true);
    expect(
      canDiscoverCollection(
        'trader',
        collection,
        { connected: false, following: false },
        ['supplier-a'],
      ),
    ).toBe(true);
  });
});
