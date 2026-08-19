import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { ExploreProductPreviewView } from '@ekum/domain-types';
import { useSaveToggle } from '@/features/saved/useSaveToggle';
import { api } from '@/lib/apiClient';
import { formatRate } from '@/lib/format';
import { PageHeader } from '@/ui/PageHeader';
import { Card, ErrorState, LoadingBlock, Tag } from '@/ui/kit';
import { CompanyRow } from '@/ui/cards';

export function ExploreProductPage() {
  const { id = '' } = useParams();
  const product = useQuery({
    queryKey: ['explore', 'product', id],
    queryFn: () => api.get<ExploreProductPreviewView>(`/explore/products/${id}`),
    enabled: Boolean(id),
  });
  const save = useSaveToggle({ productId: id });

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
  const notes = data.description?.trim();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={data.name}
        action={
          <button
            type="button"
            className="rounded-full px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent/5 disabled:opacity-45"
            disabled={!id || save.isPending}
            onClick={() => save.toggle()}
          >
            {save.isSaved ? 'Saved' : 'Save'}
          </button>
        }
      />

      {data.images.length > 0 ? (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1">
          {data.images.map((image) => (
            <img
              key={image}
              src={image}
              alt={data.name}
              className="h-56 w-44 shrink-0 rounded-2xl object-cover"
            />
          ))}
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-2xl bg-foam text-3xl font-bold text-muted">
          {data.name.charAt(0).toUpperCase()}
        </div>
      )}

      <CompanyRow company={data.company} to={`/company/${data.company.id}`} />

      <Card className="flex flex-col gap-3">
        {data.visible ? (
          <>
            <span className="text-lg font-semibold text-ink">
              {formatRate(data.rate, data.unit)}
            </span>
            {data.moq != null && data.moq > 0 ? (
              <p className="text-sm font-medium text-ink">
                Minimum order · {data.moq} pcs
              </p>
            ) : null}
            {notes ? (
              <div className="flex flex-col gap-1">
                <p className="text-xs font-bold uppercase tracking-wide text-muted">Notes</p>
                <p className="whitespace-pre-wrap text-sm text-ink">{notes}</p>
              </div>
            ) : null}
            {data.categories && data.categories.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {data.categories.map((category) => (
                  <Tag key={category}>{category}</Tag>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-muted">
            Connect with {data.company.name} to see full details.
          </p>
        )}
        {!data.connected ? (
          <Link
            to={`/company/${data.company.id}`}
            className="text-sm font-bold text-accent"
          >
            View business →
          </Link>
        ) : null}
      </Card>
    </div>
  );
}
