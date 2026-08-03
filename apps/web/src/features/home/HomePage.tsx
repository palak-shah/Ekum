import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type {
  AccessRequestView,
  CursorPage,
  NotificationView,
  OrderView,
  CollectionCard,
  ThreadSummary,
} from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { timeAgo } from '@/lib/format';
import { CollectionTile } from '@/ui/cards';
import { Button, EmptyState, LoadingBlock, SectionHeader, cx } from '@/ui/kit';

export function HomePage() {
  const incoming = useQuery({
    queryKey: ['access-requests', 'incoming'],
    queryFn: () => api.get<AccessRequestView[]>('/access-requests/incoming'),
  });
  const sellingRequested = useQuery({
    queryKey: ['orders', { direction: 'selling', status: 'requested' }],
    queryFn: () =>
      api.get<CursorPage<OrderView>>('/orders', { direction: 'selling', status: 'requested', limit: 10 }),
  });
  const buyingDispatched = useQuery({
    queryKey: ['orders', { direction: 'buying', status: 'dispatched' }],
    queryFn: () =>
      api.get<CursorPage<OrderView>>('/orders', { direction: 'buying', status: 'dispatched', limit: 10 }),
  });
  const threadRequests = useQuery({
    queryKey: ['threads', { state: 'pending' }],
    queryFn: () => api.get<CursorPage<ThreadSummary>>('/threads', { state: 'pending', limit: 10 }),
  });
  const notifications = useQuery({
    queryKey: ['notifications', { home: true }],
    queryFn: () => api.get<CursorPage<NotificationView>>('/notifications', { limit: 8 }),
  });
  const followed = useQuery({
    queryKey: ['explore', 'collections', { following: true }],
    queryFn: () =>
      api.get<CursorPage<CollectionCard>>('/explore/collections', { following: true, limit: 12 }),
  });

  const accessCount = incoming.data?.length ?? 0;
  const ordersToConfirm = sellingRequested.data?.results.length ?? 0;
  const ordersToDeliver = buyingDispatched.data?.results.length ?? 0;
  const ordersNeed = ordersToConfirm + ordersToDeliver;
  const chatRequests = threadRequests.data?.results.length ?? 0;
  const needsCount = accessCount + ordersNeed + chatRequests;

  const loadingNeeds =
    incoming.isLoading ||
    sellingRequested.isLoading ||
    buyingDispatched.isLoading ||
    threadRequests.isLoading;

  const dayOneEmpty =
    !loadingNeeds &&
    needsCount === 0 &&
    !(notifications.data?.results.length) &&
    !(followed.data?.results.length);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <SectionHeader title="Needs you" />
        {loadingNeeds ? (
          <LoadingBlock />
        ) : needsCount === 0 ? (
          dayOneEmpty ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-8 text-center">
              <p className="text-sm font-semibold text-ink">Find businesses to trade with</p>
              <p className="text-xs text-muted">Browse collections and request access when you're ready.</p>
              <Link to="/explore">
                <Button>Explore</Button>
              </Link>
            </div>
          ) : (
            <EmptyState title="You're all caught up" message="New requests and orders will surface here." />
          )
        ) : (
          <div className="flex flex-wrap gap-2">
            {ordersNeed > 0 ? (
              <ActionChip
                to="/orders?filter=needs"
                label={`${ordersNeed} order${ordersNeed === 1 ? '' : 's'} need you`}
              />
            ) : null}
            {accessCount > 0 ? (
              <ActionChip
                to="/buyers"
                label={`${accessCount} access request${accessCount === 1 ? '' : 's'}`}
              />
            ) : null}
            {chatRequests > 0 ? (
              <ActionChip
                to="/chats"
                label={`${chatRequests} chat request${chatRequests === 1 ? '' : 's'}`}
              />
            ) : null}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <SectionHeader
          title="Addressed to you"
          action={
            <Link to="/notifications" className="text-xs font-medium text-accent">
              See all
            </Link>
          }
        />
        {notifications.isLoading ? (
          <LoadingBlock />
        ) : notifications.data && notifications.data.results.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {notifications.data.results.map((item) => (
              <NotificationLine key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState title="Nothing new" message="Order updates and messages will appear here." />
        )}
      </section>

      <section className="flex flex-col gap-2">
        <SectionHeader
          title="Followed"
          action={
            <Link to="/explore" className="text-xs font-medium text-accent">
              Explore
            </Link>
          }
        />
        {followed.isLoading ? (
          <LoadingBlock />
        ) : followed.data && followed.data.results.length > 0 ? (
          <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
            {followed.data.results.map((collection) => (
              <CollectionTile key={collection.id} collection={collection} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Follow businesses you trade with"
            message="Their new collections show up here."
          />
        )}
      </section>
    </div>
  );
}

function ActionChip({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className={cx(
        'rounded-full bg-accent px-4 py-2 text-sm font-medium text-white',
        'active:opacity-90',
      )}
    >
      {label}
    </Link>
  );
}

function notificationLink(item: NotificationView): string {
  switch (item.refType) {
    case 'order':
      return `/orders/${item.refId}`;
    case 'thread':
      return `/chats/${item.refId}`;
    case 'company':
      return `/company/${item.refId}`;
    default:
      return '/notifications';
  }
}

function NotificationLine({ item }: { item: NotificationView }) {
  return (
    <Link
      to={notificationLink(item)}
      className="flex items-start gap-2 rounded-xl px-2 py-2 hover:bg-foam"
    >
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.read ? 'bg-transparent' : 'bg-accent'}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{item.title}</p>
        {item.body ? <p className="truncate text-xs text-muted">{item.body}</p> : null}
      </div>
      <span className="text-xs text-muted">{timeAgo(item.createdAt)}</span>
    </Link>
  );
}
