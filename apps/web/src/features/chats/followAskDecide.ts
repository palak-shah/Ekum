/** Grants on a See new packs ask. Add rows here — do not add more primary CTAs. */
export const FOLLOW_ASK_GRANT_OPTIONS = [
  {
    id: 'see',
    label: 'They can see my collections',
    shortLabel: 'See',
    defaultOn: true,
  },
  {
    id: 'share',
    label: 'They can share my collections',
    shortLabel: 'Share',
    defaultOn: false,
  },
] as const;

export type FollowAskGrantId = (typeof FOLLOW_ASK_GRANT_OPTIONS)[number]['id'];

export type FollowAskGrants = Record<FollowAskGrantId, boolean>;

export function defaultFollowAskGrants(): FollowAskGrants {
  return Object.fromEntries(
    FOLLOW_ASK_GRANT_OPTIONS.map((option) => [option.id, option.defaultOn]),
  ) as FollowAskGrants;
}

/** Checked grants → decide. Share (pack) wins over see (look). None → Allow stays off. */
export function followAskAllowDecision(
  grants: Record<string, boolean>,
): 'look' | 'pack' | null {
  if (grants.share) return 'pack';
  if (grants.see) return 'look';
  return null;
}
