import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  SUPER_CATEGORY_LABEL,
  SuperCategory,
  type CompanyCard,
  type CursorPage,
  type ExplorePost,
  type SuperCategory as SuperCategoryType,
} from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { useMyCompany } from '@/lib/queries';
import { useTradePresence } from '@/lib/tradePresence';
import { CompanyRow, ExploreFeedPost } from '@/ui/cards';
import { Chip, EmptyState, FilterRail, LoadingBlock, cx } from '@/ui/kit';
import { ExploreIcon } from '@/ui/icons';

const FALLBACK_CATEGORIES = ['Sarees', 'Salwar', 'Dress Material', 'Fabric'] as const;
const CITY_CHIPS = ['All cities', 'Surat', 'Jaipur'] as const;
const SUPER_IDS = new Set<string>(Object.values(SuperCategory));

type Scope = 'buy' | 'sell';

function chipLabel(value: string): string {
  if (value === 'All') return 'All';
  if (SUPER_IDS.has(value)) {
    return SUPER_CATEGORY_LABEL[value as SuperCategoryType] ?? value;
  }
  return value;
}

export function ExplorePage() {
  const navigate = useNavigate();
  const company = useMyCompany();
  const { buying, selling } = useTradePresence();
  const [category, setCategory] = useState('All');
  const [city, setCity] = useState<(typeof CITY_CHIPS)[number]>('All cities');
  const [scope, setScope] = useState<Scope>('buy');

  const showScope = buying && selling;
  const activeScope: Scope = showScope ? scope : selling && !buying ? 'sell' : 'buy';

  const categoryChips = useMemo(() => {
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

  const activeCategory = categoryChips.includes(category) ? category : 'All';

  const filters = {
    limit: 20,
    ...(activeCategory === 'All' ? {} : { category: activeCategory }),
    ...(city === 'All cities' ? {} : { city }),
  };

  const feed = useQuery({
    queryKey: ['explore', 'feed', filters],
    queryFn: () => api.get<CursorPage<ExplorePost>>('/explore/feed', filters),
    enabled: activeScope === 'buy',
  });

  const buyers = useQuery({
    queryKey: ['explore', 'companies', { ...filters, scope: 'sell' }],
    queryFn: () =>
      api.get<CursorPage<CompanyCard>>('/explore/companies', { ...filters, scope: 'sell' }),
    enabled: activeScope === 'sell',
  });

  const loading = activeScope === 'buy' ? feed.isLoading : buyers.isLoading;
  const feedResults = feed.data?.results ?? [];
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
          {categoryChips.map((value) => (
            <Chip
              key={value}
              active={activeCategory === value}
              onClick={() => setCategory(value)}
            >
              {chipLabel(value)}
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
        feedResults.length > 0 ? (
          <div className="ekum-rise -mx-4 flex flex-col">
            {feedResults.map((post) => (
              <ExploreFeedPost key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nothing here yet"
            message="Published collections and designs from the market show up here."
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
