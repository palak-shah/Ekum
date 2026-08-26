import type { ThreadSummary } from '@ekum/domain-types';

/** Pinned first (inbox order), then most recently messaged. */
export function rankShareChats(rows: ThreadSummary[]): ThreadSummary[] {
  return [...rows].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    const tb = Date.parse(b.lastMessageAt) || 0;
    const ta = Date.parse(a.lastMessageAt) || 0;
    return tb - ta;
  });
}
