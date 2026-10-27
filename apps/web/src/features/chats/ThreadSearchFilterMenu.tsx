import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { CheckIcon } from '@/ui/icons';
import { cx } from '@/ui/kit';
import { readFilterMenuPosition, watchFilterMenuPlace } from '@/ui/filterMenuPosition';
import {
  THREAD_SEARCH_SCOPE_OPTIONS,
  type ThreadMessageViewScope,
} from './threadMessageSearch';

export function ThreadSearchFilterMenu({
  open,
  onClose,
  anchorRef,
  value,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  value: ThreadMessageViewScope;
  onChange: (scope: ThreadMessageViewScope) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  const close = () => onClose();

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      setPos(readFilterMenuPosition(anchor, panelRef.current, window.innerWidth));
    };
    place();
    return watchFilterMenuPlace(place, panelRef.current);
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [open, anchorRef]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Close filter menu"
        className="fixed inset-0 z-[60] cursor-default bg-ink/15"
        onClick={close}
      />
      <div
        ref={panelRef}
        role="menu"
        data-testid="thread-search-filter-menu"
        className="fixed z-[61] w-[min(18.5rem,calc(100vw-2rem))] overflow-hidden rounded-[14px] border border-line bg-surface shadow-[var(--shadow-soft)]"
        style={{ top: pos.top, right: pos.right, animation: 'ekum-rise 160ms ease-out' }}
      >
        <ul className="max-h-[min(70vh,28rem)] overflow-y-auto py-1">
          {THREAD_SEARCH_SCOPE_OPTIONS.map((option) => {
            const active = value === option.id;
            return (
              <li key={option.id}>
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  data-testid={`thread-search-filter-${option.id}`}
                  onClick={() => {
                    onChange(option.id);
                    close();
                  }}
                  className={cx(
                    'flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm tracking-tight hover:bg-foam/70',
                    active ? 'bg-accent/10 font-emphasis text-ink' : 'font-emphasis text-slate',
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {active ? (
                    <CheckIcon width={16} height={16} className="shrink-0 text-accent" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </>,
    document.body,
  );
}
