import { MembershipRole } from '@ekum/domain-types';
import type { PrismaService } from '../core/prisma/prisma.service';

export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, '').slice(-10);
}

export function phoneVariants(phone: string): string[] {
  const last10 = phoneDigits(phone);
  if (last10.length < 10) return [phone];
  return [...new Set([phone, last10, `91${last10}`, `+91${last10}`, `0${last10}`])];
}

/** If this user has no company yet, join the thin company from a pending Accept link. */
export async function attachPendingOrderInvite(
  prisma: PrismaService,
  userId: string,
  phone: string,
): Promise<string | null> {
  const existing = await prisma.companyMembership.findFirst({
    where: { userId },
    select: { companyId: true },
  });
  if (existing) return existing.companyId;

  const invite = await prisma.orderAcceptInvite.findFirst({
    where: {
      phone: { in: phoneVariants(phone) },
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
    include: { order: { select: { buyerCompanyId: true } } },
  });
  if (!invite) return null;

  await prisma.companyMembership.create({
    data: {
      userId,
      companyId: invite.order.buyerCompanyId,
      role: MembershipRole.Owner,
      contactRole: 'Owner',
    },
  });
  return invite.order.buyerCompanyId;
}
