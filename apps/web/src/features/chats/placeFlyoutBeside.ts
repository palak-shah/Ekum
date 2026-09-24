/** Sit a small pick next to a floating menu. Prefer the open side; else below. */
export function placeFlyoutBeside(
  host: { top: number; left: number; right: number; bottom: number },
  viewport: { width: number; height: number },
  flyout: { width: number; height: number } = { width: 140, height: 132 },
): { top: number; left: number } {
  const gap = 6;
  const pad = 8;
  const leftSide = host.left - flyout.width - gap;
  const rightSide = host.right + gap;
  const leftFits = leftSide >= pad;
  const rightFits = rightSide + flyout.width <= viewport.width - pad;

  let left: number;
  let top = host.top;
  if (leftFits) {
    left = leftSide;
  } else if (rightFits) {
    left = rightSide;
  } else {
    left = Math.max(pad, Math.min(host.left, viewport.width - flyout.width - pad));
    top = host.bottom + gap;
    if (top + flyout.height > viewport.height - pad) {
      top = Math.max(pad, host.top - flyout.height - gap);
    }
  }

  if (top + flyout.height > viewport.height - pad) {
    top = Math.max(pad, viewport.height - flyout.height - pad);
  }
  if (top < pad) top = pad;
  return { top, left };
}
