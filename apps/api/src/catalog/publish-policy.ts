import { RateVisibility } from '@ekum/domain-types';
import type { PrismaService } from '../core/prisma/prisma.service';
import { asTradeDefaults, mergeTradeDefaults } from '../identity/trade-presence';

export type PublishPolicy = {
  rateVisibility: string;
  allowForward: boolean;
};

const PLATFORM: PublishPolicy = {
  rateVisibility: RateVisibility.OnRequest,
  allowForward: true,
};

type PublishDefaultsBlob = {
  rateVisibility?: string;
  allowForward?: boolean;
};

function readCompanyDefaults(tradeDefaults: unknown): PublishPolicy {
  const defaults = asTradeDefaults(tradeDefaults);
  const publish = defaults.publishDefaults;
  if (!publish || typeof publish !== 'object' || Array.isArray(publish)) {
    return { ...PLATFORM };
  }
  const blob = publish as PublishDefaultsBlob;
  return {
    rateVisibility:
      blob.rateVisibility === RateVisibility.Visible ||
      blob.rateVisibility === RateVisibility.OnRequest
        ? blob.rateVisibility
        : PLATFORM.rateVisibility,
    allowForward: blob.allowForward !== false,
  };
}

/**
 * Resolve usual → optional group override.
 * Group null fields inherit company; missing company uses platform defaults.
 */
export async function resolvePublishPolicy(
  prisma: PrismaService,
  companyId: string,
  groupId?: string | null,
): Promise<PublishPolicy> {
  const settings = await prisma.companySettings.findUnique({ where: { companyId } });
  let policy = readCompanyDefaults(settings?.tradeDefaults);

  if (!groupId) {
    return policy;
  }

  const group = await prisma.broadcastList.findFirst({
    where: { id: groupId, companyId },
    select: { defaultRateVisibility: true, allowForward: true },
  });
  if (!group) {
    return policy;
  }

  if (
    group.defaultRateVisibility === RateVisibility.Visible ||
    group.defaultRateVisibility === RateVisibility.OnRequest
  ) {
    policy = { ...policy, rateVisibility: group.defaultRateVisibility };
  }
  if (group.allowForward !== null && group.allowForward !== undefined) {
    policy = { ...policy, allowForward: group.allowForward };
  }
  return policy;
}

/** Remember last publish choices as company usual (quiet defaults). */
export async function rememberPublishDefaults(
  prisma: PrismaService,
  companyId: string,
  policy: PublishPolicy,
): Promise<void> {
  const settings = await prisma.companySettings.findUnique({ where: { companyId } });
  const next = mergeTradeDefaults(settings?.tradeDefaults, {
    publishDefaults: {
      rateVisibility: policy.rateVisibility,
      allowForward: policy.allowForward,
    },
  });
  await prisma.companySettings.upsert({
    where: { companyId },
    create: { companyId, tradeDefaults: next },
    update: { tradeDefaults: next },
  });
}
