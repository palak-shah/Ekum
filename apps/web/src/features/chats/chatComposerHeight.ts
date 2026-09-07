/** Single-line floor / multi-line cap for chat composer (WhatsApp-like grow). */
export const CHAT_COMPOSER_MIN_PX = 36;
export const CHAT_COMPOSER_MAX_PX = 120;

/** Clamp measured scrollHeight into the composer grow range. */
export function chatComposerHeightPx(scrollHeight: number): number {
  if (!Number.isFinite(scrollHeight) || scrollHeight <= 0) return CHAT_COMPOSER_MIN_PX;
  return Math.min(Math.max(Math.ceil(scrollHeight), CHAT_COMPOSER_MIN_PX), CHAT_COMPOSER_MAX_PX);
}
