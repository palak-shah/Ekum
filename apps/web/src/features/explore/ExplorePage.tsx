import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { CollectionCard, CursorPage } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { CollectionPost } from '@/ui/cards';
import { EmptyState, LoadingBlock, cx } from '@/ui/kit';
import { ExploreIcon } from '@/ui/icons';

const CATEGORY_CHIPS = ['All', 'Sarees', 'Salwar', 'Dress Material', 'Fabric'] as const;
const CITY_CHIPS = ['All cities', 'Surat', 'Jaipur'] as const;

export function ExplorePage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<(typeof CATEGORY_CHIPS)[number]>('All');
  const [city, setCity] = useState<(typeof CITY_CHIPS)[number]>('All cities');

  const collections = useQuery({
    queryKey: ['explore', 'collections', { category, city }],
    queryFn: () =>
      api.get<CursorPage<CollectionCard>>('/explore/collections', {
        limit: 20,
        ...(category === 'All' ? {} : { category }),
        ...(city === 'All cities' ? {} : { city }),
      }),
  });

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => navigate('/search')}
        className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-3.5 py-3 text-sm text-muted"
      >
        <ExploreIcon width={18} height={18} />
        Search businesses, collections, designs
      </button>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {CATEGORY_CHIPS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setCategory(value)}
            className={cx(
              'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium',
              category === value ? 'bg-accent text-white' : 'bg-foam text-muted',
            )}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {CITY_CHIPS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setCity(value)}
            className={cx(
              'shrink-0 rounded-full px-3 py-1 text-xs font-medium',
              city === value
                ? 'bg-ink text-white'
                : 'border border-line bg-surface text-muted',
            )}
          >
            {value}
          </button>
        ))}
      </div>

      {collections.isLoading ? (
        <LoadingBlock />
      ) : collections.data && collections.data.results.length > 0 ? (
        <div className="flex flex-col">
          {collections.data.results.map((collection) => (
            <CollectionPost key={collection.id} collection={collection} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No collections yet"
          message="Published collections from the market show up here."
        />
      )}
    </div>
  );
}
