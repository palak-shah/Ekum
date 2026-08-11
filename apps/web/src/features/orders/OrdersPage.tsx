import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { CursorPage, OrderView } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { timeAgo } from '@/lib/format';
import { Card, Chip, EmptyState, FilterRail, LoadingBlock, StatusPill, cx } from '@/ui/kit';
import { MoreHorizontalIcon } from '@/ui/icons';
import { matchesCompleted, matchesNeeds, matchesProgress } from './orderAttention';

type Direction = 'all' | 'buying' | 'selling';
type StatusFilter = 'needs' | 'progress' | 'completed';

export function OrdersPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const filterParam = params.get('filter');
  const [menuOpen, setMenuOpen] = useState(false);
  const [direction, setDirection] = useState<Direction>('all');
  // Default In progress so first open isn't an empty "Needs action" trap.
  // Home deep-link ?filter=needs still lands on Needs action.
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() =>
    filterParam === 'needs' || filterParam === 'progress' || filterParam === 'completed'
      ? filterParam
      : 'progress',
  );
  // Chips update immediately; list follows a beat later so the page doesn’t flash blank.
  const listStatus = useDeferredValue(statusFilter);
  const listDirection = useDeferredValue(direction);

  useEffect(() => {
    if (filterParam === 'needs' || filterParam === 'progress' || filterParam === 'completed') {
      setStatusFilter(filterParam);
    }
  }, [filterParam]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const orders = useQuery({
    queryKey: ['orders', { list: true }],
    queryFn: () => api.get<CursorPage<OrderView>>('/orders', { limit: 50 }),
  });

  const allOrders = orders.data?.results ?? [];
  const hasBuying = allOrders.some((order) => order.direction === 'buying');
  const hasSelling = allOrders.some((order) => order.direction === 'selling');
  const showDirection = hasBuying && hasSelling;

  const filtered = useMemo(
    () =>
      allOrders.filter((order) => {
        if (listDirection !== 'all' && order.direction !== listDirection) return false;
        if (listStatus === 'needs') return matchesNeeds(order);
        if (listStatus === 'progress') return matchesProgress(order);
        return matchesCompleted(order);
      }),
    [allOrders, listDirection, listStatus],
  );

  return (
    <div className="flex flex-col gap-2.5">
      <div className="relative flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => navigate('/orders/new')}
          className="text-sm font-bold tracking-tight text-accent"
        >
          New
        </button>
        <button
          type="button"
          aria-label="More"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => setMenuOpen((open) => !open)}
          className={cx(
            'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
            menuOpen ? 'bg-foam text-ink' : 'text-muted hover:bg-foam hover:text-ink',
          )}
        >
          <MoreHorizontalIcon width={18} height={18} />
        </button>
        {menuOpen ? (
          <>
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-40 cursor-default bg-transparent"
              onClick={() => setMenuOpen(false)}
            />
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[10rem] overflow-hidden rounded-[14px] border border-line bg-surface shadow-[var(--shadow-soft)]"
            >
              <button
                type="button"
                role="menuitem"
                className="flex w-full px-3.5 py-2.5 text-left text-sm font-semibold tracking-tight text-ink hover:bg-foam/70"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/samples');
                }}
              >
                Samples
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full border-t border-line/70 px-3.5 py-2.5 text-left text-sm font-semibold tracking-tight text-ink hover:bg-foam/70"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/returns');
                }}
              >
                Returns
              </button>
            </div>
          </>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <FilterRail className="min-w-0 flex-1">
          {(
            [
              ['needs', 'Needs you'],
              ['progress', 'In progress'],
              ['completed', 'Done'],
            ] as const
          ).map(([value, label]) => (
            <Chip
              key={value}
              active={statusFilter === value}
              onClick={() => setStatusFilter(value)}
            >
              {label}
            </Chip>
          ))}
        </FilterRail>
        {showDirection ? (
          <div
            className="flex shrink-0 rounded-full border border-line bg-surface p-0.5"
            role="group"
            aria-label="Buying or selling"
          >
            {(
              [
                ['all', 'All'],
                ['buying', 'Buy'],
                ['selling', 'Sell'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setDirection(value)}
                className={cx(
                  'rounded-full px-2.5 py-1 text-[11px] font-bold tracking-tight',
                  direction === value ? 'bg-ink text-white' : 'text-muted',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {orders.isPending && !orders.data ? (
        <LoadingBlock />
      ) : (
        <div className="min-h-[12rem]">
          {filtered.length > 0 ? (
            <div className="flex flex-col gap-2">
              {filtered.map((order) => (
                <Link key={order.id} to={`/orders/${order.id}`}>
                  <Card className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">
                        {order.counterpart.name}
                      </p>
                      <p className="text-xs text-muted">
                        {order.intent === 'inquiry'
                          ? 'Inquiry'
                          : order.direction === 'buying'
                            ? 'You buy'
                            : 'You sell'}{' '}
                        · {order.items.length}{' '}
                        {order.items.length === 1 ? 'item' : 'items'} · {timeAgo(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <StatusPill status={order.status} />
                      {order.intent === 'inquiry' ? (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-accent">
                          Inquiry
                        </span>
                      ) : null}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title={listStatus === 'needs' ? 'Nothing needs you' : 'No orders here'}
              message="Orders you place or receive will show up here."
            />
          )}
        </div>
      )}
    </div>
  );
}
