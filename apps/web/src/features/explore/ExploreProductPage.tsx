import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ExploreProductPreviewView } from '@ekum/domain-types';
import { DesignSheet } from '@/features/browse/DesignSheet';
import { exploreProductToSheet } from '@/features/explore/exploreProductChrome';
import { api, ApiError } from '@/lib/apiClient';
import { useMyCompany } from '@/lib/queries';
import { PageHeader } from '@/ui/PageHeader';
import { useToast } from '@/ui/Toast';
import { Button, Card, ErrorState, LoadingBlock } from '@/ui/kit';
import { LockIcon } from '@/ui/icons';

/**
 * Deep-link / Explore open host for the shared DesignSheet (Back closes).
 * Chat multi-design PhotoViewer is unchanged.
 */
export function ExploreProductPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const me = useMyCompany();
  const [index, setIndex] = useState(0);

  const product = useQuery({
    queryKey: ['explore', 'product', id],
    queryFn: () => api.get<ExploreProductPreviewView>(`/explore/products/${id}`),
    enabled: Boolean(id),
  });

  const removeDesign = useMutation({
    mutationFn: () => api.del(`/products/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['explore'] });
      void queryClient.invalidateQueries({ queryKey: ['catalog'] });
      showToast('Design deleted', 'success');
      navigate(-1);
    },
    onError: (error) =>
      showToast(error instanceof ApiError ? error.message : 'Could not delete.', 'danger'),
  });

  if (product.isLoading) {
    return <LoadingBlock label="Loading design…" />;
  }
  if (product.isError || !product.data) {
    return (
      <>
        <PageHeader title="Design" onBack={() => navigate(-1)} />
        <div className="flex flex-col gap-3 px-4 pb-8">
          <ErrorState message="This design isn't available." />
          <Button fullWidth variant="secondary" onClick={() => navigate('/explore')}>
            Go to Explore
          </Button>
        </div>
      </>
    );
  }

  const data = product.data;
  const isOwner = Boolean(me.data?.id && me.data.id === data.company.id);

  if (!data.visible && !isOwner) {
    return (
      <div className="flex min-h-[40vh] flex-col gap-4 px-4 pb-8" data-testid="explore-product-locked">
        <PageHeader title={data.name} onBack={() => navigate(-1)} />
        <Card className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-foam text-muted">
            <LockIcon />
          </span>
          <div>
            <p className="text-sm font-emphasis text-ink">This design isn’t open to you yet</p>
            <p className="text-xs text-muted">
              Ask {data.company.name} for access on their shop.
            </p>
          </div>
          <Link
            to={`/company/${data.company.id}`}
            className="text-sm font-emphasis text-accent"
          >
            Follow on their shop
          </Link>
        </Card>
      </div>
    );
  }

  const sheetProduct = exploreProductToSheet(data);

  return (
    <div className="min-h-[40vh]" data-testid="explore-product-page">
      <PageHeader title={data.name} onBack={() => navigate(-1)} />
      <DesignSheet
        product={sheetProduct}
        shopLine={data.company.name}
        index={index}
        onIndex={setIndex}
        onClose={() => navigate(-1)}
        canEdit={isOwner}
        canDelete={isOwner}
        onEdit={
          isOwner
            ? () => {
                navigate(`/catalog/products/${data.id}`);
              }
            : undefined
        }
        onDelete={
          isOwner
            ? () => {
                if (
                  typeof window !== 'undefined' &&
                  !window.confirm(`Delete ${data.name}? This cannot be undone.`)
                ) {
                  return;
                }
                removeDesign.mutate();
              }
            : undefined
        }
        removeBusy={removeDesign.isPending}
        testIdPrefix="explore-design-sheet"
      />
    </div>
  );
}
