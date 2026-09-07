import { useMemo, useState, type ComponentType, type SVGProps } from 'react';
import { useAuth, useCompanyId } from '@/lib/auth';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type {
  AccessRequestView,
  CollectionViewGrantView,
  CompanyCard,
  CursorPage,
  ExploreHomeView,
  ExplorePost,
  OrderView,
  ReturnView,
  ThreadSummary,
} from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { useMyCompany } from '@/lib/queries';
import { useTradePresence } from '@/lib/tradePresence';
import { CompanyRow } from '@/ui/cards';
import { Button, LoadingBlock, SectionHeader } from '@/ui/kit';
import {
  ChatIcon,
  CheckIcon,
  ChevronRightIcon,
  OrdersIcon,
} from '@/ui/icons';
import {
  buildHomeNeeds,
  homeMetrics,
  newFollowedPostsToday,
  type HomeNeedItem,
} from './homeAttention';
import { homeReceivedRows } from './homeReceived';
import { filterSeenHomeNeeds, markHomeNeedSeen } from './homeNeedSeen';
import {
  groupPostsByCompany,
  homePostGroupLink,
  homePostTitle,
  type HomePostGroup,
} from './homeMarket';

const PREVIEW_LIMIT = 8;
const FOLLOWED_PREVIEW = 5;
const OPPORTUNITY_PREVIEW = 5;

/**
 * Home is state-driven:
 * busy → Needs; quiet + followed updates → Followed hero;
 * quiet with market → From the market (relevance-ranked);
 * empty platform → Explore businesses.
 */
