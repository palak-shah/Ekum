import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { MembershipRole } from '@ekum/domain-types';
import type { AuthPrincipal } from './auth.types';
import { assertPermission, assertActiveCompany, membershipPermissions } from './require-permission';

function staff(over: Partial<AuthPrincipal['permissions']> = {}): AuthPrincipal {
  return {
    userId: 'u1',
    phone: '+919800000099',
    companyId: 'c1',
    role: MembershipRole.Staff,
    permissions: {
      uploads: false,
      chats: false,
      orders: true,
      payments: false,
      team: false,
      ...over,
    },
  };
}

describe('assertPermission', () => {
  it('rejects staff when chats is off', () => {
    expect(() => assertPermission(staff(), 'chats')).toThrow(ForbiddenException);
  });

  it('lets staff through when the cap is on', () => {
    expect(() => assertPermission(staff({ chats: true }), 'chats')).not.toThrow();
  });

  it('lets an owner through when all flags are true', () => {
    const owner: AuthPrincipal = {
      userId: 'o1',
      phone: '+919800000001',
      companyId: 'c1',
      role: MembershipRole.Owner,
      permissions: {
        uploads: true,
        chats: true,
        orders: true,
        payments: true,
        team: true,
      },
    };
    expect(() => assertPermission(owner, 'team')).not.toThrow();
  });

  it('rejects when there is no company', () => {
    expect(() =>
      assertPermission(
        { userId: 'u', phone: '+91', companyId: null, role: null, permissions: null },
        'orders',
      ),
    ).toThrow(ForbiddenException);
  });
});

describe('assertActiveCompany', () => {
  it('returns companyId when present', () => {
    expect(assertActiveCompany(staff())).toBe('c1');
  });

  it('rejects when there is no company', () => {
    expect(() =>
      assertActiveCompany({
        userId: 'u',
        phone: '+91',
        companyId: null,
        role: null,
        permissions: null,
      }),
    ).toThrow(ForbiddenException);
  });
});

describe('membershipPermissions', () => {
  it('maps Prisma can* columns', () => {
    expect(
      membershipPermissions({
        canUploads: true,
        canChats: false,
        canOrders: true,
        canPayments: false,
        canTeam: false,
      }),
    ).toEqual({
      uploads: true,
      chats: false,
      orders: true,
      payments: false,
      team: false,
    });
  });
});
