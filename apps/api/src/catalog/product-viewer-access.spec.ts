import { describe, expect, it, vi } from 'vitest';
import { productAccessibleViaCollection } from './product-viewer-access';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { VisibilityService } from '../access/visibility.service';

function makePrisma(memberships: unknown[]) {
  return {
    collectionProduct: {
      findMany: vi.fn(async () => memberships),
    },
    follow: {
      findUnique: vi.fn(async () => null),
    },
    collectionViewGrant: {
      findUnique: vi.fn(async () => null),
    },
  } as unknown as PrismaService;
}

function visibility(opts: { blocked?: boolean; connected?: boolean } = {}) {
  return {
    isBlocked: async () => opts.blocked ?? false,
    canViewCatalog: async () => opts.connected ?? false,
  } as unknown as VisibilityService;
}

const everyoneAlbum = {
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
  it('unlocks a published design in an Everyone album without market post', async () => {
    const prisma = makePrisma([everyoneAlbum]);
    const ok = await productAccessibleViaCollection(prisma, visibility(), 'viewer', 'p1', {
      wasSharedInChat: async () => false,
    });
    expect(ok).toBe(true);
  });

  it('rejects when album audience excludes the viewer', async () => {
    const prisma = makePrisma([
      {
        collection: {
          ...everyoneAlbum.collection,
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
          ...everyoneAlbum.collection,
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
    const prisma = makePrisma([everyoneAlbum]);
    const ok = await productAccessibleViaCollection(prisma, visibility(), 'owner', 'p1', {
      wasSharedInChat: async () => false,
    });
    expect(ok).toBe(true);
  });
});
