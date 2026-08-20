import type { OwnCompanyProfile, TradePresence } from '@ekum/domain-types';
import { useMyCompany } from './queries';

/**
 * When profile has not loaded yet: buy/sell on; trading on for Slice B WIP
 * (matches API unset→on). After ship flip, default trading to false here too.
 */
export function resolveTradePresence(company: OwnCompanyProfile | undefined | null): TradePresence {
  if (!company?.tradePresence) {
    return { buying: true, selling: true, trading: true };
  }
  return {
    buying: company.tradePresence.buying,
    selling: company.tradePresence.selling,
    trading: company.tradePresence.trading !== false,
  };
}

export function useTradePresence(): TradePresence & {
  canPublish: boolean;
  isLoading: boolean;
} {
  const company = useMyCompany();
  const presence = resolveTradePresence(company.data);
  return {
    ...presence,
    canPublish: Boolean(company.data?.capabilities.publish),
    isLoading: company.isLoading,
  };
}
