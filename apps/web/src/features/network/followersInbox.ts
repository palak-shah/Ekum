import { SEE_PACKS_THEY_CAN_PACK, SEE_PACKS_THEY_CAN_SEE } from '@/features/company/seePacksCopy';

export type FollowersInboxTab = 'asked' | 'following';

export function followersInboxTabFromSearch(search: string): FollowersInboxTab {
  return new URLSearchParams(search).get('tab') === 'asked' ? 'asked' : 'following';
}

export function sortAsksNewestFirst<T extends { createdAt: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}

export function followAccessLabel(kind: string): string {
  return kind === 'pack' ? SEE_PACKS_THEY_CAN_PACK : SEE_PACKS_THEY_CAN_SEE;
}

export function filterTheySeeMine<T extends { company: { name: string; city: string } }>(
  rows: T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => {
    const name = row.company.name.toLowerCase();
    const city = row.company.city.toLowerCase();
    return name.includes(q) || city.includes(q);
  });
}
