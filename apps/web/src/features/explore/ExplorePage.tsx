import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  SUPER_CATEGORY_LABEL,
  SuperCategory,
  type CursorPage,
  type ExploreHomeView,
  type ExploreOpportunity,
  type ExploreDesignOpportunity,
  type ExploreBuyerOpportunity,
  type ExploreSupplierCard,
  type ExploreStory,
  type SavedItemView,
  type SuperCategory as SuperCategoryType,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useMyCompany } from '@/lib/queries';
import { AlbumSelectBar } from '@/features/browse/AlbumSelectBar';
import { CatalogShareSheet } from '@/features/browse/CatalogShareSheet';
import { CurateFromSelectionSheet } from '@/features/browse/CurateFromSelectionSheet';
import { useBrowseAlbumPick } from '@/features/browse/useBrowseAlbumPick';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import { useShortlistOrderFlow } from '@/features/browse/useShortlistOrderFlow';
import { SAVED_QUERY_KEY } from '@/features/saved/useSaveToggle';
import { BatchOrderConfirmSheet } from '@/features/orders/BatchOrderConfirmSheet';
import { HowManyEachSheet } from '@/features/orders/HowManyEachSheet';
import { FORWARD_LOCKED_TOAST, canForwardFlag } from '@/features/browse/forwardGate';
import { useToast } from '@/ui/Toast';
import {
  OpportunityBusinessCard,
  OpportunityCollectionCard,
  OpportunityDesignCard,
  BusinessShopTile,
} from '@/ui/cards';
import { Avatar, Button, EmptyState, LoadingBlock, TextInput, cx } from '@/ui/kit';
import {
  BackIcon,
  BookmarkIcon,
  ExploreIcon,
  FilterIcon,
} from '@/ui/icons';
import { ExploreSearchResults } from './ExploreSearchResults';
import { isDualTradePresence, resolveExploreTradeSide } from './exploreTradeSide';
import { clearExploreFilterParams, facetSummary, mergeFacetOptions } from './exploreFilterPanel';
import {
  ExploreFilterMenu,
  contentModeLabel,
  parseContentMode,
  type ContentMode,
} from './ExploreFilterMenu';
import { SUGGEST_CATEGORIES, SUGGEST_CITIES } from '@/lib/suggestData';
import { useTradePresence } from '@/lib/tradePresence';

const SUPER_IDS = new Set<string>(Object.values(SuperCategory));
type MixedOpportunity =
  | { kind: 'collection'; id: string; opportunity: ExploreOpportunity; score: number; at: number }
  | { kind: 'design'; id: string; opportunity: ExploreDesignOpportunity; score: number; at: number };

function relevanceScore(relevance: string | null | undefined, fromNetwork: boolean): number {
  let score = fromNetwork ? 1_000 : 0;
  const line = relevance ?? '';
  if (line.includes('Connected')) score += 100;
  if (line.includes('In your network')) score += 80;
  if (line.includes('Matches')) score += 40;
  if (line.includes('GST')) score += 10;
  return score;
}

function mergeRanked(
  collections: ExploreOpportunity[],
  designs: ExploreDesignOpportunity[],
  fromNetwork: boolean,
): MixedOpportunity[] {
  const rows: MixedOpportunity[] = [
    ...collections.map((opportunity) => ({
      kind: 'collection' as const,
      id: `c:${opportunity.collection.id}`,
      opportunity,
      score: relevanceScore(opportunity.relevance, fromNetwork),
      at: Date.parse(opportunity.collection.updatedAt) || 0,
    })),
    ...designs.map((opportunity) => ({
      kind: 'design' as const,
      id: `d:${opportunity.product.id}`,
      opportunity,
      score: relevanceScore(opportunity.relevance, fromNetwork),
      at: Date.parse(opportunity.product.postedAt) || 0,
    })),
  ];
  return rows.sort((a, b) => b.score - a.score || b.at - a.at);
}

