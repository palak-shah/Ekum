import { describe, expect, it, vi } from 'vitest';
import { attachPendingOrderInvite, phoneDigits, phoneVariants } from './order-invite-claim';
import type { PrismaService } from '../core/prisma/prisma.service';

describe('order-invite-claim', () => {
  it('normalizes to last 10 digits', () => {
    expect(phoneDigits('+919876543210')).toBe('9876543210');
    expect(phoneVariants('9876543210')).toContain('+919876543210');
  });

  it('attaches a pending invite when the user has no company', async () => {
    const prisma = {
      companyMembership: {
        findFirst: vi.fn(async () => null),
        create: vi.fn(async () => ({ companyId: 'thin-1' })),
      },
      orderAcceptInvite: {
        findFirst: vi.fn(async () => ({
          id: 'inv',
          order: { buyerCompanyId: 'thin-1' },
        })),
      },
    } as unknown as PrismaService;
    const companyId = await attachPendingOrderInvite(prisma, 'u1', '+919876543210');
    expect(companyId).toBe('thin-1');
    expect(prisma.companyMembership.create).toHaveBeenCalled();
  });

  it('does not attach when the user already has a company', async () => {
    const prisma = {
      companyMembership: {
        findFirst: vi.fn(async () => ({ companyId: 'existing' })),
        create: vi.fn(),
      },
    } as unknown as PrismaService;
    await expect(attachPendingOrderInvite(prisma, 'u1', '9876543210')).resolves.toBe('existing');
    expect(prisma.companyMembership.create).not.toHaveBeenCalled();
  });
});
