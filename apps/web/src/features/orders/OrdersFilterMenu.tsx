import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '@/ui/kit';
import { BackIcon, CheckIcon, ChevronRightIcon } from '@/ui/icons';
import type { TradeKindFacet } from './tradeFind';
import {
  TRADE_FILTER_STATUSES,
  TRADE_FILTER_TYPES,
  tradeKindLabel,
  tradeStatusLabel,
} from './ordersFilterConfig';

type MenuView = 'root' | 'status' | 'type';

export function OrdersFilterMenu({
  open,
  onClose,
  anchorRef,
  statusFacet,
  kindFacet,
  onStatus,
  onKind,
  onClearAll,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  statusFacet: string | null;
  kindFacet: TradeKindFacet | null;
  onStatus: (status: string | null) => void;
  onKind: (kind: TradeKindFacet | null) => void;
  onClearAll: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const [view, setView] = useState<MenuView>('root');

  const close = () => {
    setView('root');
    onClose();
  };

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
      setView('root');
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (view !== 'root') {
          setView('root');
          return;
        }
        close();
      }
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
  }, [open, anchorRef, view]);

  if (!open || typeof document === 'undefined') return null;

  const hasFilter = Boolean(statusFacet || kindFacet);

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
        data-testid="orders-filter-menu"
        className="fixed z-[61] w-[min(18.5rem,calc(100vw-2rem))] overflow-hidden rounded-[14px] border border-line bg-surface shadow-[var(--shadow-soft)]"
        style={{ top: pos.top, right: pos.right, animation: 'ekum-rise 160ms ease-out' }}
      >
        {view === 'root' ? (
          <div className="py-1">
            <MenuRow
              label="Select Status"
              value={tradeStatusLabel(statusFacet)}
              onClick={() => setView('status')}
              onClear={statusFacet ? () => onStatus(null) : undefined}
            />
            <MenuRow
              label="Select Type"
              value={tradeKindLabel(kindFacet)}
              onClick={() => setView('type')}
              onClear={kindFacet ? () => onKind(null) : undefined}
            />
            {hasFilter ? (
              <button
                type="button"
                role="menuitem"
                data-testid="orders-filter-clear"
                onClick={() => {
                  onClearAll();
                  close();
                }}
                className="w-full px-3.5 py-2.5 text-left text-sm font-bold tracking-tight text-accent hover:bg-foam/70"
              >
                Clear all filters
              </button>
            ) : null}
          </div>
        ) : view === 'status' ? (
          <div className="flex max-h-[min(70vh,28rem)] flex-col">
            <SubHeader title="Select Status" onBack={() => setView('root')} />
            <ul className="min-h-0 overflow-y-auto py-1">
              {TRADE_FILTER_STATUSES.map((row) => {
                const active = statusFacet === row.status;
                return (
                  <li key={row.status}>
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={active}
                      data-testid={`orders-filter-status-${row.status}`}
                      onClick={() => {
                        onStatus(active ? null : row.status);
                        close();
                      }}
                      className={cx(
                        'flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm tracking-tight hover:bg-foam/70',
                        active ? 'bg-accent/10 font-bold text-ink' : 'font-medium text-slate',
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">{row.label}</span>
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
          <div className="flex flex-col">
            <SubHeader title="Select Type" onBack={() => setView('root')} />
            <ul className="py-1">
              {TRADE_FILTER_TYPES.map((row) => {
                const active = kindFacet === row.kind;
                return (
                  <li key={row.kind}>
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={active}
                      data-testid={`orders-filter-type-${row.kind}`}
                      onClick={() => {
                        onKind(active ? null : row.kind);
                        close();
                      }}
                      className={cx(
                        'flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm tracking-tight hover:bg-foam/70',
                        active ? 'bg-accent/10 font-bold text-ink' : 'font-medium text-slate',
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">{row.label}</span>
                      {active ? (
                        <CheckIcon width={16} height={16} className="shrink-0 text-accent" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </>,
    document.body,
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
        data-testid={label === 'Select Status' ? 'orders-filter-open-status' : 'orders-filter-open-type'}
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
