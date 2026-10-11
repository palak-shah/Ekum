/** Visitor album ⋯ — Bookmark always; Message · Share only when the trade dock is not up. */
export function visitorCollectionMoreIds(input: {
  tradeDockUp: boolean;
}): Array<'message' | 'share' | 'bookmark'> {
  if (input.tradeDockUp) return ['bookmark'];
  return ['message', 'share', 'bookmark'];
}
