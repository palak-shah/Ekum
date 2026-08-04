import type { OwnCompanyProfile, TradePresence } from '@ekum/domain-types';
import { useMyCompany } from './queries';

/** Defaults both true when the profile has not loaded tradePresence yet. */
export function resolveTradePresence(company: OwnCompanyProfile | undefined | null): TradePresence {
  if (!company?.tradePresence) {
    return { buying: true, selling: true };
  }
  return company.tradePresence;
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
