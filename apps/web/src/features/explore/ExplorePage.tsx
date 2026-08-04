import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { CollectionCard, CompanyCard, CursorPage } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { useTradePresence } from '@/lib/tradePresence';
import { CollectionPost, CompanyRow } from '@/ui/cards';
import { Chip, EmptyState, FilterRail, LoadingBlock, cx } from '@/ui/kit';
import { ExploreIcon } from '@/ui/icons';

const CATEGORY_CHIPS = ['All', 'Sarees', 'Salwar', 'Dress Material', 'Fabric'] as const;
const CITY_CHIPS = ['All cities', 'Surat', 'Jaipur'] as const;

type Scope = 'buy' | 'sell';

export function ExplorePage() {
  const navigate = useNavigate();
  const { buying, selling } = useTradePresence();
  const [category, setCategory] = useState<(typeof CATEGORY_CHIPS)[number]>('All');
  const [city, setCity] = useState<(typeof CITY_CHIPS)[number]>('All cities');
  const [scope, setScope] = useState<Scope>('buy');

  const showScope = buying && selling;
  const activeScope: Scope = showScope ? scope : selling && !buying ? 'sell' : 'buy';

  const filters = {
    limit: 20,
    ...(category === 'All' ? {} : { category }),
    ...(city === 'All cities' ? {} : { city }),
  };

  const collections = useQuery({
    queryKey: ['explore', 'collections', filters],
    queryFn: () => api.get<CursorPage<CollectionCard>>('/explore/collections', filters),
    enabled: activeScope === 'buy',
  });

  const buyers = useQuery({
    queryKey: ['explore', 'companies', { ...filters, scope: 'sell' }],
    queryFn: () =>
      api.get<CursorPage<CompanyCard>>('/explore/companies', { ...filters, scope: 'sell' }),
    enabled: activeScope === 'sell',
  });

  const loading = activeScope === 'buy' ? collections.isLoading : buyers.isLoading;
  const collectionResults = collections.data?.results ?? [];
  const buyerResults = buyers.data?.results ?? [];

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => navigate('/search')}
        className="flex min-h-[46px] items-center gap-2 rounded-[13px] border border-line bg-surface px-3.5 text-sm font-medium text-muted"
      >
        <ExploreIcon width={18} height={18} />
        Search businesses, collections…
      </button>

      {showScope ? (
        <div className="grid grid-cols-2 gap-1 rounded-[14px] bg-foam p-1">
          {(
            [
              ['buy', 'Buying'],
              ['sell', 'Selling'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setScope(value)}
              className={cx(
                'rounded-[11px] py-2.5 text-sm font-bold tracking-tight',
                activeScope === value ? 'bg-surface text-ink shadow-sm' : 'text-muted',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex flex-col gap-2.5">
        <FilterRail>
          {CATEGORY_CHIPS.map((value) => (
            <Chip key={value} active={category === value} onClick={() => setCategory(value)}>
              {value}
            </Chip>
          ))}
        </FilterRail>
        <FilterRail>
          {CITY_CHIPS.map((value) => (
            <Chip key={value} active={city === value} onClick={() => setCity(value)}>
              {value}
            </Chip>
          ))}
        </FilterRail>
      </div>

      {loading ? (
        <LoadingBlock />
      ) : activeScope === 'buy' ? (
        collectionResults.length > 0 ? (
          <div className="ekum-rise -mx-4 flex flex-col">
            {collectionResults.map((collection) => (
              <CollectionPost key={collection.id} collection={collection} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No collections yet"
            message="Published collections from the market show up here."
          />
        )
      ) : buyerResults.length > 0 ? (
        <div className="ekum-rise flex flex-col divide-y divide-line">
          {buyerResults.map((buyer) => (
            <div key={buyer.id} className="py-2 first:pt-0">
              <CompanyRow company={buyer} to={`/company/${buyer.id}`} />
              {buyer.buyCategories.length > 0 ? (
                <p className="-mt-1 px-3.5 pb-1 pl-[3.75rem] text-xs font-medium text-muted">
                  Buys {buyer.buyCategories.slice(0, 3).join(' · ')}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No buyers yet"
          message="Businesses that buy in these categories show up when you're selling."
        />
      )}
    </div>
  );
}
