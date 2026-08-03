import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ProductView } from '@ekum/domain-types';
import { api } from '@/lib/apiClient';
import { formatRate } from '@/lib/format';
import { PageHeader } from '@/ui/PageHeader';
import { Card, ErrorState, LoadingBlock, StatusPill, Tag } from '@/ui/kit';

export function ProductDetailPage() {
  const { id = '' } = useParams();
  const product = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get<ProductView>(`/products/${id}`),
  });

  if (product.isLoading) {
    return <LoadingBlock label="Loading design…" />;
  }
  if (product.isError || !product.data) {
    return (
      <>
        <PageHeader title="Design" />
        <ErrorState message="This design isn't available." />
      </>
    );
  }

  const data = product.data;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={data.name}
        action={
          <Link to={`/catalog/products/${data.id}`} className="text-sm font-medium text-accent">
            Edit
          </Link>
        }
      />

      {data.images.length > 0 ? (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1">
          {data.images.map((image) => (
            <img key={image} src={image} alt={data.name} className="h-56 w-44 shrink-0 rounded-2xl object-cover" />
          ))}
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-2xl bg-foam text-3xl font-bold text-muted">
          {data.name.charAt(0).toUpperCase()}
        </div>
      )}

      <Card className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-ink">{formatRate(data.rate, data.unit)}</span>
          <StatusPill status={data.status} />
        </div>
        {data.sku ? <p className="text-xs text-muted">SKU · {data.sku}</p> : null}
        {data.description ? <p className="text-sm text-muted">{data.description}</p> : null}
        {data.categories.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {data.categories.map((category) => (
              <Tag key={category}>{category}</Tag>
            ))}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
