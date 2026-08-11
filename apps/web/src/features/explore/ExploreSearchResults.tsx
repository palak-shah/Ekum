import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type {
  CollectionCard,
  CompanyCard,
  CursorPage,
  DiscoveryProductCard,
  SearchType,
  UniversalSearchResults,
} from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { CollectionListItem, CompanyRow, ProductTile } from '@/ui/cards';
import { EmptyState, LoadingBlock, cx } from '@/ui/kit';

const FILTERS: { value: SearchType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'company', label: 'Businesses' },
  { value: 'collection', label: 'Collections' },
  { value: 'design', label: 'Designs' },
];

function isUniversal(data: unknown): data is UniversalSearchResults {
  return Boolean(
    data &&
      typeof data === 'object' &&
      'companies' in data &&
      'collections' in data &&
      'designs' in data,
  );
}

type SearchPayload =
  | UniversalSearchResults
  | CursorPage<CompanyCard | CollectionCard | DiscoveryProductCard>;

/**
 * Results-only search body for Explore. Shown only when query length ≥ 2.
 * No idle empty-state void — Explore keeps the feed until the user types.
 */
export function ExploreSearchResults({
  query,
  onPickQuery,
}: {
  query: string;
  onPickQuery: (value: string) => void;
}) {
  const [filter, setFilter] = useState<SearchType | 'all'>('all');
  const q = query.trim();

  const results = useQuery({
    queryKey: ['search', filter, q],
    queryFn: async (): Promise<SearchPayload> => {
      if (filter === 'all') {
        return api.get<UniversalSearchResults>('/search', { q, limit: 8 });
      }
      return api.get<CursorPage<CompanyCard | CollectionCard | DiscoveryProductCard>>('/search', {
        q,
        type: filter,
        limit: 20,
      });
    },
    enabled: q.length >= 2,
    // Keep prior hits visible while the next keystroke fetches — avoids blank flash.
    placeholderData: keepPreviousData,
  });

  const universal = isUniversal(results.data) ? results.data : null;
  const typed =
    !universal && results.data && typeof results.data === 'object' && 'results' in results.data
      ? (results.data as CursorPage<CompanyCard | CollectionCard | DiscoveryProductCard>)
      : null;

  const hasUniversal =
    universal &&
    (universal.companies.length > 0 ||
      universal.collections.length > 0 ||
      universal.designs.length > 0 ||
      universal.cities.length > 0 ||
      universal.categories.length > 0);

  const showInitialLoading = results.isPending && !results.data;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 border-b border-line px-0.5">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={cx(
              '-mb-px border-b-2 pb-2 text-sm tracking-tight transition-colors',
              filter === item.value
                ? 'border-accent font-bold text-ink'
                : 'border-transparent font-medium text-muted',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {showInitialLoading ? (
        <LoadingBlock />
      ) : filter === 'all' ? (
        hasUniversal && universal ? (
          <UniversalResults data={universal} onPick={onPickQuery} />
        ) : (
          <EmptyState title="No matches" message={`Nothing found for "${q}".`} />
        )
      ) : typed && typed.results.length > 0 ? (
        <TypedResults type={filter} results={typed.results} />
      ) : (
        <EmptyState title="No matches" message={`Nothing found for "${q}".`} />
      )}
    </div>
  );
}

function HintLinks({
  title,
  values,
  onPick,
}: {
  title: string;
  values: string[];
  onPick: (value: string) => void;
}) {
  if (values.length === 0) return null;
  return (
    <section className="flex flex-col gap-1.5">
      <h2 className="text-xs font-bold uppercase tracking-wide text-muted">{title}</h2>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {values.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onPick(value)}
            className="text-sm font-semibold tracking-tight text-accent"
          >
            {value}
          </button>
        ))}
      </div>
    </section>
  );
}

function UniversalResults({
  data,
  onPick,
}: {
  data: UniversalSearchResults;
  onPick: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      {data.companies.length > 0 ? (
        <section className="flex flex-col gap-1">
          <h2 className="px-0.5 text-[15px] font-bold tracking-tight text-ink">Businesses</h2>
          <div className="flex flex-col divide-y divide-line/70">
            {data.companies.map((company) => (
              <CompanyRow
                key={company.id}
                company={company}
                to={`/company/${company.id}`}
                plain
              />
            ))}
          </div>
        </section>
      ) : null}

      {data.collections.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="px-0.5 text-[15px] font-bold tracking-tight text-ink">Collections</h2>
          <div className="flex flex-col gap-2">
            {data.collections.map((collection) => (
              <CollectionListItem key={collection.id} collection={collection} />
            ))}
          </div>
        </section>
      ) : null}

      {data.designs.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="px-0.5 text-[15px] font-bold tracking-tight text-ink">Designs</h2>
          <div className="grid grid-cols-2 gap-3">
            {data.designs.map((product) => (
              <Link key={product.id} to={`/explore/products/${product.id}`}>
                <ProductTile product={product} />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <HintLinks title="Cities" values={data.cities} onPick={onPick} />
      <HintLinks title="Categories" values={data.categories} onPick={onPick} />
    </div>
  );
}

function TypedResults({
  type,
  results,
}: {
  type: SearchType;
  results: (CompanyCard | CollectionCard | DiscoveryProductCard)[];
}) {
  if (type === 'company') {
    return (
      <div className="flex flex-col divide-y divide-line/70">
        {(results as CompanyCard[]).map((company) => (
          <CompanyRow key={company.id} company={company} to={`/company/${company.id}`} plain />
        ))}
      </div>
    );
  }
  if (type === 'collection') {
    return (
      <div className="flex flex-col gap-2">
        {(results as CollectionCard[]).map((collection) => (
          <CollectionListItem key={collection.id} collection={collection} />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      {(results as DiscoveryProductCard[]).map((product) => (
        <Link key={product.id} to={`/explore/products/${product.id}`}>
          <ProductTile product={product} />
        </Link>
      ))}
    </div>
  );
}
