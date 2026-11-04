import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  RateVisibility,
  type BroadcastListView,
  type CollectionDetailView,
  type CollectionPreviewView,
  type CollectionView,
  type CompanySettingsView,
  type ConnectionView,
  type CreateCollectionDto,
  type CurateCheckView,
  type PublishCollectionDto,
  type SetCollectionProductsDto,
  type ShareLinkView,
} from '@ekum/domain-types';
import { BuyerGroupFormSheet } from '@/features/broadcast/BuyerGroupFormSheet';
import {
  catalogShareCopiedToast,
  catalogShareInviteText,
} from '@/features/browse/catalogShareLinkUnits';
import {
  CURATE_ADD_TO_IT,
  CURATE_NAME_TAKEN,
  CURATE_PACK_ONLY_SUMMARY,
  curateSkipSummary,
  isCurateCeilingError,
  partitionCurateByCheck,
} from '@/features/browse/curateCheck';
import { curateExistingTargets, findOwnedPackByName, mergeCollectionProductIds } from '@/features/browse/curateExisting';
import { collectionNameClash } from '@/features/catalog/collectionCreateHelpers';
import { RepostSkipSection } from '@/features/browse/RepostSkipSection';
import { repostCoverUrl } from '@/features/browse/repostCoverUrl';
import { maxPublishAudienceForCuratedPack } from '@/features/catalog/curationAudienceCeiling';
import { readCompanyPublishDefaults } from '@/features/catalog/publishDefaults';
import {
  emptyPublishAudienceState,
  publishAudienceCanSubmit,
  publishAudienceDtoFields,
  PublishAudienceFields,
  selectCreatedGroup,
  type PublishAudienceState,
} from '@/features/catalog/PublishAudienceFields';
import { api, ApiError } from '@/lib/apiClient';
import { useMyCompany } from '@/lib/queries';
import { canNativeShare, catalogShareCopy, shareOrCopyInvite } from '@/lib/shareInvite';
import { useToast } from '@/ui/Toast';
import { Button, Field, InlineNotice, Sheet, TextArea, TextInput } from '@/ui/kit';

export type RepostSheetTarget =
  | {
      kind: 'collection';
      collectionId: string;
      name: string;
      coverImage?: string | null;
    }
  | {
      kind: 'product';
      productId: string;
      name: string;
      companyId: string;
      thumbUrl?: string | null;
    };

/**
 * Per-post Repost: publish under my name with Publish Who / rules + quiet 48h link.
 * Stays on the current page — does not open Your selection.
 */
