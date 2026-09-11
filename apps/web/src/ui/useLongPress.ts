import { useRef, type MouseEvent } from 'react';

/** Avoid iOS Safari link-preview / callout on long-press select surfaces. */
export const LONG_PRESS_SURFACE_CLASS = 'ekum-long-press-surface';

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
      onLongPress();
    },
    onClickCapture: (event: MouseEvent) => {
      if (!fired.current) return;
      fired.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
  };
}
