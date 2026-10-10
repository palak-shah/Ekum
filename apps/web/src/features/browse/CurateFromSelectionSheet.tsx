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
import { curateSheetDesigns } from '@/features/browse/curateSheetDesigns';
import { useBrowseCart } from '@/features/browse/useBrowseCart';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import {
  curateExistingTargets,
  curatePublishedTargets,
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
  curateSkipSummary,
  groupRelistAskBatches,
  isCurateCeilingError,
  mayAskToPutInPack,
  partitionCurateByCheck,
} from '@/features/browse/curateCheck';
import { useToast } from '@/ui/Toast';
import { DockIconButton } from '@/features/browse/BottomTradeDock';
import { BookmarkIcon, CollectionIcon, PlusIcon } from '@/ui/icons';
import { Button, Field, InlineNotice, Sheet, TextInput, cx } from '@/ui/kit';

type RepostMode = 'choose' | 'existing' | 'new';

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
  /** When omitted, uses cart + traveling shortlist. */
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
  const cart = useBrowseCart();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [askingKey, setAskingKey] = useState<string | null>(null);
  const [mode, setMode] = useState<RepostMode>('choose');
  const [query, setQuery] = useState('');
  const [sheetError, setSheetError] = useState<string | null>(null);

  const owned = useQuery({
    queryKey: ['my-collections'],
    queryFn: () => api.get<CollectionView[]>('/collections'),
    enabled: open,
  });

  /** Name clash / Add to it — any live album. */
  const nameTargets = useMemo(
    () => curateExistingTargets(owned.data ?? []),
    [owned.data],
  );
  /** Add to existing path — published only. */
  const publishedTargets = useMemo(
    () => curatePublishedTargets(owned.data ?? []),
    [owned.data],
  );
  const filteredPublished = useMemo(
    () => filterCurateTargetsByQuery(publishedTargets, query),
    [publishedTargets, query],
  );

  useEffect(() => {
    if (!open) return;
    setName(defaultName?.trim() ?? '');
    setMode('choose');
    setQuery('');
    setSheetError(null);
    setAskingKey(null);
  }, [open, defaultName]);

  const { ids, entries } = useMemo(
    () =>
      curateSheetDesigns({
        productIds,
        staging: shortlist.entries,
        cart: cart.designs,
      }),
    [productIds, shortlist.entries, cart.designs],
  );
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

  const nameClash = findOwnedPackByName(nameTargets, name);
  /** Enable while check loads (entries stand in); after check, need ≥1 allowed. */
  const canSubmit =
    Boolean(name.trim()) &&
    !nameClash &&
    (allowed.length >= 1 || (entries.length >= 1 && curateCheck.isLoading));

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
    const packName = name.trim();
    if (!packName) {
      setSheetError('Enter a collection name.');
      return;
    }
    if (allowed.length < 1) {
      if (curateCheck.isLoading) {
        setSheetError('Still checking which designs can go in…');
        return;
      }
      setSheetError('No designs can go in a collection yet.');
      return;
    }
    const existing = findOwnedPackByName(nameTargets, packName);
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
        categories: [],
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
      if (opts?.openPublish) {
        // Whom sheet opens on the pack; after live publish → My Collections.
        navigate(`/catalog/collections/${created.id}`, {
          replace: true,
          state: {
            notice: 'Draft ready — finish publish',
            openPublish: true,
            afterPublish: 'collections' as const,
          },
        });
        return;
      }
      showToast('Collection draft saved');
      navigate('/catalog?tab=collections', {
        replace: true,
        state: { collectionFilter: 'draft', productFilter: 'draft' },
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
        err instanceof ApiError ? err.message : (err as Error).message || 'Could not save collection.';
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
      if (pack.status === CollectionStatus.Published) {
        void queryClient.invalidateQueries({ queryKey: ['explore'] });
      }
      // Published → My Collections; draft/ready → Draft filter.
      const inDrafts =
        pack.status === CollectionStatus.Draft || pack.status === CollectionStatus.Ready;
      navigate('/catalog?tab=collections', {
        replace: true,
        state: {
          collectionFilter: inDrafts ? 'draft' : 'published',
          productFilter: inDrafts ? 'draft' : 'published',
        },
      });
    } catch (err) {
      if (err instanceof ApiError && isCurateCeilingError(err)) {
        setSheetError(null);
        void queryClient.invalidateQueries({ queryKey: ['collections', 'curate-check'] });
        return;
      }
      setSheetError(
        err instanceof ApiError
          ? err.message
          : (err as Error).message || 'Could not add to collection.',
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

  const designSummary = (
    <p className="text-sm text-muted" data-testid="repost-design-summary">
      {entries.length} design{entries.length === 1 ? '' : 's'} from{' '}
      {new Set(entries.map((entry) => entry.companyId)).size} business
      {new Set(entries.map((entry) => entry.companyId)).size === 1 ? '' : 'es'}
    </p>
  );

  const newActions =
    mode === 'new' && !nameClash ? (
      <div className="flex items-stretch gap-2" data-testid="repost-new-actions">
        <div className="w-[4.75rem] shrink-0">
          <DockIconButton
            testId="curate-save-draft"
            label={saving ? '…' : 'Save'}
            disabled={saving || !canSubmit}
            onClick={() => void createDraft()}
          >
            <BookmarkIcon width={22} height={22} />
          </DockIconButton>
        </div>
        <button
          type="button"
          data-testid="repost-publish"
          disabled={saving || !canSubmit}
          onClick={() => void createDraft({ openPublish: true })}
          className={cx(
            'flex min-h-12 min-w-0 flex-1 items-center justify-center rounded-xl px-4',
            'border border-accent bg-accent text-sm font-bold text-white',
            'disabled:opacity-40',
          )}
        >
          {saving ? 'Saving…' : 'Publish'}
        </button>
      </div>
    ) : mode === 'new' && nameClash ? (
      <Button
        fullWidth
        disabled={saving || allowed.length < 1}
        onClick={() => void addToExisting(nameClash)}
      >
        {saving ? 'Saving…' : CURATE_ADD_TO_IT}
      </Button>
    ) : null;

  return (
    <Sheet open={open} onClose={onClose} title="Repost" footer={newActions}>
      {mode === 'choose' ? (
        <div className="flex flex-col gap-3">
          {designSummary}
          {curateCheck.isLoading ? (
            <p className="text-sm text-muted">Checking which can go in…</p>
          ) : (
            skipChrome
          )}
          <div className="flex flex-col gap-2" data-testid="repost-path-choose">
            <button
              type="button"
              data-testid="repost-path-existing"
              disabled={saving || allowed.length < 1}
              onClick={() => {
                setQuery('');
                setSheetError(null);
                setMode('existing');
              }}
              className={cx(
                'flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left',
                'border-line bg-surface hover:border-accent hover:bg-accent/5 disabled:opacity-40',
              )}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <CollectionIcon width={22} height={22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-ink">Add to existing collection</span>
                <span className="block text-xs font-medium text-muted">
                  Pick a published collection
                </span>
              </span>
            </button>
            <button
              type="button"
              data-testid="repost-path-new"
              disabled={saving || allowed.length < 1}
              onClick={() => {
                setSheetError(null);
                setMode('new');
              }}
              className={cx(
                'flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left',
                'border-line bg-surface hover:border-accent hover:bg-accent/5 disabled:opacity-40',
              )}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <PlusIcon width={22} height={22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-ink">Add new</span>
                <span className="block text-xs font-medium text-muted">
                  Name it, then publish
                </span>
              </span>
            </button>
          </div>
        </div>
      ) : null}

      {mode === 'existing' ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="self-start text-sm font-semibold text-accent"
            disabled={saving}
            data-testid="repost-back-choose"
            onClick={() => setMode('choose')}
          >
            ← Back
          </button>
          <p className="text-sm text-muted">
            {allowed.length} design{allowed.length === 1 ? '' : 's'} · pick a published collection
          </p>
          {skipChrome}
          {sheetError ? <InlineNotice message={sheetError} tone="muted" /> : null}
          {publishedTargets.length > 0 ? (
            <TextInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your collections"
              autoComplete="off"
            />
          ) : null}
          {owned.isLoading ? (
            <p className="text-sm text-muted">Loading collections…</p>
          ) : publishedTargets.length === 0 ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted">No published collections yet.</p>
              <Button
                variant="secondary"
                fullWidth
                disabled={saving || allowed.length < 1}
                onClick={() => setMode('new')}
              >
                Add new instead
              </Button>
            </div>
          ) : filteredPublished.length === 0 ? (
            <p className="text-sm text-muted">No collections match.</p>
          ) : (
            <ul
              className="flex max-h-72 flex-col gap-2 overflow-y-auto"
              data-testid="repost-existing-list"
            >
              {filteredPublished.map((pack) => (
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
      ) : null}

      {mode === 'new' ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="self-start text-sm font-semibold text-accent"
            disabled={saving}
            data-testid="repost-back-choose"
            onClick={() => setMode('choose')}
          >
            ← Back
          </button>
          {designSummary}
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
        </div>
      ) : null}
    </Sheet>
  );
}
