import type { ExploreTradeSide } from '@ekum/domain-types';

export const EXPLORE_TRADE_SIDES: Array<{ id: ExploreTradeSide; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'buying', label: 'Buying' },
  { id: 'selling', label: 'Selling' },
];

export function parseTradeSide(value: string | null): ExploreTradeSide {
  if (value === 'buying' || value === 'selling') return value;
  return 'all';
}

/** Product UI only uses buying | selling. Dual defaults to buying; `all` remaps. */
export function resolveExploreTradeSide(
  urlSide: string | null,
  presence: { buying: boolean; selling: boolean },
): 'buying' | 'selling' {
  const parsed = parseTradeSide(urlSide);
  if (presence.buying && presence.selling) {
    return parsed === 'selling' ? 'selling' : 'buying';
  }
  if (presence.selling && !presence.buying) return 'selling';
  return 'buying';
}

export function isDualTradePresence(presence: { buying: boolean; selling: boolean }): boolean {
  return presence.buying && presence.selling;
}

export function receivedDayLabel(day: string, now = new Date()): string {
  const today = now.toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (day === today) return 'Today';
  if (day === yesterday) return 'Yesterday';
  const [year, month, date] = day.split('-').map(Number);
  if (!year || !month || !date) return day;
  return new Date(Date.UTC(year, month - 1, date)).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
}
