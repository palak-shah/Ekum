/** WhatsApp-like: swipe left past this px to reveal More / Archive. */
export const INBOX_SWIPE_OPEN_PX = 72;
export const INBOX_SWIPE_MAX_PX = 148;

export function inboxSwipeReveal(deltaX: number): number {
  if (deltaX >= 0) return 0;
  return Math.min(INBOX_SWIPE_MAX_PX, -deltaX);
}

export function inboxSwipeShouldOpen(deltaX: number): boolean {
  return inboxSwipeReveal(deltaX) >= INBOX_SWIPE_OPEN_PX;
}

/** Lock to horizontal swipe once the finger has a clear direction. */
export function inboxSwipeAxis(
  dx: number,
  dy: number,
  slop = 10,
): 'x' | 'y' | null {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < slop) return null;
  return Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
}

export function inboxSwipeSettle(deltaX: number): number {
  return inboxSwipeShouldOpen(deltaX) ? -INBOX_SWIPE_MAX_PX : 0;
}
