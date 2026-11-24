import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RepostPricingMode, type CollectionDetailView } from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { formatCatalogRate } from '@/lib/catalogRate';
import { useToast } from '@/ui/Toast';
import { Button, InlineNotice, Sheet } from '@/ui/kit';
import { RepostPricingFields } from '@/features/catalog/RepostPricingFields';
import {
  memberPricingDtoFromForm,
  repostPricingFormFromMember,
  repostPricingFormReady,
  type RepostPricingFormState,
} from '@/features/catalog/repostPricingForm';

/**
 * Owner: set / clear per-design buyer-facing calc on a repost pack.
 * Never writes Product.rate.
 */
export function RepostMemberPricingSheet({
  open,
  collectionId,
  productId,
  productName,
  onClose,
}: {
  open: boolean;
  collectionId: string | null | undefined;
  productId: string | null | undefined;
  productName?: string | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [form, setForm] = useState<RepostPricingFormState>({
    mode: null,
    marginValue: '',
    editedRate: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [seeded, setSeeded] = useState('');

  const detail = useQuery({
    queryKey: ['collection', collectionId, 'member-pricing'],
    queryFn: () => api.get<CollectionDetailView>(`/collections/${collectionId}`),
    enabled: open && Boolean(collectionId),
  });

  const row = useMemo(() => {
    if (!productId || !detail.data?.memberPricing) return null;
    return detail.data.memberPricing.find((entry) => entry.productId === productId) ?? null;
  }, [detail.data?.memberPricing, productId]);

  const packMode = detail.data?.repostPricingMode ?? null;

  useEffect(() => {
    if (!open || !productId || !row) return;
    const key = `${collectionId}:${productId}:${row.hasOverride}:${row.pricingMode}:${row.editInvalidated}`;
    if (seeded === key) return;
    setSeeded(key);
    setError(null);
    if (row.editInvalidated) {
      setForm({
        mode: RepostPricingMode.Edit,
        marginValue: '',
        editedRate: '',
      });
      return;
    }
    setForm(
      repostPricingFormFromMember({
        pricingMode: row.pricingMode,
        marginValue: row.marginValue,
        editedRate: row.editedRate,
        hasOverride: row.hasOverride,
      }),
    );
  }, [open, productId, collectionId, row, seeded]);

  useEffect(() => {
    if (!open) setSeeded('');
  }, [open]);

  const ready = repostPricingFormReady(form, { allowInherit: true });

  const onSave = async () => {
    if (!collectionId || !productId || !ready) return;
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/collections/${collectionId}/member-pricing`, {
        ...memberPricingDtoFromForm(productId, form, row?.sourceDisclosed ? row.sourceRate : null),
      });
      void queryClient.invalidateQueries({ queryKey: ['collection', collectionId] });
      void queryClient.invalidateQueries({ queryKey: ['explore', 'collections', collectionId] });
      showToast(form.mode == null ? 'Using pack rate' : 'Design rate saved');
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save design rate.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={productName?.trim() ? `Rate · ${productName}` : 'Design rate'}
      footer={
        <Button fullWidth loading={saving} disabled={!ready || detail.isLoading} onClick={() => void onSave()}>
          Save
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        {detail.isError ? (
          <InlineNotice
            message={
              detail.error instanceof ApiError
                ? detail.error.message
                : 'Could not load pack pricing.'
            }
          />
        ) : null}
        {!detail.isLoading && detail.data && !detail.data.memberPricing ? (
          <InlineNotice message="Design rates are only for reposted packs." tone="muted" />
        ) : (
          <RepostPricingFields
            value={form}
            onChange={setForm}
            allowInherit
            packModeHint={packMode}
            editInvalidated={row?.editInvalidated === true}
            testIdPrefix="member-pricing"
            supplierCue={
              row?.sourceDisclosed && row.sourceRate != null
                ? (() => {
                    const label = formatCatalogRate({
                      rate: row.sourceRate,
                      catalogRateUnit: detail.data?.catalogRateUnit ?? null,
                    });
                    return label && label !== 'On request' ? `Supplier ${label}` : null;
                  })()
                : null
            }
          />
        )}
        {error ? <InlineNotice message={error} /> : null}
      </div>
    </Sheet>
  );
}
