import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { CompanyService } from './company.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { TokenService } from '../auth/token.service';
import { CompanySerializer } from '../access/company.serializer';
import type { VisibilityService } from '../access/visibility.service';

const baseCompany = {
  id: 'shop',
  name: 'Surat Silk House',
  city: 'Surat',
  about: 'Wholesale',
  logoUrl: 'https://m/logo.jpg',
  coverUrl: 'https://m/cover.jpg',
  showcaseUrls: ['https://m/s1.jpg'],
  profileVisibility: 'public',
  contactPhone: '+919800000099',
  showContactPhone: true,
  gstNumber: null,
  verification: 'not_verified',
  sellCategories: ['Sarees'],
  buyCategories: [],
  superCategories: [],
  masterCategories: [],
  canPublish: true,
  canRelist: false,
  canRefer: true,
};

function makeService(opts: {
  company?: typeof baseCompany | null;
  follow?: { status: string; accessKind: string | null } | null;
  blocked?: boolean;
  canViewCatalog?: boolean;
  connected?: boolean;
  mediaUrls?: string[];
  productImages?: string[][];
  updateData?: unknown;
}) {
  const company = opts.company === undefined ? baseCompany : opts.company;
  const prisma = {
    company: {
      findUnique: vi.fn(async () => company),
      update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        opts.updateData = data;
        const applied = Object.fromEntries(
          Object.entries(data).filter(([, value]) => value !== undefined),
        );
        return { ...company, ...applied };
      }),
    },
    follow: {
      findUnique: vi.fn(async () => opts.follow ?? null),
    },
    thread: {
      findFirst: vi.fn(async () => null),
    },
    companyMembership: {
      findMany: vi.fn(async () => [
        {
          contactRole: 'Sales',
          showPhone: true,
          displayPhone: '+919822222222',
          user: { name: 'Ravi', phone: '+919811111111' },
        },
      ]),
      findUnique: vi.fn(async () => ({
        role: 'owner',
        canUploads: true,
        canChats: true,
        canOrders: true,
        canPayments: true,
        canTeam: true,
      })),
    },
    companySettings: {
      findUnique: vi.fn(async () => null),
    },
    user: {
      update: vi.fn(async () => ({})),
      findUniqueOrThrow: vi.fn(async () => ({ name: 'Owner' })),
    },
    media: {
      findMany: vi.fn(async () =>
        (opts.mediaUrls ?? []).map((url) => ({ url, thumbnailUrl: null })),
      ),
    },
    product: {
      findMany: vi.fn(async () =>
        (opts.productImages ?? []).map((images) => ({ images })),
      ),
    },
    collection: {
      findMany: vi.fn(async () => [{ id: 'c1' }]),
    },
  } as unknown as PrismaService;

  const visibility = {
    isBlocked: async () => opts.blocked ?? false,
    canViewCatalog: async () => opts.canViewCatalog ?? false,
    isActiveConnection: async () => opts.connected ?? false,
  } as unknown as VisibilityService;

  return {
    service: new CompanyService(
      prisma,
      {} as TokenService,
      new CompanySerializer(),
      visibility,
    ),
    prisma,
    opts,
  };
}

