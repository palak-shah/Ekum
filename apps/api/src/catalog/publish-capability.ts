import { ForbiddenException } from '@nestjs/common';
import type { PrismaService } from '../core/prisma/prisma.service';

/**
 * Publishing unlocks on first consent (`canPublish`). Until then the publish
 * sheet must send consentToSell; this helper rejects silent publishes.
 */
export async function assertCanPublish(prisma: PrismaService, companyId: string): Promise<void> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: { canPublish: true },
  });
  if (!company?.canPublish) {
    throw new ForbiddenException({
      code: 'PUBLISH_CONSENT_REQUIRED',
      message: 'Confirm you want to start selling when you publish for the first time.',
    });
  }
}

export async function grantPublishCapability(
  prisma: PrismaService,
  companyId: string,
): Promise<void> {
  await prisma.company.update({
    where: { id: companyId },
    data: { canPublish: true },
  });
  // Remember first-publish consent on settings for audit / UI.
  await prisma.companySettings.upsert({
    where: { companyId },
    create: {
      companyId,
      tradeDefaults: { firstPublishConsentedAt: new Date().toISOString() },
    },
    update: {
      tradeDefaults: { firstPublishConsentedAt: new Date().toISOString() },
    },
  });
}
