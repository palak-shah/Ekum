import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  classifyDrag,
  doubleTapScale,
  isNearFit,
  nextIndex,
} from './photoViewerGesture';
import { BackIcon } from './icons';

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
  /** Optional caption per photo (e.g. design name). */
  captions,
  /** Optional second line (e.g. qty × rate · SKU on an order). */
  details,
  /** Optional header action (e.g. View in chat from cross-chat Photos find). */
  headerAction,
}: {
  open: boolean;
  urls: string[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
  captions?: Array<string | null | undefined>;
  details?: Array<string | null | undefined>;
  headerAction?: { label: string; onClick: () => void; testId?: string };
}) {
  const safeIndex = clamp(index, urls.length);
  const caption = captions?.[safeIndex]?.trim() || null;
  const detail = details?.[safeIndex]?.trim() || null;
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
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (!isNearFit(scale) || urls.length < 2) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
        event.preventDefault();
        onIndex(nextIndex(safeIndex, urls.length, 'swipe-next'));
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
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
      const a = pts[0];
      const b = pts[1];
      if (a && b) {
        start.current.pinch = distance(a, b);
        start.current.scale = scale;
        pinched.current = true;
      }
    }
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      const a = pts[0];
      const b = pts[1];
      if (a && b && start.current.pinch > 0) {
        const now = distance(a, b);
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
    const intent = classifyDrag({
      scale,
      dx,
      dy,
      urlCount: urls.length,
      index: safeIndex,
    });
    if (intent === 'swipe-down') onClose();
    if (intent === 'swipe-next' || intent === 'swipe-prev') {
      onIndex(nextIndex(safeIndex, urls.length, intent));
    }
  };

  return createPortal(
    <div
      data-testid="photo-viewer"
      className="fixed inset-0 z-[100] flex flex-col bg-ink"
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
        {headerAction ? (
          <button
            type="button"
            data-testid={headerAction.testId ?? 'photo-viewer-header-action'}
            className="rounded-full px-3 py-1.5 text-sm font-medium hover:bg-white/10"
            onClick={headerAction.onClick}
          >
            {headerAction.label}
          </button>
        ) : (
          <span className="w-16" />
        )}
      </div>
      <div
        className="relative flex min-h-0 flex-1 touch-none items-center justify-center px-2"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {src ? (
          <img
            src={src}
            alt={caption ?? ''}
            draggable={false}
            className="max-h-full max-w-full object-contain"
            style={{ transform: `translate(${panX}px, ${panY}px) scale(${scale})` }}
          />
        ) : null}
        {urls.length > 1 && isNearFit(scale) && safeIndex > 0 ? (
          <button
            type="button"
            data-testid="photo-viewer-prev"
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/60"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onIndex(nextIndex(safeIndex, urls.length, 'swipe-prev'));
            }}
          >
            <BackIcon width={22} height={22} aria-hidden />
          </button>
        ) : null}
        {urls.length > 1 && isNearFit(scale) && safeIndex < urls.length - 1 ? (
          <button
            type="button"
            data-testid="photo-viewer-next"
            aria-label="Next photo"
            className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/60"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onIndex(nextIndex(safeIndex, urls.length, 'swipe-next'));
            }}
          >
            <BackIcon width={22} height={22} className="rotate-180" aria-hidden />
          </button>
        ) : null}
      </div>
      {caption || detail ? (
        <div className="shrink-0 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2 text-center">
          {caption ? (
            <p
              data-testid="photo-viewer-caption"
              className="truncate text-sm font-semibold text-white"
            >
              {caption}
            </p>
          ) : null}
          {detail ? (
            <p
              data-testid="photo-viewer-detail"
              className="mt-0.5 truncate text-xs text-white/75"
            >
              {detail}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="pb-[max(1.5rem,env(safe-area-inset-bottom))]" />
      )}
    </div>,
    document.body,
  );
}
