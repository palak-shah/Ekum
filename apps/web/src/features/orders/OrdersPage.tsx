import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { CursorPage, OrderView, SampleView } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { timeAgo } from '@/lib/format';
import { Button, Card, EmptyState, LoadingBlock, StatusPill, cx } from '@/ui/kit';
import { matchesCompleted, matchesNeeds, matchesProgress } from './orderAttention';

type Segment = 'orders' | 'samples';
type Direction = 'all' | 'buying' | 'selling';
type StatusFilter = 'needs' | 'progress' | 'completed';

export function OrdersPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const segment = (params.get('tab') as Segment) || 'orders';
  const filterParam = params.get('filter');
  const [direction, setDirection] = useState<Direction>('all');
  // Default In progress so first open isn't an empty "Needs action" trap.
  // Home deep-link ?filter=needs still lands on Needs action.
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() =>
    filterParam === 'needs' || filterParam === 'progress' || filterParam === 'completed'
      ? filterParam
      : 'progress',
  );

  useEffect(() => {
    if (filterParam === 'needs' || filterParam === 'progress' || filterParam === 'completed') {
      setStatusFilter(filterParam);
    }
  }, [filterParam]);

  const orders = useQuery({
    queryKey: ['orders', { list: true }],
    queryFn: () => api.get<CursorPage<OrderView>>('/orders', { limit: 50 }),
    enabled: segment === 'orders',
  });

  const samples = useQuery({
    queryKey: ['samples'],
    queryFn: () => api.get<CursorPage<SampleView>>('/samples', { limit: 50 }),
    enabled: segment === 'samples',
  });

  const allOrders = orders.data?.results ?? [];
  const hasBuying = allOrders.some((order) => order.direction === 'buying');
  const hasSelling = allOrders.some((order) => order.direction === 'selling');
  const showDirection = hasBuying && hasSelling;

  const filtered = allOrders.filter((order) => {
    if (direction !== 'all' && order.direction !== direction) return false;
    if (statusFilter === 'needs') return matchesNeeds(order);
    if (statusFilter === 'progress') return matchesProgress(order);
    return matchesCompleted(order);
  });

  const setSegment = (next: Segment) => {
    const nextParams = new URLSearchParams(params);
    if (next === 'orders') nextParams.delete('tab');
    else nextParams.set('tab', next);
    setParams(nextParams, { replace: true });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={() => navigate('/orders/new')}>New order</Button>
      </div>

      <div className="flex gap-2">
        {(
          [
            ['orders', 'Orders'],
            ['samples', 'Samples'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setSegment(value)}
            className={cx(
              'rounded-full px-4 py-1.5 text-sm font-medium',
              segment === value ? 'bg-accent text-white' : 'bg-foam text-muted',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {segment === 'orders' ? (
        <>
          {showDirection ? (
            <div className="flex gap-2">
              {(['all', 'buying', 'selling'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDirection(value)}
                  className={cx(
                    'rounded-full px-3 py-1 text-sm font-medium capitalize',
                    direction === value ? 'bg-ink text-white' : 'bg-foam text-muted',
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {(
              [
                ['needs', 'Needs action'],
                ['progress', 'In progress'],
                ['completed', 'Completed'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={cx(
                  'rounded-full px-3 py-1.5 text-sm font-medium',
                  statusFilter === value ? 'bg-accent text-white' : 'bg-foam text-muted',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {orders.isLoading ? (
            <LoadingBlock />
          ) : filtered.length > 0 ? (
            <div className="flex flex-col gap-2">
              {filtered.map((order) => (
                <Link key={order.id} to={`/orders/${order.id}`}>
                  <Card className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{order.counterpart.name}</p>
                      <p className="text-xs text-muted">
                        {order.direction === 'buying' ? 'Buying' : 'Selling'} · {order.items.length}{' '}
                        item(s) · {timeAgo(order.createdAt)}
                      </p>
                    </div>
                    <StatusPill status={order.status} />
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title={statusFilter === 'needs' ? 'Nothing needs you' : 'No orders here'}
              message="Orders you place or receive will show up here."
            />
          )}
        </>
      ) : samples.isLoading ? (
        <LoadingBlock />
      ) : samples.data && samples.data.results.length > 0 ? (
        <div className="flex flex-col gap-2">
          {samples.data.results.map((sample) => (
            <Card key={sample.id} className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{sample.name}</p>
                <p className="text-xs text-muted">
                  {sample.counterpart.name} · {sample.direction} · {timeAgo(sample.createdAt)}
                </p>
              </div>
              <StatusPill status={sample.status} />
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No samples yet" message="Sample requests will appear here." />
      )}
    </div>
  );
}
