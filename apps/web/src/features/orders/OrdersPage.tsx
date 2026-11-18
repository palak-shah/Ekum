import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import type {
  ComplaintView,
  CursorPage,
  OrderView,
  OrdersTabCountsView,
  SampleView,
} from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { useMyCompany } from '@/lib/queries';
import {
  Avatar,
  Button,
  Chip,
  EmptyState,
  ErrorState,
  LoadingBlock,
  SearchInput,
  cx,
} from '@/ui/kit';
import { ListSearchRow, ListSquareButton } from '@/ui/ListSearchRow';
import { FilterIcon, GroupIcon, LinkIcon, PlusIcon } from '@/ui/icons';
import { explorePostedWhen } from '@/ui/cards';
import { highlightSearchText } from '@/ui/highlightMatch';
import { ordersListFilterChrome } from '@/features/orders/ordersListFilterChrome';
import {
  UNDERLINE_TAB_BAR_BASE_CLASS,
  underlineTabChrome,
} from '@/ui/underlineTabChrome';
import {
  getOrdersListTab,
  setOrdersListTab,
  type OrdersListTab,
} from '@/features/orders/ordersDirectionSession';
import {
  firstOrdersListTabWithContent,
  firstOrdersStatusWithContent,
} from '@/features/orders/ordersListDefault';
import { ordersListEmptyCopy } from '@/features/orders/ordersListEmpty';
import { ordersListNeedsLoadMore } from '@/features/orders/ordersLoadMore';
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
  matchesTradeNeeds,
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
  // Needs you uses its own filter; progress still lands on Pending.
  if (value === 'pending' || value === 'needs' || value === 'progress') return 'pending';
  return 'pending';
}

