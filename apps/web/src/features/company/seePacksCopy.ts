export function seePacksShopLabel(input: {
  pending: boolean;
  allowed: boolean;
}): string {
  if (input.allowed) return 'Seeing packs';
  if (input.pending) return 'Asked to see packs';
  return 'See new packs';
}

/** Message = first write. Chat = already connected. */
export function shopWriteLabel(connected: boolean): string {
  return connected ? 'Chat' : 'Message';
}

export const SEE_PACKS_HINT =
  'See new packs = they let you see new posts. Asked to see packs = we asked; tap to cancel. Message = first chat. Chat = you already talk.';

export const SEE_PACKS_ASK_LINE = 'Wants to see your new packs';
export const SEE_PACKS_THEY_CAN_SEE = 'They can see';
export const SEE_PACKS_THEY_CAN_PACK = 'They can share';
