import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CollectionStatus,
  type CollectionDetailView,
  type CollectionView,
  type CreateCollectionDto,
  type SetCollectionProductsDto,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import {
  curateExistingTargets,
  filterCurateTargetsByQuery,
  mergeCollectionProductIds,
} from '@/features/browse/curateExisting';
import { useToast } from '@/ui/Toast';
import { Button, Field, Sheet, TextInput, cx } from '@/ui/kit';

function isHttpUrl(value: string | null | undefined): value is string {
  return Boolean(value && /^https?:\/\//i.test(value));
}

function statusLabel(status: CollectionView['status']): string {
  if (status === CollectionStatus.Published) return 'Published';
  if (status === CollectionStatus.Ready) return 'Ready';
  return 'Draft';
}

export function CurateFromSelectionSheet({
  open,
  onClose,
  productIds,
  defaultName,
  onCurated,
}: {
  open: boolean;
  onClose: () => void;
  /** When omitted, uses the full traveling shortlist. */
  productIds?: string[];
  /** Prefill pack name (one album expand or single design). */
  defaultName?: string;
  /** Called after a successful new pack or add-to-existing (before navigate). */
  onCurated?: () => void;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const shortlist = useBrowseShortlist();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [query, setQuery] = useState('');

  const owned = useQuery({
    queryKey: ['my-collections'],
    queryFn: () => api.get<CollectionView[]>('/collections'),
    enabled: open,
  });

  const targets = useMemo(
    () => curateExistingTargets(owned.data ?? []),
    [owned.data],
  );
  const filteredTargets = useMemo(
    () => filterCurateTargetsByQuery(targets, query),
    [targets, query],
  );

  useEffect(() => {
    if (!open) return;
    setName(defaultName?.trim() ?? '');
    setMode('new');
    setQuery('');
  }, [open, defaultName]);

  const ids = productIds ?? shortlist.entries.map((entry) => entry.productId);
  const entries = shortlist.entries.filter((entry) => ids.includes(entry.productId));
  const canSubmit = entries.length >= 1 && Boolean(name.trim());

  const createDraft = async (opts?: { openPublish?: boolean }) => {
    if (entries.length < 1) {
      showToast('Pick at least one design.', 'danger');
      return;
    }
    const packName = name.trim();
    if (!packName) {
      showToast('Enter a pack name.', 'danger');
      return;
    }
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
      onCurated?.();
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

  const addToExisting = async (pack: CollectionView) => {
    if (entries.length < 1) {
      showToast('Pick at least one design.', 'danger');
      return;
    }
    setSaving(true);
    try {
      const detail = await api.get<CollectionDetailView>(`/collections/${pack.id}`);
      const existingIds = detail.products.map((product) => product.id);
      const productIdsMerged = mergeCollectionProductIds(
        existingIds,
        entries.map((entry) => entry.productId),
      );
      const updated = await api.put<CollectionDetailView>(`/collections/${pack.id}/products`, {
        productIds: productIdsMerged,
      } satisfies SetCollectionProductsDto);
      queryClient.setQueryData(['collection', pack.id], updated);
      void queryClient.invalidateQueries({ queryKey: ['my-collections'] });
      shortlist.removeIds(entries.map((entry) => entry.productId));
      onCurated?.();
      onClose();
      showToast(`Added to ${pack.name}`);
      if (pack.status !== CollectionStatus.Published) {
        navigate(`/catalog/collections/${pack.id}`, { replace: true });
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : (err as Error).message || 'Could not add to pack.';
      showToast(message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Curate pack">
      {mode === 'existing' ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="self-start text-sm font-semibold text-accent"
            disabled={saving}
            onClick={() => setMode('new')}
          >
            ← New pack
          </button>
          <p className="text-sm text-muted">
            {entries.length} design{entries.length === 1 ? '' : 's'} · pick a pack to add them
          </p>
          {targets.length > 0 ? (
            <TextInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your packs"
              autoComplete="off"
            />
          ) : null}
          {owned.isLoading ? (
            <p className="text-sm text-muted">Loading packs…</p>
          ) : targets.length === 0 ? (
            <p className="text-sm text-muted">No packs yet — create a new one.</p>
          ) : filteredTargets.length === 0 ? (
            <p className="text-sm text-muted">No packs match.</p>
          ) : (
            <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto">
              {filteredTargets.map((pack) => (
                <li key={pack.id}>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void addToExisting(pack)}
                    className={cx(
                      'flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left',
                      'border-line bg-surface hover:border-accent hover:bg-accent/5 disabled:opacity-40',
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold tracking-tight text-ink">
                        {pack.name}
                      </p>
                      <p className="truncate text-xs font-medium text-muted">
                        {statusLabel(pack.status)}
                        {pack.productCount != null
                          ? ` · ${pack.productCount} design${pack.productCount === 1 ? '' : 's'}`
                          : ''}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
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
              placeholder="e.g. Festive 2026"
              autoComplete="off"
              autoFocus
            />
          </Field>
          <Button fullWidth disabled={saving || !canSubmit} onClick={() => void createDraft()}>
            {saving ? 'Saving…' : 'Save draft'}
          </Button>
          <Button
            variant="secondary"
            fullWidth
            disabled={saving || !canSubmit}
            onClick={() => void createDraft({ openPublish: true })}
          >
            Publish to Collection
          </Button>
          {owned.isLoading ? null : targets.length > 0 ? (
            <button
              type="button"
              className="text-center text-sm font-semibold text-accent"
              disabled={saving}
              onClick={() => setMode('existing')}
            >
              Add to existing pack
            </button>
          ) : (
            <p className="text-center text-xs text-muted">No packs yet — name a new one above.</p>
          )}
        </div>
      )}
    </Sheet>
  );
}
