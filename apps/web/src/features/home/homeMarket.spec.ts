import { describe, expect, it } from 'vitest';
import type { ExplorePost } from '@ekum/domain-types';
import {
  groupPostsByCompany,
  homePostGroupLink,
  homePostLink,
  homePostTitle,
} from './homeMarket';

function collectionPost(id: string, companyId: string, postedAt: string): ExplorePost {
  return {
    kind: 'collection',
    id: `c:${id}`,
    postedAt,
    collection: {
      id,
      name: `Trader pack ${id}`,
      coverImage: null,
      previewImages: [],
      imageCount: 0,
      productCount: 9,
      status: 'published',
      updatedAt: postedAt,
      allowForward: true,
      orderPathPreference: null,
      company: {
        id: companyId,
        name: companyId === 'co-1' ? 'Ahmedabad Loom Co' : 'Surat Silk House',
        city: companyId === 'co-1' ? 'Ahmedabad' : 'Surat',
        logoUrl: null,
        verification: 'unverified',
      },
    },
  } as ExplorePost;
}

function productPost(id: string, companyId: string, postedAt: string): ExplorePost {
  return {
    kind: 'product',
    id: `p:${id}`,
    postedAt,
    product: {
      id,
      name: `Design ${id}`,
      images: [],
      company: {
        id: companyId,
        name: 'Ahmedabad Loom Co',
        city: 'Ahmedabad',
        logoUrl: null,
        verification: 'unverified',
      },
    },
  } as ExplorePost;
}

describe('groupPostsByCompany', () => {
  it('groups many posts from the same company into one row with a count', () => {
    const posts = [
      collectionPost('a', 'co-1', '2026-08-20T10:00:00.000Z'),
      collectionPost('b', 'co-1', '2026-08-22T10:00:00.000Z'),
      collectionPost('c', 'co-1', '2026-08-21T10:00:00.000Z'),
      collectionPost('d', 'co-2', '2026-08-19T10:00:00.000Z'),
    ];
    const groups = groupPostsByCompany(posts);
    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({
      companyId: 'co-1',
      count: 3,
      latest: { id: 'c:b' },
    });
    expect(groups[1]).toMatchObject({
      companyId: 'co-2',
      count: 1,
      latest: { id: 'c:d' },
    });
  });

  it('returns empty for empty input', () => {
    expect(groupPostsByCompany([])).toEqual([]);
  });
});

describe('homePostTitle', () => {
  it('uses singular and plural copy', () => {
    expect(homePostTitle(1, 'Surat Silk House')).toBe('New post · Surat Silk House');
    expect(homePostTitle(4, 'Surat Silk House')).toBe('4 new posts · Surat Silk House');
  });
});

describe('homePostLink', () => {
  it('links to product or collection', () => {
    expect(homePostLink(productPost('p1', 'co-1', '2026-08-22T10:00:00.000Z'))).toBe(
      '/explore/products/p1',
    );
    expect(homePostLink(collectionPost('c1', 'co-1', '2026-08-22T10:00:00.000Z'))).toBe(
      '/collections/c1',
    );
  });
});

describe('homePostGroupLink', () => {
  it('opens the single design when count is one', () => {
    const [group] = groupPostsByCompany([
      productPost('p1', 'co-1', '2026-08-22T10:00:00.000Z'),
    ]);
    expect(homePostGroupLink(group!)).toBe('/explore/products/p1');
  });

  it('opens Explore story listing when several posts', () => {
    const [group] = groupPostsByCompany([
      collectionPost('a', 'co-1', '2026-08-20T10:00:00.000Z'),
      collectionPost('b', 'co-1', '2026-08-22T10:00:00.000Z'),
      collectionPost('c', 'co-1', '2026-08-21T10:00:00.000Z'),
    ]);
    expect(homePostGroupLink(group!)).toBe('/explore?story=co-1');
  });
});
