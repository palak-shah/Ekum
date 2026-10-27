/** Gutter from the viewport edge for portaled filter menus. */
export const FILTER_MENU_GUTTER_PX = 8;
/** Gap below the filter square. */
export const FILTER_MENU_GAP_PX = 6;

const NARROW_REM = 18.5;
const WIDE_REM = 22;

export type FilterMenuBounds = { left: number; right: number };

/** Matches `w-[min(18.5rem|22rem,calc(100vw-2rem))]` when the panel is not measured yet. */
export function filterMenuWidthFallback(viewportWidth: number, wide = false): number {
  const rem = 16;
  return Math.min((wide ? WIDE_REM : NARROW_REM) * rem, viewportWidth - 2 * rem);
}

/**
 * Phone column (`max-w-md` shell) when present — not the laptop window.
 * Portaled menus use `position: fixed` against the window; without this they
 * hang off the left of the column (Explore **N selected** shoves the square).
 */
export function readFilterMenuFrameBounds(
  viewportWidth: number,
  frame?: Pick<DOMRect, 'left' | 'right' | 'width'> | null,
): FilterMenuBounds {
  if (!frame || frame.width < 1) return { left: 0, right: viewportWidth };
  return { left: frame.left, right: frame.right };
}

/**
 * Right-align to the filter square, but never let the panel cross the frame
 * (or window) edge. Explore **N selected** shoves the square left — without
 * this clamp the menu paints off the phone column.
 */
export function placeFilterMenu(
  anchor: { bottom: number; right: number },
  menuWidth: number,
  viewportWidth: number,
  gutter = FILTER_MENU_GUTTER_PX,
  gap = FILTER_MENU_GAP_PX,
  bounds?: FilterMenuBounds,
): { top: number; right: number } {
  const minLeft = (bounds?.left ?? 0) + gutter;
  const maxRightEdge = (bounds?.right ?? viewportWidth) - gutter;
  const preferredLeft = anchor.right - menuWidth;
  const maxLeft = Math.max(minLeft, maxRightEdge - menuWidth);
  const left = Math.min(Math.max(minLeft, preferredLeft), maxLeft);
  return {
    top: anchor.bottom + gap,
    right: viewportWidth - left - menuWidth,
  };
}

export function readFilterMenuPosition(
  anchor: HTMLElement,
  panel: HTMLElement | null,
  viewportWidth: number,
  wide = false,
): { top: number; right: number } {
  const frame =
    typeof document === 'undefined'
      ? null
      : document.querySelector('[data-testid="app-shell-frame"]')?.getBoundingClientRect();
  const bounds = readFilterMenuFrameBounds(viewportWidth, frame);
  const column = bounds.right - bounds.left;
  const menuWidth =
    panel?.offsetWidth || filterMenuWidthFallback(column > 0 ? column : viewportWidth, wide);
  return placeFilterMenu(
    anchor.getBoundingClientRect(),
    menuWidth,
    viewportWidth,
    FILTER_MENU_GUTTER_PX,
    FILTER_MENU_GAP_PX,
    bounds,
  );
}

/** Resize + panel size — first paint can undersize before fonts/layout settle. */
export function watchFilterMenuPlace(place: () => void, panel: HTMLElement | null): () => void {
  window.addEventListener('resize', place);
  const ro = panel ? new ResizeObserver(place) : null;
  if (panel) ro.observe(panel);
  return () => {
    window.removeEventListener('resize', place);
    ro?.disconnect();
  };
}
