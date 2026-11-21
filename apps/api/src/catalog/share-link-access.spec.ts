import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { CollectionStatus, PublishAudience } from '@ekum/domain-types';
import { ShareLinkService } from './share-link.service';
import { CollectionViewRequestService } from './collection-view-request.service';
import {
  COLLECTION_VIEW_GRANT_TTL_MS,
  isCollectionViewGrantActive,
} from './collection-view-grant';
import { canViewCollectionProducts } from './audience-visibility';
import type { PrismaService } from '../core/prisma/prisma.service';

function liveCollection(over: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    name: 'Wedding',
    companyId: 'owner',
    company: { name: 'Surat Silk House' },
    status: CollectionStatus.Published,
    allowForward: true,
    coverImage: null,
    audience: PublishAudience.Selected,
    audienceCompanyIds: [] as string[],
    startsAt: null,
    endsAt: null,
    repostSourceCollectionId: null,
    ...over,
  };
}

describe('share-link access locks (claim ≠ grant)', () => {
  it('claim navigates without creating a view grant', async () => {
    const upsert = vi.fn(async () => ({}));
    const prisma = {
      catalogShareLink: {
        findUnique: vi.fn(async () => ({
          token: 'tok',
          collectionId: 'c1',
          productId: null,
          productIds: [],
          expiresAt: new Date(Date.now() + 60_000),
        })),
      },
      collection: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce(liveCollection())
          .mockResolvedValueOnce({
            id: 'c1',
            companyId: 'owner',
            status: CollectionStatus.Published,
          }),
      },
      collectionProduct: { findMany: vi.fn(async () => []) },
      collectionViewGrant: { upsert },
    } as unknown as PrismaService;

    const claimed = await new ShareLinkService(prisma).claim('buyer', 'tok');
    expect(claimed.path).toBe('/collections/c1');
    expect(upsert).not.toHaveBeenCalled();
  });

  it('expired grant does not unlock products even if the row remains', () => {
    const expired = {
      expiresAt: new Date(Date.now() - 1000),
    };
    expect(isCollectionViewGrantActive(expired)).toBe(false);
    expect(
      canViewCollectionProducts(
        'buyer',
        liveCollection(),
        { connected: false, following: false },
        isCollectionViewGrantActive(expired),
      ),
    ).toBe(false);
  });

  it('active grant unlocks products for Selected packs', () => {
    const active = {
      expiresAt: new Date(Date.now() + COLLECTION_VIEW_GRANT_TTL_MS),
    };
    expect(
      canViewCollectionProducts(
        'buyer',
        liveCollection(),
        { connected: false, following: false },
        isCollectionViewGrantActive(active),
      ),
    ).toBe(true);
  });

  it('Allow writes a 48h expiresAt on the grant', async () => {
    const upsert = vi.fn(async () => ({}));
    const now = Date.now();
    const requestRow = {
      id: 'req-1',
      collectionId: 'c1',
      requesterCompanyId: 'buyer',
      targetCompanyId: 'owner',
      status: 'pending',
      messageId: null,
      threadId: null,
      createdAt: new Date(),
      decidedAt: null,
    };
    const prisma = {
      collectionViewRequest: {
        findUnique: vi.fn(async () => requestRow),
        update: vi.fn(async () => ({})),
        findUniqueOrThrow: vi.fn(async () => ({
          ...requestRow,
          status: 'allowed',
          decidedAt: new Date(),
          collection: { id: 'c1', name: 'Wedding' },
          requester: { id: 'buyer', name: 'Buyer Co' },
          target: { id: 'owner', name: 'Surat Silk House' },
        })),
      },
      collection: {
        findUnique: vi.fn(async () => liveCollection()),
      },
      collectionViewGrant: { upsert },
    } as unknown as PrismaService;

    const svc = new CollectionViewRequestService(
      prisma,
      { toPublicSummary: (c: { id?: string }) => ({ id: c.id ?? 'x', name: 'X' }) } as never,
      {} as never,
      { collectionViewGranted: vi.fn() } as never,
    );
    await svc.allow('owner', 'req-1');

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          collectionId: 'c1',
          companyId: 'buyer',
          expiresAt: expect.any(Date),
        }),
        update: expect.objectContaining({
          expiresAt: expect.any(Date),
        }),
      }),
    );
    const created = upsert.mock.calls[0][0].create;
    expect(created.expiresAt.getTime() - created.grantedAt.getTime()).toBe(
      COLLECTION_VIEW_GRANT_TTL_MS,
    );
    expect(created.grantedAt.getTime()).toBeGreaterThanOrEqual(now - 1000);
  });

  it('Allow refuses when upstream source pack is unavailable', async () => {
    const upsert = vi.fn(async () => ({}));
    const prisma = {
      collectionViewRequest: {
        findUnique: vi.fn(async () => ({
          id: 'req-1',
          collectionId: 'c1',
          requesterCompanyId: 'buyer',
          targetCompanyId: 'trader',
          status: 'pending',
          messageId: null,
          threadId: null,
        })),
      },
      collection: {
        findUnique: vi.fn(async () =>
          liveCollection({
            companyId: 'trader',
            repostSourceCollectionId: 'src-mill',
          }),
        ),
        findMany: vi.fn(async () => [
          {
            id: 'src-mill',
            allowForward: true,
            status: CollectionStatus.Draft,
            repostSourceCollectionId: null,
          },
        ]),
      },
      collectionViewGrant: { upsert },
    } as unknown as PrismaService;

    const svc = new CollectionViewRequestService(
      prisma,
      { toPublicSummary: () => ({ id: 'x', name: 'X' }) } as never,
      {} as never,
      { collectionViewGranted: vi.fn() } as never,
    );
    await expect(svc.allow('trader', 'req-1')).rejects.toMatchObject({
      response: { code: 'UPSTREAM_RESTRICTED' },
    });
    expect(upsert).not.toHaveBeenCalled();
  });

  it('Allow refuses when upstream allowForward is off (soft-unavailable)', async () => {
    const upsert = vi.fn(async () => ({}));
    const prisma = {
      collectionViewRequest: {
        findUnique: vi.fn(async () => ({
          id: 'req-1',
          collectionId: 'c1',
          requesterCompanyId: 'buyer',
          targetCompanyId: 'trader',
          status: 'pending',
          messageId: null,
          threadId: null,
        })),
      },
      collection: {
        findUnique: vi.fn(async () =>
          liveCollection({
            companyId: 'trader',
            repostSourceCollectionId: 'src-mill',
          }),
        ),
        findMany: vi.fn(async () => [
          {
            id: 'src-mill',
            allowForward: false,
            status: CollectionStatus.Published,
            repostSourceCollectionId: null,
          },
        ]),
      },
      collectionViewGrant: { upsert },
    } as unknown as PrismaService;

    const svc = new CollectionViewRequestService(
      prisma,
      { toPublicSummary: () => ({ id: 'x', name: 'X' }) } as never,
      {} as never,
      { collectionViewGranted: vi.fn() } as never,
    );
    await expect(svc.allow('trader', 'req-1')).rejects.toMatchObject({
      response: { code: 'UPSTREAM_RESTRICTED' },
    });
    expect(upsert).not.toHaveBeenCalled();
  });

  it('Ask refuses when the pack is soft-unavailable', async () => {
    const prisma = {
      collection: {
        findUnique: vi.fn(async () =>
          liveCollection({
            companyId: 'trader',
            repostSourceCollectionId: 'src-mill',
          }),
        ),
        findMany: vi.fn(async () => [
          {
            id: 'src-mill',
            allowForward: false,
            status: CollectionStatus.Published,
            repostSourceCollectionId: null,
          },
        ]),
      },
      collectionViewGrant: { findFirst: vi.fn() },
      collectionViewRequest: { findFirst: vi.fn(), create: vi.fn() },
    } as unknown as PrismaService;
    const svc = new CollectionViewRequestService(
      prisma,
      { toPublicSummary: () => ({ id: 'x', name: 'X' }) } as never,
      {} as never,
      { collectionViewGranted: vi.fn() } as never,
    );
    await expect(svc.create('buyer', 'c1')).rejects.toMatchObject({
      response: { code: 'UPSTREAM_RESTRICTED' },
    });
    expect(prisma.collectionViewRequest.create).not.toHaveBeenCalled();
  });

  it('Ask refuses while an active grant exists, but allows after expiry', async () => {
    const prismaActive = {
      collection: {
        findUnique: vi.fn(async () => liveCollection()),
      },
      collectionViewGrant: {
        findFirst: vi.fn(async () => ({ id: 'g1' })),
      },
    } as unknown as PrismaService;
    const svcActive = new CollectionViewRequestService(
      prismaActive,
      { toPublicSummary: () => ({ id: 'x', name: 'X' }) } as never,
      {} as never,
      { collectionViewGranted: vi.fn() } as never,
    );
    await expect(svcActive.create('buyer', 'c1')).rejects.toBeInstanceOf(ConflictException);

    const prismaExpired = {
      collection: {
        findUnique: vi.fn(async () => liveCollection()),
      },
      collectionViewGrant: {
        // Expired rows filtered by expiresAt > now — findFirst returns null.
        findFirst: vi.fn(async () => null),
      },
      collectionViewRequest: {
        findFirst: vi.fn(async () => null),
        create: vi.fn(async () => ({ id: 'req-new' })),
        update: vi.fn(async () => ({})),
        findUniqueOrThrow: vi.fn(async () => ({
          id: 'req-new',
          collectionId: 'c1',
          requesterCompanyId: 'buyer',
          targetCompanyId: 'owner',
          status: 'pending',
          threadId: 'th1',
          messageId: 'm1',
          createdAt: new Date(),
          decidedAt: null,
          collection: { id: 'c1', name: 'Wedding' },
          requester: { id: 'buyer', name: 'Buyer' },
          target: { id: 'owner', name: 'Owner' },
        })),
      },
      message: { create: vi.fn(async () => ({ id: 'm1' })) },
      thread: { update: vi.fn(async () => ({})) },
    } as unknown as PrismaService;
    const threads = {
      ensureTradeThread: vi.fn(async () => 'th1'),
    };
    const svcExpired = new CollectionViewRequestService(
      prismaExpired,
      { toPublicSummary: () => ({ id: 'x', name: 'X' }) } as never,
      threads as never,
      { collectionViewGranted: vi.fn() } as never,
    );
    const view = await svcExpired.create('buyer', 'c1');
    expect(view.id).toBe('req-new');
    expect(view.status).toBe('pending');
  });

  it('revoke deletes the grant so further viewing fails', async () => {
    const deleteMany = vi.fn(async () => ({ count: 1 }));
    const prisma = {
      collection: {
        findFirst: vi.fn(async () => ({ id: 'c1' })),
      },
      collectionViewGrant: { deleteMany },
    } as unknown as PrismaService;
    const svc = new CollectionViewRequestService(
      prisma,
      { toPublicSummary: () => ({ id: 'x', name: 'X' }) } as never,
      {} as never,
      { collectionViewGranted: vi.fn() } as never,
    );
    await svc.revokeGrant('owner', 'c1', 'buyer');
    expect(deleteMany).toHaveBeenCalledWith({
      where: { collectionId: 'c1', companyId: 'buyer' },
    });
  });

  it('claim 404s when the pack is no longer published', async () => {
    const prisma = {
      catalogShareLink: {
        findUnique: vi.fn(async () => ({
          token: 'tok',
          collectionId: 'c1',
          productId: null,
          productIds: [],
          expiresAt: new Date(Date.now() + 60_000),
        })),
      },
      collection: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce(liveCollection())
          .mockResolvedValueOnce({
            id: 'c1',
            companyId: 'owner',
            status: CollectionStatus.Draft,
          }),
      },
      collectionProduct: { findMany: vi.fn(async () => []) },
    } as unknown as PrismaService;
    await expect(new ShareLinkService(prisma).claim('buyer', 'tok')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
