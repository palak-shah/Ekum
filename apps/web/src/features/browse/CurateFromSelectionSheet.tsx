import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CollectionStatus,
  type CollectionDetailView,
  type CollectionView,
  type CreateCollectionDto,
  type CurateCheckView,
  type RelistAccessView,
  type RelistRequestView,
  type SetCollectionProductsDto,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useTradePresence } from '@/lib/tradePresence';
import { useMyCompany } from '@/lib/queries';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import {
  curateExistingTargets,
  filterCurateTargetsByQuery,
  findOwnedPackByName,
  mergeCollectionProductIds,
} from '@/features/browse/curateExisting';
import {
  CURATE_ADD_TO_IT,
  CURATE_ASK_RELIST,
  CURATE_NAME_TAKEN,
  curateAskAllLabel,
  curateAskKind,
  curateBlockReason,
  curateSaveDraftLabel,
  curateSkipSummary,
  groupRelistAskBatches,
  isCurateCeilingError,
  mayAskToPutInPack,
  partitionCurateByCheck,
} from '@/features/browse/curateCheck';
import { useToast } from '@/ui/Toast';
import { Button, Field, InlineNotice, Sheet, TextInput, cx } from '@/ui/kit';

function isHttpUrl(value: string | null | undefined): value is string {
  return Boolean(value && /^https?:\/\//i.test(value));
}

function statusLabel(status: CollectionView['status']): string {
  if (status === CollectionStatus.Published) return 'Published';
  if (status === CollectionStatus.Ready) return 'Ready';
  return 'Draft';
}

type BlockedRow = {
  productId: string;
  name: string;
  thumbUrl: string | null;
  companyId: string;
  companyName: string;
  sourceCollectionId?: string;
  code: string;
};

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
  const { trading } = useTradePresence();
  const me = useMyCompany();
  const myCompanyId = me.data?.id;
  const shortlist = useBrowseShortlist();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [askingKey, setAskingKey] = useState<string | null>(null);
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [query, setQuery] = useState('');
  const [sheetError, setSheetError] = useState<string | null>(null);

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
    setSheetError(null);
    setAskingKey(null);
  }, [open, defaultName]);

  const ids = productIds ?? shortlist.entries.map((entry) => entry.productId);
  const entries = shortlist.entries.filter((entry) => ids.includes(entry.productId));
  const idKey = ids.join('|');

  const curateCheck = useQuery({
    queryKey: ['collections', 'curate-check', idKey],
    queryFn: () =>
      api.post<CurateCheckView>('/collections/curate-check', { productIds: ids }),
    enabled: open && ids.length > 0,
  });

  const relistAccess = useQuery({
    queryKey: ['relist-access', idKey],
    queryFn: () => {
      const packByProductId: Record<string, string> = {};
      for (const entry of entries) {
        if (entry.sourceCollectionId) {
          packByProductId[entry.productId] = entry.sourceCollectionId;
        }
      }
      return api.post<RelistAccessView>('/relist-requests/access', {
        productIds: ids,
        packByProductId,
      });
    },
    enabled: open && ids.length > 0,
  });

  const { allowed, blocked } = partitionCurateByCheck(entries, curateCheck.data);
  const skipLine = curateSkipSummary(allowed.length, blocked.length);
  const pendingByProductId = relistAccess.data?.pendingByProductId ?? {};

  const relistAskable = blocked.filter((row) =>
    mayAskToPutInPack({
      trading,
      ownCompany: Boolean(myCompanyId) && row.companyId === myCompanyId,
      waiting: Boolean(pendingByProductId[row.productId]),
      packLocked: curateAskKind(row.code) === 'relist',
      lookOnly: row.code === 'FOLLOW_LOOK_ONLY',
    }),
  );

  const nameClash = findOwnedPackByName(targets, name);
  const checkReady = !curateCheck.isLoading;
  const canSubmit =
    allowed.length >= 1 && Boolean(name.trim()) && !nameClash && checkReady;

  const askRelist = useMutation({
    mutationFn: async (rows: { productId: string; sourceCollectionId?: string }[]) => {
      for (const batch of groupRelistAskBatches(rows)) {
        await api.post<RelistRequestView>('/relist-requests', batch);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['relist-access'] });
      void queryClient.invalidateQueries({ queryKey: ['collections', 'curate-check'] });
      setAskingKey(null);
    },
    onError: (err) => {
      setAskingKey(null);
      showToast(err instanceof ApiError ? err.message : 'Could not ask.', 'danger');
    },
  });

  const refetchSplit = async () => {
    const next = await queryClient.fetchQuery({
      queryKey: ['collections', 'curate-check', idKey],
      queryFn: () =>
        api.post<CurateCheckView>('/collections/curate-check', { productIds: ids }),
    });
    return partitionCurateByCheck(entries, next);
  };

  const putMembers = async (collectionId: string, productIdsToPut: string[]) => {
    return api.put<CollectionDetailView>(`/collections/${collectionId}/products`, {
      productIds: productIdsToPut,
    } satisfies SetCollectionProductsDto);
  };

  const createDraft = async (opts?: { openPublish?: boolean }) => {
    if (allowed.length < 1) return;
    const packName = name.trim();
    if (!packName) {
      setSheetError('Enter a pack name.');
      return;
    }
    const existing = findOwnedPackByName(targets, packName);
    if (existing) {
      setSheetError(CURATE_NAME_TAKEN);
      return;
    }
    const firstThumb = allowed.find((item) => isHttpUrl(item.thumbUrl))?.thumbUrl;
    setSaving(true);
    setSheetError(null);
    let createdId: string | undefined;
    try {
      const created = await api.post<CollectionDetailView>('/collections', {
        name: packName,
        ...(firstThumb ? { coverImage: firstThumb } : {}),
      } satisfies CreateCollectionDto);
      createdId = created.id;
      const toPut = allowed.map((entry) => entry.productId);
      let detail: CollectionDetailView;
      try {
        detail = await putMembers(created.id, toPut);
      } catch (err) {
        if (!(err instanceof ApiError) || !isCurateCeilingError(err)) throw err;
        const retry = await refetchSplit();
        if (retry.allowed.length < 1) {
          try {
            await api.del(`/collections/${created.id}`);
          } catch {
            // Best-effort
          }
          createdId = undefined;
          return;
        }
        detail = await putMembers(
          created.id,
          retry.allowed.map((entry) => entry.productId),
        );
      }
      queryClient.setQueryData(['collection', created.id], detail);
      void queryClient.invalidateQueries({ queryKey: ['my-collections'] });
      shortlist.removeIds(detail.products.map((product) => product.id));
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
      if (createdId) {
        try {
          await api.del(`/collections/${createdId}`);
        } catch {
          // Best-effort — do not leave the trader on an empty named draft.
        }
      }
      if (err instanceof ApiError && isCurateCeilingError(err)) {
        setSheetError(null);
        void queryClient.invalidateQueries({ queryKey: ['collections', 'curate-check'] });
        return;
      }
      const message =
        err instanceof ApiError ? err.message : (err as Error).message || 'Could not save pack.';
      setSheetError(message);
    } finally {
      setSaving(false);
    }
  };

  const addToExisting = async (pack: CollectionView) => {
    if (allowed.length < 1) return;
    setSaving(true);
    setSheetError(null);
    try {
      const detail = await api.get<CollectionDetailView>(`/collections/${pack.id}`);
      const existingIds = detail.products.map((product) => product.id);
      const productIdsMerged = mergeCollectionProductIds(
        existingIds,
        allowed.map((entry) => entry.productId),
      );
      let updated: CollectionDetailView;
      try {
        updated = await putMembers(pack.id, productIdsMerged);
      } catch (err) {
        if (!(err instanceof ApiError) || !isCurateCeilingError(err)) throw err;
        const retry = await refetchSplit();
        if (retry.allowed.length < 1) return;
        updated = await putMembers(
          pack.id,
          mergeCollectionProductIds(
            existingIds,
            retry.allowed.map((entry) => entry.productId),
          ),
        );
      }
      queryClient.setQueryData(['collection', pack.id], updated);
      void queryClient.invalidateQueries({ queryKey: ['my-collections'] });
      shortlist.removeIds(allowed.map((entry) => entry.productId));
      onCurated?.();
      onClose();
      showToast(`Added to ${pack.name}`);
      if (pack.status !== CollectionStatus.Published) {
        navigate(`/catalog/collections/${pack.id}`, { replace: true });
      }
    } catch (err) {
      if (err instanceof ApiError && isCurateCeilingError(err)) {
        setSheetError(null);
        void queryClient.invalidateQueries({ queryKey: ['collections', 'curate-check'] });
        return;
      }
      setSheetError(
        err instanceof ApiError
          ? err.message
          : (err as Error).message || 'Could not add to pack.',
      );
    } finally {
      setSaving(false);
    }
  };

  const blockedList = (rows: BlockedRow[]) => (
    <ul className="flex max-h-44 flex-col gap-2 overflow-y-auto" data-testid="curate-blocked-list">
      {rows.map((row) => {
        const waiting = Boolean(pendingByProductId[row.productId]);
        const showAsk = mayAskToPutInPack({
          trading,
          ownCompany: Boolean(myCompanyId) && row.companyId === myCompanyId,
          waiting,
          packLocked: curateAskKind(row.code) === 'relist',
          lookOnly: row.code === 'FOLLOW_LOOK_ONLY',
        });
        return (
          <li
            key={row.productId}
            className="flex items-center gap-2.5 rounded-xl border border-line bg-foam/60 px-2.5 py-2"
            data-testid="curate-blocked-row"
          >
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-foam">
              {row.thumbUrl && isHttpUrl(row.thumbUrl) ? (
                <img src={row.thumbUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-sm font-bold text-muted">
                  {row.name.slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{row.name}</p>
              <p className="truncate text-[12px] text-muted">{row.companyName}</p>
              <p className="mt-0.5 text-[12px] font-medium text-muted">
                {waiting ? 'Waiting for Allow' : curateBlockReason(row.code)}
              </p>
            </div>
            {showAsk ? (
              <button
                type="button"
                className="shrink-0 text-[13px] font-semibold text-accent disabled:opacity-50"
                disabled={askingKey != null}
                data-testid="curate-blocked-ask"
                onClick={() => {
                  setAskingKey(row.productId);
                  askRelist.mutate([row]);
                }}
              >
                {askingKey === row.productId ? 'Asking…' : CURATE_ASK_RELIST}
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );

  const skipChrome =
    blocked.length > 0 ? (
      <div className="flex flex-col gap-2">
        {skipLine ? (
          <p className="text-sm text-muted" data-testid="curate-skip-summary">
            {skipLine}
          </p>
        ) : null}
        {blockedList(blocked)}
        {relistAskable.length > 1 ? (
          <Button
            variant="secondary"
            fullWidth
            disabled={askingKey != null}
            data-testid="curate-ask-all-relist"
            onClick={() => {
              setAskingKey('all-relist');
              askRelist.mutate(relistAskable);
            }}
          >
            {askingKey === 'all-relist'
              ? 'Asking…'
              : curateAskAllLabel(relistAskable.length)}
          </Button>
        ) : null}
      </div>
    ) : null;

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
            {allowed.length} design{allowed.length === 1 ? '' : 's'} · pick a pack to add them
          </p>
          {skipChrome}
          {sheetError ? <InlineNotice message={sheetError} tone="muted" /> : null}
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
                    disabled={saving || allowed.length < 1}
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
          {curateCheck.isLoading ? (
            <p className="text-sm text-muted">Checking which can go in…</p>
          ) : (
            skipChrome
          )}
          <Field label="Name">
            <TextInput
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSheetError(null);
              }}
              placeholder="e.g. Festive 2026"
              autoComplete="off"
              autoFocus
            />
          </Field>
          {nameClash ? (
            <InlineNotice message={CURATE_NAME_TAKEN} tone="muted" />
          ) : null}
          {sheetError && !nameClash ? (
            <InlineNotice message={sheetError} tone="muted" />
          ) : null}
          {nameClash ? (
            <Button
              fullWidth
              disabled={saving || allowed.length < 1}
              onClick={() => void addToExisting(nameClash)}
            >
              {saving ? 'Saving…' : CURATE_ADD_TO_IT}
            </Button>
          ) : (
            <>
              <Button
                fullWidth
                disabled={saving || !canSubmit}
                onClick={() => void createDraft()}
                data-testid="curate-save-draft"
              >
                {saving ? 'Saving…' : curateSaveDraftLabel(allowed.length, blocked.length)}
              </Button>
              <Button
                variant="secondary"
                fullWidth
                disabled={saving || !canSubmit}
                onClick={() => void createDraft({ openPublish: true })}
              >
                Publish to Collection
              </Button>
            </>
          )}
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
