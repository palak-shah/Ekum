import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { CollectionStatus, PublishAudience } from '@ekum/domain-types';
import { ShareLinkService } from './share-link.service';
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
    audience: PublishAudience.Connections,
    startsAt: null,
    endsAt: null,
    ...over,
  };
}

describe('ShareLinkService', () => {
  it('lets the owner create a 48h album link', async () => {
    const collection = liveCollection();
    const prisma = {
      collection: { findUnique: vi.fn(async () => collection) },
      catalogShareLink: {
        create: vi.fn(async () => ({})),
        findUnique: vi.fn(async () => ({
          token: 'tok',
          collectionId: 'c1',
          productId: null,
          expiresAt: new Date(Date.now() + 60_000),
        })),
      },
    } as unknown as PrismaService;
    const svc = new ShareLinkService(prisma);
    const view = await svc.create('owner', { collectionId: 'c1' });
    expect(view.kind).toBe('collection');
    expect(view.path.startsWith('/s/')).toBe(true);
    expect(view.name).toBe('Wedding');
    expect(view.companyName).toBe('Surat Silk House');
    expect(view.image).toBeNull();
    expect(view.open).toBe(false);
    expect(view.designs).toEqual([]);
  });

  it('lets a non-owner create a 48h link when relist is locked', async () => {
    const collection = liveCollection({ allowForward: false });
    const prisma = {
      collection: { findUnique: vi.fn(async () => collection) },
      catalogShareLink: {
        create: vi.fn(async () => ({})),
        findUnique: vi.fn(async () => ({
          token: 'tok',
          collectionId: 'c1',
          productId: null,
          expiresAt: new Date(Date.now() + 60_000),
        })),
      },
    } as unknown as PrismaService;
    const svc = new ShareLinkService(prisma);
    const view = await svc.create('buyer', { collectionId: 'c1' });
    expect(view.path.startsWith('/s/')).toBe(true);
  });

  it('404s an expired token', async () => {
    const prisma = {
      catalogShareLink: {
        findUnique: vi.fn(async () => ({
          token: 't',
          collectionId: 'c1',
          productId: null,
          expiresAt: new Date(Date.now() - 1000),
        })),
      },
    } as unknown as PrismaService;
    const svc = new ShareLinkService(prisma);
    await expect(svc.get('t')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns design thumbs only for an Everyone live album', async () => {
    const prisma = {
      catalogShareLink: {
        findUnique: vi.fn(async () => ({
          token: 't',
          collectionId: 'c1',
          productId: null,
          expiresAt: new Date(Date.now() + 60_000),
        })),
      },
      collection: {
        findUnique: vi.fn(async () =>
          liveCollection({ audience: PublishAudience.Everyone, coverImage: 'cover.jpg' }),
        ),
      },
      collectionProduct: {
        findMany: vi.fn(async () => [
          { product: { id: 'p1', name: 'Saree', images: ['a.jpg'] } },
        ]),
      },
    } as unknown as PrismaService;
    const svc = new ShareLinkService(prisma);
    const view = await svc.get('t');
    expect(view.open).toBe(true);
    expect(view.designs).toEqual([{ id: 'p1', name: 'Saree', image: 'a.jpg' }]);
  });

  it('does not leak designs for a Connections album', async () => {
    const findMany = vi.fn();
    const prisma = {
      catalogShareLink: {
        findUnique: vi.fn(async () => ({
          token: 't',
          collectionId: 'c1',
          productId: null,
          expiresAt: new Date(Date.now() + 60_000),
        })),
      },
      collection: {
        findUnique: vi.fn(async () => liveCollection()),
      },
      collectionProduct: { findMany: findMany },
    } as unknown as PrismaService;
    const svc = new ShareLinkService(prisma);
    const view = await svc.get('t');
    expect(view.open).toBe(false);
    expect(view.designs).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });
});
