/** Gutter from the viewport edge for portaled filter menus. */
export const FILTER_MENU_GUTTER_PX = 8;
/** Gap below the filter square. */
export const FILTER_MENU_GAP_PX = 6;

const NARROW_REM = 18.5;
const WIDE_REM = 22;

/** Matches `w-[min(18.5rem|22rem,calc(100vw-2rem))]` when the panel is not measured yet. */
export function filterMenuWidthFallback(viewportWidth: number, wide = false): number {
  const rem = 16;
  return Math.min((wide ? WIDE_REM : NARROW_REM) * rem, viewportWidth - 2 * rem);
}

/**
 * Right-align to the filter square, but never let the panel cross the left
 * (or right) viewport edge. Explore **N selected** shoves the square left —
 * without this clamp the menu paints off-screen.
 */
export function placeFilterMenu(
  anchor: { bottom: number; right: number },
  menuWidth: number,
  viewportWidth: number,
  gutter = FILTER_MENU_GUTTER_PX,
  gap = FILTER_MENU_GAP_PX,
): { top: number; right: number } {
  const preferredRight = viewportWidth - anchor.right;
  const maxRight = Math.max(gutter, viewportWidth - menuWidth - gutter);
  return {
    top: anchor.bottom + gap,
    right: Math.min(Math.max(gutter, preferredRight), maxRight),
  };
}

export function readFilterMenuPosition(
  anchor: HTMLElement,
  panel: HTMLElement | null,
  viewportWidth: number,
  wide = false,
): { top: number; right: number } {
  const menuWidth = panel?.offsetWidth || filterMenuWidthFallback(viewportWidth, wide);
  return placeFilterMenu(anchor.getBoundingClientRect(), menuWidth, viewportWidth);
}
