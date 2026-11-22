import { howManySectionHeading } from '@/features/orders/howManySectionHeading';

/** How many loose lines stamped from an expanded pack + shop. */
export type HowManyCollectionStamp = {
  id: string;
  companyId?: string | null;
  companyName?: string | null;
  sourceCollectionId?: string | null;
  sourceCollectionName?: string | null;
};

export type HowManyCollectionGroup<T extends HowManyCollectionStamp> = {
  kind: 'section' | 'loose';
  /** Stable key for React + tests (shop|pack or loose). */
  key: string;
  /** Subtle separator copy — shop · pack when both exist. */
  heading: string;
  shopId: string | null;
  collectionId: string | null;
  items: T[];
};

/**
 * Group How many lines by permitted shop + pack (first-seen order).
 * Same shop on two packs → two sections (shop name repeated).
 * Designs without a pack stamp group by shop only (loose-per-shop), then a
 * trailing no-shop bucket if needed.
 */
export function groupHowManyByCollection<T extends HowManyCollectionStamp>(
  items: T[],
): HowManyCollectionGroup<T>[] {
  const groups: HowManyCollectionGroup<T>[] = [];
  const byKey = new Map<string, HowManyCollectionGroup<T>>();
  const shopIds = new Set(
    items.map((item) => item.companyId?.trim()).filter((id): id is string => Boolean(id)),
  );
  /** One shop → collection name alone (Order goes to already names the shop). */
  const includeShopInHeading = shopIds.size > 1;

  for (const item of items) {
    const shopId = item.companyId?.trim() || null;
    const collectionId = item.sourceCollectionId?.trim() || null;
    const key = `${shopId ?? 'unknown'}|${collectionId ?? 'loose'}`;
    let group = byKey.get(key);
    if (!group) {
      const packName = collectionId
        ? item.sourceCollectionName?.trim() || 'Collection'
        : null;
      const heading = howManySectionHeading({
        shopName: includeShopInHeading || !packName ? item.companyName : null,
        packName,
      });
      group = {
        kind: collectionId ? 'section' : 'loose',
        key,
        heading,
        shopId,
        collectionId,
        items: [],
      };
      byKey.set(key, group);
      groups.push(group);
    }
    group.items.push(item);
  }

  return groups;
}

/** @deprecated alias — prefer groupHowManyByCollection (now shop+pack). */
export const groupHowManyByShopAndPack = groupHowManyByCollection;
