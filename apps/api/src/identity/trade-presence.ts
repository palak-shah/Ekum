import type { Prisma } from '@prisma/client';
import type { TradePresence } from '@ekum/domain-types';
import type { PrismaService } from '../core/prisma/prisma.service';

type TradeDefaults = Record<string, unknown>;

/**
 * Buy/sell: missing flags default true.
 * Trading: product default is off (`=== true` only). While Slice B WIP/QA, unset
 * is treated as on so local testing does not require Profile hunting.
 * TODO(slice-b-ship): `trading: defaults.tradingEnabled === true` only.
 */
export function resolveTradePresence(tradeDefaults: unknown): TradePresence {
  const defaults = asTradeDefaults(tradeDefaults);
  return {
    buying: defaults.buyingEnabled !== false,
    selling: defaults.sellingEnabled !== false,
    trading: defaults.tradingEnabled === true || defaults.tradingEnabled === undefined,
  };
}

/** Profile default for Direct vs I handle. Missing ⇒ direct. */
export function resolveOrderPathPreference(
  tradeDefaults: unknown,
): 'direct' | 'handle' {
  const defaults = asTradeDefaults(tradeDefaults);
  return defaults.orderPathPreference === 'handle' ? 'handle' : 'direct';
}

export function asTradeDefaults(value: unknown): TradeDefaults {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { ...(value as TradeDefaults) };
  }
  return {};
}

export function mergeTradeDefaults(
  existing: unknown,
  patch: TradeDefaults,
): Prisma.InputJsonValue {
  return { ...asTradeDefaults(existing), ...patch } as Prisma.InputJsonValue;
}

/** Force selling UI back on after the company creates catalogue content. */
export async function ensureSellingEnabled(
  prisma: PrismaService,
  companyId: string,
): Promise<void> {
  const settings = await prisma.companySettings.findUnique({ where: { companyId } });
  const next = mergeTradeDefaults(settings?.tradeDefaults, { sellingEnabled: true });
  await prisma.companySettings.upsert({
    where: { companyId },
    create: { companyId, tradeDefaults: next },
    update: { tradeDefaults: next },
  });
}

/** Merge first-publish consent without wiping buy/sell presence flags. */
export async function rememberFirstPublishConsent(
  prisma: PrismaService,
  companyId: string,
): Promise<void> {
  const settings = await prisma.companySettings.findUnique({ where: { companyId } });
  const next = mergeTradeDefaults(settings?.tradeDefaults, {
    firstPublishConsentedAt: new Date().toISOString(),
    sellingEnabled: true,
  });
  await prisma.companySettings.upsert({
    where: { companyId },
    create: { companyId, tradeDefaults: next },
    update: { tradeDefaults: next },
  });
}
