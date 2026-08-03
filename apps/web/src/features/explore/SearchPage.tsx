import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type {
  CollectionCard,
  CompanyCard,
  CursorPage,
  DiscoveryProductCard,
  SearchType,
} from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { PageHeader } from '@/ui/PageHeader';
import { CollectionListItem, CompanyRow, ProductTile } from '@/ui/cards';
import { EmptyState, LoadingBlock, TextInput, cx } from '@/ui/kit';

const TABS: { value: SearchType; label: string }[] = [
  { value: 'company', label: 'Businesses' },
  { value: 'collection', label: 'Collections' },
  { value: 'design', label: 'Designs' },
];

export function SearchPage() {
  const [term, setTerm] = useState('');
  const [type, setType] = useState<SearchType>('company');
  const query = term.trim();

  const results = useQuery({
    queryKey: ['search', type, query],
    queryFn: () =>
      api.get<CursorPage<CompanyCard | CollectionCard | DiscoveryProductCard>>('/search', {
        q: query,
        type,
        limit: 20,
      }),
    enabled: query.length >= 2,
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Search" />
      <TextInput
        autoFocus
        placeholder="Search by name or city"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
      />
      <div className="flex gap-2">
        {TABS.map((item) => (
          <button
            key={item.value}
            onClick={() => setType(item.value)}
            className={cx(
              'rounded-full px-4 py-1.5 text-sm font-medium',
              type === item.value ? 'bg-accent text-white' : 'bg-foam text-muted',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {query.length < 2 ? (
        <EmptyState title="Start typing" message="Search across businesses, collections and designs." />
      ) : results.isLoading ? (
        <LoadingBlock />
      ) : results.data && results.data.results.length > 0 ? (
        <ResultList type={type} results={results.data.results} />
      ) : (
        <EmptyState title="No matches" message={`Nothing found for "${query}".`} />
      )}
    </div>
  );
}

function ResultList({
  type,
  results,
}: {
  type: SearchType;
  results: (CompanyCard | CollectionCard | DiscoveryProductCard)[];
}) {
  if (type === 'company') {
    return (
      <div className="flex flex-col gap-2">
        {(results as CompanyCard[]).map((company) => (
          <CompanyRow key={company.id} company={company} to={`/company/${company.id}`} />
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
        <ProductTile key={product.id} product={product} />
      ))}
    </div>
  );
}
