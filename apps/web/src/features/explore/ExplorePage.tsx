import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  SUPER_CATEGORY_LABEL,
  SuperCategory,
  type CursorPage,
  type ExploreHomeView,
  type ExploreOpportunity,
  type ExploreDesignOpportunity,
  type ExploreBuyerOpportunity,
  type ExploreSupplierCard,
  type SuperCategory as SuperCategoryType,
} from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { useMyCompany } from '@/lib/queries';
import {
  OpportunityBusinessCard,
  OpportunityCollectionCard,
  OpportunityDesignCard,
} from '@/ui/cards';
import { Button, EmptyState, LoadingBlock, TextInput, cx } from '@/ui/kit';
import {
  BackIcon,
  CheckIcon,
  ChevronRightIcon,
  ExploreIcon,
  FilterIcon,
} from '@/ui/icons';
import { ExploreSearchResults } from './ExploreSearchResults';

const FALLBACK_CATEGORIES = ['Sarees', 'Salwar', 'Dress Material', 'Fabric'] as const;
const CITIES = ['Surat', 'Jaipur'] as const;
const SUPER_IDS = new Set<string>(Object.values(SuperCategory));
const SECTION_PREVIEW = 4;

type MenuView = 'root' | 'category' | 'city' | 'show';
/** All = ranked mix; Collections / Designs / Businesses filter by type. */
type ContentMode = 'all' | 'collections' | 'designs' | 'businesses';

const CONTENT_MODE_OPTIONS: Array<{ id: ContentMode; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'collections', label: 'Collections' },
  { id: 'designs', label: 'Designs' },
  { id: 'businesses', label: 'Businesses' },
];

function parseContentMode(value: string | null): ContentMode {
  if (value === 'collections' || value === 'designs' || value === 'businesses') return value;
  return 'all';
}

function contentModeLabel(mode: ContentMode): string {
  return CONTENT_MODE_OPTIONS.find((option) => option.id === mode)?.label ?? 'All';
}

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
      <div className="flex items-baseline justify-between gap-3 px-0.5">
        <h2 className="text-[15px] font-bold tracking-tight text-ink">{title}</h2>
        {action}
      </div>
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
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;
  const visible = expanded ? items : items.slice(0, SECTION_PREVIEW);
  const overflow = items.length > SECTION_PREVIEW;
  return (
    <Section
      title={title}
      action={
        overflow && !expanded ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-xs font-bold tracking-tight text-accent"
          >
            See all {items.length}
          </button>
        ) : null
      }
    >
      <div className="flex flex-col">
        {visible.map((opportunity) => (
          <OpportunityCollectionCard
            key={opportunity.collection.id}
            opportunity={opportunity}
          />
        ))}
      </div>
    </Section>
  );
}

function DesignSection({
  title,
  items,
}: {
  title: string;
  items: ExploreDesignOpportunity[];
}) {
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;
  const visible = expanded ? items : items.slice(0, SECTION_PREVIEW);
  const overflow = items.length > SECTION_PREVIEW;
  return (
    <Section
      title={title}
      action={
        overflow && !expanded ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-xs font-bold tracking-tight text-accent"
          >
            See all {items.length}
          </button>
        ) : null
      }
    >
      <div className="flex flex-col">
        {visible.map((opportunity) => (
          <OpportunityDesignCard key={opportunity.product.id} opportunity={opportunity} />
        ))}
      </div>
    </Section>
  );
}

