/** Visitor album ⋯ — Repost (when allowed) · Message · Share · Bookmark; Bookmark only when trade dock is up. */
export function visitorCollectionMoreIds(input: {
  tradeDockUp: boolean;
  /** Trading + pack curatable (allowForward / eligible). */
  canRepost?: boolean;
}): Array<'repost' | 'message' | 'share' | 'bookmark'> {
  if (input.tradeDockUp) return ['bookmark'];
  const ids: Array<'repost' | 'message' | 'share' | 'bookmark'> = [];
  if (input.canRepost) ids.push('repost');
  ids.push('message', 'share', 'bookmark');
  return ids;
}
