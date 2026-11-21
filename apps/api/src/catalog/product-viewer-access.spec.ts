import { describe, expect, it, vi } from 'vitest';
import { productAccessibleViaCollection } from './product-viewer-access';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { VisibilityService } from '../access/visibility.service';

function makePrisma(
  memberships: unknown[],
  opts: {
    following?: boolean;
    upstream?: Array<{
      id: string;
      allowForward: boolean;
      status: string;
      repostSourceCollectionId?: string | null;
    }>;
  } = {},
) {
  return {
    collectionProduct: {
      findMany: vi.fn(async () => memberships),
    },
    collection: {
      findMany: vi.fn(async () => opts.upstream ?? []),
    },
    follow: {
      findUnique: vi.fn(async () =>
        opts.following ? { status: 'allowed' } : null,
      ),
    },
    collectionViewGrant: {
      findFirst: vi.fn(async () => null),
    },
  } as unknown as PrismaService;
}

function visibility(opts: { blocked?: boolean; connected?: boolean } = {}) {
  return {
    isBlocked: async () => opts.blocked ?? false,
    canViewCatalog: async () => opts.connected ?? false,
  } as unknown as VisibilityService;
}

const legacyEveryoneAlbum = {
  collection: {
    id: 'col1',
    companyId: 'owner',
    status: 'published',
    audience: 'everyone',
    audienceCompanyIds: [] as string[],
    startsAt: null,
    endsAt: null,
  },
};

describe('productAccessibleViaCollection', () => {
  it('does not unlock legacy Everyone album without allowed follow', async () => {
    const prisma = makePrisma([legacyEveryoneAlbum]);
    const ok = await productAccessibleViaCollection(prisma, visibility(), 'viewer', 'p1', {
      wasSharedInChat: async () => false,
    });
    expect(ok).toBe(false);
  });

  it('unlocks legacy Everyone album when viewer is an allowed follower', async () => {
    const prisma = makePrisma([legacyEveryoneAlbum], { following: true });
    const ok = await productAccessibleViaCollection(prisma, visibility(), 'viewer', 'p1', {
      wasSharedInChat: async () => false,
    });
    expect(ok).toBe(true);
  });

  it('rejects when album audience excludes the viewer', async () => {
    const prisma = makePrisma([
      {
        collection: {
          ...legacyEveryoneAlbum.collection,
          audience: 'followers',
        },
      },
    ]);
    const ok = await productAccessibleViaCollection(prisma, visibility(), 'viewer', 'p1', {
      wasSharedInChat: async () => false,
    });
    expect(ok).toBe(false);
  });

  it('rejects Followers chat-share shell (products locked)', async () => {
    const prisma = makePrisma([
      {
        collection: {
          ...legacyEveryoneAlbum.collection,
          audience: 'followers',
        },
      },
    ]);
    const ok = await productAccessibleViaCollection(prisma, visibility(), 'viewer', 'p1', {
      wasSharedInChat: async () => true,
    });
    expect(ok).toBe(false);
  });

  it('allows owner of the pack', async () => {
    const prisma = makePrisma([legacyEveryoneAlbum]);
    const ok = await productAccessibleViaCollection(prisma, visibility(), 'owner', 'p1', {
      wasSharedInChat: async () => false,
    });
    expect(ok).toBe(true);
  });

  it('does not unlock via soft-unavailable descendant pack', async () => {
    const prisma = makePrisma(
      [
        {
          collection: {
            id: 'repost1',
            companyId: 'trader',
            status: 'published',
            audience: 'everyone',
            audienceCompanyIds: [] as string[],
            startsAt: null,
            endsAt: null,
            repostSourceCollectionId: 'mill1',
          },
        },
      ],
      {
        following: true,
        upstream: [
          {
            id: 'mill1',
            allowForward: false,
            status: 'published',
            repostSourceCollectionId: null,
          },
        ],
      },
    );
    const ok = await productAccessibleViaCollection(prisma, visibility(), 'viewer', 'p1', {
      wasSharedInChat: async () => false,
    });
    expect(ok).toBe(false);
  });
});
