import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type {
  AccessRequestView,
  CompanyCard,
  CursorPage,
  NotificationView,
  OrderView,
  CollectionCard,
  ThreadSummary,
} from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { timeAgo } from '@/lib/format';
import { useTradePresence } from '@/lib/tradePresence';
import { buyerCanAcceptQuote, matchesNeeds } from '@/features/orders/orderAttention';
import { CollectionTile, CompanyRow } from '@/ui/cards';
import { Button, Chip, FilterRail, LoadingBlock, SectionHeader } from '@/ui/kit';

/**
 * Home (PDF + HTML HOME-01):
 * - Day one / empty: one welcome card → Explore (Needs/Addressed/Followed hidden)
 * - After Follow + activity: attention center — only sections with real items
 * Same tabs forever; content gates the surface.
 */
export function HomePage() {
  const { buying, selling, isLoading: tradeLoading } = useTradePresence();

  const incoming = useQuery({
    queryKey: ['access-requests', 'incoming'],
    queryFn: () => api.get<AccessRequestView[]>('/access-requests/incoming'),
  });
  const sellingRequested = useQuery({
    queryKey: ['orders', { direction: 'selling', status: 'requested' }],
    queryFn: () =>
      api.get<CursorPage<OrderView>>('/orders', {
        direction: 'selling',
        status: 'requested',
        limit: 10,
      }),
  });
  const buyingOpen = useQuery({
    queryKey: ['orders', { direction: 'buying', home: true }],
    queryFn: () =>
      api.get<CursorPage<OrderView>>('/orders', {
        direction: 'buying',
        limit: 20,
      }),
  });
  const threadRequests = useQuery({
    queryKey: ['threads', { state: 'pending' }],
    queryFn: () => api.get<CursorPage<ThreadSummary>>('/threads', { state: 'pending', limit: 10 }),
  });
  const notifications = useQuery({
    queryKey: ['notifications', { home: true }],
    queryFn: () => api.get<CursorPage<NotificationView>>('/notifications', { limit: 8 }),
  });
  const following = useQuery({
    queryKey: ['follows', 'following'],
    queryFn: () => api.get<CompanyCard[]>('/follows/following'),
  });
  const followed = useQuery({
    queryKey: ['explore', 'collections', { following: true }],
    queryFn: () =>
      api.get<CursorPage<CollectionCard>>('/explore/collections', { following: true, limit: 12 }),
  });

  const accessCount = incoming.data?.length ?? 0;
  const sellingNeed = sellingRequested.data?.results.length ?? 0;
  const buyingOrders = buyingOpen.data?.results ?? [];
  const buyingNeed = buyingOrders.filter(matchesNeeds).length;
  const buyingWaiting = buyingOrders.filter(
    (order) => order.status === 'requested' && !buyerCanAcceptQuote(order),
  ).length;
  const ordersNeed = sellingNeed + buyingNeed;
  const chatRequests = threadRequests.data?.results.length ?? 0;
  const needsCount = accessCount + ordersNeed + chatRequests;

  const loadingNeeds =
    incoming.isLoading ||
    sellingRequested.isLoading ||
    buyingOpen.isLoading ||
    threadRequests.isLoading;

  const notificationItems = notifications.data?.results ?? [];
  const followedItems = followed.data?.results ?? [];
  const followingList = following.data ?? [];
  const followingCount = followingList.length;

  const hasNeeds = needsCount > 0;
  const hasWaitingOrders = buyingWaiting > 0;
  const hasAddressed = notificationItems.length > 0;
  const hasFollowedShelf = followedItems.length > 0;
  const hasNetwork = followingCount > 0;

  const stillBootstrapping =
    loadingNeeds ||
    following.isLoading ||
    notifications.isLoading ||
    followed.isLoading ||
    tradeLoading;

  /**
   * HTML isNewEmptyAccount(): no personal signal yet.
   * Day-one doorway — not an empty attention dashboard.
   */
  const dayOne =
    !stillBootstrapping &&
    !hasNeeds &&
    !hasWaitingOrders &&
    !hasAddressed &&
    !hasNetwork &&
    !hasFollowedShelf;

  if (stillBootstrapping) {
    return <LoadingBlock label="Opening home…" />;
  }

  return (
    <div className="ekum-rise flex flex-col gap-7">
      {dayOne ? <DayOneWelcome buying={buying} selling={selling} /> : null}

      {hasNeeds ? (
        <section className="flex flex-col gap-2.5">
          <SectionHeader title="Needs you" />
          <FilterRail>
            {ordersNeed > 0 ? (
              <Link to="/orders?filter=needs">
                <Chip active>
                  {ordersNeed} order{ordersNeed === 1 ? '' : 's'} need you
                </Chip>
              </Link>
            ) : null}
            {accessCount > 0 ? (
              <Link to="/buyers">
                <Chip active>
                  {accessCount} access request{accessCount === 1 ? '' : 's'}
                </Chip>
              </Link>
            ) : null}
            {chatRequests > 0 ? (
              <Link to="/chats">
                <Chip active>
                  {chatRequests} chat request{chatRequests === 1 ? '' : 's'}
                </Chip>
              </Link>
            ) : null}
          </FilterRail>
        </section>
      ) : null}

      {hasWaitingOrders ? (
        <section className="flex flex-col gap-2.5">
          <SectionHeader title="In progress" />
          <FilterRail>
            <Link to="/orders?filter=progress">
              <Chip>
                {buyingWaiting} order{buyingWaiting === 1 ? '' : 's'} awaiting quote
              </Chip>
            </Link>
          </FilterRail>
        </section>
      ) : null}

      {hasAddressed ? (
        <section className="flex flex-col gap-2">
          <SectionHeader
            title="Addressed to you"
            action={
              <Link to="/notifications" className="text-xs font-bold text-accent">
                See all
              </Link>
            }
          />
          <div className="divide-y divide-line rounded-2xl bg-surface px-1 shadow-[var(--shadow-soft)]">
            {notificationItems.map((item) => (
              <NotificationLine key={item.id} item={item} />
            ))}
          </div>
        </section>
      ) : null}

      {hasFollowedShelf || hasNetwork ? (
        <section className="flex flex-col gap-2.5">
          <SectionHeader
            title="Followed"
            action={
              <Link to="/explore" className="text-xs font-bold text-accent">
                Explore
              </Link>
            }
          />
          {hasFollowedShelf ? (
            <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
              {followedItems.map((collection) => (
                <CollectionTile key={collection.id} collection={collection} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {followingList.slice(0, 4).map((biz) => (
                <CompanyRow key={biz.id} company={biz} to={`/company/${biz.id}`} />
              ))}
              <p className="text-sm leading-relaxed text-muted">
                New collections from businesses you follow will show up here.
              </p>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}

/** Day-one doorway: both buy and sell paths when trade presence allows. */
function DayOneWelcome({ buying, selling }: { buying: boolean; selling: boolean }) {
  const support =
    buying && selling
      ? 'Follow businesses for drops, or add designs to start selling — one account does both.'
      : buying
        ? 'Follow your first business to start seeing drops and trade activity here.'
        : 'Add designs to start your catalogue. Publish when you are ready.';

  return (
    <section className="rounded-2xl bg-surface px-4 py-5 shadow-[var(--shadow-soft)]">
      <h1 className="text-base font-bold tracking-tight text-ink">Welcome to Ekum.</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">{support}</p>
      {buying ? (
        <Link to="/explore" className="mt-4 block">
          <Button fullWidth>
            {selling ? 'Explore the market' : 'Follow your first business to start'}
          </Button>
        </Link>
      ) : null}
      {selling ? (
        buying ? (
          <Link
            to="/catalog/products/new"
            className="mt-3 block text-center text-sm font-bold text-accent"
          >
            Add designs
          </Link>
        ) : (
          <Link to="/catalog/products/new" className="mt-4 block">
            <Button fullWidth>Add designs</Button>
          </Link>
        )
      ) : null}
    </section>
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
    case 'collection':
      return `/collections/${item.refId}`;
    default:
      return '/notifications';
  }
}

function NotificationLine({ item }: { item: NotificationView }) {
  return (
    <Link
      to={notificationLink(item)}
      className="flex items-start gap-2.5 px-3 py-3 hover:bg-foam/80"
    >
      <span
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.read ? 'bg-transparent' : 'bg-accent'}`}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
        {item.body ? <p className="truncate text-xs text-muted">{item.body}</p> : null}
      </div>
      <span className="text-[11px] font-medium text-muted">{timeAgo(item.createdAt)}</span>
    </Link>
  );
}
