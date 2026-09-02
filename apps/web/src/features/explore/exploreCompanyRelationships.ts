import type { ConnectionView, PublicCompanySummary } from '@ekum/domain-types';

/** Pure helpers for Explore feed Follow visibility. */
export function buildFollowingSet(following: PublicCompanySummary[] | undefined): Set<string> {
  return new Set((following ?? []).map((row) => row.id));
}

export function buildConnectedSet(connections: ConnectionView[] | undefined): Set<string> {
  const ids = new Set<string>();
  for (const row of connections ?? []) {
    if (row.status === 'active') ids.add(row.company.id);
  }
  return ids;
}

export function shouldShowExploreFollow(
  companyId: string,
  ownCompanyId: string | undefined,
  followingIds: Set<string>,
  connectedIds: Set<string>,
): boolean {
  if (!companyId || companyId === ownCompanyId) return false;
  if (connectedIds.has(companyId)) return false;
  if (followingIds.has(companyId)) return false;
  return true;
}
