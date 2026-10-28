/** Select-mode swipe: right = on, left = off. Idle rows keep their own swipe. */

export const SELECT_SWIPE_PX = 56;
export const SELECT_SWIPE_NUDGE_MAX_PX = 36;

/** Lock to horizontal swipe once the finger has a clear direction. */
export function selectSwipeAxis(
  dx: number,
  dy: number,
  slop = 10,
): 'x' | 'y' | null {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < slop) return null;
  return Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
}

export function selectSwipeIntent(
  dx: number,
  selected: boolean,
): 'select' | 'deselect' | null {
  if (dx >= SELECT_SWIPE_PX && !selected) return 'select';
  if (dx <= -SELECT_SWIPE_PX && selected) return 'deselect';
  return null;
}

/** Follow the finger a little, then snap back. */
export function selectSwipeNudge(dx: number): number {
  return Math.max(-SELECT_SWIPE_NUDGE_MAX_PX, Math.min(SELECT_SWIPE_NUDGE_MAX_PX, dx));
}
