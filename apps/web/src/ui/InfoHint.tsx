import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { InfoIcon } from '@/ui/icons';

/**
 * Circle i for instructional copy. Idle screens stay on the job; tap shows
 * the note. Change this file (and `InfoIcon`) — every sheet/field follows.
 */
export function InfoHint({
  children,
  label = 'More about this',
  testId,
}: {
  children: ReactNode;
  /** Accessible name — “About {title}”. */
  label?: string;
  testId?: string;
}) {
  const panelId = useId();
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    const sync = () => {
      const el = btnRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const width = Math.min(288, window.innerWidth - 16);
      let left = r.left;
      if (left + width > window.innerWidth - 8) left = window.innerWidth - 8 - width;
      if (left < 8) left = 8;
      setPos({ top: r.bottom + 6, left, width });
    };
    sync();
    window.addEventListener('resize', sync);
    document.addEventListener('scroll', sync, true);
    return () => {
      window.removeEventListener('resize', sync);
      document.removeEventListener('scroll', sync, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: PointerEvent) => {
      const target = event.target as Node;
      if (btnRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        data-testid={testId}
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-muted hover:bg-foam"
      >
        <InfoIcon width={16} height={16} aria-hidden />
      </button>
      {open && pos && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={panelRef}
              id={panelId}
              role="note"
              data-testid={testId ? `${testId}-body` : undefined}
              className="fixed z-[85] rounded-xl border border-line bg-surface px-3 py-2.5 text-xs font-body leading-snug text-muted shadow-[var(--shadow-soft)]"
              style={{ top: pos.top, left: pos.left, width: pos.width }}
            >
              {children}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
