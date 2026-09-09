import { describe, expect, it, vi } from 'vitest';
import { ConflictException } from '@nestjs/common';
import { SuperCategory } from '@ekum/domain-types';
import { CompanyService } from './company.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { TokenService } from '../auth/token.service';
import type { CompanySerializer } from '../access/company.serializer';
import type { VisibilityService } from '../access/visibility.service';
import type { AuthPrincipal } from '../auth/auth.types';

const principal: AuthPrincipal = {
  userId: 'user-new',
  phone: '+919800000099',
  companyId: null,
  role: null,
  permissions: null,
};

describe('CompanyService.create onboarding', () => {
  it('creates a company with canPublish false and stores contact person on the user', async () => {
    const companyCreate = vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'co-1',
      ...data,
      verification: 'not_verified',
      logoUrl: null,
      canRefer: true,
      canRelist: false,
    }));
    const membershipCreate = vi.fn(async () => ({}));
    const userUpdate = vi.fn(async () => ({}));
    const tx = {
      companyMembership: { findFirst: async () => null, create: membershipCreate },
      company: { create: companyCreate },
      user: { update: userUpdate },
    };
    const issue = vi.fn(async () => ({
      accessToken: 'a',
      refreshToken: 'r',
      accessExpiresIn: 900,
    }));
    const prisma = {
      $transaction: async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx),
      user: {
        findUniqueOrThrow: async () => ({ id: 'user-new', phone: '+919800000099', name: 'Kiran' }),
      },
      companySettings: { findUnique: async () => null },
      companyMembership: { findUnique: async () => null },
    } as unknown as PrismaService;
    const tokens = { issue } as unknown as TokenService;
    const serializer = {
      toOwnProfile: (_company: unknown, contactPerson: string | null) => ({
        id: 'co-1',
        name: 'Kala Creations',
        contactPerson,
        canPublish: false,
        capabilities: { publish: false, relist: false, refer: true },
      }),
    } as unknown as CompanySerializer;
    const visibility = {} as unknown as VisibilityService;
    const service = new CompanyService(prisma, tokens, serializer, visibility);

    const result = await service.create(principal, {
      name: 'Kala Creations',
      contactPerson: 'Kiran',
      city: 'Surat',
      sellCategories: [],
      buyCategories: [],
      superCategories: [SuperCategory.WomensApparel],
    });

    expect(companyCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Kala Creations',
          canPublish: false,
          canRefer: true,
          superCategories: [SuperCategory.WomensApparel],
        }),
      }),
    );
    expect(userUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: 'Kiran' },
      }),
    );
    expect(issue).toHaveBeenCalledWith(
      { id: 'user-new', phone: '+919800000099' },
      'co-1',
    );
    expect(result.company).toMatchObject({
      id: 'co-1',
      canPublish: false,
      contactPerson: 'Kiran',
    });
  });

  it('rejects a second live company for the same user', async () => {
    const tx = {
      companyMembership: { findFirst: async () => ({ id: 'mem-1', archivedAt: null }) },
      company: { create: vi.fn() },
      user: { update: vi.fn() },
    };
    const prisma = {
      $transaction: async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx),
    } as unknown as PrismaService;
    const service = new CompanyService(
      prisma,
      {} as TokenService,
      {} as CompanySerializer,
      {} as VisibilityService,
    );

    await expect(
      service.create(principal, {
        name: 'Other',
        contactPerson: 'Kiran',
        city: 'Surat',
        sellCategories: [],
        buyCategories: [],
        superCategories: [SuperCategory.Others],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('allows creating a company after prior membership was archived', async () => {
    const companyCreate = vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'co-2',
      ...data,
      verification: 'not_verified',
      logoUrl: null,
      canRefer: true,
      canRelist: false,
    }));
    const membershipCreate = vi.fn(async () => ({}));
    const findFirst = vi.fn(async (args: { where: { archivedAt: null | undefined } }) => {
      expect(args.where.archivedAt).toBeNull();
      return null;
    });
    const tx = {
      companyMembership: { findFirst, create: membershipCreate },
      company: { create: companyCreate },
      user: { update: vi.fn(async () => ({})) },
    };
    const prisma = {
      $transaction: async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx),
      user: {
        findUniqueOrThrow: async () => ({ id: 'user-new', phone: '+919800000099', name: 'Kiran' }),
      },
      companySettings: { findUnique: async () => null },
      companyMembership: { findUnique: async () => null },
    } as unknown as PrismaService;
    const tokens = {
      issue: vi.fn(async () => ({
        accessToken: 'a',
        refreshToken: 'r',
        accessExpiresIn: 900,
      })),
    } as unknown as TokenService;
    const serializer = {
      toOwnProfile: () => ({
        id: 'co-2',
        name: 'New Shop',
        contactPerson: 'Kiran',
        canPublish: false,
        capabilities: { publish: false, relist: false, refer: true },
      }),
    } as unknown as CompanySerializer;
    const service = new CompanyService(prisma, tokens, serializer, {} as VisibilityService);

    const result = await service.create(principal, {
      name: 'New Shop',
      contactPerson: 'Kiran',
      city: 'Surat',
      sellCategories: [],
      buyCategories: [],
      superCategories: [SuperCategory.Others],
    });

    expect(result.company.id).toBe('co-2');
    expect(findFirst).toHaveBeenCalled();
  });
});
