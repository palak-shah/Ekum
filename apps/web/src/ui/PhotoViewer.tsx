import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  classifyDrag,
  doubleTapScale,
  isNearFit,
  nextIndex,
} from './photoViewerGesture';

const PINCH_MAX = 4;
const DOUBLE_TAP_MS = 280;

function clamp(index: number, length: number): number {
  if (length < 1) return 0;
  return Math.min(length - 1, Math.max(0, index));
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function PhotoViewer({
  open,
  urls,
  index,
  onIndex,
  onClose,
}: {
  open: boolean;
  urls: string[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const safeIndex = clamp(index, urls.length);
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const start = useRef({ x: 0, y: 0, panX: 0, panY: 0, scale: 1, pinch: 0 });
  const lastTap = useRef(0);
  const pinched = useRef(false);

  useEffect(() => {
    setScale(1);
    setPanX(0);
    setPanY(0);
  }, [open, safeIndex]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (!isNearFit(scale) || urls.length < 2) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        onIndex(nextIndex(safeIndex, urls.length, 'swipe-next'));
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onIndex(nextIndex(safeIndex, urls.length, 'swipe-prev'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, onIndex, safeIndex, scale, urls.length]);

  if (!open || urls.length === 0 || typeof document === 'undefined') return null;

  const src = urls[safeIndex];

  const onPointerDown = (event: React.PointerEvent) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 1) {
      start.current = {
        x: event.clientX,
        y: event.clientY,
        panX,
        panY,
        scale,
        pinch: 0,
      };
      pinched.current = false;
    } else if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      start.current.pinch = distance(pts[0], pts[1]);
      start.current.scale = scale;
      pinched.current = true;
    }
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      const now = distance(pts[0], pts[1]);
      if (start.current.pinch > 0) {
        const next = Math.min(PINCH_MAX, Math.max(1, start.current.scale * (now / start.current.pinch)));
        setScale(next);
      }
      return;
    }
    if (pointers.current.size === 1 && !isNearFit(scale)) {
      setPanX(start.current.panX + event.clientX - start.current.x);
      setPanY(start.current.panY + event.clientY - start.current.y);
    }
  };

  const onPointerUp = (event: React.PointerEvent) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size > 0) return;
    if (pinched.current) {
      pinched.current = false;
      return;
    }
    const dx = event.clientX - start.current.x;
    const dy = event.clientY - start.current.y;
    const now = Date.now();
    const isTap = Math.abs(dx) < 8 && Math.abs(dy) < 8;
    if (isTap && now - lastTap.current < DOUBLE_TAP_MS) {
      lastTap.current = 0;
      const next = doubleTapScale(scale);
      setScale(next);
      if (next === 1) {
        setPanX(0);
        setPanY(0);
      }
      return;
    }
    if (isTap) {
      lastTap.current = now;
      return;
    }
    const intent = classifyDrag({ scale, dx, dy, urlCount: urls.length });
    if (intent === 'swipe-down') onClose();
    if (intent === 'swipe-next' || intent === 'swipe-prev') {
      onIndex(nextIndex(safeIndex, urls.length, intent));
    }
  };

  return createPortal(
    <div
      data-testid="photo-viewer"
      className="fixed inset-0 z-[85] flex flex-col bg-ink/92"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
    >
      <div className="flex items-center justify-between px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] text-white">
        <button
          type="button"
          data-testid="photo-viewer-close"
          className="rounded-full px-3 py-1.5 text-sm font-medium hover:bg-white/10"
          onClick={onClose}
        >
          Close
        </button>
        {urls.length > 1 ? (
          <p data-testid="photo-viewer-counter" className="text-sm text-white/80">
            {safeIndex + 1} / {urls.length}
          </p>
        ) : (
          <span className="w-16" />
        )}
        <span className="w-16" />
      </div>
      <div
        className="relative flex min-h-0 flex-1 touch-none items-center justify-center px-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {src ? (
          <img
            src={src}
            alt=""
            draggable={false}
            className="max-h-full max-w-full object-contain"
            style={{ transform: `translate(${panX}px, ${panY}px) scale(${scale})` }}
          />
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