function needsYouFromParam(value: string | null): boolean {
  return value === 'needs';
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
  const contentSeeded = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [listTab, setListTabState] = useState<OrdersListTab>(() =>
    kindFromParam(kindParam) === 'sample' || kindFromParam(kindParam) === 'complaint'
      ? 'others'
      : getOrdersListTab(),
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() =>
    statusFilterFromParam(filterParam),
  );
  const [needsYouFilter, setNeedsYouFilter] = useState(() => needsYouFromParam(filterParam));
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
      setNeedsYouFilter(false);
      return;
    }
    if (filterParam === 'needs') {
      setNeedsYouFilter(true);
      setStatusFilter('pending');
      return;
    }
    if (filterParam === 'pending' || filterParam === 'progress' || filterParam === 'completed') {
      setNeedsYouFilter(false);
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
    } else if (listTab === 'selling' || listTab === 'buying') {
      params.direction = listTab;
    }
    if (dateFacet) {
      params.createdFrom = dateFacet.from;
      params.createdTo = dateFacet.to;
    }
    return params;
  }, [serverFind, deferredFind, listTab]);

  const countParams = useMemo(() => {
    const params: Record<string, string> = { tab: listTab };
    const dateFacet = effectiveDateFacet(deferredFind);
    const needleIsDate = Boolean(dateFacetFromNeedle(deferredFind.needle));
    if (serverFind && deferredFind.needle.trim().length >= 2 && !needleIsDate) {
      params.q = deferredFind.needle.trim();
    }
    if (dateFacet) {
      params.createdFrom = dateFacet.from;
      params.createdTo = dateFacet.to;
    }
    return params;
  }, [listTab, serverFind, deferredFind]);

  const orders = useInfiniteQuery({
    queryKey: ['orders', { list: true, infinite: true, ...orderParams }],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      api.get<CursorPage<OrderView>>('/orders', {
        ...orderParams,
        ...(pageParam ? { cursor: pageParam } : {}),
      }),
    getNextPageParam: (last) => last.nextCursor,
  });
  const samples = useInfiniteQuery({
    queryKey: ['samples', { list: true, infinite: true }],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      api.get<CursorPage<SampleView>>('/samples', {
        limit: 50,
        ...(pageParam ? { cursor: pageParam } : {}),
      }),
    getNextPageParam: (last) => last.nextCursor,
  });
  const complaints = useInfiniteQuery({
    queryKey: ['complaints', { list: true, infinite: true }],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      api.get<CursorPage<ComplaintView>>('/complaints', {
        limit: 50,
        ...(pageParam ? { cursor: pageParam } : {}),
      }),
    getNextPageParam: (last) => last.nextCursor,
  });
  const tabCounts = useQuery({
    queryKey: ['orders', 'tab-counts', countParams],
    queryFn: () => api.get<OrdersTabCountsView>('/orders/tab-counts', countParams),
  });

  const orderRows = useMemo(
    () => orders.data?.pages.flatMap((page) => page.results) ?? [],
    [orders.data],
  );
  const sampleRows = useMemo(
    () => samples.data?.pages.flatMap((page) => page.results) ?? [],
    [samples.data],
  );
  const complaintRows = useMemo(
    () => complaints.data?.pages.flatMap((page) => page.results) ?? [],
    [complaints.data],
  );

  const merged = useMemo(
    () =>
      toTradeItems(
        orderRows,
        samplesForOthersList(sampleRows, orderRows),
        [],
        complaintRows,
      ),
    [orderRows, sampleRows, complaintRows],
  );

  const findOverridesAttention =
    Boolean(deferredFind.kindFacet) ||
    Boolean(deferredFind.dateFacet) ||
    Boolean(dateFacetFromNeedle(deferredFind.needle)) ||
    deferredFind.needle.trim().length > 0;

  const attentionOverrides = findOverridesAttention || needsYouFilter;

  const filterApplied = Boolean(
    find.statusFacet || find.kindFacet || find.dateFacet || needsYouFilter,
  );
  const filterIconActive = filterApplied || menuOpen;

  const inTab = useMemo(
    () => merged.filter((item) => tradeMatchesListTab(item, listTab)),
    [merged, listTab],
  );

  const filtered = useMemo(() => {
    const rows = inTab.filter((item) => {
      if (!tradeMatchesFind(item, deferredFind)) return false;
      if (needsYouFilter) {
        return matchesTradeNeeds(item, me.data?.id ?? null);
      }
      if (findOverridesAttention) return true;
      if (statusFilter === 'pending') return matchesTradePending(item);
      return matchesTradeCompleted(item);
    });
    return sortTradePending(rows);
  }, [inTab, deferredFind, statusFilter, findOverridesAttention, needsYouFilter, me.data?.id]);

  const pendingCount = tabCounts.data?.pending ?? 0;
  const completedCount = tabCounts.data?.completed ?? 0;

  const hasMoreOrders =
    listTab !== 'others' && Boolean(orders.hasNextPage);
  const hasMoreOthers =
    listTab === 'others' &&
    (Boolean(samples.hasNextPage) || Boolean(complaints.hasNextPage));
  const serverHasMore = hasMoreOrders || hasMoreOthers;
  const knownTotalForView: number | null = findOverridesAttention
    ? null
    : !tabCounts.data
      ? null
      : needsYouFilter
        ? tabCounts.data.needsYou
        : statusFilter === 'pending'
          ? tabCounts.data.pending
          : tabCounts.data.completed;
  const hasMore = ordersListNeedsLoadMore({
    serverHasMore,
    loadedVisible: filtered.length,
    knownTotal: knownTotalForView,
  });
  const loadingMore =
    orders.isFetchingNextPage ||
    samples.isFetchingNextPage ||
    complaints.isFetchingNextPage;
  const fetchMore = () => {
    if (listTab === 'others') {
      if (samples.hasNextPage) void samples.fetchNextPage();
      if (complaints.hasNextPage) void complaints.fetchNextPage();
      return;
    }
    if (orders.hasNextPage) void orders.fetchNextPage();
  };

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

  const setNeedsYou = (next: boolean) => {
    setNeedsYouFilter(next);
    if (next) {
      setStatusFilter('pending');
      setFind((prev) => ({ ...prev, statusFacet: null, needle: '' }));
    }
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (next) {
          params.set('filter', 'needs');
          params.delete('status');
        } else if (params.get('filter') === 'needs') {
          params.set('filter', statusFilter);
        }
        return params;
      },
      { replace: true },
    );
  };

  useEffect(() => {
    if (contentSeeded.current || loading) return;
    contentSeeded.current = true;

    // Explicit direction: sample/complaint deep link, or session Buying/Others (ticket Back).
    // Platform-default Selling (or a stale empty remembered tab) → first tab with content.
    const kindLocked =
      kindFromParam(kindParam) === 'sample' || kindFromParam(kindParam) === 'complaint';
    const directionIntent = kindLocked || listTab === 'buying' || listTab === 'others';

    let nextTab = listTab;
    if (!kindLocked) {
      const counts: Record<OrdersListTab, number> = {
        selling: merged.filter((item) => tradeMatchesListTab(item, 'selling')).length,
        buying: merged.filter((item) => tradeMatchesListTab(item, 'buying')).length,
        others: merged.filter((item) => tradeMatchesListTab(item, 'others')).length,
      };
      if (!directionIntent || counts[listTab] === 0) {
        nextTab = firstOrdersListTabWithContent(counts);
        if (nextTab !== listTab) {
          setOrdersListTab(nextTab);
          setListTabState(nextTab);
        }
      }
    }

    // Explicit status: any ?filter= / ?status= (Home Needs, chip tap, deep link).
    const statusIntent =
      filterParam === 'completed' ||
      filterParam === 'pending' ||
      filterParam === 'needs' ||
      filterParam === 'progress' ||
      Boolean(statusParam && statusFromParam(statusParam));

    if (!statusIntent && !findOverridesAttention && !needsYouFilter) {
      const pending = tabCounts.data?.pending ?? 0;
      const completed = tabCounts.data?.completed ?? 0;
      // Fall back to loaded rows when counts have not arrived yet.
      const inChosen = merged.filter((item) => tradeMatchesListTab(item, nextTab));
      const pendingFallback = inChosen.filter((item) => matchesTradePending(item)).length;
      const completedFallback = inChosen.filter((item) => matchesTradeCompleted(item)).length;
      const nextStatus = firstOrdersStatusWithContent(
        tabCounts.data ? pending : pendingFallback,
        tabCounts.data ? completed : completedFallback,
      );
      if (nextStatus !== statusFilter) setStatusFilter(nextStatus);
    }
  }, [
    loading,
    merged,
    listTab,
    kindParam,
    filterParam,
    statusParam,
    findOverridesAttention,
    needsYouFilter,
    statusFilter,
    tabCounts.data,
  ]);

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
    setNeedsYouFilter(false);
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
    setNeedsYouFilter(false);
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
        if (next.get('filter') === 'needs') next.set('filter', statusFilter);
        return next;
      },
      { replace: true },
    );
  };

  const clearFind = () => {
    setNeedsYouFilter(false);
    setFind(emptyFindState());
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('kind');
        next.delete('status');
        if (next.get('filter') === 'needs') next.set('filter', statusFilter);
        return next;
      },
      { replace: true },
    );
  };

  const menuFilterSummary = tradeMenuFilterSummary({
    statusFacet: find.statusFacet,
    kindFacet: find.kindFacet,
    dateFacet: find.dateFacet,
    needsYou: needsYouFilter,
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
          needsYou={needsYouFilter}
          onStatus={setStatusFacet}
          onKind={setKindFacet}
          onNeedsYou={setNeedsYou}
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
        className={cx('flex min-w-0 flex-col gap-2', attentionOverrides && 'opacity-50')}
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
                underlineTabChrome(listTab === value).buttonClass,
              )}
            >
              {label}
              <span
                aria-hidden
                className={cx(
                  UNDERLINE_TAB_BAR_BASE_CLASS,
                  underlineTabChrome(listTab === value).barClass,
                )}
              />
            </button>
          ))}
        </div>
        {/* Two chips only — plain flex, not FilterRail (overflow-x-auto fails BM-07). */}
        <div className="flex min-w-0 flex-wrap gap-1.5">
          {(
            [
              ['pending', 'Pending', pendingCount],
              ['completed', 'Completed', completedCount],
            ] as const
          ).map(([value, label, count]) => {
            const on = !attentionOverrides && statusFilter === value;
            return (
              <Chip
                key={value}
                compact
                active={on}
                data-testid={`orders-summary-${value}`}
                onClick={() => {
                  if (statusFilter === value && !attentionOverrides) return;
                  setStatusFilter(value);
                  setNeedsYouFilter(false);
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
                        !attentionOverrides &&
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
        </div>
      </div>

      {loading ? (
        <LoadingBlock />
      ) : ordersFailed ? (
        <ErrorState message="Could not load orders." onRetry={() => void orders.refetch()} />
      ) : (
        <div className="min-h-[12rem]">
          {filtered.length > 0 ? (
            <>
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
              {hasMore ? (
                <div className="px-4 pb-2 pt-2">
                  <Button
                    variant="secondary"
                    fullWidth
                    data-testid="orders-load-more"
                    disabled={loadingMore}
                    onClick={fetchMore}
                  >
                    {loadingMore ? 'Loading…' : 'Load more'}
                  </Button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <EmptyState
                {...ordersListEmptyCopy({
                  tab: listTab,
                  status: statusFilter,
                  searching: findOverridesAttention,
                  complaintFind: find.kindFacet === 'complaint',
                  needsYou: needsYouFilter,
                })}
              />
              {needsYouFilter && hasMore ? (
                <div className="px-4 pb-2">
                  <Button
                    variant="secondary"
                    fullWidth
                    data-testid="orders-load-more"
                    disabled={loadingMore}
                    onClick={fetchMore}
                  >
                    {loadingMore ? 'Loading…' : 'Load more'}
                  </Button>
                </div>
              ) : null}
            </div>
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
  const needsLabel = tradeNeedsYouLabel(item, companyId);
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
          {pathMark === 'direct' &&
          item.kind === 'order' &&
          !needsLabel &&
          item.order.status !== 'cancelled' &&
          item.order.status !== 'declined' &&
          (item.order.status !== 'requested' || item.order.hasSellerQuote === true) ? (
            <>
              <span data-testid="trade-list-observing">Observing</span>
              {facts ? <> · {highlightSearchText(facts, highlightQuery)}</> : null}
            </>
          ) : facts ? (
            highlightSearchText(facts, highlightQuery)
          ) : null}
        </p>
        <TradeListGlanceCue item={item} companyId={companyId} />
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
