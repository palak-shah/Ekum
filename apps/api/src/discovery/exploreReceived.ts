import { PublishAudience } from '@ekum/domain-types';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOME_CURATED_DAYS = 7;
const HOME_CURATED_CAP = 5;

/** Connections / followers / selected — not Everyone market. */
export function isDirectedAudience(audience: string): boolean {
  return (
    audience === PublishAudience.Connections ||
    audience === PublishAudience.Followers ||
    audience === PublishAudience.Selected
  );
}

export function isCuratedCollection(
  ownerCompanyId: string,
  memberCompanyIds: readonly string[],
): boolean {
  return memberCompanyIds.some((id) => id !== ownerCompanyId);
}

export function utcDayKey(at: Date | string): string {
  const date = typeof at === 'string' ? new Date(at) : at;
  return date.toISOString().slice(0, 10);
}

export function isEligibleStoryPublisher(
  companyId: string,
  followedIds: ReadonlySet<string>,
  connectedIds: ReadonlySet<string>,
): boolean {
  return followedIds.has(companyId) || connectedIds.has(companyId);
}

export type ReceivedPackInput<T> = {
  postedAt: Date | string;
  companyId: string;
  curated: boolean;
  payload: T;
};

export function groupReceivedByDay<T>(
  items: ReceivedPackInput<T>[],
): Array<{ day: string; groups: Array<{ companyId: string; items: T[] }> }> {
  const sorted = [...items].sort(
    (a, b) => Date.parse(String(b.postedAt)) - Date.parse(String(a.postedAt)),
  );
  const byDay = new Map<string, ReceivedPackInput<T>[]>();
  for (const item of sorted) {
    const day = utcDayKey(item.postedAt);
    const list = byDay.get(day) ?? [];
    list.push(item);
    byDay.set(day, list);
  }
  return [...byDay.entries()].map(([day, dayItems]) => {
    const groups: Array<{ companyId: string; items: T[] }> = [];
    const index = new Map<string, number>();
    for (const item of dayItems) {
      const existing = index.get(item.companyId);
      if (existing == null) {
        index.set(item.companyId, groups.length);
        groups.push({ companyId: item.companyId, items: [item.payload] });
      } else {
        groups[existing]!.items.push(item.payload);
      }
    }
    return { day, groups };
  });
}

export function pickReceivedCurated<T>(
  items: ReceivedPackInput<T>[],
  now = Date.now(),
  windowMs = HOME_CURATED_DAYS * DAY_MS,
  cap = HOME_CURATED_CAP,
): T[] {
  const cutoff = now - windowMs;
  return items
    .filter((item) => item.curated && Date.parse(String(item.postedAt)) >= cutoff)
    .sort((a, b) => Date.parse(String(b.postedAt)) - Date.parse(String(a.postedAt)))
    .slice(0, cap)
    .map((item) => item.payload);
}
