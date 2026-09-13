import { useRef, type MouseEvent } from 'react';

/** Avoid iOS Safari link-preview / callout on long-press select surfaces. */
export const LONG_PRESS_SURFACE_CLASS = 'ekum-long-press-surface';

/** After a long-press fires, ignore activate clicks briefly (survives remount). */
const SUPPRESS_MS = 400;
let suppressClicksUntil = 0;

function markLongPressFired() {
  suppressClicksUntil = Date.now() + SUPPRESS_MS;
}

/** True while a post-long-press ghost click should not open/toggle. */
export function isLongPressActivateSuppressed() {
  return Date.now() < suppressClicksUntil;
}

/** WhatsApp-style long-press; swallows the click that usually follows so activate does not fire. */
export function useLongPress(onLongPress?: () => void, ms = 420) {
  const timer = useRef<number | null>(null);
  const fired = useRef(false);
  const clear = () => {
    if (timer.current != null) {
      window.clearTimeout(timer.current);
    }
    timer.current = null;
  };
  return {
    onPointerDown: () => {
      if (!onLongPress) return;
      fired.current = false;
      clear();
      timer.current = window.setTimeout(() => {
        timer.current = null;
        fired.current = true;
        markLongPressFired();
        onLongPress();
      }, ms);
    },
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    onContextMenu: (event: MouseEvent) => {
      if (!onLongPress) return;
      event.preventDefault();
      fired.current = true;
      markLongPressFired();
      onLongPress();
    },
    onClickCapture: (event: MouseEvent) => {
      if (!fired.current && !isLongPressActivateSuppressed()) return;
      fired.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
  };
}
