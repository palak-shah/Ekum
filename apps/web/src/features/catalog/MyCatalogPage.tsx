import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { CollectionView, ProductView } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { formatRate } from '@/lib/format';
import { PageHeader } from '@/ui/PageHeader';
import { Button, Card, EmptyState, LoadingBlock, Sheet, StatusPill, cx } from '@/ui/kit';

type Tab = 'products' | 'collections';

export function MyCatalogPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('products');
  const [postOpen, setPostOpen] = useState(false);

  const products = useQuery({
    queryKey: ['my-products'],
    queryFn: () => api.get<ProductView[]>('/products'),
    enabled: tab === 'products',
  });
  const collections = useQuery({
    queryKey: ['my-collections'],
    queryFn: () => api.get<CollectionView[]>('/collections'),
    enabled: tab === 'collections',
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="My designs & collections"
        action={
          <button className="text-sm font-medium text-accent" onClick={() => setPostOpen(true)}>
            New post
          </button>
        }
      />

      <div className="flex gap-2">
        {(['products', 'collections'] as const).map((value) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={cx(
              'rounded-full px-4 py-1.5 text-sm font-medium capitalize',
              tab === value ? 'bg-accent text-white' : 'bg-foam text-muted',
            )}
          >
            {value === 'products' ? 'Designs' : 'Collections'}
          </button>
        ))}
      </div>

      {tab === 'products' ? (
        products.isLoading ? (
          <LoadingBlock />
        ) : products.data && products.data.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {products.data.map((product) => (
              <Link
                key={product.id}
                to={`/catalog/products/${product.id}`}
                className="overflow-hidden rounded-2xl border border-line bg-surface"
              >
                {product.images[0] ? (
                  <img src={product.images[0]} alt={product.name} className="h-32 w-full object-cover" />
                ) : (
                  <div className="flex h-32 items-center justify-center bg-foam text-2xl font-bold text-muted">
                    {product.name.charAt(0)}
                  </div>
                )}
                <div className="flex flex-col gap-1 p-2.5">
                  <p className="truncate text-sm font-medium text-ink">{product.name}</p>
                  <p className="text-xs text-muted">{formatRate(product.rate, product.unit)}</p>
                  <StatusPill status={product.status} />
                  {product.postedToMarketAt ? (
                    <p className="text-[10px] font-bold uppercase tracking-wide text-accent">On Explore</p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No designs yet"
            message="Your design library. Group any of them into a collection."
            action={<Button onClick={() => setPostOpen(true)}>New post</Button>}
          />
        )
      ) : collections.isLoading ? (
        <LoadingBlock />
      ) : collections.data && collections.data.length > 0 ? (
        <div className="flex flex-col gap-2">
          {collections.data.map((collection) => (
            <Link key={collection.id} to={`/catalog/collections/${collection.id}`}>
              <Card className="flex items-center gap-3">
                {collection.coverImage ? (
                  <img
                    src={collection.coverImage}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-foam text-lg font-bold text-muted">
                    {collection.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-ink">{collection.name}</p>
                  <p className="text-sm text-muted">{collection.productCount} designs</p>
                </div>
                <StatusPill status={collection.status} />
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No collections yet"
          message="Albums of designs from your library."
          action={<Button onClick={() => navigate('/catalog/collections/new')}>New collection</Button>}
        />
      )}

      <Sheet open={postOpen} onClose={() => setPostOpen(false)} title="What are you posting?">
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setPostOpen(false);
              navigate('/catalog/products/new');
            }}
            className="rounded-2xl border border-line px-4 py-3.5 text-left"
          >
            <p className="text-sm font-bold text-ink">Single design</p>
            <p className="mt-0.5 text-xs text-muted">One product post on Explore</p>
          </button>
          <button
            type="button"
            onClick={() => {
              setPostOpen(false);
              navigate('/catalog/collections/new');
            }}
            className="rounded-2xl border border-line px-4 py-3.5 text-left"
          >
            <p className="text-sm font-bold text-ink">Collection</p>
            <p className="mt-0.5 text-xs text-muted">Album of designs as one post</p>
          </button>
        </div>
      </Sheet>
    </div>
  );
}
