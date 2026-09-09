/**
 * Buyer may see this mill on the main order when:
 * - ticket = mill (transparent desk), or
 * - reveal On (group chat ⇒ mill named on order too).
 */
export function millLaneVisibleToBuyer(input: {
  ticket?: string | null;
  reveal?: boolean | null;
}): boolean {
  if (input.reveal === true) return true;
  return input.ticket === 'mill';
}
