/** Grants on They see mine allowed cards (See + Repost). */
export const FOLLOW_ASK_GRANT_OPTIONS = [
  {
    id: 'see',
    label: 'They can see my collections',
    shortLabel: 'See',
    defaultOn: true,
  },
  {
    id: 'share',
    label: 'They can repost my collections',
    shortLabel: 'Repost',
    defaultOn: false,
  },
] as const;

/** Ask-row checkbox — Accept always implies see; this only adds pack. */
export const FOLLOW_ASK_REPOST_LABEL = 'Allow Repost';

export type FollowAskGrantId = (typeof FOLLOW_ASK_GRANT_OPTIONS)[number]['id'];

export type FollowAskGrants = Record<FollowAskGrantId, boolean>;

export function defaultFollowAskGrants(): FollowAskGrants {
  return Object.fromEntries(
    FOLLOW_ASK_GRANT_OPTIONS.map((option) => [option.id, option.defaultOn]),
  ) as FollowAskGrants;
}

export function followAskGrantsForKind(kind: 'see' | 'share'): FollowAskGrants {
  if (kind === 'share') return { see: true, share: true };
  return { see: true, share: false };
}

/** Accept → look, or pack when Allow Repost is on. Always a decision (Accept never disabled). */
export function followAskAllowDecision(
  grants: Record<string, boolean>,
): 'look' | 'pack' {
  if (grants.share) return 'pack';
  return 'look';
}