export function HomePage() {
  const { buying, selling, isLoading: tradeLoading } = useTradePresence();
  const { session } = useAuth();
  const company = useMyCompany();
  const companyId = useCompanyId();
  const [showAllNeeds, setShowAllNeeds] = useState(false);
  const [seenVersion, setSeenVersion] = useState(0);

  const incoming = useQuery({
    queryKey: ['access-requests', 'incoming'],
    queryFn: () => api.get<AccessRequestView[]>('/access-requests/incoming'),
  });
  const orders = useQuery({
    queryKey: ['orders', { home: true }],
    queryFn: () => api.get<CursorPage<OrderView>>('/orders', { limit: 50 }),
  });
  const returns = useQuery({
    queryKey: ['returns', { home: true }],
    queryFn: () => api.get<CursorPage<ReturnView>>('/returns', { limit: 40 }),
  });
  const threadRequests = useQuery({
    queryKey: ['threads', { state: 'pending' }],
    queryFn: () => api.get<CursorPage<ThreadSummary>>('/threads', { state: 'pending', limit: 10 }),
  });
  const following = useQuery({
    queryKey: ['follows', 'following'],
    queryFn: () => api.get<CompanyCard[]>('/follows/following'),
  });

  const followingCount = following.data?.length ?? 0;
  const hasNetwork = followingCount > 0;

  const followed = useQuery({
    queryKey: ['explore', 'feed', { following: true }],
    queryFn: () =>
      api.get<CursorPage<ExplorePost>>('/explore/feed', { following: true, limit: 40 }),
    enabled: !following.isLoading && hasNetwork,
  });
  const receivedHome = useQuery({
    queryKey: ['explore', 'home', { receivedCurated: true }],
    queryFn: () => api.get<ExploreHomeView>('/explore/home'),
  });

  const orderRows = orders.data?.results ?? [];
  const returnRows = returns.data?.results ?? [];
  const accessRequests = incoming.data ?? [];
  const chatRequests = threadRequests.data?.results ?? [];
  const myGrants = useQuery({
    queryKey: ['collection-view-grants', 'mine'],
    queryFn: () =>
      api.get<CollectionViewGrantView[]>('/collection-view-requests/grants/mine'),
  });
  const grantRows = myGrants.data ?? [];

  const needs = useMemo(() => {
    void seenVersion;
    return filterSeenHomeNeeds(
      companyId ?? undefined,
      buildHomeNeeds({
        orders: orderRows,
        returns: returnRows,
        accessRequests,
        chatRequests,
        collectionViewGrants: grantRows,
      }),
    );
  }, [orderRows, returnRows, accessRequests, chatRequests, grantRows, companyId, seenVersion]);
  const metrics = homeMetrics({
    orders: orderRows,
    returns: returnRows,
    accessCount: accessRequests.length,
    chatCount: chatRequests.length,
  });

  const followedItems = followed.data?.results ?? [];
  const newToday = newFollowedPostsToday(followedItems);
  const hasNeeds = needs.length > 0;
  const isOpportunity = !hasNeeds;
  const hasFollowedUpdates = newToday.length > 0;
  const chipEntries = (
    [
      { label: 'Orders', value: metrics.orders, to: '/orders?filter=needs' },
      {
        label: 'Requests',
        value: metrics.requests,
        to: accessRequests.length > 0 ? '/network/requests' : '/chats',
      },
      { label: 'Returns', value: metrics.returns, to: '/orders?filter=needs' },
    ] as const
  ).filter((chip) => chip.value > 0);
  const hasChips = chipEntries.length > 0;

  const stillBootstrapping =
    incoming.isLoading ||
    orders.isLoading ||
    returns.isLoading ||
    threadRequests.isLoading ||
    following.isLoading ||
    (hasNetwork && followed.isLoading) ||
    tradeLoading ||
    company.isLoading;

  const suggestScope = buying || !selling ? 'buy' : 'sell';
  const viewerCity = company.data?.city?.trim() || undefined;
  const followingIds = useMemo(
    () => new Set((following.data ?? []).map((row) => row.id)),
    [following.data],
  );

  const marketFeed = useQuery({
    queryKey: ['explore', 'feed', { homeOpportunity: true }],
    queryFn: () => api.get<CursorPage<ExplorePost>>('/explore/feed', { limit: 20 }),
    enabled: !stillBootstrapping && isOpportunity,
  });

  const suggested = useQuery({
    queryKey: ['explore', 'companies', { homeOpportunity: true, scope: suggestScope, city: viewerCity }],
    queryFn: async () => {
      const base = { scope: suggestScope, limit: 8 } as const;
      if (!viewerCity) {
        return api.get<CursorPage<CompanyCard>>('/explore/companies', base);
      }
      const local = await api.get<CursorPage<CompanyCard>>('/explore/companies', {
        ...base,
        city: viewerCity,
      });
      if (local.results.length > 0) return local;
      return api.get<CursorPage<CompanyCard>>('/explore/companies', base);
    },
    enabled: !stillBootstrapping && isOpportunity,
  });

  if (stillBootstrapping) {
    return <LoadingBlock label="Opening home…" />;
  }

  const packRows = homeReceivedRows(receivedHome.data?.receivedCurated ?? []);
  const visibleNeeds = showAllNeeds ? needs : needs.slice(0, PREVIEW_LIMIT);
  const needsOverflow = needs.length > PREVIEW_LIMIT;
  const greetName =
    session?.user.name?.trim() ||
    company.data?.contactPerson?.trim() ||
    company.data?.name?.trim() ||
    '';
  const followedPreview = groupPostsByCompany(newToday).slice(0, FOLLOWED_PREVIEW);
  const recentPosts = groupPostsByCompany(marketFeed.data?.results ?? []).slice(
    0,
    OPPORTUNITY_PREVIEW,
  );
  const suggestedBusinesses = (suggested.data?.results ?? [])
    .filter((row) => !followingIds.has(row.id))
    .slice(0, OPPORTUNITY_PREVIEW);
  const opportunityReady = isOpportunity && marketFeed.isSuccess && suggested.isSuccess;
  const isEmptyPlatform =
    opportunityReady &&
    !hasFollowedUpdates &&
    recentPosts.length === 0 &&
    suggestedBusinesses.length === 0;
  /** First visit / no follows - guide, do not say caught up. */
  const isColdStart = !hasNeeds && !hasNetwork;

  return (
    <div className="ekum-rise flex flex-col gap-5">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-xl font-bold tracking-tight text-ink">
          {greetName ? `Namaste, ${greetName}` : 'Namaste'}
        </h1>
        {hasNeeds ? (
          <p className="text-sm text-muted">
            <span className="font-semibold text-accent">
              {needs.length} item{needs.length === 1 ? '' : 's'}
            </span>{' '}
            {needs.length === 1 ? 'needs' : 'need'} attention.
          </p>
        ) : isColdStart ? (
          <div className="mt-1 flex flex-col gap-2.5">
            <p className="text-sm leading-relaxed text-muted">
              Start by browsing the market - find businesses on Explore.
            </p>
            <Link to="/explore" className="self-start text-sm font-bold text-accent">
              Open Explore →
            </Link>
          </div>
        ) : (
          <div className="mt-1 flex flex-col gap-2.5">
            <p className="text-sm leading-relaxed text-muted">
              Explore what&apos;s new in the market.
            </p>
          </div>
        )}
      </header>

      {hasNeeds && hasChips ? (
        <div
          className={`grid gap-2 ${chipEntries.length === 1 ? 'grid-cols-1' : chipEntries.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}
        >
          {chipEntries.map((chip) => (
            <MetricCard key={chip.label} label={chip.label} value={chip.value} to={chip.to} />
          ))}
        </div>
      ) : null}

      {packRows.length > 0 ? (
        <section className="flex flex-col gap-2.5">
          <SectionHeader
            title="New packs"
            action={
              <Link to="/explore?side=buying" className="text-xs font-bold text-accent">
                See all →
              </Link>
            }
          />
          {packRows.map((item) => (
            <Link
              key={item.id}
              to={item.to}
              className="flex items-center gap-3 rounded-2xl bg-surface px-3.5 py-3 shadow-[var(--shadow-soft)] hover:bg-foam active:bg-foam"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
                <p className="truncate text-xs text-muted">{item.subtitle}</p>
              </div>
              <ChevronRightIcon width={18} height={18} className="shrink-0 text-muted" />
            </Link>
          ))}
        </section>
      ) : null}

      {hasNeeds ? (
        <section className="flex flex-col gap-2.5">
          {visibleNeeds.map((item) => (
            <NeedCard
              key={item.id}
              item={item}
              onOpen={() => {
                if (!companyId) return;
                markHomeNeedSeen(companyId, item.id, item.sortAt);
                setSeenVersion((value) => value + 1);
              }}
            />
          ))}
          {needsOverflow && !showAllNeeds ? (
            <button
              type="button"
              onClick={() => setShowAllNeeds(true)}
              className="self-start px-0.5 text-sm font-bold text-accent"
            >
              See all {needs.length} →
            </button>
          ) : null}
        </section>
      ) : null}

      {/* Busy day: Followed only when there is news */}
      {hasNeeds && hasFollowedUpdates ? (
        <PostListSection
          title="Followed"
          subtitle={`${newToday.length} new post${newToday.length === 1 ? '' : 's'} today`}
          posts={followedPreview}
          actionLabel="View more →"
        />
      ) : null}

      {isOpportunity ? (
        isEmptyPlatform ? (
          <EmptyPlatformSection selling={selling} buying={buying} />
        ) : (
          <>
            {hasNetwork && hasFollowedUpdates ? (
              <PostListSection
                title="Followed"
                subtitle={`${newToday.length} new post${newToday.length === 1 ? '' : 's'} today`}
                posts={followedPreview}
                actionLabel="View more →"
              />
            ) : null}

            {recentPosts.length > 0 ? (
              <PostListSection
                title="From the market"
                posts={recentPosts}
                actionLabel="View more →"
              />
            ) : null}

            {suggestedBusinesses.length > 0 ? (
              <section className="flex flex-col gap-2.5">
                <SectionHeader title="Recommended companies" />
                <div className="flex flex-col gap-2">
                  {suggestedBusinesses.map((row) => (
                    <CompanyRow key={row.id} company={row} to={`/company/${row.id}`} />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )
      ) : null}
    </div>
  );
}

function PostListSection({
  title,
  subtitle,
  posts,
  actionLabel,
}: {
  title: string;
  subtitle?: string;
  posts: HomePostGroup[];
  actionLabel: string;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <SectionHeader
        title={title}
        action={
          <Link to="/explore" className="text-xs font-bold text-accent">
            {actionLabel}
          </Link>
        }
      />
      {subtitle ? <p className="px-0.5 text-sm font-medium text-muted">{subtitle}</p> : null}
      <div className="overflow-hidden rounded-2xl bg-surface shadow-[var(--shadow-soft)]">
        {posts.map((group) => (
          <MarketPostRow key={group.id} group={group} />
        ))}
      </div>
    </section>
  );
}

/** Brand-new / empty market: no follows, no catalogues, nothing to recommend. */
function EmptyPlatformSection({ buying, selling }: { buying: boolean; selling: boolean }) {
  return (
    <section className="flex flex-col gap-2.5">
      <SectionHeader title="Explore businesses" />
      <div className="rounded-2xl bg-surface px-4 py-4 shadow-[var(--shadow-soft)]">
        <p className="text-sm leading-relaxed text-muted">
          Be the first to build your network.
        </p>
        <Link to="/explore" className="mt-3 block">
          <Button fullWidth>Explore →</Button>
        </Link>
        {selling ? (
          <div className="mt-3 flex flex-col gap-2">
            <Link to="/catalog" className="block text-center text-sm font-bold text-accent">
              My designs
            </Link>
            <Link
              to="/catalog/products/new"
              className="block text-center text-sm font-medium text-muted"
            >
              {buying ? 'Add designs' : 'Add designs to start'}
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function metricLabel(label: string, value: number): string {
  const singular: Record<string, string> = {
    Orders: 'order',
    Requests: 'request',
    Returns: 'return',
  };
  if (value === 1) return singular[label] ?? label.toLowerCase();
  return label.toLowerCase();
}

function MetricCard({ label, value, to }: { label: string; value: number; to: string }) {
  return (
    <Link
      to={to}
      className="flex min-h-[5.75rem] flex-col items-center justify-center gap-1 rounded-2xl bg-surface px-4 py-4 text-center shadow-[var(--shadow-soft)] transition-colors hover:bg-foam"
    >
      <p className="text-3xl font-bold tracking-tight text-accent">{value}</p>
      <p className="text-sm font-semibold text-muted">{metricLabel(label, value)}</p>
    </Link>
  );
}

function MarketPostRow({ group }: { group: HomePostGroup }) {
  const post = group.latest;
  const title = homePostTitle(group.count, group.companyName);
  const itemName = post.kind === 'product' ? post.product.name : post.collection.name;
  const meta =
    post.kind === 'product'
      ? '1 design'
      : `${post.collection.productCount} design${post.collection.productCount === 1 ? '' : 's'}`;
  const place = group.city;

  return (
    <Link
      to={homePostGroupLink(group)}
      className="flex items-center gap-3 border-b border-line px-4 py-3.5 last:border-b-0 hover:bg-foam active:bg-foam"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-sm font-semibold text-ink">{title}</p>
        {place ? <p className="truncate text-xs text-muted">{place}</p> : null}
        {group.count === 1 ? (
          <>
            <p className="truncate text-sm text-ink">{itemName}</p>
            <p className="truncate text-xs text-muted">{meta}</p>
          </>
        ) : null}
      </div>
      <ChevronRightIcon width={18} height={18} className="shrink-0 text-muted" />
    </Link>
  );
}

function NeedCard({ item, onOpen }: { item: HomeNeedItem; onOpen: () => void }) {
  const Icon = needIcon(item.kind);
  return (
    <Link
      to={item.to}
      onClick={onOpen}
      data-testid={`home-need-${item.id}`}
      className="flex items-center gap-3 rounded-2xl bg-surface px-3.5 py-3 shadow-[var(--shadow-soft)] hover:bg-foam active:bg-foam"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foam text-accent">
        <Icon width={18} height={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
        {item.subtitle ? <p className="truncate text-xs text-muted">{item.subtitle}</p> : null}
      </div>
      <ChevronRightIcon width={18} height={18} className="shrink-0 text-muted" />
    </Link>
  );
}

function needIcon(kind: HomeNeedItem['kind']): ComponentType<SVGProps<SVGSVGElement>> {
  switch (kind) {
    case 'dispatch':
    case 'mark_delivered':
      return CheckIcon;
    case 'chat_request':
    case 'send_rate':
    case 'accept_quote':
      return ChatIcon;
    default:
      return OrdersIcon;
  }
}
