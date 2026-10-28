import { useRef, useState, type PointerEvent, type MouseEvent } from 'react';
import {
  selectSwipeAxis,
  selectSwipeIntent,
  selectSwipeNudge,
} from './selectSwipe';

/**
 * PWA select-mode row swipe (Pointer Events). Vertical list scroll wins until
 * the finger commits to X — same axis lock as inbox More/Archive.
 */
export function useSelectSwipe({
  selected,
  onSelect,
  onDeselect,
  enabled = true,
  onHorizontalLock,
}: {
  selected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
  enabled?: boolean;
  /** Cancel long-press (⋯) once the finger commits to a swipe. */
  onHorizontalLock?: () => void;
}) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const dxRef = useRef(0);
  const axisRef = useRef<'x' | 'y' | null>(null);
  const didSwipeRef = useRef(false);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onDeselectRef = useRef(onDeselect);
  onDeselectRef.current = onDeselect;
  const onHorizontalLockRef = useRef(onHorizontalLock);
  onHorizontalLockRef.current = onHorizontalLock;
  const [nudge, setNudge] = useState(0);
  const [dragging, setDragging] = useState(false);

  const clearFinger = () => {
    startX.current = null;
    startY.current = null;
    axisRef.current = null;
    dxRef.current = 0;
    setNudge(0);
    setDragging(false);
  };

  return {
    nudge,
    dragging,
    bind: {
      onPointerDown: (event: PointerEvent<HTMLElement>) => {
        if (!enabled) return;
        startX.current = event.clientX;
        startY.current = event.clientY;
        axisRef.current = null;
        didSwipeRef.current = false;
        dxRef.current = 0;
      },
      onPointerMove: (event: PointerEvent<HTMLElement>) => {
        if (!enabled || startX.current == null || startY.current == null) return;
        const dx = event.clientX - startX.current;
        const dy = event.clientY - startY.current;
        if (axisRef.current == null) {
          axisRef.current = selectSwipeAxis(dx, dy);
          if (axisRef.current === 'x') {
            try {
              event.currentTarget.setPointerCapture(event.pointerId);
            } catch {
              /* capture is optional on desktop */
            }
            onHorizontalLockRef.current?.();
            setDragging(true);
          }
        }
        if (axisRef.current !== 'x') return;
        didSwipeRef.current = true;
        event.preventDefault();
        dxRef.current = dx;
        setNudge(selectSwipeNudge(dx));
      },
      onPointerUp: () => {
        if (!enabled) return;
        if (axisRef.current === 'x') {
          const intent = selectSwipeIntent(dxRef.current, selectedRef.current);
          if (intent === 'select') onSelectRef.current();
          if (intent === 'deselect') onDeselectRef.current();
        }
        clearFinger();
      },
      onPointerCancel: () => {
        clearFinger();
        didSwipeRef.current = false;
      },
      onClickCapture: (event: MouseEvent<HTMLElement>) => {
        if (!didSwipeRef.current) return;
        event.preventDefault();
        event.stopPropagation();
        didSwipeRef.current = false;
      },
    },
  };
}
