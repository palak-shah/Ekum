import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ExploreProductPreviewView } from '@ekum/domain-types';
import { DesignSheet, type DesignSheetProduct } from '@/features/browse/DesignSheet';
import { api, ApiError } from '@/lib/apiClient';
import { useMyCompany } from '@/lib/queries';
import { PageHeader } from '@/ui/PageHeader';
import { useToast } from '@/ui/Toast';
import { ErrorState, LoadingBlock } from '@/ui/kit';

function toSheetProduct(data: ExploreProductPreviewView): DesignSheetProduct {
  return {
    id: data.id,
    name: data.name,
    images: data.images ?? [],
    companyId: data.company.id,
    companyName: data.company.name,
    allowForward: data.allowForward !== false,
    categories: data.categories ?? [],
    description: data.description ?? null,
    unit: data.unit ?? null,
    dispatchUnit: null,
    moq: data.moq ?? null,
    rate: data.rate ?? null,
    rateMax: data.rateMax ?? null,
  };
}

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
        <ErrorState message="This design isn't available." />
      </>
    );
  }

  const data = product.data;
  const sheetProduct = toSheetProduct(data);
  const isOwner = Boolean(me.data?.id && me.data.id === data.company.id);

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
