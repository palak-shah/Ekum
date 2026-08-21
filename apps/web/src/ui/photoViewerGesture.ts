export const ZOOM_NEAR_1 = 1.05;
export const SWIPE_PX = 50;
export const DOUBLE_TAP_SCALE = 2.5;

export type DragIntent = 'pan' | 'swipe-next' | 'swipe-prev' | 'swipe-down' | 'none';

export function isNearFit(scale: number): boolean {
  return scale <= ZOOM_NEAR_1;
}

export function classifyDrag(input: {
  scale: number;
  dx: number;
  dy: number;
  urlCount: number;
}): DragIntent {
  const { scale, dx, dy, urlCount } = input;
  if (!isNearFit(scale)) return 'pan';
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ax < SWIPE_PX && ay < SWIPE_PX) return 'none';
  if (ay >= ax && dy > 0) return 'swipe-down';
  if (urlCount < 2) return 'none';
  if (ax >= ay) return dx < 0 ? 'swipe-next' : 'swipe-prev';
  return 'none';
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
