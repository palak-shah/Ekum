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
