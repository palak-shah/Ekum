import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Button, TextInput, cx } from '@/ui/kit';
import { BackIcon, CheckIcon, ChevronRightIcon } from '@/ui/icons';
import {
  allVisibleSelected,
  addVisible,
  facetSummary,
  filterStartsWithPreserveOrder,
  pinSelectedOnOpen,
  removeVisible,
  toggleValue,
} from './exploreFilterPanel';

export type ContentMode = 'all' | 'collections' | 'designs' | 'businesses';
type MenuView = 'root' | 'category' | 'city' | 'show';

export const CONTENT_MODE_OPTIONS: Array<{ id: ContentMode; label: string }> = [
  { id: 'all', label: 'All Feeds' },
  { id: 'collections', label: 'Collections Only' },
  { id: 'designs', label: 'Designs Only' },
  { id: 'businesses', label: 'Businesses Only' },
];

export function parseContentMode(value: string | null): ContentMode {
  if (value === 'collections' || value === 'designs' || value === 'businesses') return value;
  return 'all';
}

export function contentModeLabel(mode: ContentMode): string {
  return CONTENT_MODE_OPTIONS.find((option) => option.id === mode)?.label ?? 'All Feeds';
}

export function ExploreFilterMenu({
  open,
  onClose,
  anchorRef,
  contentMode,
  categories,
  cities,
  categoryOptions,
  cityOptions,
  labelFor,
  onContentMode,
  onCategories,
  onCities,
  switchLabel,
  onSwitch,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  contentMode: ContentMode;
  categories: string[];
  cities: string[];
  categoryOptions: string[];
  cityOptions: string[];
  labelFor: (value: string) => string;
  onContentMode: (mode: ContentMode) => void;
  onCategories: (values: string[]) => void;
  onCities: (values: string[]) => void;
  switchLabel: string | null;
  onSwitch: () => void;
}) {
  const [view, setView] = useState<MenuView>('root');
  const [draft, setDraft] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [sessionOrder, setSessionOrder] = useState<string[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  const resetSub = () => {
    setView('root');
    setQuery('');
    setDraft([]);
    setSessionOrder([]);
  };

  const close = () => {
    resetSub();
    onClose();
  };

  const openFacet = (facet: 'category' | 'city') => {
    const pool = facet === 'category' ? categoryOptions : cityOptions;
    const selected = facet === 'category' ? categories : cities;
    setSessionOrder(pinSelectedOnOpen(pool, selected));
    setDraft(selected);
    setQuery('');
    setView(facet);
  };

  const visible = useMemo(
    () => filterStartsWithPreserveOrder(sessionOrder, query),
    [sessionOrder, query],
  );

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      setPos({
        top: rect.bottom + 6,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [open, anchorRef, view]);

  useEffect(() => {
    if (!open) {
      resetSub();
      return;
    }
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
    // close / resetSub are stable enough for this portal
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose, anchorRef]);

  if (!open || typeof document === 'undefined') return null;

  const wide = view === 'category' || view === 'city';
  const subTitle =
    view === 'show'
      ? 'View Items By'
      : view === 'category'
        ? 'Select Category'
        : view === 'city'
          ? 'Select City'
          : '';

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
        data-testid="explore-filter-menu"
        className={cx(
          'fixed z-[61] overflow-hidden rounded-[14px] border border-line bg-surface shadow-[var(--shadow-soft)]',
          wide ? 'w-[min(22rem,calc(100vw-2rem))]' : 'w-[min(18.5rem,calc(100vw-2rem))]',
        )}
        style={{ top: pos.top, right: pos.right, animation: 'ekum-rise 160ms ease-out' }}
      >
        {view === 'root' ? (
          <div className="py-1">
            <MenuRow
              label="Change View"
              value={contentModeLabel(contentMode)}
              onClick={() => setView('show')}
            />
            <MenuRow
              label="Select Category"
              value={
                categories.length === 0
                  ? 'Any category'
                  : categories.length === 1
                    ? labelFor(categories[0]!)
                    : `${labelFor(categories[0]!)} + ${categories.length - 1}`
              }
              onClear={categories.length > 0 ? () => onCategories([]) : undefined}
              onClick={() => openFacet('category')}
            />
            <MenuRow
              label="Select City"
              value={facetSummary(cities, 'Any city')}
              onClear={cities.length > 0 ? () => onCities([]) : undefined}
              onClick={() => openFacet('city')}
            />
            {switchLabel ? (
              <button
                type="button"
                role="menuitem"
                data-testid="explore-trade-switch"
                onClick={() => {
                  onSwitch();
                  close();
                }}
                className="flex w-full items-center px-3.5 py-2.5 text-left text-sm font-bold tracking-tight text-accent hover:bg-foam/70"
              >
                {switchLabel}
              </button>
            ) : null}
          </div>
        ) : view === 'show' ? (
          <div className="flex max-h-72 flex-col">
            <SubHeader title={subTitle} onBack={() => setView('root')} />
            <ul className="min-h-0 overflow-y-auto py-1">
              {CONTENT_MODE_OPTIONS.map((option) => {
                const active = option.id === contentMode;
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={active}
                      onClick={() => {
                        onContentMode(option.id);
                        close();
                      }}
                      className={cx(
                        'flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm tracking-tight hover:bg-foam/70',
                        active ? 'bg-accent/10 font-bold text-ink' : 'font-medium text-slate',
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
        ) : (
          <div className="flex max-h-[min(70vh,28rem)] flex-col">
            <SubHeader
              title={subTitle}
              onBack={() => {
                setView('root');
                setQuery('');
              }}
            />
            <div className="min-h-0 flex-1 overflow-y-auto px-2.5 pt-2 pb-2">
              <FacetList
                query={query}
                onQuery={setQuery}
                options={visible}
                selected={draft}
                labelFor={labelFor}
                onToggle={(value) => setDraft((prev) => toggleValue(prev, value))}
                placeholder={view === 'city' ? 'Type a city…' : 'Type a category…'}
              />
            </div>
            <div className="flex shrink-0 items-center gap-2 border-t border-line px-2.5 py-2.5">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() =>
                  allVisibleSelected(draft, visible)
                    ? setDraft((prev) => removeVisible(prev, visible))
                    : setDraft((prev) => addVisible(prev, visible))
                }
              >
                {allVisibleSelected(draft, visible) ? 'Deselect all' : 'Select all'}
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={() => {
                  if (view === 'city') onCities(draft);
                  else onCategories(draft);
                  close();
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        )}
      </div>
    </>,
    document.body,
  );
}

function FacetList({
  query,
  onQuery,
  options,
  selected,
  onToggle,
  labelFor,
  placeholder,
}: {
  query: string;
  onQuery: (value: string) => void;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  labelFor: (value: string) => string;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <TextInput
        value={query}
        onChange={(event) => onQuery(event.target.value)}
        placeholder={placeholder}
        aria-label="Filter list"
      />
      {options.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">No matches.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {options.map((option) => {
            const active = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => onToggle(option)}
                className={cx(
                  'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left',
                  active ? 'border-accent bg-accent/5' : 'border-line bg-surface',
                )}
              >
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                  {labelFor(option)}
                </span>
                <span className="shrink-0 text-xs text-muted">{active ? 'Selected' : 'Add'}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SubHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="flex shrink-0 items-center gap-1 border-b border-line px-2.5 py-2.5 text-sm font-bold tracking-tight text-ink hover:bg-foam/50"
    >
      <BackIcon width={18} height={18} />
      {title}
    </button>
  );
}

function MenuRow({
  label,
  value,
  onClick,
  onClear,
}: {
  label: string;
  value: string;
  onClick: () => void;
  onClear?: () => void;
}) {
  return (
    <div className="flex w-full items-center gap-1 pr-2">
      <button
        type="button"
        role="menuitem"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-2.5 text-left hover:bg-foam/70"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold tracking-tight text-ink">{label}</span>
          <span className="block truncate text-xs font-medium text-muted">{value}</span>
        </span>
        <ChevronRightIcon width={16} height={16} className="shrink-0 text-muted" />
      </button>
      {onClear ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onClear();
          }}
          className="shrink-0 px-1.5 py-1 text-xs font-bold tracking-tight text-accent"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}
