export function seePacksShopLabel(input: {
  pending: boolean;
  allowed: boolean;
}): string {
  if (input.allowed) return 'Has access';
  if (input.pending) return 'Requested';
  return 'Request catalog access';
}

/** Message = first write. Chat = already connected. */
export function shopWriteLabel(connected: boolean): string {
  return connected ? 'Chat' : 'Message';
}

export const SEE_PACKS_ASK_LINE = 'Wants to see your new collections';
export const SEE_PACKS_THEY_CAN_SEE = 'They can see';
export const SEE_PACKS_THEY_CAN_PACK = 'They can share';