function MixedSection({ title, items }: { title: string; items: MixedOpportunity[] }) {
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;
  const visible = expanded ? items : items.slice(0, SECTION_PREVIEW);
  const overflow = items.length > SECTION_PREVIEW;
  return (
    <Section
      title={title}
      action={
        overflow && !expanded ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-xs font-bold tracking-tight text-accent"
          >
            See all {items.length}
          </button>
        ) : null
      }
    >
      <div className="flex flex-col">
        {visible.map((item) =>
          item.kind === 'collection' ? (
            <OpportunityCollectionCard key={item.id} opportunity={item.opportunity} />
          ) : (
            <OpportunityDesignCard key={item.id} opportunity={item.opportunity} />
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
  seeAllLabel,
  onSeeAll,
}: {
  title: string;
  subtitle?: string;
  items: ExploreBuyerOpportunity[];
  intentSide?: 'buy' | 'sell';
  seeAllLabel?: string;
  onSeeAll?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  if (items.length === 0) return null;
  const visible = expanded || onSeeAll ? items.slice(0, SECTION_PREVIEW) : items.slice(0, SECTION_PREVIEW);
  const showExpand = !onSeeAll && items.length > SECTION_PREVIEW && !expanded;
  const showDirectoryLink = Boolean(onSeeAll);
  return (
    <Section
      title={title}
      action={
        showDirectoryLink ? (
          <button
            type="button"
            onClick={onSeeAll}
            className="text-xs font-bold tracking-tight text-accent"
          >
            {seeAllLabel ?? 'See all →'}
          </button>
        ) : showExpand ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="text-xs font-bold tracking-tight text-accent"
          >
            See all {items.length}
          </button>
        ) : null
      }
    >
      {subtitle ? <p className="px-0.5 text-xs font-medium text-muted">{subtitle}</p> : null}
      <div className="flex flex-col">
        {(expanded && !onSeeAll ? items : visible).map((opportunity) => (
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
  filters: { category?: string; city?: string };
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
      <div className="flex flex-col">
        {rows.map((supplier) => (
          <OpportunityBusinessCard
            key={supplier.company.id}
            company={supplier.company}
            relevance={supplier.relevance}
            previewImages={supplier.previewImages}
            designCount={supplier.designCount}
            collectionCount={supplier.collectionCount}
            latestPostedAt={supplier.latestPostedAt}
            intentSide="sell"
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

/**
 * Compact filter menu. Portaled to document.body so dismiss is not trapped by
 * parent transforms (ekum-rise). Closes on outside tap, Escape, or scroll.
 */
function FilterMenu({
  open,
  onClose,
  anchorRef,
  category,
  city,
  contentMode,
  categoryOptions,
  onCategory,
  onCity,
  onContentMode,
  onClear,
  filterActive,
}: {
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  category: string;
  city: string;
  contentMode: ContentMode;
  categoryOptions: string[];
  onCategory: (value: string) => void;
  onCity: (value: string) => void;
  onContentMode: (value: ContentMode) => void;
  onClear: () => void;
  filterActive: boolean;
}) {
  const [view, setView] = useState<MenuView>('root');
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      setPos({
        top: rect.bottom + 6,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [open, anchorRef, view]);

  useEffect(() => {
    if (!open) {
      setView('root');
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };
    const onScroll = () => onClose();
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, onClose, anchorRef]);

  if (!open || typeof document === 'undefined') return null;

  const subTitle =
    view === 'category' ? 'Category' : view === 'city' ? 'City' : view === 'show' ? 'Show' : '';

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Close filter menu"
        className="fixed inset-0 z-[60] cursor-default bg-ink/15"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="menu"
        data-testid="explore-filter-menu"
        className="fixed z-[61] w-[min(18.5rem,calc(100vw-2rem))] overflow-hidden rounded-[14px] border border-line bg-surface shadow-[var(--shadow-soft)]"
        style={{
          top: pos.top,
          right: pos.right,
          animation: 'ekum-rise 160ms ease-out',
        }}
      >
        {view === 'root' ? (
          <div className="py-1">
            <MenuRow
              label="Show"
              value={contentModeLabel(contentMode)}
              onClick={() => setView('show')}
            />
            <MenuRow
              label="Category"
              value={optionLabel(category)}
              onClick={() => setView('category')}
            />
            <MenuRow
              label="City"
              value={city === 'All' ? 'Any city' : city}
              onClick={() => setView('city')}
            />
            {filterActive ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onClear();
                  onClose();
                }}
                className="flex w-full items-center px-3.5 py-2.5 text-left text-sm font-bold tracking-tight text-accent hover:bg-foam/70"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : view === 'show' ? (
          <div className="flex max-h-72 flex-col">
            <button
              type="button"
              onClick={() => setView('root')}
              className="flex shrink-0 items-center gap-1 border-b border-line px-2.5 py-2.5 text-sm font-bold tracking-tight text-ink hover:bg-foam/50"
            >
              <BackIcon width={18} height={18} />
              {subTitle}
            </button>
            <ul className="min-h-0 overflow-y-auto py-1">
              {CONTENT_MODE_OPTIONS.map((option) => {
                const active = option.id === contentMode;
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={active}
                      onClick={() => {
                        onContentMode(option.id);
                        setView('root');
                      }}
                      className={cx(
                        'flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm tracking-tight hover:bg-foam/70',
                        active ? 'font-bold text-ink' : 'font-medium text-slate',
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">{option.label}</span>
                      {active ? (
                        <CheckIcon width={16} height={16} className="shrink-0 text-accent" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="flex max-h-72 flex-col">
            <button
              type="button"
              onClick={() => setView('root')}
              className="flex shrink-0 items-center gap-1 border-b border-line px-2.5 py-2.5 text-sm font-bold tracking-tight text-ink hover:bg-foam/50"
            >
              <BackIcon width={18} height={18} />
              {subTitle}
            </button>
            <ul className="min-h-0 overflow-y-auto py-1">
              {(view === 'category' ? categoryOptions : ['All', ...CITIES]).map((option) => {
                const active = view === 'category' ? option === category : option === city;
                const label =
                  view === 'category'
                    ? optionLabel(option)
                    : option === 'All'
                      ? 'Any city'
                      : option;
                return (
                  <li key={option}>
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={active}
                      onClick={() => {
                        if (view === 'category') onCategory(option);
                        else onCity(option);
                        setView('root');
                      }}
                      className={cx(
                        'flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm tracking-tight hover:bg-foam/70',
                        active ? 'font-bold text-ink' : 'font-medium text-slate',
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                      {active ? (
                        <CheckIcon width={16} height={16} className="shrink-0 text-accent" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </>,
    document.body,
  );
}

function MenuRow({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-foam/70"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold tracking-tight text-ink">{label}</span>
        <span className="block truncate text-xs font-medium text-muted">{value}</span>
      </span>
      <ChevronRightIcon width={16} height={16} className="shrink-0 text-muted" />
    </button>
  );
}

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const company = useMyCompany();
  const [menuOpen, setMenuOpen] = useState(false);
  const filterAnchorRef = useRef<HTMLButtonElement>(null);
  const contentMode = parseContentMode(searchParams.get('show'));
  const [category, setCategory] = useState('All');
  const [city, setCity] = useState<string>('All');
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

  const categoryOptions = useMemo(() => {
    const buy = (company.data?.buyCategories ?? [])
      .map((item) => item.trim())
      .filter(Boolean);
    if (buy.length > 0) {
      return ['All', ...new Set(buy)];
    }
    const supers = (company.data?.superCategories ?? [])
      .map((item) => item.trim())
      .filter(Boolean);
    if (supers.length > 0) {
      return ['All', ...new Set(supers)];
    }
    return ['All', ...FALLBACK_CATEGORIES];
  }, [company.data?.buyCategories, company.data?.superCategories]);

  const activeCategory = categoryOptions.includes(category) ? category : 'All';
  const filters = {
    ...(activeCategory === 'All' ? {} : { category: activeCategory }),
    ...(city === 'All' ? {} : { city }),
  };
  const filterActive = activeCategory !== 'All' || city !== 'All' || contentMode !== 'all';
  const filterSummary = [
    contentMode !== 'all' ? contentModeLabel(contentMode) : null,
    activeCategory !== 'All' ? optionLabel(activeCategory) : null,
    city !== 'All' ? city : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const home = useQuery({
    queryKey: ['explore', 'home', filters],
    queryFn: () => api.get<ExploreHomeView>('/explore/home', filters),
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

  const contentCount =
    contentMode === 'collections'
      ? collectionsForYou.length
      : contentMode === 'designs'
        ? designsForYou.length
        : contentMode === 'businesses'
          ? 1
          : postsForYou.length;

  const hasAny =
    contentMode === 'businesses' ||
    contentCount +
      (data?.suggestedBusinesses.length ?? 0) +
      (data?.lookingForWhatYouSell?.length ?? 0) >
      0;

  const clearFilters = () => {
    setCategory('All');
    setCity('All');
    setContentMode('all');
  };

  return (
    <div className="flex flex-col gap-4">
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

            <FilterMenu
              open={menuOpen}
              onClose={() => setMenuOpen(false)}
              anchorRef={filterAnchorRef}
              category={activeCategory}
              city={city}
              contentMode={contentMode}
              categoryOptions={categoryOptions}
              onCategory={setCategory}
              onCity={setCity}
              onContentMode={setContentMode}
              onClear={clearFilters}
              filterActive={filterActive}
            />
          </>
        )}
      </div>

      {!searchFocused && filterActive ? (
        <div className="flex items-center gap-3 px-0.5">
          <p className="min-w-0 flex-1 truncate text-xs font-medium text-muted">
            Showing {filterSummary}
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="shrink-0 text-xs font-bold tracking-tight text-accent"
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
      ) : !hasAny ? (
        <EmptyState
          title="Nothing to explore yet"
          message={
            contentMode === 'collections'
              ? 'Published collections that match your interests show up here.'
              : contentMode === 'designs'
                ? 'Published designs that match your interests show up here.'
                : 'Designs, collections, and businesses that match your interests show up here.'
          }
        />
      ) : (
        <div className="flex flex-col gap-7">
          {contentMode === 'all' ? (
            <MixedSection title="New for you" items={postsForYou} />
          ) : null}
          {contentMode === 'collections' ? (
            <CollectionSection title="New for you" items={collectionsForYou} />
          ) : null}
          {contentMode === 'designs' ? (
            <DesignSection title="New for you" items={designsForYou} />
          ) : null}
          <CompanySection
            title="Suppliers"
            items={data?.suggestedBusinesses ?? []}
            intentSide="sell"
            seeAllLabel="See all suppliers →"
            onSeeAll={() => setContentMode('businesses')}
          />
          {data?.lookingForWhatYouSell ? (
            <CompanySection
              title="Buyers for you"
              items={data.lookingForWhatYouSell}
              intentSide="buy"
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
