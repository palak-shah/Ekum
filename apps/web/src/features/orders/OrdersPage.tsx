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
  ComplaintView,
  CursorPage,
  OrderView,
  SampleView,
} from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { useMyCompany } from '@/lib/queries';
import { Avatar, Chip, EmptyState, ErrorState, FilterRail, LoadingBlock, SearchInput, cx } from '@/ui/kit';
import { ListSearchRow, ListSquareButton } from '@/ui/ListSearchRow';
import { FilterIcon, GroupIcon, LinkIcon, PlusIcon } from '@/ui/icons';
import { explorePostedWhen } from '@/ui/cards';
import { highlightSearchText } from '@/ui/highlightMatch';
import { ordersListFilterChrome } from '@/features/orders/ordersListFilterChrome';
import {
  getOrdersListTab,
  setOrdersListTab,
  type OrdersListTab,
} from '@/features/orders/ordersDirectionSession';
import { ordersListEmptyCopy } from '@/features/orders/ordersListEmpty';
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
  samplesForOthersList,
  sortTradePending,
  toTradeItems,
  tradeMatchesListTab,
  type TradeListItem,
} from './tradeList';
import { tradeNeedsYouLabel } from './tradeNeedsYouLabel';
import { TradeListGlanceCue } from './tradeListGlanceCue';
import {
  tradeListFacts,
  tradeListPathMark,
  tradeListWhen,
} from './tradeListPreview';
import { tradeListShipProgress } from './tradeListShipLine';
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
  if (
    value === 'sample' ||
    value === 'order' ||
    value === 'trading' ||
    value === 'complaint'
  ) {
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
  const [listTab, setListTabState] = useState<OrdersListTab>(() =>
    kindFromParam(kindParam) === 'sample' || kindFromParam(kindParam) === 'complaint'
      ? 'others'
      : getOrdersListTab(),
  );
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
    if (next === 'sample' || next === 'complaint') {
      setOrdersListTab('others');
      setListTabState('others');
    }
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
  const complaints = useQuery({
    queryKey: ['complaints', { list: true }],
    queryFn: () => api.get<CursorPage<ComplaintView>>('/complaints', { limit: 50 }),
  });

  const merged = useMemo(
    () =>
      toTradeItems(
        orders.data?.results ?? [],
        samplesForOthersList(samples.data?.results ?? [], orders.data?.results ?? []),
        [],
        complaints.data?.results ?? [],
      ),
    [orders.data, samples.data, complaints.data],
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

  const inTab = useMemo(
    () => merged.filter((item) => tradeMatchesListTab(item, listTab)),
    [merged, listTab],
  );

  const filtered = useMemo(() => {
    const rows = inTab.filter((item) => {
      if (!tradeMatchesFind(item, deferredFind)) return false;
      if (findOverridesAttention) return true;
      if (statusFilter === 'pending') return matchesTradePending(item);
      return matchesTradeCompleted(item);
    });
    return sortTradePending(rows);
  }, [inTab, deferredFind, statusFilter, findOverridesAttention]);

  const counted = inTab.filter((item) => tradeMatchesFind(item, deferredFind));
  const pendingCount = counted.filter((item) => matchesTradePending(item)).length;
  const completedCount = counted.filter((item) => matchesTradeCompleted(item)).length;

  const setListTab = (next: OrdersListTab) => {
    setOrdersListTab(next);
    setListTabState(next);
    if (next !== 'others' && (find.kindFacet === 'sample' || find.kindFacet === 'complaint')) {
      setKindFacet(null);
    }
  };

  const filterChrome = ordersListFilterChrome();

  const loading =
    (orders.isPending && !orders.data) ||
    (samples.isPending && !samples.data) ||
    (complaints.isPending && !complaints.data);
  const ordersFailed = orders.isError && !orders.data;

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
    if (kind === 'sample' || kind === 'complaint') {
      setOrdersListTab('others');
      setListTabState('others');
    }
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
            <p className="text-xs font-body text-muted">
              Showing <span className="capitalize text-ink">{summaryLabel}</span>
            </p>
            <button
              type="button"
              onClick={clearFind}
              className="inline-flex min-h-11 items-center text-xs font-emphasis tracking-tight text-accent"
            >
              Clear
            </button>
          </div>
        ) : null}
      </div>

      <div
        data-testid="orders-list-filters"
        className={cx('flex min-w-0 flex-col gap-2', findOverridesAttention && 'opacity-50')}
      >
        <div className={filterChrome.tabRowClass} role="tablist" aria-label="Whose orders">
          {(
            [
              ['selling', 'Selling'],
              ['buying', 'Buying'],
              ['others', 'Others'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={listTab === value}
              data-testid={`orders-tab-${value}`}
              onClick={() => setListTab(value)}
              className={cx(
                filterChrome.tabClass,
                listTab === value ? 'text-accent' : 'text-muted',
              )}
            >
              {label}
              <span
                aria-hidden
                className={cx(
                  'absolute inset-x-0 bottom-0 h-1',
                  listTab === value ? 'bg-accent' : 'bg-transparent',
                )}
              />
            </button>
          ))}
        </div>
        <FilterRail className="gap-1.5">
          {(
            [
              ['pending', 'Pending', pendingCount],
              ['completed', 'Completed', completedCount],
            ] as const
          ).map(([value, label, count]) => {
            const on = !findOverridesAttention && statusFilter === value;
            return (
              <Chip
                key={value}
                compact
                active={on}
                data-testid={`orders-summary-${value}`}
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
                <span className="inline-flex items-center gap-1">
                  {label}
                  <span className="tabular-nums">{count}</span>
                </span>
              </Chip>
            );
          })}
        </FilterRail>
      </div>

      {loading ? (
        <LoadingBlock />
      ) : ordersFailed ? (
        <ErrorState message="Could not load orders." onRetry={() => void orders.refetch()} />
      ) : (
        <div className="min-h-[12rem]">
          {filtered.length > 0 ? (
            <div className="flex flex-col gap-2" data-testid="orders-trade-list">
              {filtered.map((item) => (
                <TradeRow
                  key={`${item.kind}-${item.id}`}
                  item={item}
                  companyId={me.data?.id ?? null}
                  highlightQuery={find.needle}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              {...ordersListEmptyCopy({
                tab: listTab,
                status: statusFilter,
                searching: findOverridesAttention,
                complaintFind: find.kindFacet === 'complaint',
              })}
            />
          )}
        </div>
      )}
    </div>
  );
}

const TRADE_LIST_AVATAR_SIZE = 48;

function TradeListMedia({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl: string | null;
}) {
  return (
    <div className="h-12 w-12 shrink-0" data-testid="trade-list-media">
      <Avatar name={name} imageUrl={logoUrl} size={TRADE_LIST_AVATAR_SIZE} />
    </div>
  );
}

function TradeRow({
  item,
  companyId,
  highlightQuery = '',
}: {
  item: TradeListItem;
  companyId: string | null;
  highlightQuery?: string;
}) {
  if (item.kind === 'return') return null;

  const orderId = item.kind === 'order' ? item.order.id : null;
  const needsLabel = tradeNeedsYouLabel(item);
  const pathMark = tradeListPathMark(item, companyId);
  const facts = tradeListFacts(item);
  const when = explorePostedWhen(tradeListWhen(item));
  const progress = item.kind === 'order' ? tradeListShipProgress(item.order) : null;
  const name =
    item.kind === 'order'
      ? item.order.counterpart.name
      : item.kind === 'sample'
        ? item.sample.counterpart.name
        : item.complaint.counterpartName || 'Complaint';
  const logoUrl =
    item.kind === 'order'
      ? item.order.counterpart.logoUrl
      : item.kind === 'sample'
        ? item.sample.counterpart.logoUrl
        : null;

  const rowClass = cx(
    'relative flex w-full flex-col overflow-hidden rounded-xl border border-line bg-surface px-3 py-3 text-left',
    (item.kind === 'order' || item.kind === 'complaint') &&
      'hover:border-accent/40 hover:bg-accent/[0.03] active:bg-accent/[0.05]',
  );

  const media = <TradeListMedia name={name} logoUrl={logoUrl} />;

  const meta = (
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline justify-between gap-2">
        <p className="flex min-w-0 items-center gap-1 text-name font-emphasis leading-tight text-ink">
          <span className="truncate">{highlightSearchText(name, highlightQuery)}</span>
          {pathMark === 'direct' ? (
            <span
              className="inline-flex shrink-0 text-muted"
              title="Direct connection"
              data-testid="trade-list-path-direct"
            >
              <GroupIcon width={14} height={14} aria-hidden />
            </span>
          ) : null}
          {pathMark === 'handle' ? (
            <span
              className="inline-flex shrink-0 text-muted"
              title="Through you"
              data-testid="trade-list-path-handle"
            >
              <LinkIcon width={14} height={14} aria-hidden />
            </span>
          ) : null}
        </p>
        <span className="shrink-0 text-meta font-body tabular-nums text-muted">{when}</span>
      </div>
      <div className="mt-0.5 flex min-h-6 items-center justify-between gap-2.5">
        <p
          data-testid="trade-list-facts"
          className="min-w-0 flex-1 truncate text-meta font-body leading-snug text-muted"
        >
          {facts ? highlightSearchText(facts, highlightQuery) : null}
        </p>
        <TradeListGlanceCue item={item} />
      </div>
    </div>
  );

  const bar =
    progress != null ? (
      <span
        data-testid="trade-list-progress"
        data-progress={`${progress.shipped}/${progress.total}`}
        aria-hidden
        className={cx(
          'pointer-events-none absolute inset-x-0 bottom-0 h-[3px]',
          progress.over ? 'bg-warning' : 'bg-accent/70',
        )}
        style={{
          width: `${Math.min(100, Math.round((progress.shipped / progress.total) * 100))}%`,
        }}
      />
    ) : null;

  const body = (
    <>
      <div className="flex w-full items-start gap-3">
        {media}
        {meta}
      </div>
      {bar}
    </>
  );

  if (item.kind === 'sample') {
    return (
      <div data-needs-you={needsLabel ? 'true' : undefined} className={rowClass}>
        {body}
      </div>
    );
  }

  const to =
    item.kind === 'complaint'
      ? item.complaint.threadId
        ? item.complaint.messageId
          ? `/chats/${item.complaint.threadId}?message=${encodeURIComponent(item.complaint.messageId)}`
          : `/chats/${item.complaint.threadId}`
        : item.complaint.orderId
          ? `/orders/${item.complaint.orderId}`
          : null
      : `/orders/${item.order.id}`;

  if (!to) {
    return (
      <div data-testid="trade-list-row" className={rowClass}>
        {body}
      </div>
    );
  }

  return (
    <Link
      to={to}
      data-testid="trade-list-row"
      data-order-id={orderId ?? undefined}
      data-needs-you={needsLabel ? 'true' : undefined}
      className={cx(rowClass, 'text-inherit no-underline')}
    >
      {body}
    </Link>
  );
}
