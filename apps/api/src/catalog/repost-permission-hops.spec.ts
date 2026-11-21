import { describe, expect, it, vi } from 'vitest';
import { CollectionStatus, ProductStatus } from '@ekum/domain-types';
import { assertProductsCuratable } from './curation-ceiling';
import { CollectionService } from './collection.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { CatalogSerializer } from './catalog.serializer';
import type { JobQueue } from '../jobs/job-queue.service';
import type { MasterDataService } from './master-data/master-data.service';

/**
 * Locked rule: repost permission is relationship-specific and never auto-inherited
 * by the recipient’s buyers. A → B does not create A → C or B → C without a new grant.
 */

const jobs = { enqueue: vi.fn(async () => 'job-1') } as unknown as JobQueue;

const millLockedDesign = {
  id: 'design-x',
  companyId: 'supplier-a',
  audience: 'followers',
  audienceCompanyIds: [] as string[],
  allowForward: false,
  status: ProductStatus.Published,
  postedToMarketAt: new Date('2026-11-01'),
};

/** Pack follow of mill — not Look (Look would block curate). */
function followMillPack() {
  return {
    findMany: async (args?: { where?: { accessKind?: string } }) =>
      args?.where?.accessKind === 'look'
        ? []
        : [{ followedCompanyId: 'supplier-a', accessKind: 'pack', status: 'allowed' }],
    findUnique: async () => ({ status: 'allowed', accessKind: 'pack' }),
  };
}

function basePrisma(over: Record<string, unknown> = {}) {
  return {
    product: { findMany: async () => [millLockedDesign] },
    connection: {
      findMany: async () => [],
      findFirst: async () => null,
      findUnique: async () => null,
    },
    follow: followMillPack(),
    companyBlock: { findMany: async () => [], count: async () => 0 },
    productRelistGrant: { findMany: async () => [] },
    collectionProduct: { findMany: async () => [] },
    collectionViewGrant: { findFirst: async () => null },
    collection: {
      findUnique: async () => ({
        id: 'src',
        companyId: 'supplier-a',
        status: CollectionStatus.Published,
        audience: 'followers',
        audienceCompanyIds: [],
        startsAt: null,
        endsAt: null,
        allowForward: true,
        products: [{ productId: 'design-x', product: { id: 'design-x', status: ProductStatus.Published } }],
      }),
    },
    ...over,
  } as unknown as PrismaService;
}

function expectBlocked(
  result: { allowedProductIds: string[]; blocked: { productId: string; code: string }[] },
  code: string,
) {
  expect(result.allowedProductIds).toEqual([]);
  expect(result.blocked).toEqual([{ productId: 'design-x', code }]);
}

