import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type {
  CursorPage,
  OrderView,
  ReturnView,
  SampleView,
} from '@ekum/domain-types';
import { shortOrderLabel } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { timeAgo } from '@/lib/format';
import { useMyCompany } from '@/lib/queries';
import { Chip, EmptyState, LoadingBlock, SearchInput, StatusPill, cx } from '@/ui/kit';
import { ListSearchRow, ListSquareButton } from '@/ui/ListSearchRow';
import { FilterIcon, PlusIcon } from '@/ui/icons';
import { returnStatusLabel } from '@/lib/status';
import { orderViewerIsFacilitator } from '@/features/browse/forwardAttribution';
import { orderListLinkedCue, orderListRoleBit } from '@/features/orders/tradeListRole';
import { ordersListFilterChrome } from '@/features/orders/ordersListFilterChrome';
import {
  getOrdersDirection,
  setOrdersDirection,
  tradeMatchesDirection,
  type OrdersDirection,
} from '@/features/orders/ordersDirectionSession';
import {
  dateFacetFromNeedle,
  emptyFindState,
  effectiveDateFacet,
  findNeedsServer,
  kindFacetFromNeedle,
  tradeMatchesFind,
  type TradeFindState,
  type TradeKindFacet,
} from './tradeFind';
import {
  matchesTradeCompleted,
  matchesTradePending,
  sortTradePending,
  toTradeItems,
  type TradeListItem,
} from './tradeList';
import { tradeNeedsYouLabel } from './tradeNeedsYouLabel';
import { OrdersFilterMenu } from './OrdersFilterMenu';
import { statusFromParam, tradeMenuFilterSummary } from './ordersFilterConfig';

type StatusFilter = 'pending' | 'completed';

function statusFilterFromParam(value: string | null): StatusFilter {
  if (value === 'completed') return 'completed';
  // Legacy Needs you / In progress deep links land on Pending.
  if (value === 'pending' || value === 'needs' || value === 'progress') return 'pending';
  return 'pending';
}

function kindFromParam(value: string | null): TradeFindState['kindFacet'] {
  if (value === 'sample' || value === 'return' || value === 'order' || value === 'trading') {
    return value;
  }
  return null;
}

