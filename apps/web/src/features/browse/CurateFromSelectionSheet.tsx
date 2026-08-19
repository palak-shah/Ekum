import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type {
  CollectionDetailView,
  CreateCollectionDto,
  SetCollectionProductsDto,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { defaultCollectionName } from '@/features/catalog/collectionCreateHelpers';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import { useToast } from '@/ui/Toast';
import { Button, Field, Sheet, TextInput } from '@/ui/kit';

function isHttpUrl(value: string | null | undefined): value is string {
  return Boolean(value && /^https?:\/\//i.test(value));
}

export function CurateFromSelectionSheet({
  open,
  onClose,
  productIds,
}: {
  open: boolean;
  onClose: () => void;
  /** When omitted, uses the full traveling shortlist. */
  productIds?: string[];
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const shortlist = useBrowseShortlist();
  const [name, setName] = useState(() => defaultCollectionName());
  const [saving, setSaving] = useState(false);

  const ids = productIds ?? shortlist.entries.map((entry) => entry.productId);
  const entries = shortlist.entries.filter((entry) => ids.includes(entry.productId));

  const createDraft = async (opts?: { openPublish?: boolean }) => {
    if (entries.length < 1) {
      showToast('Pick at least one design.', 'danger');
      return;
    }
    const packName = name.trim() || defaultCollectionName();
    const firstThumb = entries.find((item) => isHttpUrl(item.thumbUrl))?.thumbUrl;
    setSaving(true);
    try {
      const created = await api.post<CollectionDetailView>('/collections', {
        name: packName,
        ...(firstThumb ? { coverImage: firstThumb } : {}),
      } satisfies CreateCollectionDto);
      const detail = await api.put<CollectionDetailView>(`/collections/${created.id}/products`, {
        productIds: entries.map((entry) => entry.productId),
      } satisfies SetCollectionProductsDto);
      queryClient.setQueryData(['collection', created.id], detail);
      void queryClient.invalidateQueries({ queryKey: ['my-collections'] });
      shortlist.removeIds(entries.map((entry) => entry.productId));
      onClose();
      navigate(`/catalog/collections/${created.id}`, {
        replace: true,
        state: {
          notice: opts?.openPublish ? 'Draft ready — finish publish' : 'Pack draft saved',
          ...(opts?.openPublish ? { openPublish: true } : {}),
        },
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : (err as Error).message || 'Could not save pack.';
      showToast(message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Curate pack">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted">
          {entries.length} design{entries.length === 1 ? '' : 's'} from{' '}
          {new Set(entries.map((entry) => entry.companyId)).size} business
          {new Set(entries.map((entry) => entry.companyId)).size === 1 ? '' : 'es'}
        </p>
        <Field label="Name">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={defaultCollectionName()}
            autoComplete="off"
          />
        </Field>
        <Button fullWidth disabled={saving || entries.length < 1} onClick={() => void createDraft()}>
          {saving ? 'Saving…' : 'Save draft'}
        </Button>
        <Button
          variant="secondary"
          fullWidth
          disabled={saving || entries.length < 1}
          onClick={() => void createDraft({ openPublish: true })}
        >
          Publish…
        </Button>
      </div>
    </Sheet>
  );
}
