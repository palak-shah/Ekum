import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { MembershipRole } from '@ekum/domain-types';
import { TeamService } from './team.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { TokenService } from '../auth/token.service';
import type { CompanySerializer } from '../access/company.serializer';

function serializer() {
  return {
    toPublicSummary: (company: { id: string; name: string }) => ({
      id: company.id,
      name: company.name,
      city: 'Surat',
      verification: 'not_verified',
      logoUrl: null,
    }),
  } as unknown as CompanySerializer;
}

describe('TeamService', () => {
  it('creates an invite with a normalized phone', async () => {
    const create = vi.fn(async () => ({}));
    const prisma = {
      teamInvite: { create },
    } as unknown as PrismaService;
    const svc = new TeamService(prisma, {} as TokenService, serializer());
    const result = await svc.createInvite(
      { userId: 'u1', phone: '+919800000001', companyId: 'c1', role: 'owner', permissions: null },
      'c1',
      { name: 'Ramesh', phone: '9876543210' },
    );
    expect(result.invitePath).toMatch(/^\/t\//);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ phone: '9876543210', name: 'Ramesh' }),
      }),
    );
  });

  it('joins as staff when phone matches and user has no business', async () => {
    const invite = {
      id: 'inv1',
      companyId: 'c1',
      phone: '9876543210',
      name: 'Ramesh',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
      company: { id: 'c1', name: 'House' },
    };
    const prisma = {
      teamInvite: {
        findUnique: vi.fn(async () => invite),
      },
      companyMembership: {
        findUnique: vi.fn(async () => null),
        findFirst: vi.fn(async () => null),
        create: vi.fn(async () => ({})),
      },
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<void>) =>
        fn({
          companyMembership: { create: vi.fn(async () => ({})) },
          teamInvite: { update: vi.fn(async () => ({})) },
          user: { update: vi.fn(async () => ({})) },
        }),
      ),
    } as unknown as PrismaService;
    const tokens = {
      issue: vi.fn(async () => ({ accessToken: 'a', refreshToken: 'r' })),
    } as unknown as TokenService;
    const svc = new TeamService(prisma, tokens, serializer());
    const result = await svc.joinInvite(
      { userId: 'u2', phone: '+919876543210', companyId: null, role: null, permissions: null },
      'tok',
    );
    expect(result.companyId).toBe('c1');
    expect(tokens.issue).toHaveBeenCalledWith({ id: 'u2', phone: '+919876543210' }, 'c1');
  });

  it('rejects join when phone does not match', async () => {
    const prisma = {
      teamInvite: {
        findUnique: vi.fn(async () => ({
          id: 'inv1',
          companyId: 'c1',
          phone: '9876543210',
          name: 'Ramesh',
          expiresAt: new Date(Date.now() + 60_000),
          usedAt: null,
          company: { id: 'c1', name: 'House' },
        })),
      },
    } as unknown as PrismaService;
    const svc = new TeamService(prisma, {} as TokenService, serializer());
    await expect(
      svc.joinInvite(
        { userId: 'u2', phone: '+919800000099', companyId: null, role: null, permissions: null },
        'tok',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects join when user still has a live business elsewhere', async () => {
    const prisma = {
      teamInvite: {
        findUnique: vi.fn(async () => ({
          id: 'inv1',
          companyId: 'c1',
          phone: '9876543210',
          name: 'Ramesh',
          expiresAt: new Date(Date.now() + 60_000),
          usedAt: null,
          company: { id: 'c1', name: 'House' },
        })),
      },
      companyMembership: {
        findUnique: vi.fn(async () => null),
        findFirst: vi.fn(async () => ({ companyId: 'other', archivedAt: null })),
      },
    } as unknown as PrismaService;
    const svc = new TeamService(prisma, {} as TokenService, serializer());
    await expect(
      svc.joinInvite(
        { userId: 'u2', phone: '+919876543210', companyId: null, role: null, permissions: null },
        'tok',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('joins a new company after prior membership was archived', async () => {
    const invite = {
      id: 'inv1',
      companyId: 'c-b',
      phone: '9876543210',
      name: 'Ramesh',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
      company: { id: 'c-b', name: 'Shop B' },
    };
    const create = vi.fn(async () => ({}));
    const prisma = {
      teamInvite: {
        findUnique: vi.fn(async () => invite),
      },
      companyMembership: {
        findUnique: vi.fn(async () => null),
        findFirst: vi.fn(async () => null),
      },
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<void>) =>
        fn({
          companyMembership: { create },
          teamInvite: { update: vi.fn(async () => ({})) },
          user: { update: vi.fn(async () => ({})) },
        }),
      ),
    } as unknown as PrismaService;
    const tokens = {
      issue: vi.fn(async () => ({ accessToken: 'a', refreshToken: 'r' })),
    } as unknown as TokenService;
    const svc = new TeamService(prisma, tokens, serializer());
    const result = await svc.joinInvite(
      { userId: 'u2', phone: '+919876543210', companyId: null, role: null, permissions: null },
      'tok',
    );
    expect(result.companyId).toBe('c-b');
    expect(create).toHaveBeenCalled();
  });

  it('unarchives when rejoining the same company', async () => {
    const invite = {
      id: 'inv1',
      companyId: 'c-a',
      phone: '9876543210',
      name: 'Ramesh',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
      company: { id: 'c-a', name: 'Shop A' },
    };
    const updateMembership = vi.fn(async () => ({}));
    const prisma = {
      teamInvite: {
        findUnique: vi.fn(async () => invite),
      },
      companyMembership: {
        findUnique: vi.fn(async () => ({
          id: 'mem-a',
          companyId: 'c-a',
          archivedAt: new Date(),
        })),
      },
      $transaction: vi.fn(async (fn: (tx: unknown) => Promise<void>) =>
        fn({
          companyMembership: { update: updateMembership },
          teamInvite: { update: vi.fn(async () => ({})) },
        }),
      ),
    } as unknown as PrismaService;
    const tokens = {
      issue: vi.fn(async () => ({ accessToken: 'a', refreshToken: 'r' })),
    } as unknown as TokenService;
    const svc = new TeamService(prisma, tokens, serializer());
    const result = await svc.joinInvite(
      { userId: 'u2', phone: '+919876543210', companyId: null, role: null, permissions: null },
      'tok',
    );
    expect(result.companyId).toBe('c-a');
    expect(updateMembership).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'mem-a' },
        data: { archivedAt: null },
      }),
    );
  });
  it('cannot remove the last owner', async () => {
    const prisma = {
      companyMembership: {
        findUnique: vi.fn(async () => ({ role: MembershipRole.Owner })),
        count: vi.fn(async () => 1),
        delete: vi.fn(),
      },
    } as unknown as PrismaService;
    const svc = new TeamService(prisma, {} as TokenService, serializer());
    await expect(
      svc.removeMember(
        {
          userId: 'owner',
          phone: '+91',
          companyId: 'c1',
          role: MembershipRole.Owner,
          permissions: null,
        },
        'c1',
        'owner',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects unknown invite token', async () => {
    const prisma = {
      teamInvite: { findUnique: vi.fn(async () => null) },
    } as unknown as PrismaService;
    const svc = new TeamService(prisma, {} as TokenService, serializer());
    await expect(svc.resolveInvite('bad')).rejects.toBeInstanceOf(NotFoundException);
  });
});