export function RepostSheet({
  open,
  onClose,
  onReposted,
  target,
}: {
  open: boolean;
  onClose: () => void;
  /** Fired after publish succeeds so the feed can show the done icon immediately. */
  onReposted?: () => void;
  target: RepostSheetTarget | null;
}) {
  const me = useMyCompany();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const canPublishAlready = Boolean(me.data?.capabilities.publish);
  const myCompanyId = me.data?.id;

  const [name, setName] = useState('');
  const [publishAudience, setPublishAudience] = useState<PublishAudienceState>(() =>
    emptyPublishAudienceState(),
  );
  const [consent, setConsent] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [readyInvite, setReadyInvite] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const seededSource = useRef<string>('');

  const packPreview = useQuery({
    queryKey: ['explore', 'collections', target?.kind === 'collection' ? target.collectionId : ''],
    queryFn: () =>
      api.get<CollectionPreviewView>(
        `/explore/collections/${(target as { collectionId: string }).collectionId}`,
      ),
    enabled: open && target?.kind === 'collection',
  });

  const productIds = useMemo(() => {
    if (!target) return [] as string[];
    if (target.kind === 'product') return [target.productId];
    return (packPreview.data?.products ?? []).map((product) => product.id);
  }, [target, packPreview.data?.products]);

  const ceilingMembers = useMemo(() => {
    if (!target) return [];
    if (target.kind === 'product') {
      return [{ companyId: target.companyId, audience: 'followers' }];
    }
    return (packPreview.data?.products ?? []).map((product) => ({
      companyId: product.companyId,
      audience: product.audience || 'followers',
    }));
  }, [target, packPreview.data?.products]);

  const maxAudience = useMemo(
    () => maxPublishAudienceForCuratedPack(myCompanyId, ceilingMembers),
    [myCompanyId, ceilingMembers],
  );

  const hasForeign = useMemo(() => {
    if (!myCompanyId) return true;
    return ceilingMembers.some((row) => row.companyId !== myCompanyId);
  }, [myCompanyId, ceilingMembers]);

  const curateCheck = useQuery({
    queryKey: ['collections', 'curate-check', 'repost', productIds.join('|')],
    queryFn: () =>
      api.post<CurateCheckView>('/collections/curate-check', { productIds }),
    enabled: open && productIds.length > 0,
  });

  const allowedIds = curateCheck.data?.allowedProductIds ?? [];

  const owned = useQuery({
    queryKey: ['my-collections'],
    queryFn: () => api.get<CollectionView[]>('/collections'),
    enabled: open,
  });
  const nameTargets = useMemo(
    () => curateExistingTargets(Array.isArray(owned.data) ? owned.data : []),
    [owned.data],
  );
  const nameClash = findOwnedPackByName(nameTargets, name);

  const memberEntries = useMemo(() => {
    if (!target) return [];
    if (target.kind === 'product') {
      return [
        {
          productId: target.productId,
          name: target.name,
          thumbUrl: target.thumbUrl ?? null,
          companyId: target.companyId,
          companyName: '',
        },
      ];
    }
    return (packPreview.data?.products ?? []).map((product) => ({
      productId: product.id,
      name: product.name,
      thumbUrl: product.images?.[0] ?? null,
      companyId: product.companyId,
      companyName: product.companyName ?? '',
    }));
  }, [target, packPreview.data?.products]);

  const { allowed: allowedRows, blocked: blockedRows } = partitionCurateByCheck(
    memberEntries,
    curateCheck.data,
  );

  const connections = useQuery({
    queryKey: ['connections'],
    queryFn: () => api.get<ConnectionView[]>('/connections'),
    enabled: open,
  });
  const broadcastLists = useQuery({
    queryKey: ['broadcast-lists'],
    queryFn: () => api.get<BroadcastListView[]>('/broadcasts/lists'),
    enabled: open,
  });
  const settings = useQuery({
    queryKey: ['company-settings'],
    queryFn: () => api.get<CompanySettingsView>('/settings'),
    enabled: open,
  });

  const activeConnections = (connections.data ?? []).filter((c) => c.status === 'active');

  const sourceKey =
    target?.kind === 'collection'
      ? `c:${target.collectionId}`
      : target?.kind === 'product'
        ? `p:${target.productId}`
        : '';

  useEffect(() => {
    if (!open || !target || !sourceKey) return;
    if (seededSource.current === sourceKey) return;
    seededSource.current = sourceKey;
    setName(target.name.trim());
    setConsent(false);
    setSheetError(null);
    setReadyInvite(null);
  }, [open, sourceKey, target]);

  useEffect(() => {
    if (!open) seededSource.current = '';
  }, [open]);

  useEffect(() => {
    if (!open || !settings.data) return;
    const usual = readCompanyPublishDefaults(settings.data.tradeDefaults);
    setPublishAudience({
      ...emptyPublishAudienceState(usual),
      rateVisibility: hasForeign ? RateVisibility.OnRequest : usual.rateVisibility,
      showSourceShops: false,
      policyHint: hasForeign
        ? 'Rates stay on request when this collection includes others’ designs.'
        : null,
    });
  }, [open, settings.data, hasForeign]);

  const packLocked =
    target?.kind === 'collection' &&
    !packPreview.isLoading &&
    packPreview.data != null &&
    packPreview.data.products == null;

  const previewPending = target?.kind === 'collection' && packPreview.isLoading;
  const previewFailed = target?.kind === 'collection' && packPreview.isError;
  const noMembers =
    target?.kind === 'collection' &&
    !packPreview.isLoading &&
    !packPreview.isError &&
    packPreview.data != null &&
    Array.isArray(packPreview.data.products) &&
    packPreview.data.products.length === 0;
  const showPublishForm =
    Boolean(target) && !previewPending && !previewFailed && !packLocked && !noMembers;
  const previewErrorMessage =
    packPreview.error instanceof ApiError
      ? packPreview.error.message
      : "Couldn't load these designs.";

  const canSubmit =
    Boolean(name.trim()) &&
    allowedIds.length >= 1 &&
    !nameClash &&
    (canPublishAlready || consent) &&
    publishAudienceCanSubmit(publishAudience) &&
    !packLocked &&
    !curateCheck.isLoading;

  const addToExisting = async (pack: CollectionView) => {
    if (allowedIds.length < 1) return;
    setSaving(true);
    setSheetError(null);
    try {
      const detail = await api.get<CollectionDetailView>(`/collections/${pack.id}`);
      const productIdsMerged = mergeCollectionProductIds(
        detail.products.map((product) => product.id),
        allowedIds,
      );
      await api.put<CollectionDetailView>(`/collections/${pack.id}/products`, {
        productIds: productIdsMerged,
      } satisfies SetCollectionProductsDto);
      void queryClient.invalidateQueries({ queryKey: ['my-collections'] });
      showToast(`Added to ${pack.name}`);
      onClose();
    } catch (err) {
      setSheetError(
        err instanceof ApiError ? err.message : (err as Error).message || 'Could not add to collection.',
      );
    } finally {
      setSaving(false);
    }
  };

  /** Returns true when the sheet should stay open for manual copy. */
  const mintLink = async (collectionId: string): Promise<boolean> => {
    const link = await api.post<ShareLinkView>('/share-links', { collectionId });
    const origin = window.location.origin;
    const url = `${origin}${link.path}`;
    const copy = catalogShareCopy({
      name: link.name,
      kind: link.kind,
      companyName: link.companyName,
    });
    const text = catalogShareInviteText([copy.text], [url]);
    try {
      const result = await shareOrCopyInvite({
        url,
        title: copy.title,
        text,
        preferShareSheet: canNativeShare(),
      });
      if (result === 'copied') showToast(catalogShareCopiedToast(1));
      if (result === 'manual') {
        setReadyInvite(text);
        return true;
      }
      return false;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return false;
      setReadyInvite(text);
      return true;
    }
  };

  const runRepost = async (withLink: boolean) => {
    if (!target) throw new Error('Nothing to repost');
    const packName = name.trim();
    if (!packName) throw new Error('Enter a collection name.');
    if (allowedIds.length < 1) throw new Error('Nothing you can put in a collection yet.');

    const cover = repostCoverUrl(
      target.kind === 'collection' ? target.coverImage : target.thumbUrl,
    );

    let createdId: string | undefined;
    try {
      const created = await api.post<CollectionDetailView>('/collections', {
        name: packName,
        categories: [],
        ...(cover ? { coverImage: cover } : {}),
        ...(target.kind === 'collection'
          ? { repostSourceCollectionId: target.collectionId }
          : { repostSourceProductId: target.productId }),
      } satisfies CreateCollectionDto);
      createdId = created.id;
      await api.put<CollectionDetailView>(`/collections/${created.id}/products`, {
        productIds: allowedIds,
      } satisfies SetCollectionProductsDto);

      const dto: PublishCollectionDto = {
        audience: publishAudience.audience as PublishCollectionDto['audience'],
        rateVisibility: publishAudience.rateVisibility as PublishCollectionDto['rateVisibility'],
        allowForward: publishAudience.allowForward,
        allowDownload: publishAudience.allowDownload,
        showSourceShops: hasForeign ? publishAudience.showSourceShops : false,
        ...publishAudienceDtoFields(publishAudience),
        ...(canPublishAlready ? {} : { consentToSell: true }),
      };
      await api.post(`/collections/${created.id}/publish`, dto);

      void queryClient.invalidateQueries({ queryKey: ['my-collections'] });
      void queryClient.invalidateQueries({ queryKey: ['explore'] });
      void queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      void queryClient.invalidateQueries({ queryKey: ['company', 'me'] });
      onReposted?.();
      showToast(
        !publishAudience.allowForward
          ? 'Reposted · Buyers can’t add these to collections.'
          : 'Reposted',
      );

      if (withLink) {
        try {
          const keepOpen = await mintLink(created.id);
          if (!keepOpen) onClose();
        } catch (err) {
          showToast(
            err instanceof ApiError ? err.message : 'Reposted — could not make a link.',
            'danger',
          );
          onClose();
        }
        return;
      }
      onClose();
    } catch (err) {
      if (createdId) {
        try {
          await api.del(`/collections/${createdId}`);
        } catch {
          // Best-effort
        }
      }
      throw err;
    }
  };

  const onRepostClick = async (withLink: boolean) => {
    if (busy) return;
    setSaving(true);
    setSheetError(null);
    setReadyInvite(null);
    try {
      await runRepost(withLink);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'ALREADY_REPOSTED') {
        onReposted?.();
        void queryClient.invalidateQueries({ queryKey: ['explore'] });
        showToast('You already reposted this.');
        onClose();
      } else if (err instanceof ApiError && err.code === 'COLLECTION_NAME_TAKEN') {
        setSheetError(CURATE_NAME_TAKEN);
      } else if (err instanceof ApiError && isCurateCeilingError(err)) {
        setSheetError(null);
        void queryClient.invalidateQueries({ queryKey: ['collections', 'curate-check'] });
      } else {
        const clash = err instanceof ApiError ? collectionNameClash(err) : null;
        setSheetError(
          clash
            ? CURATE_NAME_TAKEN
            : err instanceof ApiError
              ? err.message
              : (err as Error).message || 'Could not repost.',
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const busy = saving;

  return (
    <>
      <Sheet
        open={open}
        onClose={() => {
          if (!busy) onClose();
        }}
        title="Repost"
        footer={
          !showPublishForm || (allowedIds.length < 1 && !curateCheck.isLoading) ? null : (
          <div className="flex flex-col gap-2">
            {nameClash ? (
              <Button
                fullWidth
                disabled={busy || allowedIds.length < 1}
                data-testid="repost-add-to-it"
                onClick={() => void addToExisting(nameClash)}
              >
                {CURATE_ADD_TO_IT}
              </Button>
            ) : (
              <>
            <Button
              fullWidth
              disabled={!canSubmit || busy}
              data-testid="repost-publish"
              onClick={() => void onRepostClick(false)}
            >
              {busy && !readyInvite ? 'Reposting…' : 'Repost'}
            </Button>
            <button
              type="button"
              disabled={!canSubmit || busy}
              onClick={() => void onRepostClick(true)}
              className="text-center text-sm text-accent disabled:opacity-50"
              data-testid="repost-link-48h"
            >
              {busy
                ? 'Working…'
                : canNativeShare()
                  ? 'Repost + share a link · 48 hours'
                  : 'Repost + copy a link · 48 hours'}
            </button>
              </>
            )}
          </div>
          )
        }
      >
        <div className="flex flex-col gap-4">
          {previewPending || showPublishForm ? (
            <p className="text-sm text-muted">
              Publish under your name for the buyers you choose.
            </p>
          ) : null}

          {packLocked ? (
            <InlineNotice message="Open this collection first — designs aren’t visible to put in a collection yet." />
          ) : null}

          {previewPending ? (
            <p className="text-sm text-muted">Loading designs…</p>
          ) : null}

          {previewFailed ? (
            <InlineNotice message={previewErrorMessage} />
          ) : null}

          {noMembers ? (
            <div className="flex flex-col gap-1" data-testid="repost-unavailable-summary">
              <p className="text-sm text-muted">{curateSkipSummary(0, 2)}</p>
              <p className="text-sm text-muted">{CURATE_PACK_ONLY_SUMMARY}</p>
            </div>
          ) : null}

          {showPublishForm ? (
            <>
              {curateCheck.isLoading && productIds.length > 0 ? (
                <p className="text-sm text-muted">Checking which can go in…</p>
              ) : null}

              {productIds.length > 0 && !curateCheck.isLoading ? (
                <RepostSkipSection
                  allowed={allowedRows}
                  blocked={blockedRows}
                  extraHint={sheetError}
                  allowRelistAsk={false}
                  trading={false}
                  pendingByProductId={{}}
                  askingKey={null}
                  onAsk={() => undefined}
                  onAskAll={() => undefined}
                />
              ) : null}

              <Field label="Name">
                <TextInput
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSheetError(null);
                  }}
                  placeholder="e.g. Festive 2026"
                  autoComplete="off"
                  data-testid="repost-name"
                />
              </Field>

              <PublishAudienceFields
                state={publishAudience}
                onChange={(next) => {
                  setSheetError(null);
                  setPublishAudience(next);
                }}
                lists={broadcastLists.data ?? []}
                connections={activeConnections}
                connectionsLoading={connections.isLoading}
                tradeDefaults={settings.data?.tradeDefaults}
                maxAudience={maxAudience}
                showSourceShopsOption={hasForeign}
                showConsent={!canPublishAlready}
                consent={consent}
                onConsent={setConsent}
                consentLabel="You're sharing others' designs under their rules — publish this collection?"
                onCreateGroup={() => setCreateGroupOpen(true)}
              />

              {nameClash ? (
                <InlineNotice message={CURATE_NAME_TAKEN} tone="muted" />
              ) : null}
              {sheetError && !nameClash ? (
                <InlineNotice message={sheetError} />
              ) : null}
              {readyInvite ? (
                <Field label="48-hour link" hint="Select the text and copy.">
                  <TextArea
                    readOnly
                    value={readyInvite}
                    rows={Math.min(6, readyInvite.split('\n').length + 1)}
                    data-testid="repost-link-ready"
                  />
                </Field>
              ) : null}
            </>
          ) : null}
        </div>
      </Sheet>

      <BuyerGroupFormSheet
        open={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        onSaved={(list) => {
          setPublishAudience((prev) =>
            selectCreatedGroup(prev, list, broadcastLists.data ?? [], settings.data?.tradeDefaults),
          );
          void queryClient.invalidateQueries({ queryKey: ['broadcast-lists'] });
        }}
      />
    </>
  );
}
