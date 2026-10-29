import { describe, expect, it } from 'vitest';
import {
  audienceVisibilityOr,
  canDiscoverCollection,
  canViewCollectionProducts,
  effectivePublishAudience,
  isBroadPublishAudience,
} from './audience-visibility';

describe('audience visibility', () => {
  it('maps legacy everyone and connections to followers', () => {
    expect(effectivePublishAudience('everyone')).toBe('followers');
    expect(effectivePublishAudience('connections')).toBe('followers');
    expect(effectivePublishAudience('followers')).toBe('followers');
    expect(effectivePublishAudience('selected')).toBe('selected');
    expect(isBroadPublishAudience('followers')).toBe(true);
    expect(isBroadPublishAudience('everyone')).toBe(true);
    expect(isBroadPublishAudience('selected')).toBe(false);
  });

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

  it('treats legacy connections as followers (allowed follow, not Connection)', () => {
    const collection = {
      companyId: 'owner',
      audience: 'connections',
      audienceCompanyIds: [],
    };
    expect(
      canDiscoverCollection('viewer', collection, { connected: true, following: false }),
    ).toBe(false);
    expect(
      canDiscoverCollection('viewer', collection, { connected: false, following: true }),
    ).toBe(true);
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

  it('hides Followers hops from Direct Link buyers already delivered', () => {
    const collection = {
      companyId: 'trader',
      audience: 'followers',
      audienceCompanyIds: ['buyer-1'],
    };
    expect(
      canDiscoverCollection('buyer-1', collection, { connected: false, following: true }),
    ).toBe(false);
    expect(
      canDiscoverCollection('buyer-2', collection, { connected: false, following: true }),
    ).toBe(true);
    expect(
      canDiscoverCollection('buyer-2', collection, { connected: false, following: false }),
    ).toBe(false);
    expect(
      canDiscoverCollection('trader', collection, { connected: false, following: false }),
    ).toBe(true);
  });

  it('leaves ordinary Followers packs visible to all followers when ids are empty', () => {
    const collection = {
      companyId: 'owner',
      audience: 'followers',
      audienceCompanyIds: [],
    };
    expect(
      canDiscoverCollection('viewer', collection, { connected: false, following: true }),
    ).toBe(true);
  });

  it('unlocks view when Granted on request even without follow', () => {
    const collection = {
      companyId: 'owner',
      audience: 'followers',
      audienceCompanyIds: [],
    };
    expect(
      canViewCollectionProducts(
        'meena',
        collection,
        { connected: false, following: false },
        true,
      ),
    ).toBe(true);
    expect(
      canDiscoverCollection(
        'meena',
        collection,
        { connected: false, following: false },
        [],
        true,
      ),
    ).toBe(true);
  });

  it('treats legacy everyone as followers (not open catalog)', () => {
    const collection = {
      companyId: 'owner',
      audience: 'everyone',
      audienceCompanyIds: [],
    };
    expect(
      canDiscoverCollection('viewer', collection, { connected: false, following: false }),
    ).toBe(false);
    expect(
      canDiscoverCollection('viewer', collection, { connected: false, following: true }),
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
        { connected: true, following: true },
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

  it('requires allowed follow for followers and legacy everyone/connections rows', () => {
    const clause = audienceVisibilityOr('viewer').find(
      (row) =>
        typeof row === 'object' &&
        row !== null &&
        'audience' in row &&
        typeof (row as { audience: unknown }).audience === 'object',
    ) as {
      company?: { followers?: { some?: { status?: string } } };
      audience?: { in?: string[] };
      NOT?: { audienceCompanyIds?: { has?: string } };
    };
    expect(clause.company?.followers?.some?.status).toBe('allowed');
    expect(clause.audience?.in).toEqual(
      expect.arrayContaining(['followers', 'connections', 'everyone']),
    );
    expect(clause.NOT?.audienceCompanyIds?.has).toBe('viewer');
  });

  it('includes the viewer’s own company so Followers packs stay on their Explore', () => {
    expect(audienceVisibilityOr('viewer')).toEqual(
      expect.arrayContaining([{ companyId: 'viewer' }]),
    );
  });
});
