import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type {
  CollectionDetailView,
  CreateCollectionDto,
  SavedItemView,
  SetCollectionProductsDto,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { PageHeader } from '@/ui/PageHeader';
import { useToast } from '@/ui/Toast';
import {
  Button,
  EmptyState,
  ErrorState,
  Field,
  LoadingBlock,
  TextInput,
  cx,
} from '@/ui/kit';
import { SAVED_QUERY_KEY, useSavedList } from '@/features/saved/useSaveToggle';
import { defaultCollectionName } from './collectionCreateHelpers';

function isHttpUrl(value: string | null | undefined): value is string {
  return Boolean(value && /^https?:\/\//i.test(value));
}

export function CuratePackPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const saved = useSavedList();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [name, setName] = useState(() => defaultCollectionName());
  const [saving, setSaving] = useState(false);

  const productItems = useMemo(
    () => (saved.data ?? []).filter((item) => item.kind === 'product' && item.productId),
    [saved.data],
  );
  const collectionOnlyCount = useMemo(
    () => (saved.data ?? []).filter((item) => item.kind === 'collection').length,
    [saved.data],
  );

  const selectedProducts = useMemo(
    () => productItems.filter((item) => item.productId && selectedIds.has(item.productId)),
    [productItems, selectedIds],
  );

  const toggle = (productId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const createDraft = async (opts?: { openPublish?: boolean }) => {
    if (selectedProducts.length < 1) {
      showToast('Pick at least one saved design.', 'danger');
      return;
    }
    const packName = name.trim() || defaultCollectionName();
    const firstThumb = selectedProducts.find((item) => isHttpUrl(item.thumbUrl))?.thumbUrl;
    setSaving(true);
    try {
      const created = await api.post<CollectionDetailView>('/collections', {
        name: packName,
        ...(firstThumb ? { coverImage: firstThumb } : {}),
      } satisfies CreateCollectionDto);
      const productIds = selectedProducts
        .map((item) => item.productId)
        .filter((id): id is string => Boolean(id));
      const detail = await api.put<CollectionDetailView>(`/collections/${created.id}/products`, {
        productIds,
      } satisfies SetCollectionProductsDto);
      queryClient.setQueryData(['collection', created.id], detail);
      void queryClient.invalidateQueries({ queryKey: ['my-collections'] });
      void queryClient.invalidateQueries({ queryKey: SAVED_QUERY_KEY });
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
    <div className="flex flex-col gap-4 pb-8">
      <PageHeader title="Curate pack" onBack={() => navigate(-1)} />
      <p className="text-sm text-muted">
        Pick saved designs from any business, name the pack, then save a draft or publish.
      </p>

      <Field label="Name">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={defaultCollectionName()}
          autoComplete="off"
        />
      </Field>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-ink">From Saved</p>
        {saved.isLoading ? (
          <LoadingBlock label="Loading saved…" />
        ) : saved.isError ? (
          <ErrorState
            message={
              saved.error instanceof ApiError
                ? saved.error.message
                : 'Could not load Saved. Try again.'
            }
            onRetry={() => void saved.refetch()}
          />
        ) : productItems.length === 0 ? (
          <EmptyState
            title="No saved designs yet"
            message={
              collectionOnlyCount > 0
                ? 'You have saved collections — open them and save individual designs to curate.'
                : 'Save designs from Explore first, then pick them here.'
            }
            action={
              <Button variant="secondary" onClick={() => navigate('/saved')}>
                Open Saved
              </Button>
            }
          />
        ) : (
          <>
            {collectionOnlyCount > 0 ? (
              <p className="text-xs text-muted">
                Saved collections stay in Saved — pick designs (not whole collections) for this pack.
              </p>
            ) : null}
            <div className="flex flex-col gap-1.5">
              {productItems.map((item) => (
                <SavedProductPickRow
                  key={item.id}
                  item={item}
                  selected={Boolean(item.productId && selectedIds.has(item.productId))}
                  onToggle={() => item.productId && toggle(item.productId)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {selectedProducts.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-ink">
            Selected · {selectedProducts.length}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {selectedProducts.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-xl bg-foam">
                {item.thumbUrl ? (
                  <img
                    src={item.thumbUrl}
                    alt=""
                    className="aspect-square w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-square items-center justify-center text-lg font-bold text-muted">
                    {item.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <p className="truncate px-1.5 py-1 text-xs font-medium text-ink">{item.name}</p>
                <p className="truncate px-1.5 pb-1.5 text-[10px] text-muted">{item.company.name}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Button
          fullWidth
          disabled={saving || selectedProducts.length < 1}
          onClick={() => void createDraft()}
        >
          {saving ? 'Saving…' : 'Save draft'}
        </Button>
        <Button
          variant="secondary"
          fullWidth
          disabled={saving || selectedProducts.length < 1}
          onClick={() => void createDraft({ openPublish: true })}
        >
          Publish…
        </Button>
        <p className="text-center text-xs text-muted">
          Need more designs?{' '}
          <Link to="/saved" className="font-semibold text-accent">
            Saved
          </Link>
          {' · '}
          <Link to="/explore" className="font-semibold text-accent">
            Explore
          </Link>
        </p>
      </div>
    </div>
  );
}

function SavedProductPickRow({
  item,
  selected,
  onToggle,
}: {
  item: SavedItemView;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cx(
        'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left',
        selected ? 'border-accent bg-accent/5' : 'border-line bg-surface',
      )}
    >
      {item.thumbUrl ? (
        <img
          src={item.thumbUrl}
          alt=""
          className="h-12 w-12 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-foam text-sm font-bold text-muted">
          {item.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
        <p className="truncate text-xs text-muted">{item.company.name}</p>
      </div>
      <span className="shrink-0 text-xs text-muted">{selected ? 'Selected' : 'Add'}</span>
    </button>
  );
}
