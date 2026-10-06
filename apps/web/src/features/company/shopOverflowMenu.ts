/** Which rows show on shop header ⋯ (everyday first, destructive last). */

export type ShopOverflowFlags = {
  isOwn: boolean;
  hasDirectThread: boolean;
  followPending: boolean;
  following: boolean;
};

export type ShopOverflowItem = 'share' | 'mute' | 'block' | 'remove';

export function shopOverflowItems(flags: ShopOverflowFlags): ShopOverflowItem[] {
  if (flags.isOwn) return ['share'];
  const items: ShopOverflowItem[] = ['share'];
  if (flags.hasDirectThread) items.push('mute');
  items.push('block');
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
