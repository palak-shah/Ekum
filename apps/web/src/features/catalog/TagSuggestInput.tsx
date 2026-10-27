import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from '@/ui/icons';
import { InfoHint, TextInput, cx } from '@/ui/kit';

const MAX_TAGS = 20;
const LIST_MAX_H = 160;
/** Sticky PageHeader. */
const TOP_CLEAR = 56;
/** Bottom nav + Update/Create dock. */
const BOTTOM_CLEAR = 136;
/** Finger travel that means scroll, not a tap. */
export const TAG_SUGGEST_SCROLL_PX = 8;

/** List overflow scroll must not re-anchor the portal (that jumps the list). */
export function isTagSuggestListScroll(
  target: EventTarget | null,
  list: HTMLElement | null,
): boolean {
  return Boolean(list && target instanceof Node && (target === list || list.contains(target)));
}

export function tagSuggestGestureIsScroll(startY: number, currentY: number): boolean {
  return Math.abs(currentY - startY) >= TAG_SUGGEST_SCROLL_PX;
}

function addUnique(current: string[], next: string, multiple: boolean): string[] {
  const label = next.trim();
  if (!label) return current;
  const key = label.toLowerCase();
  if (current.some((row) => row.toLowerCase() === key)) return current;
  if (!multiple) return [label];
  if (current.length >= MAX_TAGS) return current;
  return [...current, label];
}

