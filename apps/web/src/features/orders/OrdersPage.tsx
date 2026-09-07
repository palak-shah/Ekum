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
import { Card, Chip, EmptyState, FilterRail, LoadingBlock, StatusPill, TextInput, cx } from '@/ui/kit';
import { ListSearchRow, ListSquareButton } from '@/ui/ListSearchRow';
import { FilterIcon, PlusIcon } from '@/ui/icons';
import { returnStatusLabel } from '@/lib/status';
import { orderViewerIsFacilitator } from '@/features/browse/forwardAttribution';
import { orderListLinkedCue, orderListRoleBit } from '@/features/orders/tradeListRole';
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
  matchesTradeProgress,
  toTradeItems,
  type TradeListItem,
} from './tradeList';
import { OrdersFilterMenu } from './OrdersFilterMenu';
import { statusFromParam, tradeMenuFilterSummary } from './ordersFilterConfig';

type Direction = 'all' | 'buying' | 'selling';
type StatusFilter = 'needs' | 'progress' | 'completed';

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
  const [direction, setDirection] = useState<Direction>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() =>
    filterParam === 'needs' || filterParam === 'progress' || filterParam === 'completed'
      ? filterParam
      : 'progress',
  );
  const [find, setFind] = useState<TradeFindState>(() => ({
    ...emptyFindState(),
    kindFacet: kindFromParam(kindParam),
    statusFacet: statusFromParam(statusParam),
  }));
  const listStatus = useDeferredValue(statusFilter);
  const listDirection = useDeferredValue(direction);
  const deferredFind = useDeferredValue(find);

  useEffect(() => {
    if (filterParam === 'needs' || filterParam === 'progress' || filterParam === 'completed') {
      setStatusFilter(filterParam);
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
    return merged.filter((item) => {
      if (!tradeMatchesFind(item, deferredFind)) return false;
      if (listDirection !== 'all' && item.direction !== listDirection) return false;
      if (findOverridesAttention) return true;
      if (listStatus === 'needs') return matchesTradeNeeds(item);
      if (listStatus === 'progress') return matchesTradeProgress(item);
      return matchesTradeCompleted(item);
    });
  }, [merged, deferredFind, listDirection, listStatus, findOverridesAttention]);

  const showDirection =
    merged.some((i) => i.direction === 'buying') &&
    merged.some((i) => i.direction === 'selling');

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
            <TextInput
              className="w-full"
              value={find.needle}
              onChange={(e) => onFindNeedleChange(e.target.value)}
              placeholder="Name, status, today…"
              aria-label="Search orders, samples, returns"
              autoComplete="off"
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

      <div className="flex items-center gap-2">
        <FilterRail className={cx('min-w-0 flex-1', findOverridesAttention && 'opacity-50')}>
          {(
            [
              ['needs', 'Needs you'],
              ['progress', 'In progress'],
              ['completed', 'Completed'],
            ] as const
          ).map(([value, label]) => (
            <Chip
              key={value}
              active={!findOverridesAttention && statusFilter === value}
              onClick={() => {
                setStatusFilter(value);
                if (findOverridesAttention) {
                  clearFind();
                }
              }}
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

      {loading ? (
        <LoadingBlock />
      ) : (
        <div className="min-h-[12rem]">
          {filtered.length > 0 ? (
            <div className="flex flex-col gap-2">
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
                  : listStatus === 'needs'
                    ? 'Nothing needs you'
                    : 'No orders here'
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
      <Link to={`/orders/${order.id}`}>
        <Card className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{order.counterpart.name}</p>
            <p className="text-xs text-muted">
              {idLabel}
              {roleBit ? ` · ${roleBit}` : ''}
              {mills ? ` · ${mills}` : ''}
              {' · '}
              {order.items.length} {order.items.length === 1 ? 'item' : 'items'} ·{' '}
              {timeAgo(order.createdAt)}
              {staff ? ` · ${staff}` : ''}
            </p>
          </div>
          <StatusPill status={order.status} />
        </Card>
      </Link>
    );
  }

  if (item.kind === 'sample') {
    const sample = item.sample;
    return (
      <Card className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{sample.name}</p>
          <p className="text-xs text-muted">
            Sample · {sample.counterpart.name} · {timeAgo(sample.createdAt)}
          </p>
        </div>
        <StatusPill status={sample.status} />
      </Card>
    );
  }

  const ret = item.ret;
  const linePreview = ret.items
    .map((line) => `${line.name} × ${line.requestedQuantity}`)
    .join(' · ');
  return (
    <Link to={`/orders/${ret.orderId}?return=${ret.id}`}>
      <Card className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{ret.counterpart.name}</p>
          <p className="truncate text-xs text-muted">
            Return · {linePreview || `${ret.items.length} designs`} · {timeAgo(ret.createdAt)}
          </p>
        </div>
        <StatusPill status={ret.status} label={returnStatusLabel(ret.status)} />
      </Card>
    </Link>
  );
}