function optionLabel(value: string): string {
  if (value === 'All') return 'Any category';
  if (SUPER_IDS.has(value)) {
    return SUPER_CATEGORY_LABEL[value as SuperCategoryType] ?? value;
  }
  return value;
}

function Section({
  title,
  children,
  empty,
  action,
}: {
  title: string;
  children: ReactNode;
  empty?: boolean;
  action?: ReactNode;
}) {
  if (empty) return null;
  return (
    <section className="flex flex-col gap-2.5">
      {title || action ? (
        <div className="flex items-baseline justify-between gap-3 px-0.5">
          {title ? <h2 className="text-[15px] font-bold tracking-tight text-ink">{title}</h2> : null}
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

function CollectionSection({
  title,
  items,
}: {
  title: string;
  items: ExploreOpportunity[];
}) {
  const albumPick = useBrowseAlbumPick();
  const shortlist = useBrowseShortlist();
  const { showToast } = useToast();
  if (items.length === 0) return null;
  const selecting =
    albumPick.count > 0 || shortlist.count > 0 || albumPick.selectMode || shortlist.selectMode;
  const onLocked = () => showToast(FORWARD_LOCKED_TOAST);

  return (
    <Section title={title}>
      <div className="flex flex-col">
        {items.map((opportunity) => (
          <OpportunityCollectionCard
            key={opportunity.collection.id}
            opportunity={opportunity}
            selectMode={selecting}
            selected={albumPick.collectionIds.has(opportunity.collection.id)}
            onLongSelect={() => toggleExploreAlbum(albumPick, opportunity, onLocked)}
            onToggleSelect={
              selecting ? () => toggleExploreAlbum(albumPick, opportunity, onLocked) : undefined
            }
          />
        ))}
      </div>
    </Section>
  );
}

function toggleExploreDesign(
  shortlist: ReturnType<typeof useBrowseShortlist>,
  opportunity: ExploreDesignOpportunity,
  notifyLocked?: () => void,
) {
  const { product } = opportunity;
  const wasSelected = shortlist.productIds.has(product.id);
  shortlist.toggle({
    productId: product.id,
    name: product.name,
    thumbUrl: product.images[0] ?? null,
    companyId: product.company.id,
    companyName: product.company.name,
    allowForward: product.allowForward,
  });
  if (!wasSelected && !canForwardFlag(product.allowForward)) {
    notifyLocked?.();
  }
}

function toggleExploreAlbum(
  albumPick: ReturnType<typeof useBrowseAlbumPick>,
  opportunity: ExploreOpportunity,
  notifyLocked?: () => void,
) {
  const { collection } = opportunity;
  const wasSelected = albumPick.collectionIds.has(collection.id);
  albumPick.toggle({
    collectionId: collection.id,
    name: collection.name,
    coverImage: collection.coverImage,
    companyId: collection.company.id,
    companyName: collection.company.name,
    productCount: collection.productCount,
    allowForward: collection.allowForward,
  });
  if (!wasSelected && !canForwardFlag(collection.allowForward)) {
    notifyLocked?.();
  }
}

function DesignSection({
  title,
  items,
}: {
  title: string;
  items: ExploreDesignOpportunity[];
}) {
  const shortlist = useBrowseShortlist();
  const albumPick = useBrowseAlbumPick();
  const { showToast } = useToast();
  if (items.length === 0) return null;
  const selecting =
    shortlist.count > 0 || albumPick.count > 0 || shortlist.selectMode || albumPick.selectMode;
  const onLocked = () => showToast(FORWARD_LOCKED_TOAST);

  return (
    <Section title={title}>
      <div className="flex flex-col">
        {items.map((opportunity) => (
          <OpportunityDesignCard
            key={opportunity.product.id}
            opportunity={opportunity}
            selectMode={selecting}
            selected={shortlist.productIds.has(opportunity.product.id)}
            onLongSelect={() => toggleExploreDesign(shortlist, opportunity, onLocked)}
            onToggleSelect={
              selecting ? () => toggleExploreDesign(shortlist, opportunity, onLocked) : undefined
            }
          />
        ))}
      </div>
    </Section>
  );
}

function MixedSection({ title, items }: { title: string; items: MixedOpportunity[] }) {
  const shortlist = useBrowseShortlist();
  const albumPick = useBrowseAlbumPick();
  const { showToast } = useToast();
  if (items.length === 0) return null;
  const selecting =
    shortlist.count > 0 || albumPick.count > 0 || shortlist.selectMode || albumPick.selectMode;
  const onLocked = () => showToast(FORWARD_LOCKED_TOAST);

  return (
    <Section title={title}>
      <div className="flex flex-col">
        {items.map((item) =>
          item.kind === 'collection' ? (
            <OpportunityCollectionCard
              key={item.id}
              opportunity={item.opportunity}
              selectMode={selecting}
              selected={albumPick.collectionIds.has(item.opportunity.collection.id)}
              onLongSelect={() => toggleExploreAlbum(albumPick, item.opportunity, onLocked)}
              onToggleSelect={
                selecting
                  ? () => toggleExploreAlbum(albumPick, item.opportunity, onLocked)
                  : undefined
              }
            />
          ) : (
            <OpportunityDesignCard
              key={item.id}
              opportunity={item.opportunity}
              selectMode={selecting}
              selected={shortlist.productIds.has(item.opportunity.product.id)}
              onLongSelect={() => toggleExploreDesign(shortlist, item.opportunity, onLocked)}
              onToggleSelect={
                selecting
                  ? () => toggleExploreDesign(shortlist, item.opportunity, onLocked)
                  : undefined
              }
            />
          ),
        )}
      </div>
    </Section>
  );
}

function CompanySection({
  title,
  subtitle,
  items,
  intentSide = 'sell',
}: {
  title: string;
  subtitle?: string;
  items: ExploreBuyerOpportunity[];
  intentSide?: 'buy' | 'sell';
}) {
  if (items.length === 0) return null;
  return (
    <Section title={title}>
      {subtitle ? <p className="px-0.5 text-xs font-medium text-muted">{subtitle}</p> : null}
      <div className="flex flex-col">
        {items.map((opportunity) => (
          <OpportunityBusinessCard
            key={opportunity.company.id}
            company={opportunity.company}
            relevance={opportunity.relevance}
            previewImages={opportunity.previewImages}
            designCount={opportunity.designCount}
            collectionCount={opportunity.collectionCount}
            latestPostedAt={opportunity.latestPostedAt}
            intentSide={intentSide}
          />
        ))}
      </div>
    </Section>
  );
}

function SupplierDirectory({
  filters,
}: {
  filters: { categories?: string; cities?: string };
}) {
  const directory = useInfiniteQuery({
    queryKey: ['explore', 'suppliers', filters],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      api.get<CursorPage<ExploreSupplierCard>>('/explore/companies', {
        posted: true,
        limit: 20,
        ...(pageParam ? { cursor: pageParam } : {}),
        ...filters,
      }),
    getNextPageParam: (last) => last.nextCursor,
  });

  const rows = directory.data?.pages.flatMap((page) => page.results) ?? [];

  if (directory.isLoading) {
    return <LoadingBlock label="Loading suppliers…" />;
  }
  if (directory.isError) {
    return (
      <EmptyState
        title="Could not load suppliers"
        message="Try again in a moment."
        action={
          <Button variant="secondary" onClick={() => void directory.refetch()}>
            Retry
          </Button>
        }
      />
    );
  }
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No suppliers on Explore yet"
        message="Companies with published designs or collections show up here."
      />
    );
  }

  return (
    <section className="flex flex-col gap-2.5">
      <div className="px-0.5">
        <h2 className="text-[15px] font-bold tracking-tight text-ink">Suppliers on Explore</h2>
        <p className="text-xs font-medium text-muted">
          Companies with published designs or collections
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {rows.map((supplier) => (
          <BusinessShopTile
            key={supplier.company.id}
            company={supplier.company}
            relevance={supplier.relevance}
            previewImages={supplier.previewImages}
          />
        ))}
      </div>
      {directory.hasNextPage ? (
        <Button
          variant="secondary"
          fullWidth
          disabled={directory.isFetchingNextPage}
          onClick={() => void directory.fetchNextPage()}
        >
          {directory.isFetchingNextPage ? 'Loading…' : 'Load more'}
        </Button>
      ) : null}
    </section>
  );
}

function StoryFilterChip({
  companyName,
  onClear,
  onOpenShop,
}: {
  companyName: string;
  onClear: () => void;
  onOpenShop: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-foam/60 px-2.5 py-1.5">
      <p className="min-w-0 flex-1 truncate text-xs text-ink">
        Posts from <span className="font-semibold">{companyName}</span>
      </p>
      <button type="button" className="shrink-0 text-xs font-bold text-accent" onClick={onClear}>
        Clear
      </button>
      <button type="button" className="shrink-0 text-xs font-bold text-accent" onClick={onOpenShop}>
        Open shop
      </button>
    </div>
  );
}

function StoriesRail({
  stories,
  activeId,
  onSelect,
}: {
  stories: ExploreStory[];
  activeId: string | null;
  onSelect: (companyId: string) => void;
}) {
  if (stories.length === 0) return null;
  return (
    <div className="-mx-1 overflow-x-auto px-1 scrollbar-gutter-stable">
      <div className="flex gap-2.5">
        {stories.map((story) => {
          const active = story.company.id === activeId;
          return (
            <button
              key={story.company.id}
              type="button"
              onClick={() => onSelect(story.company.id)}
              className="flex w-[60px] shrink-0 flex-col items-center gap-1"
            >
              <span
                className={cx(
                  'rounded-full p-[2px]',
                  active ? 'bg-accent' : 'bg-gradient-to-br from-accent to-tangerine',
                )}
              >
                <span className="block rounded-full bg-canvas p-[2px]">
                  <Avatar name={story.company.name} imageUrl={story.company.logoUrl} size={44} />
                </span>
              </span>
              <span className="w-full truncate text-center text-[10px] font-medium leading-tight text-ink">
                {story.company.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const company = useMyCompany();
  const shortlist = useBrowseShortlist();
  const albumPick = useBrowseAlbumPick();
  const orderFlow = useShortlistOrderFlow();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [curateOpen, setCurateOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [savingPick, setSavingPick] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const filterAnchorRef = useRef<HTMLButtonElement>(null);
  const contentMode = parseContentMode(searchParams.get('show'));
  const presence = useTradePresence();
  const tradeSide = resolveExploreTradeSide(searchParams.get('side'), presence);
  const storyCompanyId = searchParams.get('story');
  const [categories, setCategories] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [searchFocused, setSearchFocused] = useState(
    () => searchParams.get('search') === '1' || Boolean(searchParams.get('q')),
  );
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') ?? '');
  const searchQuery = searchTerm.trim();
  const showingResults = searchFocused && searchQuery.length >= 2;

  // Honor /explore?search=1 from /search redirect (term comes from initial ?q=).
  useEffect(() => {
    if (searchParams.get('search') === '1' || searchParams.get('q')) {
      setSearchFocused(true);
    }
  }, [searchParams]);

  // Debounce URL sync so typing doesn't thrash the router each keystroke.
  useEffect(() => {
    if (!searchFocused) return;
    const handle = window.setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('search', '1');
          if (searchQuery) next.set('q', searchQuery);
          else next.delete('q');
          const same =
            prev.get('search') === next.get('search') && prev.get('q') === next.get('q');
          return same ? prev : next;
        },
        { replace: true },
      );
    }, 250);
    return () => window.clearTimeout(handle);
  }, [searchFocused, searchQuery, setSearchParams]);

  const openSearch = () => {
    setMenuOpen(false);
    setSearchFocused(true);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('search', '1');
        return next;
      },
      { replace: true },
    );
  };

  const closeSearch = () => {
    setSearchFocused(false);
    setSearchTerm('');
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('search');
        next.delete('q');
        return next;
      },
      { replace: true },
    );
  };

  const onSearchTermChange = (value: string) => {
    setSearchTerm(value);
  };

  const setContentMode = (mode: ContentMode) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (mode === 'all') next.delete('show');
        else next.set('show', mode);
        return next;
      },
      { replace: true },
    );
  };

  const categoryOptions = useMemo(
    () =>
      mergeFacetOptions(SUGGEST_CATEGORIES, [
        ...(company.data?.buyCategories ?? []),
        ...(company.data?.sellCategories ?? []),
        ...(company.data?.superCategories ?? []),
        ...categories,
      ]),
    [company.data?.buyCategories, company.data?.sellCategories, company.data?.superCategories, categories],
  );
  const cityOptions = useMemo(() => mergeFacetOptions(SUGGEST_CITIES, cities), [cities]);

  const filters = {
    ...(categories.length ? { categories: categories.join(',') } : {}),
    ...(cities.length ? { cities: cities.join(',') } : {}),
  };
  const filterActive = categories.length > 0 || cities.length > 0 || contentMode !== 'all';
  const filterSummary = [
    contentMode !== 'all' ? contentModeLabel(contentMode) : null,
    categories.length
      ? categories.length === 1
        ? optionLabel(categories[0]!)
        : `${optionLabel(categories[0]!)} + ${categories.length - 1}`
      : null,
    cities.length ? facetSummary(cities, '') : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const setTradeSide = (side: 'buying' | 'selling') => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('side', side);
        return next;
      },
      { replace: true },
    );
  };

  const home = useQuery({
    queryKey: ['explore', 'home', filters, tradeSide],
    queryFn: () =>
      api.get<ExploreHomeView>('/explore/home', {
        ...filters,
        side: tradeSide,
      }),
    enabled: contentMode !== 'businesses',
  });

  const data = home.data;
  const networkMixed = useMemo(
    () => mergeRanked(data?.fromNetwork ?? [], data?.designsFromNetwork ?? [], true),
    [data?.fromNetwork, data?.designsFromNetwork],
  );
  const recommendedMixed = useMemo(
    () => mergeRanked(data?.forYou ?? [], data?.designsForYou ?? [], false),
    [data?.forYou, data?.designsForYou],
  );
  // Network first, then recommended — one shelf; why-lines carry trust/network.
  const postsForYou = useMemo(
    () => [...networkMixed, ...recommendedMixed],
    [networkMixed, recommendedMixed],
  );
  const collectionsForYou = useMemo(
    () => [...(data?.fromNetwork ?? []), ...(data?.forYou ?? [])],
    [data?.fromNetwork, data?.forYou],
  );
  const designsForYou = useMemo(
    () => [...(data?.designsFromNetwork ?? []), ...(data?.designsForYou ?? [])],
    [data?.designsFromNetwork, data?.designsForYou],
  );

  const filteredPosts = useMemo(() => {
    if (!storyCompanyId) return postsForYou;
    return postsForYou
      .filter((item) =>
        item.kind === 'collection'
          ? item.opportunity.collection.company.id === storyCompanyId
          : item.opportunity.product.company.id === storyCompanyId,
      )
      .sort((a, b) => b.at - a.at);
  }, [postsForYou, storyCompanyId]);
  const filteredCollections = useMemo(() => {
    if (!storyCompanyId) return collectionsForYou;
    return [...collectionsForYou]
      .filter((item) => item.collection.company.id === storyCompanyId)
      .sort(
        (a, b) =>
          Date.parse(b.collection.updatedAt) - Date.parse(a.collection.updatedAt),
      );
  }, [collectionsForYou, storyCompanyId]);
  const filteredDesigns = useMemo(() => {
    if (!storyCompanyId) return designsForYou;
    return [...designsForYou]
      .filter((item) => item.product.company.id === storyCompanyId)
      .sort(
        (a, b) => Date.parse(b.product.postedAt) - Date.parse(a.product.postedAt),
      );
  }, [designsForYou, storyCompanyId]);

  const storyCompany = data?.stories?.find((s) => s.company.id === storyCompanyId)?.company;

  const clearStory = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('story');
        return next;
      },
      { replace: true },
    );
  };

  // Drop a sticky ?story= that would filter the feed to nothing.
  useEffect(() => {
    if (!storyCompanyId || !data) return;
    const inFeed = postsForYou.some((item) =>
      item.kind === 'collection'
        ? item.opportunity.collection.company.id === storyCompanyId
        : item.opportunity.product.company.id === storyCompanyId,
    );
    if (!inFeed) clearStory();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when home data / story param change
  }, [storyCompanyId, data, postsForYou]);

  const selectStory = (companyId: string) => {
    // Prefer the business shop when this feed has no posts from them yet —
    // Stories can include publishers who aren’t in the current feed.
    const inFeed = postsForYou.some((item) =>
      item.kind === 'collection'
        ? item.opportunity.collection.company.id === companyId
        : item.opportunity.product.company.id === companyId,
    );
    if (!inFeed) {
      navigate(`/company/${companyId}`);
      return;
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (prev.get('story') === companyId) next.delete('story');
        else next.set('story', companyId);
        next.delete('show');
        return next;
      },
      { replace: true },
    );
  };

  const contentCount =
    contentMode === 'collections'
      ? filteredCollections.length
      : contentMode === 'designs'
        ? filteredDesigns.length
        : contentMode === 'businesses'
          ? 1
          : filteredPosts.length;

  const buyersCount = data?.lookingForWhatYouSell?.length ?? 0;
  const hasAny =
    contentMode === 'businesses' ||
    Boolean(storyCompanyId) ||
    (tradeSide === 'selling' ? buyersCount > 0 : contentCount > 0);

  const clearFilters = () => {
    setMenuOpen(false);
    setCategories([]);
    setCities([]);
    setSearchParams((prev) => clearExploreFilterParams(prev), { replace: true });
  };

  return (
    <div
      className={cx(
        'flex flex-col',
        storyCompanyId ? 'gap-2.5' : 'gap-4',
        (shortlist.count > 0 || albumPick.count > 0) && 'pb-[calc(5rem+5.5rem)]',
      )}
    >
      <div className="relative flex items-center gap-2">
        {searchFocused ? (
          <>
            <button
              type="button"
              aria-label="Back to Explore"
              onClick={closeSearch}
              className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[13px] border border-line bg-surface text-slate hover:bg-foam"
            >
              <BackIcon width={20} height={20} />
            </button>
            <TextInput
              key="explore-search"
              autoFocus
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              placeholder="Company, city, GST…"
              className="min-w-0 flex-1"
              aria-label="Search"
            />
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={openSearch}
              className="flex min-h-[46px] min-w-0 flex-1 items-center gap-2 rounded-[13px] border border-line bg-surface px-3.5 text-sm font-medium text-muted"
            >
              <ExploreIcon width={18} height={18} className="shrink-0" />
              <span className="truncate">Search companies, city, GST…</span>
            </button>
            <button
              type="button"
              aria-label="Saved"
              onClick={() => navigate('/saved')}
              className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[13px] border border-line bg-surface text-slate hover:bg-foam"
            >
              <BookmarkIcon width={20} height={20} />
            </button>
            <button
              ref={filterAnchorRef}
              type="button"
              data-testid="explore-filter"
              aria-label="Filter"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={() => setMenuOpen((open) => !open)}
              className={cx(
                'flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[13px] border transition-colors',
                filterActive || menuOpen
                  ? 'border-accent bg-accent text-white'
                  : 'border-line bg-surface text-slate hover:bg-foam',
              )}
            >
              <FilterIcon width={20} height={20} />
            </button>

            <ExploreFilterMenu
              open={menuOpen}
              onClose={() => setMenuOpen(false)}
              anchorRef={filterAnchorRef}
              contentMode={contentMode}
              categories={categories}
              cities={cities}
              categoryOptions={categoryOptions}
              cityOptions={cityOptions}
              labelFor={optionLabel}
              onContentMode={setContentMode}
              onCategories={setCategories}
              onCities={setCities}
              switchLabel={
                isDualTradePresence(presence)
                  ? tradeSide === 'buying'
                    ? 'Explore Buyers'
                    : 'Explore Suppliers'
                  : null
              }
              onSwitch={() => setTradeSide(tradeSide === 'buying' ? 'selling' : 'buying')}
            />
          </>
        )}
      </div>

      {!searchFocused && filterActive ? (
        <div className="relative z-10 flex flex-wrap items-center gap-x-3 px-0.5">
          <p className="text-xs font-medium text-muted">Showing {filterSummary}</p>
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex min-h-11 items-center text-xs font-bold tracking-tight text-accent"
          >
            Clear
          </button>
        </div>
      ) : null}

      {showingResults ? (
        <ExploreSearchResults query={searchQuery} onPickQuery={onSearchTermChange} />
      ) : contentMode === 'businesses' ? (
        <SupplierDirectory filters={filters} />
      ) : home.isLoading ? (
        <LoadingBlock />
      ) : home.isError ? (
        <EmptyState
          title="Couldn’t load Explore"
          message="Check your connection and try again."
        />
      ) : !hasAny ? (
        <EmptyState
          title="Nothing to explore yet"
          message={
            tradeSide === 'selling'
              ? 'Businesses that buy what you sell show up here.'
              : contentMode === 'collections'
                ? 'Published collections that match your interests show up here.'
                : contentMode === 'designs'
                  ? 'Published designs that match your interests show up here.'
                  : 'Designs, collections, and businesses that match your interests show up here.'
          }
        />
      ) : (
        <div className={cx('flex flex-col', storyCompanyId ? 'gap-3' : 'gap-7')}>
          {!searchFocused && tradeSide !== 'selling' ? (
            storyCompanyId ? (
              <StoryFilterChip
                companyName={storyCompany?.name ?? 'this business'}
                onClear={clearStory}
                onOpenShop={() => navigate(`/company/${storyCompanyId}`)}
              />
            ) : (
              <StoriesRail
                stories={data?.stories ?? []}
                activeId={storyCompanyId}
                onSelect={selectStory}
              />
            )
          ) : null}
          {tradeSide === 'selling' && storyCompanyId ? (
            <StoryFilterChip
              companyName={storyCompany?.name ?? 'this business'}
              onClear={clearStory}
              onOpenShop={() => navigate(`/company/${storyCompanyId}`)}
            />
          ) : null}
          {tradeSide !== 'selling' && contentMode === 'all' ? (
            filteredPosts.length > 0 ? (
              <MixedSection title="" items={filteredPosts} />
            ) : storyCompanyId ? (
              <EmptyState
                title="No posts in this feed"
                message="Open their shop to see published designs and collections."
              />
            ) : (
              <EmptyState
                title="No posts from other businesses yet"
                message="Follow suppliers or wait for new drops — buyers who may want what you sell still show below."
              />
            )
          ) : null}
          {tradeSide !== 'selling' && contentMode === 'collections' ? (
            <CollectionSection title="" items={filteredCollections} />
          ) : null}
          {tradeSide !== 'selling' && contentMode === 'designs' ? (
            <DesignSection title="" items={filteredDesigns} />
          ) : null}
          {tradeSide === 'selling' && !storyCompanyId && data?.lookingForWhatYouSell ? (
            <CompanySection
              title="Buyers for you"
              items={data.lookingForWhatYouSell}
              intentSide="buy"
            />
          ) : null}
        </div>
      )}

      <AlbumSelectBar
        albumCount={albumPick.count}
        designCount={shortlist.count}
        onClear={() => {
          albumPick.clear();
          shortlist.clear();
        }}
        saving={savingPick}
        onSave={async () => {
          setSavingPick(true);
          try {
            let saved = 0;
            for (const entry of albumPick.entries) {
              await api.post<SavedItemView>('/saved', { collectionId: entry.collectionId });
              saved += 1;
            }
            for (const entry of shortlist.entries) {
              await api.post<SavedItemView>('/saved', { productId: entry.productId });
              saved += 1;
            }
            void queryClient.invalidateQueries({ queryKey: SAVED_QUERY_KEY });
            albumPick.clear();
            shortlist.clear();
            showToast(saved === 1 ? 'Bookmarked' : `${saved} bookmarked`, 'success', {
              action: { label: 'Open', to: '/saved' },
            });
          } catch (err) {
            showToast(
              err instanceof ApiError ? err.message : 'Could not bookmark.',
              'danger',
            );
          } finally {
            setSavingPick(false);
          }
        }}
        canShare={
          albumPick.entries.some((entry) => canForwardFlag(entry.allowForward)) ||
          shortlist.entries.some((entry) => canForwardFlag(entry.allowForward))
        }
        onShare={() => {
          const collections = albumPick.entries.filter((entry) =>
            canForwardFlag(entry.allowForward),
          );
          const products = shortlist.entries.filter((entry) => canForwardFlag(entry.allowForward));
          if (collections.length + products.length === 0) {
            showToast(FORWARD_LOCKED_TOAST, 'danger');
            return;
          }
          const skipped =
            albumPick.count +
            shortlist.count -
            collections.length -
            products.length;
          if (skipped > 0) {
            showToast(
              skipped === 1
                ? 'Skipped 1 that can’t be shared.'
                : `Skipped ${skipped} that can’t be shared.`,
            );
          }
          setShareOpen(true);
        }}
        canCurate={shortlist.entries.some((entry) => canForwardFlag(entry.allowForward))}
        onCurate={() => {
          const locked = shortlist.entries.filter((entry) => !canForwardFlag(entry.allowForward));
          const allowed = shortlist.entries.filter((entry) => canForwardFlag(entry.allowForward));
          if (allowed.length === 0) {
            showToast(FORWARD_LOCKED_TOAST, 'danger');
            return;
          }
          if (locked.length > 0) {
            shortlist.removeIds(locked.map((entry) => entry.productId));
            showToast(
              locked.length === 1
                ? 'Skipped 1 that can’t be shared.'
                : `Skipped ${locked.length} that can’t be shared.`,
            );
          }
          setCurateOpen(true);
        }}
        canOrder={shortlist.count > 0}
        onOrder={() => {
          orderFlow.setError(null);
          orderFlow.setQtyOpen(true);
        }}
      />
      <CatalogShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        collections={albumPick.entries
          .filter((entry) => canForwardFlag(entry.allowForward))
          .map((entry) => ({
            collectionId: entry.collectionId,
            name: entry.name,
          }))}
        products={shortlist.entries
          .filter((entry) => canForwardFlag(entry.allowForward))
          .map((entry) => ({
            productId: entry.productId,
            name: entry.name,
          }))}
        onShared={() => {
          albumPick.clear();
          shortlist.clear();
        }}
      />
      <HowManyEachSheet
        open={orderFlow.qtyOpen}
        onClose={() => orderFlow.setQtyOpen(false)}
        sellerId={orderFlow.sellerIdForQty}
        products={orderFlow.products}
        submitting={orderFlow.submitting}
        asking={orderFlow.asking}
        error={orderFlow.error}
        onSendOrder={orderFlow.sendOrder}
        onAskRates={orderFlow.askRates}
      />
      <BatchOrderConfirmSheet
        open={orderFlow.confirmOpen}
        result={orderFlow.result}
        onClose={() => orderFlow.setConfirmOpen(false)}
      />
      <CurateFromSelectionSheet open={curateOpen} onClose={() => setCurateOpen(false)} />
    </div>
  );
}
