/** Sorted unique ids joined — group uniqueness key piece. */
export function membershipKey(ids: string[]): string {
  return [...new Set(ids.filter(Boolean))].sort().join(',');
}

/** People who still define “this group” for our shop (not owner-removed). */
export function countedMemberIds(
  members: { userId: string; state: string }[],
): string[] {
  return members.filter((m) => m.state !== 'removed').map((m) => m.userId);
}

export function sameGroupFingerprint(
  aCompanies: string[],
  aPeople: string[],
  bCompanies: string[],
  bPeople: string[],
): boolean {
  return membershipKey(aCompanies) === membershipKey(bCompanies)
    && membershipKey(aPeople) === membershipKey(bPeople);
}
