export function seePacksShopLabel(input: {
  pending: boolean;
  allowed: boolean;
}): string {
  if (input.allowed) return 'Following';
  if (input.pending) return 'Requested';
  return 'Follow';
}

/** Message = first write. Chat = already connected. */
export function shopWriteLabel(connected: boolean): string {
  return connected ? 'Chat' : 'Message';
}

export const SEE_PACKS_ASK_LINE = 'Wants to follow you and see your collections.';
export const UNBLOCK_ACCESS_CLEARED_TOAST =
  'Collection access was cleared on both sides. Ask again to see theirs; they must ask to see yours.';
/** Own edge cleared but the other side still blocks — Connection not restored yet. */
export const YOUR_BLOCK_REMOVED_TOAST = 'Your block removed.';
export const SHARE_PACKS_ASK_LINE = 'Wants to repost all your collections';
export const SHARE_PACKS_ASK_SUBLINE =
  'They can put your collections in their catalog and send them to their buyers.';
export const REQUEST_SHARE_LABEL = 'Ask to repost';
/** Gated / forwarded pack view permission (collection-view-requests) — not Follow, not Connect. */
export const REQUEST_TO_ACCESS_LABEL = 'Request to access';
export const FOLLOW_ON_THEIR_SHOP_LABEL = 'Follow on their shop';
export const SEE_PACKS_THEY_CAN_SEE = 'They can see';
export const SEE_PACKS_THEY_CAN_PACK = 'They can repost';