describe('CompanyService profile access', () => {
  it('returns full public profile to a stranger', async () => {
    const { service } = makeService({ company: { ...baseCompany, profileVisibility: 'public' } });
    const profile = await service.getPublicProfile('viewer', 'shop');
    expect(profile.profileAccess).toBe(true);
    expect(profile.coverUrl).toBe('https://m/cover.jpg');
    expect(profile.showcaseUrls).toEqual(['https://m/s1.jpg']);
  });

  it('returns private stub to a non-follower', async () => {
    const { service } = makeService({
      company: { ...baseCompany, profileVisibility: 'private' },
      follow: null,
    });
    const profile = await service.getPublicProfile('viewer', 'shop');
    expect(profile.profileAccess).toBe(false);
    expect(profile.coverUrl).toBeNull();
    expect(profile.showcaseUrls).toEqual([]);
    expect(profile.about).toBeNull();
    expect(profile.name).toBe('Surat Silk House');
    expect(profile.workingHours).toBeNull();
    expect(profile.shopAddress).toBeNull();
    expect(profile.websiteUrl).toBeNull();
  });

  it('returns full private profile to an approved follower', async () => {
    const { service } = makeService({
      company: { ...baseCompany, profileVisibility: 'private' },
      follow: { status: 'allowed', accessKind: 'look' },
    });
    const profile = await service.getPublicProfile('viewer', 'shop');
    expect(profile.profileAccess).toBe(true);
    expect(profile.following).toBe(true);
    expect(profile.coverUrl).toBe('https://m/cover.jpg');
  });

  it('does not unlock private profile with Connection alone', async () => {
    const { service } = makeService({
      company: { ...baseCompany, profileVisibility: 'private' },
      follow: null,
      connected: true,
    });
    const profile = await service.getPublicProfile('viewer', 'shop');
    expect(profile.profileAccess).toBe(false);
    expect(profile.connected).toBe(true);
  });

  it('404s blocked viewers', async () => {
    const { service } = makeService({ blocked: true });
    await expect(service.getPublicProfile('viewer', 'shop')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns empty collections shelf for private strangers before querying packs', async () => {
    const { service, prisma } = makeService({
      company: { ...baseCompany, profileVisibility: 'private' },
      follow: null,
    });
    const page = await service.listPublishedCollections('viewer', 'shop', { limit: 20 });
    expect(page.results).toEqual([]);
    expect(prisma.collection.findMany).not.toHaveBeenCalled();
  });
});

describe('CompanyService contact phones', () => {
  it('returns [] when canViewCatalog is false (Follow-only)', async () => {
    const { service } = makeService({ canViewCatalog: false });
    await expect(service.getContactPoints('viewer', 'shop')).resolves.toEqual([]);
  });

  it('returns company phone then team when Connected and opted in', async () => {
    const { service } = makeService({ canViewCatalog: true });
    const points = await service.getContactPoints('viewer', 'shop');
    expect(points[0]).toMatchObject({
      kind: 'company',
      phone: '+919800000099',
    });
    expect(points[1]?.phone).toBe('+919822222222');
    expect(JSON.stringify(points)).not.toContain('+919811111111');
  });

  it('omits company phone when showContactPhone is false', async () => {
    const { service } = makeService({
      canViewCatalog: true,
      company: { ...baseCompany, showContactPhone: false },
    });
    const points = await service.getContactPoints('viewer', 'shop');
    expect(points.every((p) => p.kind !== 'company')).toBe(true);
    expect(points[0]?.phone).toBe('+919822222222');
  });
});

describe('CompanyService updateOwnProfile media patch', () => {
  it('writes cover and showcase URLs without Media/Product ownership checks', async () => {
    const { service, opts } = makeService({});
    await service.updateOwnProfile('shop', 'user1', {
      coverUrl: 'https://other/x.jpg',
      showcaseUrls: ['https://cdn/rewritten.jpg'],
    });
    expect(opts.updateData).toMatchObject({
      coverUrl: 'https://other/x.jpg',
      showcaseUrls: ['https://cdn/rewritten.jpg'],
    });
  });

  it('rejects more than 10 showcase photos', async () => {
    const urls = Array.from({ length: 11 }, (_, i) => `https://m/${i}.jpg`);
    const { service } = makeService({});
    await expect(
      service.updateOwnProfile('shop', 'user1', { showcaseUrls: urls }),
    ).rejects.toMatchObject({ response: { code: 'SHOWCASE_MAX' } });
  });

  it('clears cover without touching showcase', async () => {
    const { service, opts } = makeService({});
    await service.updateOwnProfile('shop', 'user1', { coverUrl: null });
    const data = opts.updateData as Record<string, unknown>;
    expect(data.coverUrl).toBeNull();
    expect(data.showcaseUrls).toBeUndefined();
    expect(data.logoUrl).toBeUndefined();
  });

  it('clears logo without touching cover', async () => {
    const { service, opts } = makeService({});
    await service.updateOwnProfile('shop', 'user1', { logoUrl: null });
    const data = opts.updateData as Record<string, unknown>;
    expect(data.logoUrl).toBeNull();
    expect(data.coverUrl).toBeUndefined();
  });

  it('accepts empty showcaseUrls to clear the strip', async () => {
    const { service, opts } = makeService({});
    await service.updateOwnProfile('shop', 'user1', { showcaseUrls: [] });
    const data = opts.updateData as Record<string, unknown>;
    expect(data.showcaseUrls).toEqual([]);
    expect(data.coverUrl).toBeUndefined();
    expect(data.logoUrl).toBeUndefined();
  });

  it('replaces showcase order with a full array', async () => {
    const { service, opts } = makeService({});
    await service.updateOwnProfile('shop', 'user1', {
      showcaseUrls: ['https://m/b.jpg', 'https://m/a.jpg'],
    });
    expect(opts.updateData).toMatchObject({
      showcaseUrls: ['https://m/b.jpg', 'https://m/a.jpg'],
    });
  });

  it('writes working hours, address and website without touching cover', async () => {
    const { service, opts } = makeService({});
    await service.updateOwnProfile('shop', 'user1', {
      workingHours: { opensAt: '10:30', closesAt: '19:30', weeklyOff: 'sun' },
      shopAddress: {
        unit: 'Shop 12',
        street: 'Ring Road',
        area: 'Textile Market',
        pincode: '395002',
      },
      websiteUrl: 'https://suratsilk.example/',
    });
    expect(opts.updateData).toMatchObject({
      opensAt: '10:30',
      closesAt: '19:30',
      weeklyOff: 'sun',
      addressUnit: 'Shop 12',
      addressStreet: 'Ring Road',
      addressArea: 'Textile Market',
      addressPincode: '395002',
      websiteUrl: 'https://suratsilk.example/',
    });
    expect((opts.updateData as Record<string, unknown>).coverUrl).toBeUndefined();
  });

  it('clears hours without wiping address', async () => {
    const { service, opts } = makeService({});
    await service.updateOwnProfile('shop', 'user1', { workingHours: null });
    const data = opts.updateData as Record<string, unknown>;
    expect(data.opensAt).toBeNull();
    expect(data.closesAt).toBeNull();
    expect(data.weeklyOff).toBeNull();
    expect(data.addressUnit).toBeUndefined();
    expect(data.websiteUrl).toBeUndefined();
  });

  it('name-only patch does not null shop address', async () => {
    const { service, opts } = makeService({});
    await service.updateOwnProfile('shop', 'user1', { name: 'New House' });
    const data = opts.updateData as Record<string, unknown>;
    expect(data.name).toBe('New House');
    expect(data.addressUnit).toBeUndefined();
    expect(data.opensAt).toBeUndefined();
    expect(data.websiteUrl).toBeUndefined();
  });
});
