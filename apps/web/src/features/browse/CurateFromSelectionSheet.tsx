import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CollectionStatus,
  type CollectionView,
  type CurateCheckView,
  type RelistAccessView,
  type RelistRequestView,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { useTradePresence } from '@/lib/tradePresence';
import { useMyCompany } from '@/lib/queries';
import { curateSheetDesigns } from '@/features/browse/curateSheetDesigns';
import { useBrowseCart } from '@/features/browse/useBrowseCart';
import { useBrowseShortlist } from '@/features/browse/useBrowseShortlist';
import {
  curatePublishedTargets,
  filterCurateTargetsByQuery,
} from '@/features/browse/curateExisting';
import {
  groupRelistAskBatches,
  partitionCurateByCheck,
} from '@/features/browse/curateCheck';
import { useToast } from '@/ui/Toast';
import { CollectionIcon, PlusIcon } from '@/ui/icons';
import { CurateWhyHint } from '@/features/browse/CurateWhyHint';
import { RepostSkipSection } from '@/features/browse/RepostSkipSection';
import {
  RepostSheet,
  type RepostSheetProductMember,
  type RepostSheetTarget,
} from '@/features/explore/RepostSheet';
import { Button, InlineNotice, Sheet, TextInput, cx } from '@/ui/kit';

type ChooseMode = 'choose' | 'existing';

type RepostPhase =
  | { kind: 'idle' }
  | { kind: 'create'; target: RepostSheetTarget }
  | {
      kind: 'edit';
      editCollectionId: string;
      pendingProductIds: string[];
      pendingMembers: RepostSheetProductMember[];
      target: RepostSheetTarget;
    };

function statusLabel(status: CollectionView['status']): string {
  if (status === CollectionStatus.Published) return 'Published';
  if (status === CollectionStatus.Ready) return 'Ready';
  return 'Draft';
}

function membersFromEntries(
  rows: { productId: string; name: string; thumbUrl?: string | null; companyId: string; companyName?: string; sourceCollectionId?: string | null }[],
): RepostSheetProductMember[] {
  return rows.map((row) => ({
    productId: row.productId,
    name: row.name,
    thumbUrl: row.thumbUrl ?? null,
    companyId: row.companyId,
    companyName: row.companyName ?? '',
    sourceCollectionId: row.sourceCollectionId ?? null,
  }));
}

