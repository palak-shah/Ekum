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
};

describe('CompanyService.create onboarding', () => {
  it('creates a company with canPublish false and stores contact person on the user', async () => {
    const companyCreate = vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'co-1',
      ...data,
      verification: 'not_verified',
      logoUrl: null,
      canRefer: false,
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
    } as unknown as PrismaService;
    const tokens = { issue } as unknown as TokenService;
    const serializer = {
      toOwnProfile: (_company: unknown, contactPerson: string | null) => ({
        id: 'co-1',
        name: 'Kala Creations',
        contactPerson,
        canPublish: false,
        capabilities: { publish: false, relist: false, refer: false },
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

  it('rejects a second company for the same user', async () => {
    const tx = {
      companyMembership: { findFirst: async () => ({ id: 'mem-1' }) },
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
});
