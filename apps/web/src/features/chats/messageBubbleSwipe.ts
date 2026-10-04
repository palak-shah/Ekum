import { inboxSwipeAxis } from './inboxRowSwipe';

/** WhatsApp-like: swipe bubble right past this px to Reply. */
export const MESSAGE_REPLY_SWIPE_PX = 56;
export const MESSAGE_REPLY_SWIPE_MAX_PX = 72;

export { inboxSwipeAxis as messageReplySwipeAxis };

/** Finger moved right → reveal reply cue (same for mine / theirs). */
export function messageReplySwipeReveal(deltaX: number): number {
  if (deltaX <= 0) return 0;
  return Math.min(MESSAGE_REPLY_SWIPE_MAX_PX, deltaX);
}

export function messageReplyShouldTrigger(deltaX: number): boolean {
  return messageReplySwipeReveal(deltaX) >= MESSAGE_REPLY_SWIPE_PX;
}