/**
 * Cart / You Repost: New | Existing first, then shared Explore RepostSheet
 * (Show rates / Same·Edit·±Margin / Who). Existing opens Edit with staged adds.
 */
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
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { trading } = useTradePresence();
  const me = useMyCompany();
  const myCompanyId = me.data?.id;
  const shortlist = useBrowseShortlist();
  const cart = useBrowseCart();
  const [mode, setMode] = useState<ChooseMode>('choose');
  const [query, setQuery] = useState('');
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [askingKey, setAskingKey] = useState<string | null>(null);
  const [repostPhase, setRepostPhase] = useState<RepostPhase>({ kind: 'idle' });
  const [defaultPackName, setDefaultPackName] = useState('');

  const owned = useQuery({
    queryKey: ['my-collections'],
    queryFn: () => api.get<CollectionView[]>('/collections'),
    enabled: open,
  });

  const ownedPacks = Array.isArray(owned.data) ? owned.data : [];
  const publishedTargets = useMemo(
    () => curatePublishedTargets(ownedPacks),
    [ownedPacks],
  );
  const filteredPublished = useMemo(
    () => filterCurateTargetsByQuery(publishedTargets, query),
    [publishedTargets, query],
  );

  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current) {
      setDefaultPackName(defaultName?.trim() ?? '');
      setMode('choose');
      setQuery('');
      setSheetError(null);
      setAskingKey(null);
      setRepostPhase({ kind: 'idle' });
    }
    if (!open) {
      setRepostPhase({ kind: 'idle' });
    }
    wasOpen.current = open;
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
    enabled: open && ids.length > 0 && repostPhase.kind === 'idle',
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
    enabled: open && ids.length > 0 && repostPhase.kind === 'idle',
  });

  const { allowed, blocked } = partitionCurateByCheck(entries, curateCheck.data);
  const pendingByProductId = relistAccess.data?.pendingByProductId ?? {};

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

  const openCreateRepost = () => {
    if (allowed.length < 1) return;
    const members = membersFromEntries(allowed);
    setRepostPhase({
      kind: 'create',
      target: {
        kind: 'products',
        productIds: allowed.map((row) => row.productId),
        name: defaultPackName.trim() || allowed[0]?.name || 'Repost',
        coverImage: allowed.find((row) => row.thumbUrl)?.thumbUrl ?? null,
        members,
      },
    });
  };

  const openEditRepost = (pack: CollectionView) => {
    if (allowed.length < 1) return;
    const members = membersFromEntries(allowed);
    setRepostPhase({
      kind: 'edit',
      editCollectionId: pack.id,
      pendingProductIds: allowed.map((row) => row.productId),
      pendingMembers: members,
      target: {
        kind: 'products',
        productIds: allowed.map((row) => row.productId),
        name: pack.name,
        members,
      },
    });
  };

  const onRepostDone = (childId?: string) => {
    void childId;
    const usedIds = allowed.map((row) => row.productId);
    shortlist.removeIds(usedIds);
    onCurated?.();
    setRepostPhase({ kind: 'idle' });
    onClose();
  };

  const onRepostClose = () => {
    setRepostPhase({ kind: 'idle' });
    setMode('choose');
  };

  const skipChrome = (
    <RepostSkipSection
      allowed={allowed}
      blocked={blocked}
      extraHint={sheetError}
      allowRelistAsk
      trading={trading}
      myCompanyId={myCompanyId}
      pendingByProductId={pendingByProductId}
      askingKey={askingKey}
      onAsk={(row) => {
        setAskingKey(row.productId);
        askRelist.mutate([
          {
            productId: row.productId,
            ...(row.sourceCollectionId ? { sourceCollectionId: row.sourceCollectionId } : {}),
          },
        ]);
      }}
      onAskAll={(rows) => {
        setAskingKey('all');
        askRelist.mutate(
          rows.map((row) => ({
            productId: row.productId,
            ...(row.sourceCollectionId ? { sourceCollectionId: row.sourceCollectionId } : {}),
          })),
        );
      }}
    />
  );

  const designSummary = (
    <p className="text-sm text-muted" data-testid="repost-design-summary">
      {entries.length} design{entries.length === 1 ? '' : 's'} ·{' '}
      {new Set(entries.map((entry) => entry.companyId)).size} business
      {new Set(entries.map((entry) => entry.companyId)).size === 1 ? '' : 'es'}
    </p>
  );

  const chooseOpen = open && repostPhase.kind === 'idle';
  const repostOpen = open && repostPhase.kind !== 'idle';

  return (
    <>
      <Sheet open={chooseOpen} onClose={onClose} title="Repost">
        {mode === 'choose' ? (
          <div className="flex flex-col gap-3">
            {designSummary}
            {curateCheck.isLoading ? (
              <p className="text-sm text-muted">Checking which can go in…</p>
            ) : (
              skipChrome
            )}
            {curateCheck.isLoading || allowed.length >= 1 ? (
              <div className="flex flex-col gap-2" data-testid="repost-path-choose">
                <button
                  type="button"
                  data-testid="repost-path-existing"
                  disabled={allowed.length < 1}
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
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <CollectionIcon width={22} height={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-emphasis text-ink">
                      Add to existing collection
                    </span>
                    <span className="block text-xs font-body text-muted">
                      Pick a published collection · set rates
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  data-testid="repost-path-new"
                  disabled={allowed.length < 1}
                  onClick={() => {
                    setSheetError(null);
                    openCreateRepost();
                  }}
                  className={cx(
                    'flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left',
                    'border-line bg-surface hover:border-accent hover:bg-accent/5 disabled:opacity-40',
                  )}
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <PlusIcon width={22} height={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-emphasis text-ink">Add new</span>
                    <span className="block text-xs font-body text-muted">
                      Name, rates, who — then Repost
                    </span>
                  </span>
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {mode === 'existing' ? (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              className="self-start text-sm font-emphasis text-accent"
              data-testid="repost-back-choose"
              onClick={() => setMode('choose')}
            >
              ← Back
            </button>
            <p className="text-sm text-muted">
              {allowed.length} design{allowed.length === 1 ? '' : 's'} · pick a published
              collection
            </p>
            {skipChrome}
            {sheetError ? (
              <div className="flex items-start gap-1">
                <div className="min-w-0 flex-1">
                  <InlineNotice message={sheetError} tone="muted" />
                </div>
                {blocked.length < 1 ? (
                  <CurateWhyHint codes={[]} extra={sheetError} testId="curate-skip-info" />
                ) : null}
              </div>
            ) : null}
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
                  disabled={allowed.length < 1}
                  onClick={() => openCreateRepost()}
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
                      disabled={allowed.length < 1}
                      data-testid={`repost-existing-${pack.id}`}
                      onClick={() => openEditRepost(pack)}
                      className={cx(
                        'flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left',
                        'border-line bg-surface hover:border-accent hover:bg-accent/5 disabled:opacity-40',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-emphasis tracking-tight text-ink">
                          {pack.name}
                        </p>
                        <p className="truncate text-xs font-body text-muted">
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
      </Sheet>

      {repostPhase.kind === 'create' ? (
        <RepostSheet
          open={repostOpen}
          onClose={onRepostClose}
          onReposted={onRepostDone}
          target={repostPhase.target}
        />
      ) : null}
      {repostPhase.kind === 'edit' ? (
        <RepostSheet
          open={repostOpen}
          onClose={onRepostClose}
          onReposted={onRepostDone}
          target={repostPhase.target}
          editCollectionId={repostPhase.editCollectionId}
          editTitle="Edit repost"
          pendingProductIds={repostPhase.pendingProductIds}
          pendingMembers={repostPhase.pendingMembers}
        />
      ) : null}
    </>
  );
}
