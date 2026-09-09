import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProductRelistGrantView, ProductView } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { formatRate } from '@/lib/format';
import { useMyCompany } from '@/lib/queries';
import { PageHeader } from '@/ui/PageHeader';
import { useToast } from '@/ui/Toast';
import { Card, ErrorState, LoadingBlock, StatusPill, Tag } from '@/ui/kit';

export function ProductDetailPage() {
  const { id = '' } = useParams();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const me = useMyCompany();
  const product = useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get<ProductView>(`/products/${id}`),
  });

  const isOwner = Boolean(
    me.data?.id && product.data?.companyId && me.data.id === product.data.companyId,
  );

  const relistGrants = useQuery({
    queryKey: ['relist-grants', id],
    queryFn: () => api.get<ProductRelistGrantView[]>(`/products/${id}/relist-grants`),
    enabled: Boolean(id) && isOwner,
  });

  const revokeGrant = useMutation({
    mutationFn: (granteeId: string) => api.del(`/products/${id}/relist-grants/${granteeId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['relist-grants', id] });
      showToast('Removed pack permission');
    },
    onError: (err) =>
      showToast(err instanceof ApiError ? err.message : 'Could not remove.', 'danger'),
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
  const notes = data.description?.trim();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={data.name}
        action={
          isOwner ? (
            <Link to={`/catalog/products/${data.id}`} className="text-sm font-medium text-accent">
              Edit
            </Link>
          ) : undefined
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

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-ink">{formatRate(data.rate, data.unit)}</span>
          <StatusPill status={data.status} />
        </div>
        {data.moq != null && data.moq > 0 ? (
          <p className="text-sm font-medium text-ink">Minimum order · {data.moq} pcs</p>
        ) : null}
        {data.sku ? <p className="text-xs text-muted">SKU · {data.sku}</p> : null}
        {notes ? (
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Notes</p>
            <p className="whitespace-pre-wrap text-sm text-ink">{notes}</p>
          </div>
        ) : null}
        {data.categories.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {data.categories.map((category) => (
              <Tag key={category}>{category}</Tag>
            ))}
          </div>
        ) : null}
      </Card>

      {isOwner && (relistGrants.data?.length ?? 0) > 0 ? (
        <div data-testid="product-relist-grants">
          <Card className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-ink">Who can put in pack</p>
            <p className="text-xs text-muted">
              Businesses you Allowed for this design only — not Connections.
            </p>
            <ul className="flex flex-col gap-2">
              {relistGrants.data!.map((grant) => (
                <li
                  key={grant.companyId}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="min-w-0 truncate font-medium text-ink">
                    {grant.company.name}
                  </span>
                  <button
                    type="button"
                    className="shrink-0 text-xs font-semibold text-danger"
                    disabled={revokeGrant.isPending}
                    onClick={() => revokeGrant.mutate(grant.companyId)}
                    data-testid="product-relist-revoke"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
