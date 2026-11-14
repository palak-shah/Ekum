/** Which rows show on shop header ⋯ (everyday first, destructive last). */

export type ShopOverflowFlags = {
  isOwn: boolean;
  hasDirectThread: boolean;
  followPending: boolean;
  following: boolean;
  /** Blocker-only: connection is Blocked and we may Unblock. */
  canUnblock?: boolean;
};

export type ShopOverflowItem = 'share' | 'mute' | 'block' | 'unblock' | 'remove';

export function shopOverflowItems(flags: ShopOverflowFlags): ShopOverflowItem[] {
  if (flags.isOwn) return ['share'];
  const items: ShopOverflowItem[] = ['share'];
  if (flags.hasDirectThread) items.push('mute');
  if (flags.canUnblock) {
    items.push('unblock');
  } else {
    items.push('block');
  }
  if (flags.followPending || flags.following) items.push('remove');
  return items;
}

export function findDirectThreadForCompany<T extends { type: string; counterpart: { id: string } | null }>(
  threads: T[] | undefined,
  companyId: string,
): T | undefined {
  return threads?.find(
    (thread) => thread.type === 'direct' && thread.counterpart?.id === companyId,
  );
}
