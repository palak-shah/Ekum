/** Newest-first timeline display helpers (trail stays ascending in storage). */

export function newestFirstTrail<T>(events: T[]): T[] {
  if (events.length <= 1) return events;
  return [...events].reverse();
}

/** Amend / Updated rows get the warning dot. */
export function timelineUpdatedDot(type?: string | null, summary?: string | null): boolean {
  if (type === 'updated') return true;
  return Boolean(summary && /^Updated\b/i.test(summary));
}

/** Default collapsed: only the newest row; chevron expands the rest + details. */
export function timelineVisibleSlice<T>(
  newestFirst: T[],
  expanded: boolean,
): { visible: T[]; hiddenCount: number } {
  if (expanded || newestFirst.length <= 1) {
    return { visible: newestFirst, hiddenCount: 0 };
  }
  return {
    visible: newestFirst.slice(0, 1),
    hiddenCount: newestFirst.length - 1,
  };
}
