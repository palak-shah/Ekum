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
import { Card, Chip, EmptyState, FilterRail, LoadingBlock, StatusPill, TextInput, cx } from '@/ui/kit';
import { ListSearchRow, ListSquareButton } from '@/ui/ListSearchRow';
import { PlusIcon } from '@/ui/icons';
import { returnStatusLabel } from '@/lib/status';
import {
  dateFacetFromNeedle,
  emptyFindState,
  effectiveDateFacet,
  findNeedsServer,
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

type Direction = 'all' | 'buying' | 'selling';
type StatusFilter = 'needs' | 'progress' | 'completed';

/** Quiet inline shortcuts — no floating panel. List is the result. */
const QUICK_STATUS = [
  { label: 'Requested', status: 'requested' },
  { label: 'Confirmed', status: 'confirmed' },
  { label: 'Dispatched', status: 'dispatched' },
  { label: 'Delivered', status: 'delivered' },
] as const;

const QUICK_KIND: { label: string; kind: TradeKindFacet }[] = [
  { label: 'Sample', kind: 'sample' },
  { label: 'Return', kind: 'return' },
];

function kindFromParam(value: string | null): TradeFindState['kindFacet'] {
  if (value === 'sample' || value === 'return' || value === 'order') return value;
  return null;
}

export function OrdersPage() {
  const navigate = useNavigate();
  const [params, setSearchParams] = useSearchParams();
  const filterParam = params.get('filter');
  const kindParam = params.get('kind');
  const findWrapRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState<Direction>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() =>
    filterParam === 'needs' || filterParam === 'progress' || filterParam === 'completed'
      ? filterParam
      : 'progress',
  );
  const [find, setFind] = useState<TradeFindState>(() => ({
    ...emptyFindState(),
    kindFacet: kindFromParam(kindParam),
  }));
  const [findFocused, setFindFocused] = useState(false);
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

  const serverFind = findNeedsServer(deferredFind);
  const orderParams = useMemo(() => {
    const params: Record<string, string | number> = { limit: 50 };
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

  const setKindFacet = (kind: TradeKindFacet | null) => {
    setFind((prev) => ({ ...prev, kindFacet: kind, needle: '' }));
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (!kind || kind === 'order') next.delete('kind');
        else next.set('kind', kind);
        return next;
      },
      { replace: true },
    );
  };

  const onFindNeedleChange = (raw: string) => {
    const kindWord = raw.trim().toLowerCase();
    if (kindWord === 'return' || kindWord === 'sample' || kindWord === 'order') {
      setKindFacet(kindWord);
      return;
    }
    setFind((prev) => ({ ...prev, needle: raw }));
  };

  const clearFind = () => {
    setFind(emptyFindState());
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('kind');
        return next;
      },
      { replace: true },
    );
  };

  const activeLabel = [
    find.kindFacet === 'sample'
      ? 'Sample'
      : find.kindFacet === 'return'
        ? 'Return'
        : find.kindFacet === 'order'
          ? 'Order'
          : null,
    find.statusFacet?.replace(/_/g, ' '),
    find.dateFacet?.label,
    find.needle.trim() || null,
  ]
    .filter(Boolean)
    .join(' · ');

  const showQuick =
    findFocused &&
    !find.needle.trim() &&
    !find.kindFacet &&
    !find.statusFacet &&
    !find.dateFacet;

  return (
    <div className="flex flex-col gap-2.5">
      <div ref={findWrapRef} className="flex w-full flex-col gap-1.5">
        <ListSearchRow
          search={
            <TextInput
              className="w-full"
              value={find.needle}
              onChange={(e) => onFindNeedleChange(e.target.value)}
              onFocus={() => setFindFocused(true)}
              onBlur={() => {
                window.setTimeout(() => setFindFocused(false), 150);
              }}
              placeholder="Name, status, today…"
              aria-label="Search orders, samples, returns"
              autoComplete="off"
            />
          }
          action={
            <ListSquareButton
              aria-label="New order"
              onClick={() => navigate('/orders/new')}
            >
              <PlusIcon width={20} height={20} />
            </ListSquareButton>
          }
        />
        {showQuick ? (
          <div className="flex flex-wrap gap-x-3 gap-y-1 px-0.5">
            {QUICK_STATUS.map((item) => (
              <button
                key={item.status}
                type="button"
                className="text-[12px] font-medium text-muted hover:text-ink"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() =>
                  setFind((prev) => ({
                    ...prev,
                    statusFacet: item.status,
                    needle: '',
                  }))
                }
              >
                {item.label}
              </button>
            ))}
            {QUICK_KIND.map((item) => (
              <button
                key={item.kind}
                type="button"
                className="text-[12px] font-medium text-muted hover:text-ink"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setKindFacet(item.kind)}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
        {activeLabel ? (
          <p className="px-0.5 text-[12px] text-muted">
            <span className="capitalize text-ink">{activeLabel}</span>
            {' · '}
            <button type="button" className="font-medium text-accent" onClick={clearFind}>
              Clear
            </button>
          </p>
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
                <TradeRow key={`${item.kind}-${item.id}`} item={item} />
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

function TradeRow({ item }: { item: TradeListItem }) {
  if (item.kind === 'order') {
    const order = item.order;
    const staff =
      order.updatedBy?.name?.trim() || order.createdBy?.name?.trim() || null;
    const isInquiry = order.intent === 'inquiry';
    const idLabel = shortOrderLabel(order.id, { inquiry: isInquiry });
    return (
      <Link to={`/orders/${order.id}`}>
        <Card className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{order.counterpart.name}</p>
            <p className="text-xs text-muted">
              {idLabel}
              {' · '}
              {isInquiry ? null : order.direction === 'buying' ? 'You buy · ' : 'You sell · '}
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
