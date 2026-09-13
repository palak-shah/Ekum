export const ZOOM_NEAR_1 = 1.05;
export const SWIPE_PX = 50;
export const DOUBLE_TAP_SCALE = 2.5;

export type DragIntent = 'pan' | 'swipe-next' | 'swipe-prev' | 'swipe-down' | 'none';

export function isNearFit(scale: number): boolean {
  return scale <= ZOOM_NEAR_1;
}

/**
 * Near fit: WhatsApp-style vertical album nav (up = next, down = prev).
 * Down on the first photo dismisses. Single photo: down dismisses.
 * Zoomed: always pan.
 */
export function classifyDrag(input: {
  scale: number;
  dx: number;
  dy: number;
  urlCount: number;
  /** Current album index — used so down on first photo closes. */
  index?: number;
}): DragIntent {
  const { scale, dx, dy, urlCount } = input;
  const index = input.index ?? 0;
  if (!isNearFit(scale)) return 'pan';
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ax < SWIPE_PX && ay < SWIPE_PX) return 'none';

  if (urlCount < 2) {
    if (ay >= ax && dy > 0) return 'swipe-down';
    return 'none';
  }

  // Vertical wins → album navigation (or dismiss at start).
  if (ay >= ax) {
    if (dy < 0) return 'swipe-next';
    if (dy > 0) return index <= 0 ? 'swipe-down' : 'swipe-prev';
    return 'none';
  }

  // Horizontal still works as a secondary path.
  return dx < 0 ? 'swipe-next' : 'swipe-prev';
}

export function nextIndex(
  index: number,
  urlCount: number,
  intent: 'swipe-next' | 'swipe-prev',
): number {
  if (urlCount < 1) return 0;
  if (intent === 'swipe-next') return Math.min(urlCount - 1, index + 1);
  return Math.max(0, index - 1);
}

export function doubleTapScale(currentScale: number): number {
  return isNearFit(currentScale) ? DOUBLE_TAP_SCALE : 1;
}