describe('repost permission hops (no automatic inheritance)', () => {
  it('ceiling: B grant does not help C — C still needs own unlock', () => {
    expect(() =>
      assertProductsCuratable({
        curatorCompanyId: 'buyer-c',
        products: [millLockedDesign],
        discoverableIds: new Set(['design-x']),
        relistGrantedIds: new Set(),
      }),
    ).toThrow(/allow/i);

    expect(() =>
      assertProductsCuratable({
        curatorCompanyId: 'trader-b',
        products: [millLockedDesign],
        discoverableIds: new Set(['design-x']),
        relistGrantedIds: new Set(['design-x']),
      }),
    ).not.toThrow();
  });

  it('view grant ≠ repost: CollectionViewGrant does not appear in relist unlock set', () => {
    expect(() =>
      assertProductsCuratable({
        curatorCompanyId: 'buyer-c',
        products: [millLockedDesign],
        discoverableIds: new Set(['design-x']),
        relistGrantedIds: new Set(),
      }),
    ).toThrow(/allow/i);
  });

  it('downstream trader open pack does not unlock locked mill design for the next hop', async () => {
    const collectionProductFindMany = vi.fn(
      async (args: { where?: { OR?: Array<{ collection?: { companyId?: string } }> } }) => {
        for (const clause of args.where?.OR ?? []) {
          expect(clause.collection?.companyId).toBe('supplier-a');
          expect(clause.collection?.companyId).not.toBe('trader-b');
        }
        // Trader B’s open pack is not an owner pack — return no unlock rows.
        return [];
      },
    );

    const prisma = basePrisma({
      productRelistGrant: { findMany: async () => [] },
      collectionProduct: { findMany: collectionProductFindMany },
      collection: {
        findUnique: async () => ({
          id: 'trader-b-repost-of-x',
          companyId: 'trader-b',
          status: CollectionStatus.Published,
          audience: 'followers',
          audienceCompanyIds: [],
          startsAt: null,
          endsAt: null,
          allowForward: true,
          products: [
            {
              productId: 'design-x',
              product: { id: 'design-x', status: ProductStatus.Published },
            },
          ],
        }),
      },
      connection: {
        findMany: async () => [],
        findFirst: async () => ({ status: 'active' }),
        findUnique: async () => null,
      },
      follow: {
        ...followMillPack(),
        findUnique: async () => ({ status: 'allowed', accessKind: 'pack' }),
      },
    });

    const service = new CollectionService(prisma, {} as CatalogSerializer, jobs, {} as unknown as MasterDataService);
    const result = await service.checkCurateProducts('buyer-c', ['design-x'], {
      sourceCollectionId: 'trader-b-repost-of-x',
    });
    expectBlocked(result, 'RELIST_NOT_ALLOWED');
  });

  it('original seller open pack still unlocks (owner pack, not a mid-hop)', async () => {
    const prisma = basePrisma({
      collectionProduct: {
        findMany: vi.fn(
          async (args: { where?: { OR?: Array<{ collection?: { companyId?: string } }> } }) => {
            const ownerOnly = args.where?.OR?.every(
              (clause) => clause.collection?.companyId === 'supplier-a',
            );
            expect(ownerOnly).toBe(true);
            return [{ productId: 'design-x' }];
          },
        ),
      },
    });

    const service = new CollectionService(prisma, {} as CatalogSerializer, jobs, {} as unknown as MasterDataService);
    const result = await service.checkCurateProducts('buyer-c', ['design-x']);
    expect(result.allowedProductIds).toEqual(['design-x']);
    expect(result.blocked).toEqual([]);
  });

  it('C with only a ProductRelistGrant for themselves can curate; B’s grant is not shared', async () => {
    const prisma = basePrisma({
      productRelistGrant: {
        findMany: async (args: { where?: { companyId?: string } }) => {
          if (args.where?.companyId === 'buyer-c') return [{ productId: 'design-x' }];
          return [];
        },
      },
    });

    const forC = new CollectionService(prisma, {} as CatalogSerializer, jobs, {} as unknown as MasterDataService);
    expect((await forC.checkCurateProducts('buyer-c', ['design-x'])).allowedProductIds).toEqual([
      'design-x',
    ]);

    const prismaBOnly = basePrisma({
      productRelistGrant: {
        findMany: async (args: { where?: { companyId?: string } }) => {
          if (args.where?.companyId === 'trader-b') return [{ productId: 'design-x' }];
          return [];
        },
      },
    });
    const forCWithoutOwnGrant = new CollectionService(prismaBOnly, {} as CatalogSerializer, jobs, {} as unknown as MasterDataService);
    expectBlocked(
      await forCWithoutOwnGrant.checkCurateProducts('buyer-c', ['design-x']),
      'RELIST_NOT_ALLOWED',
    );
  });

  it('look-only follow (no Pack) blocks curate even when product allowForward is on — Direct Link ceiling sibling', () => {
    expect(() =>
      assertProductsCuratable({
        curatorCompanyId: 'buyer-c',
        products: [{ ...millLockedDesign, allowForward: true }],
        discoverableIds: new Set(['design-x']),
        lookOnlyOwnerIds: new Set(['supplier-a']),
      }),
    ).toThrow(/collection/i);
  });

  it('upstream restriction wins: locked product + no own grant stays blocked regardless of mid-hop open pack id', async () => {
    const prisma = basePrisma({
      collectionProduct: {
        findMany: vi.fn(
          async (args: { where?: { OR?: Array<{ collection?: { companyId?: string } }> } }) => {
            for (const clause of args.where?.OR ?? []) {
              expect(clause.collection?.companyId).toBe('supplier-a');
              expect(clause.collection?.companyId).not.toBe('trader-b');
            }
            return [];
          },
        ),
      },
      collection: {
        findUnique: async () => ({
          id: 'trader-b-repost',
          audience: 'followers',
          allowForward: true,
          status: CollectionStatus.Published,
          companyId: 'trader-b',
          audienceCompanyIds: [],
          startsAt: null,
          endsAt: null,
          products: [
            {
              productId: 'design-x',
              product: { id: 'design-x', status: ProductStatus.Published },
            },
          ],
        }),
      },
      connection: {
        findMany: async () => [],
        findFirst: async () => ({ status: 'active' }),
        findUnique: async () => null,
      },
      follow: {
        ...followMillPack(),
        findUnique: async () => ({ status: 'allowed', accessKind: 'pack' }),
      },
    });

    const service = new CollectionService(prisma, {} as CatalogSerializer, jobs, {} as unknown as MasterDataService);
    expectBlocked(
      await service.checkCurateProducts('buyer-c', ['design-x'], {
        sourceCollectionId: 'trader-b-repost',
      }),
      'RELIST_NOT_ALLOWED',
    );
  });
});