export function TagSuggestInput({
  label,
  values,
  onChange,
  suggestionsFor,
  placeholder,
  info,
  testId,
  multiple = true,
  onCustomCommit,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  suggestionsFor: (query: string) => string[];
  placeholder?: string;
  /** Instructional copy on the shared circle i. */
  info?: string;
  testId?: string;
  /** When false, a pick replaces the current value and closes the list. */
  multiple?: boolean;
  /** Fired when the user creates a free-text value (not from the suggestion pool). */
  onCustomCommit?: (label: string) => void;
}) {
  const listId = useId();
  const inputId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const keepOpenForListRef = useRef(false);
  const pointerStartYRef = useRef<number | null>(null);
  const ignoreClickRef = useRef(false);
  const [query, setQuery] = useState(multiple ? '' : (values[0] ?? ''));
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{
    top: number;
    bottom: number;
    left: number;
    width: number;
  } | null>(null);

  useEffect(() => {
    if (!multiple) setQuery(values[0] ?? '');
  }, [multiple, values]);

  const selectedKeys = useMemo(
    () => new Set(values.map((row) => row.toLowerCase())),
    [values],
  );

  const options = useMemo(() => {
    const pool = suggestionsFor(query).filter(
      (row) => !selectedKeys.has(row.toLowerCase()),
    );
    const q = query.trim().toLowerCase();
    const exact = pool.some((row) => row.toLowerCase() === q) || selectedKeys.has(q);
    const extra = q && !exact ? [`Use “${query.trim()}”`] : [];
    return [...pool, ...extra];
  }, [query, selectedKeys, suggestionsFor]);

  const showMenu = open && options.length > 0;

  useLayoutEffect(() => {
    if (!showMenu) {
      setAnchor(null);
      return;
    }
    const sync = () => {
      const el = inputRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setAnchor({ top: r.top, bottom: r.bottom, left: r.left, width: r.width });
    };
    sync();
    window.addEventListener('resize', sync);
    const onScroll = (event: Event) => {
      if (isTagSuggestListScroll(event.target, listRef.current)) return;
      sync();
    };
    document.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', sync);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [showMenu, options.length]);

  const closeAndExit = () => {
    keepOpenForListRef.current = false;
    ignoreClickRef.current = false;
    pointerStartYRef.current = null;
    setOpen(false);
    inputRef.current?.blur();
  };

  useEffect(() => {
    const onDoc = (event: PointerEvent) => {
      const target = event.target as Node;
      if (wrapRef.current?.contains(target) || listRef.current?.contains(target)) return;
      keepOpenForListRef.current = false;
      setOpen(false);
      inputRef.current?.blur();
    };
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, []);

  const commit = (raw: string) => {
    const isCustom = raw.startsWith('Use “');
    const custom = isCustom ? query.trim() : raw;
    onChange(addUnique(values, custom, multiple));
    if (isCustom && custom) onCustomCommit?.(custom);
    if (multiple) {
      setQuery('');
      setOpen(true);
      return;
    }
    setQuery(custom.trim());
    closeAndExit();
  };

  const remove = (tag: string) => {
    onChange(values.filter((row) => row.toLowerCase() !== tag.toLowerCase()));
  };

  const spaceBelow = anchor
    ? window.innerHeight - anchor.bottom - BOTTOM_CLEAR
    : 0;
  const spaceAbove = anchor ? anchor.top - TOP_CLEAR : 0;
  const flipUp = Boolean(anchor) && spaceBelow < 128 && spaceAbove > spaceBelow;

  const menu =
    showMenu && anchor
      ? createPortal(
          <>
            <div
              data-testid={testId ? `${testId}-dismiss` : undefined}
              className="fixed inset-0 z-[79]"
              aria-hidden
              onPointerDown={(event) => {
                event.preventDefault();
                closeAndExit();
              }}
            />
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              data-testid={testId ? `${testId}-list` : undefined}
              className="fixed z-[80] max-h-40 touch-pan-y overflow-auto overscroll-contain rounded-xl border border-line bg-surface py-0.5 shadow-[var(--shadow-soft)]"
              style={{
                left: anchor.left,
                width: anchor.width,
                top: flipUp ? undefined : anchor.bottom + 4,
                bottom: flipUp ? window.innerHeight - anchor.top + 4 : undefined,
                maxHeight: Math.min(
                  LIST_MAX_H,
                  Math.max(
                    96,
                    flipUp ? spaceAbove - 4 : spaceBelow - 4,
                  ),
                ),
              }}
              onPointerDownCapture={(event) => {
                keepOpenForListRef.current = true;
                pointerStartYRef.current = event.clientY;
                ignoreClickRef.current = false;
              }}
              onPointerMove={(event) => {
                const startY = pointerStartYRef.current;
                if (startY == null) return;
                if (tagSuggestGestureIsScroll(startY, event.clientY)) {
                  ignoreClickRef.current = true;
                }
              }}
              onScroll={() => {
                ignoreClickRef.current = true;
              }}
              onPointerUp={() => {
                requestAnimationFrame(() => {
                  keepOpenForListRef.current = false;
                });
              }}
              onPointerCancel={() => {
                keepOpenForListRef.current = false;
                pointerStartYRef.current = null;
              }}
            >
              {options.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    role="option"
                    className={cx(
                      'flex w-full touch-pan-y items-center px-3 py-1 text-left text-sm leading-snug',
                      option === query ? 'bg-accent/5 font-emphasis text-ink' : 'text-ink',
                    )}
                    onPointerDown={(event) => {
                      if (event.pointerType === 'mouse') event.preventDefault();
                    }}
                    onClick={() => {
                      if (ignoreClickRef.current) {
                        ignoreClickRef.current = false;
                        return;
                      }
                      commit(option);
                    }}
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>
          </>,
          document.body,
        )
      : null;

  return (
    <div
      ref={wrapRef}
      className="relative flex scroll-mt-16 flex-col gap-1.5"
    >
      <div className="flex items-center gap-0.5">
        <label htmlFor={inputId} className="text-sm font-emphasis text-ink">
          {label}
        </label>
        {info ? <InfoHint label={`About ${label}`}>{info}</InfoHint> : null}
      </div>
      {multiple && values.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {values.map((tag) => (
            <span
              key={tag}
              className="inline-flex max-w-full items-center gap-0.5 rounded-lg bg-foam py-0.5 pl-2 pr-0.5 text-xs font-emphasis text-ink"
            >
              <span className="truncate">{tag}</span>
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-line/60 hover:text-ink"
                onClick={() => remove(tag)}
              >
                <CloseIcon width={12} height={12} />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <div className="relative">
        <TextInput
          ref={inputRef}
          id={inputId}
          value={query}
          data-testid={testId}
          className="min-h-10 text-base"
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="done"
          aria-expanded={showMenu}
          aria-controls={listId}
          aria-autocomplete="list"
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onBlur={(event) => {
            const next = event.relatedTarget;
            if (
              next instanceof Node &&
              (listRef.current?.contains(next) || wrapRef.current?.contains(next))
            ) {
              return;
            }
            if (keepOpenForListRef.current) return;
            closeAndExit();
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!multiple) {
              const next = e.target.value;
              onChange(next.trim() ? [next] : []);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              closeAndExit();
              return;
            }
            if (e.key === 'Enter') {
              e.preventDefault();
              if (query.trim()) commit(query);
              else closeAndExit();
            }
          }}
        />
      </div>
      {menu}
    </div>
  );
}
