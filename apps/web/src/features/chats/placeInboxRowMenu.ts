/**
 * Place a message/inbox action menu below the anchor (chevron or row),
 * or above when it would clip the viewport.
 */
export function placeInboxRowMenu(
  row: { top: number; bottom: number; right: number },
  viewport: { width: number; height: number },
  menu: { width: number; height: number } = { width: 200, height: 248 },
): { top: number; left: number } {
  const gap = 6;
  const pad = 8;
  let left = Math.min(row.right - menu.width, viewport.width - menu.width - pad);
  left = Math.max(pad, left);
  let top = row.bottom + gap;
  if (top + menu.height > viewport.height - pad) {
    top = row.top - menu.height - gap;
  }
  if (top < pad) top = pad;
  return { top, left };
}
