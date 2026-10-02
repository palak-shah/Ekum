/** One-line floor / grow cap for How many each line notes. */
export const HOW_MANY_NOTE_MIN_PX = 40;
export const HOW_MANY_NOTE_MAX_PX = 120;

export function howManyNoteHeightPx(scrollHeight: number): number {
  if (!Number.isFinite(scrollHeight) || scrollHeight <= 0) return HOW_MANY_NOTE_MIN_PX;
  return Math.min(Math.max(Math.ceil(scrollHeight), HOW_MANY_NOTE_MIN_PX), HOW_MANY_NOTE_MAX_PX);
}
