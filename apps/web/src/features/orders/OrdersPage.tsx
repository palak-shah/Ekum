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
  SampleView,
} from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { timeAgo } from '@/lib/format';
import { useMyCompany } from '@/lib/queries';
import { Avatar, Chip, EmptyState, LoadingBlock, SearchInput, cx } from '@/ui/kit';
import { ListSearchRow, ListSquareButton } from '@/ui/ListSearchRow';
import { FilterIcon, PlusIcon } from '@/ui/icons';
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
import { tradeListFacts, tradeListPreview, tradeListWhen } from './tradeListPreview';
import { OrdersFilterMenu } from './OrdersFilterMenu';
import {
  statusFitsTab,
  statusFromParam,
  tabForTradeStatus,
  tradeMenuFilterSummary,
} from './ordersFilterConfig';

type StatusFilter = 'pending' | 'completed';

function statusFilterFromParam(value: string | null): StatusFilter {
  if (value === 'completed') return 'completed';
  // Legacy Needs you / In progress deep links land on Pending.
  if (value === 'pending' || value === 'needs' || value === 'progress') return 'pending';
  return 'pending';
}

function kindFromParam(value: string | null): TradeFindState['kindFacet'] {
  if (value === 'sample' || value === 'order' || value === 'trading') {
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
    const fromStatus = tabForTradeStatus(statusFromParam(statusParam) ?? '');
    if (fromStatus) {
      setStatusFilter(fromStatus);
      return;
    }
    if (
      filterParam === 'pending' ||
      filterParam === 'needs' ||
      filterParam === 'progress' ||
      filterParam === 'completed'
    ) {
      setStatusFilter(statusFilterFromParam(filterParam));
    }
  }, [filterParam, statusParam]);

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

  const merged = useMemo(
    () => toTradeItems(orders.data?.results ?? [], samples.data?.results ?? [], []),
    [orders.data, samples.data],
  );

  const findOverridesAttention =
    Boolean(deferredFind.kindFacet) ||
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
    (samples.isPending && !samples.data);

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
    const tab = status ? (tabForTradeStatus(status) ?? statusFilter) : statusFilter;
    if (tab !== statusFilter) setStatusFilter(tab);
    setFind((prev) => {
      const next = { ...prev, statusFacet: status, needle: '' };
      setSearchParams(
        (params) => {
          const nextParams = new URLSearchParams(params);
          nextParams.set('filter', tab);
          if (status) nextParams.set('status', status);
          else nextParams.delete('status');
          if (!prev.kindFacet || prev.kindFacet === 'order') nextParams.delete('kind');
          else nextParams.set('kind', prev.kindFacet);
          return nextParams;
        },
        { replace: true },
      );
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
              aria-label="Search orders and samples"
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
          attentionTab={statusFilter}
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
                  } else {
                    setFind((prev) =>
                      statusFitsTab(prev.statusFacet, value)
                        ? prev
                        : { ...prev, statusFacet: null },
                    );
                  }
                  setSearchParams(
                    (prev) => {
                      if (
                        prev.get('filter') === value &&
                        !findOverridesAttention &&
                        !prev.get('kind') &&
                        statusFitsTab(prev.get('status'), value)
                      ) {
                        return prev;
                      }
                      const next = new URLSearchParams(prev);
                      next.set('filter', value);
                      if (findOverridesAttention) {
                        next.delete('kind');
                        next.delete('status');
                      } else if (!statusFitsTab(prev.get('status'), value)) {
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
            <div className="-mx-4 overflow-x-hidden bg-surface">
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
                  : 'Orders and samples show up here.'
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
  if (item.kind === 'return') return null;

  const needsLabel = tradeNeedsYouLabel(item);
  const { preview, accent } = tradeListPreview(item, companyId);
  const facts = tradeListFacts(item);
  const when = timeAgo(tradeListWhen(item));
  const name =
    item.kind === 'order' ? item.order.counterpart.name : item.sample.counterpart.name;
  const logoUrl =
    item.kind === 'order' ? item.order.counterpart.logoUrl : item.sample.counterpart.logoUrl;
  const rowClass = cx(
    'flex w-full items-center gap-3 border-b border-line/70 px-4 py-3 last:border-b-0',
    needsLabel && 'border-l-[3px] border-l-accent bg-accent/[0.04] pl-[13px]',
    item.kind === 'order' && 'hover:bg-canvas active:bg-canvas text-left',
  );
  const body = (
    <>
      <Avatar name={name} imageUrl={logoUrl} size={48} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="min-w-0 truncate text-[15px] font-semibold leading-tight tracking-[-0.02em] text-ink">
            {name}
          </p>
          <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted">{when}</span>
        </div>
        <p
          data-testid={needsLabel ? 'orders-needs-you' : undefined}
          className={cx(
            'min-w-0 truncate text-[13px] leading-snug',
            accent ? 'font-semibold tracking-tight text-accent' : 'font-normal text-muted',
          )}
        >
          {preview}
        </p>
        {facts ? (
          <p
            data-testid="trade-list-facts"
            className="min-w-0 truncate text-[11px] font-medium leading-snug text-muted"
          >
            {facts}
          </p>
        ) : null}
      </div>
    </>
  );

  if (item.kind === 'sample') {
    return (
      <div data-needs-you={needsLabel ? 'true' : undefined} className={rowClass}>
        {body}
      </div>
    );
  }

  return (
    <Link
      to={`/orders/${item.order.id}`}
      data-testid="trade-list-row"
      data-needs-you={needsLabel ? 'true' : undefined}
      className={rowClass}
    >
      {body}
    </Link>
  );
}