export function OrdersPage() {
  const navigate = useNavigate();
  const me = useMyCompany();
  const [params, setSearchParams] = useSearchParams();
  const filterParam = params.get('filter');
  const kindParam = params.get('kind');
  const statusParam = params.get('status');
  const filterAnchorRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [direction, setDirectionState] = useState<OrdersDirection>(() => getOrdersDirection());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() =>
    statusFilterFromParam(filterParam),
  );
  const [find, setFind] = useState<TradeFindState>(() => ({
    ...emptyFindState(),
    kindFacet: kindFromParam(kindParam),
    statusFacet: statusFromParam(statusParam),
  }));
  // Attention tabs filter in-memory — keep chip + list in lockstep (no deferred
  // lag that flashes EmptyState ↔ rows). Only defer Find typing/server facets.
  const deferredFind = useDeferredValue(find);

  useEffect(() => {
    if (
      filterParam === 'pending' ||
      filterParam === 'needs' ||
      filterParam === 'progress' ||
      filterParam === 'completed'
    ) {
      setStatusFilter(statusFilterFromParam(filterParam));
    }
  }, [filterParam]);

  useEffect(() => {
    const next = kindFromParam(kindParam);
    setFind((prev) => (prev.kindFacet === next ? prev : { ...prev, kindFacet: next }));
  }, [kindParam]);

  useEffect(() => {
    const next = statusFromParam(statusParam);
    setFind((prev) => (prev.statusFacet === next ? prev : { ...prev, statusFacet: next }));
  }, [statusParam]);

  const serverFind = findNeedsServer(deferredFind);
  const orderParams = useMemo(() => {
    const params: Record<string, string | number> = { limit: 50 };
    const dateFacet = effectiveDateFacet(deferredFind);
    const needleIsDate = Boolean(dateFacetFromNeedle(deferredFind.needle));
    if (serverFind && deferredFind.needle.trim().length >= 2 && !needleIsDate) {
      params.q = deferredFind.needle.trim();
    }
    if (deferredFind.kindFacet === 'trading') {
      params.tradeMode = 'manage';
      params.direction = 'selling';
    }
    if (dateFacet) {
      params.createdFrom = dateFacet.from;
      params.createdTo = dateFacet.to;
    }
    return params;
  }, [serverFind, deferredFind]);

  const orders = useQuery({
    queryKey: ['orders', { list: true, ...orderParams }],
    queryFn: () => api.get<CursorPage<OrderView>>('/orders', orderParams),
  });
  const samples = useQuery({
    queryKey: ['samples', { list: true }],
    queryFn: () => api.get<CursorPage<SampleView>>('/samples', { limit: 50 }),
  });
  const returns = useQuery({
    queryKey: ['returns', { list: true }],
    queryFn: () => api.get<CursorPage<ReturnView>>('/returns', { limit: 50 }),
  });

  const merged = useMemo(
    () =>
      toTradeItems(
        orders.data?.results ?? [],
        samples.data?.results ?? [],
        returns.data?.results ?? [],
      ),
    [orders.data, samples.data, returns.data],
  );

  const findOverridesAttention =
    Boolean(deferredFind.kindFacet) ||
    Boolean(deferredFind.statusFacet) ||
    Boolean(deferredFind.dateFacet) ||
    Boolean(dateFacetFromNeedle(deferredFind.needle)) ||
    deferredFind.needle.trim().length > 0;

  const filterApplied = Boolean(
    find.statusFacet || find.kindFacet || find.dateFacet,
  );
  const filterIconActive = filterApplied || menuOpen;

  const filtered = useMemo(() => {
    const rows = merged.filter((item) => {
      if (!tradeMatchesFind(item, deferredFind)) return false;
      if (!tradeMatchesDirection(item.direction, direction)) return false;
      if (findOverridesAttention) return true;
      if (statusFilter === 'pending') return matchesTradePending(item);
      return matchesTradeCompleted(item);
    });
    if (findOverridesAttention || statusFilter !== 'pending') return rows;
    return sortTradePending(rows);
  }, [merged, deferredFind, direction, statusFilter, findOverridesAttention]);

  const setDirection = (next: OrdersDirection) => {
    setOrdersDirection(next);
    setDirectionState(next);
  };

  const showDirection = merged.length > 0;
  const filterChrome = ordersListFilterChrome();

  const loading =
    (orders.isPending && !orders.data) ||
    (samples.isPending && !samples.data) ||
    (returns.isPending && !returns.data);

  const syncFindParams = (statusFacet: string | null, kindFacet: TradeKindFacet | null) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (statusFacet) next.set('status', statusFacet);
        else next.delete('status');
        if (!kindFacet || kindFacet === 'order') next.delete('kind');
        else next.set('kind', kindFacet);
        return next;
      },
      { replace: true },
    );
  };

  const setKindFacet = (kind: TradeKindFacet | null) => {
    setFind((prev) => {
      const next = { ...prev, kindFacet: kind, needle: '' };
      syncFindParams(prev.statusFacet, kind);
      return next;
    });
  };

  const setStatusFacet = (status: string | null) => {
    setFind((prev) => {
      const next = { ...prev, statusFacet: status, needle: '' };
      syncFindParams(status, prev.kindFacet);
      return next;
    });
  };

  const onFindNeedleChange = (raw: string) => {
    const kindWord = kindFacetFromNeedle(raw);
    if (kindWord) {
      setKindFacet(kindWord);
      return;
    }
    setFind((prev) => ({ ...prev, needle: raw }));
  };

  const clearMenuFilters = () => {
    setFind((prev) => ({
      ...prev,
      statusFacet: null,
      kindFacet: null,
      dateFacet: null,
    }));
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('kind');
        next.delete('status');
        return next;
      },
      { replace: true },
    );
  };

  const clearFind = () => {
    setFind(emptyFindState());
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('kind');
        next.delete('status');
        return next;
      },
      { replace: true },
    );
  };

  const menuFilterSummary = tradeMenuFilterSummary({
    statusFacet: find.statusFacet,
    kindFacet: find.kindFacet,
    dateFacet: find.dateFacet,
  });

  const searchLabel = find.needle.trim() || null;
  const summaryLabel = [menuFilterSummary, searchLabel].filter(Boolean).join(' · ');

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex w-full flex-col gap-1.5">
        <ListSearchRow
          search={
            <SearchInput
              value={find.needle}
              onChange={(e) => onFindNeedleChange(e.target.value)}
              placeholder="Name, status, today…"
              aria-label="Search orders, samples, returns"
            />
          }
          action={
            <div className="flex shrink-0 items-center gap-2">
              <ListSquareButton
                ref={filterAnchorRef}
                data-testid="orders-filter"
                data-filter-active={filterApplied ? 'true' : 'false'}
                aria-label="Filter"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-pressed={filterApplied}
                active={filterIconActive}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <FilterIcon
                  width={20}
                  height={20}
                  className={filterIconActive ? 'text-white' : undefined}
                />
              </ListSquareButton>
              <ListSquareButton
                aria-label="New order"
                onClick={() => navigate('/orders/new')}
              >
                <PlusIcon width={20} height={20} />
              </ListSquareButton>
            </div>
          }
        />
        <OrdersFilterMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          anchorRef={filterAnchorRef}
          statusFacet={find.statusFacet}
          kindFacet={find.kindFacet}
          onStatus={setStatusFacet}
          onKind={setKindFacet}
          onClearAll={clearMenuFilters}
        />
        {summaryLabel ? (
          <div className="relative z-10 flex flex-wrap items-center gap-x-3 px-0.5">
            <p className="text-xs font-medium text-muted">
              Showing <span className="capitalize text-ink">{summaryLabel}</span>
            </p>
            <button
              type="button"
              onClick={clearFind}
              className="inline-flex min-h-11 items-center text-xs font-bold tracking-tight text-accent"
            >
              Clear
            </button>
          </div>
        ) : null}
      </div>

      <div
        data-testid="orders-list-filters"
        className={cx('min-w-0', findOverridesAttention && 'opacity-50')}
      >
        <div className={filterChrome.rowClass}>
          <div className="flex min-w-0 gap-1.5" role="group" aria-label="Open or finished">
            {(
              [
                ['pending', 'Pending'],
                ['completed', 'Completed'],
              ] as const
            ).map(([value, label]) => (
              <Chip
                key={value}
                className={filterChrome.statusChipClass}
                active={!findOverridesAttention && statusFilter === value}
                onClick={() => {
                  if (statusFilter === value && !findOverridesAttention) return;
                  setStatusFilter(value);
                  if (findOverridesAttention) {
                    setFind(emptyFindState());
                  }
                  setSearchParams(
                    (prev) => {
                      if (
                        prev.get('filter') === value &&
                        !findOverridesAttention &&
                        !prev.get('kind') &&
                        !prev.get('status')
                      ) {
                        return prev;
                      }
                      const next = new URLSearchParams(prev);
                      next.set('filter', value);
                      if (findOverridesAttention) {
                        next.delete('kind');
                        next.delete('status');
                      }
                      return next;
                    },
                    { replace: true },
                  );
                }}
              >
                {label}
              </Chip>
            ))}
          </div>
          {showDirection ? (
            <div
              className={filterChrome.directionGroupClass}
              role="group"
              aria-label="Buy or sell"
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
                  data-testid={`orders-direction-${value}`}
                  onClick={() => setDirection(value)}
                  className={cx(
                    filterChrome.directionBtnClass,
                    direction === value ? 'bg-ink text-white' : 'text-muted',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {loading ? (
        <LoadingBlock />
      ) : (
        <div className="min-h-[12rem]">
          {filtered.length > 0 ? (
            <div className="-mx-4 overflow-hidden bg-surface">
              {filtered.map((item) => (
                <TradeRow
                  key={`${item.kind}-${item.id}`}
                  item={item}
                  companyId={me.data?.id ?? null}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={
                findOverridesAttention
                  ? 'No matches'
                  : statusFilter === 'pending'
                    ? 'No open orders'
                    : 'No completed orders'
              }
              message={
                findOverridesAttention
                  ? 'Try another find, or clear filters.'
                  : 'Orders, samples, and returns show up here.'
              }
            />
          )}
        </div>
      )}
    </div>
  );
}

function TradeRow({
  item,
  companyId,
}: {
  item: TradeListItem;
  companyId: string | null;
}) {
  const needsLabel = tradeNeedsYouLabel(item);

  if (item.kind === 'order') {
    const order = item.order;
    const staff =
      order.updatedBy?.name?.trim() || order.createdBy?.name?.trim() || null;
    const isInquiry = order.intent === 'inquiry';
    const idLabel = shortOrderLabel(order.id, { inquiry: isInquiry });
    const shared = orderViewerIsFacilitator(order, companyId);
    const roleBit = orderListRoleBit(order, shared);
    const mills = orderListLinkedCue(order.linkedMills);
    return (
      <Link
        to={`/orders/${order.id}`}
        data-needs-you={needsLabel ? 'true' : undefined}
        className={cx(
          'flex items-start justify-between gap-3 border-b border-line/70 px-4 py-3.5 last:border-b-0 hover:bg-canvas active:bg-canvas',
          needsLabel && 'border-l-[3px] border-l-accent bg-accent/[0.04] pl-[13px]',
        )}
      >
        <div className="min-w-0">
          <p className="truncate text-[16px] font-semibold tracking-[-0.02em] text-ink">
            {order.counterpart.name}
          </p>
          {needsLabel ? (
            <p
              data-testid="orders-needs-you"
              className="mt-0.5 truncate text-[13px] font-semibold tracking-tight text-accent"
            >
              {needsLabel}
            </p>
          ) : null}
          <p className="mt-0.5 text-[13px] font-semibold tabular-nums tracking-tight text-slate">
            {idLabel}
            {roleBit ? <span className="font-medium text-muted"> · {roleBit}</span> : null}
            {mills ? <span className="font-medium text-muted"> · {mills}</span> : null}
          </p>
          <p className="mt-0.5 text-[12px] text-muted">
            {order.items.length} {order.items.length === 1 ? 'item' : 'items'} · {timeAgo(order.createdAt)}
            {staff ? ` · ${staff}` : ''}
          </p>
        </div>
        <StatusPill status={order.status} />
      </Link>
    );
  }

  if (item.kind === 'sample') {
    const sample = item.sample;
    return (
      <div
        data-needs-you={needsLabel ? 'true' : undefined}
        className={cx(
          'flex items-start justify-between gap-3 border-b border-line/70 px-4 py-3.5 last:border-b-0',
          needsLabel && 'border-l-[3px] border-l-accent bg-accent/[0.04] pl-[13px]',
        )}
      >
        <div className="min-w-0">
          <p className="truncate text-[16px] font-semibold tracking-[-0.02em] text-ink">{sample.name}</p>
          {needsLabel ? (
            <p
              data-testid="orders-needs-you"
              className="mt-0.5 truncate text-[13px] font-semibold tracking-tight text-accent"
            >
              {needsLabel}
            </p>
          ) : null}
          <p className="mt-0.5 text-[13px] font-semibold text-slate">Sample</p>
          <p className="mt-0.5 text-[12px] text-muted">
            {sample.counterpart.name} · {timeAgo(sample.createdAt)}
          </p>
        </div>
        <StatusPill status={sample.status} />
      </div>
    );
  }

  const ret = item.ret;
  const linePreview = ret.items
    .map((line) => `${line.name} × ${line.requestedQuantity}`)
    .join(' · ');
  return (
    <Link
      to={`/orders/${ret.orderId}?return=${ret.id}`}
      data-needs-you={needsLabel ? 'true' : undefined}
      className={cx(
        'flex items-start justify-between gap-3 border-b border-line/70 px-4 py-3.5 last:border-b-0 hover:bg-canvas active:bg-canvas',
        needsLabel && 'border-l-[3px] border-l-accent bg-accent/[0.04] pl-[13px]',
      )}
    >
      <div className="min-w-0">
        <p className="truncate text-[16px] font-semibold tracking-[-0.02em] text-ink">{ret.counterpart.name}</p>
        {needsLabel ? (
          <p
            data-testid="orders-needs-you"
            className="mt-0.5 truncate text-[13px] font-semibold tracking-tight text-accent"
          >
            {needsLabel}
          </p>
        ) : null}
        <p className="mt-0.5 text-[13px] font-semibold text-slate">Return</p>
        <p className="mt-0.5 truncate text-[12px] text-muted">
          {linePreview || `${ret.items.length} designs`} · {timeAgo(ret.createdAt)}
        </p>
      </div>
      <StatusPill status={ret.status} label={returnStatusLabel(ret.status)} />
    </Link>
  );
}
