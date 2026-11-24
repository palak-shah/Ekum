import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  RateVisibility,
  RepostPricingMode,
  uniqueSharedRepostHop,
  type BroadcastListView,
  type CollectionDetailView,
  type CollectionPreviewView,
  type CollectionView,
  type CompanySettingsView,
  type ConnectionView,
  type CreateCollectionDto,
  type CurateCheckView,
  type ExploreProductPreviewView,
  type PublishCollectionDto,
  type SetCollectionProductsDto,
  type ShareLinkView,
} from '@ekum/domain-types';
import {
  RepostPricingFields,
  type RepostEditDesignRow,
} from '@/features/catalog/RepostPricingFields';
import {
  defaultPackRepostPricingForm,
  exclusiveRepostPricingFormFromPack,
  exploreShowRatesOn,
  publishPricingFieldsFromForm,
  repostSheetPricingReady,
  withExclusiveRepostPricingMode,
  type RepostPricingFormState,
} from '@/features/catalog/repostPricingForm';
import { formatCatalogRate } from '@/lib/catalogRate';
import { BuyerGroupFormSheet } from '@/features/broadcast/BuyerGroupFormSheet';
import { OwnerPackLifecycleSheet } from '@/features/catalog/OwnerPackLifecycleSheet';
import { removeRepostCopy } from '@/features/catalog/ownerPackLifecycle';
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
import {
  clampAudienceToCeiling,
  maxPublishAudienceForCuratedPack,
  narrowestAudienceCeiling,
} from '@/features/catalog/curationAudienceCeiling';
import {
  maxAllowDownloadForCuratedPack,
  maxAllowForwardForCuratedPack,
} from '@/features/catalog/downloadCeiling';
import { readCompanyPublishDefaults } from '@/features/catalog/publishDefaults';
import {
  emptyPublishAudienceState,
  publishAudienceCanSubmit,
  publishAudienceDtoFields,
  PublishAudienceFields,
  restorePublishAudienceState,
  selectCreatedGroup,
  type PublishAudienceState,
} from '@/features/catalog/PublishAudienceFields';
import { api, ApiError } from '@/lib/apiClient';
import { useMyCompany } from '@/lib/queries';
import { canNativeShare, catalogShareCopy, shareOrCopyInvite } from '@/lib/shareInvite';
import { useToast } from '@/ui/Toast';
import { Button, Field, InlineNotice, Sheet, TextArea, TextInput, cx } from '@/ui/kit';

/** Cart multi-design member stub for create / staged Edit adds. */
export type RepostSheetProductMember = {
  productId: string;
  name: string;
  companyId: string;
  thumbUrl?: string | null;
  companyName?: string | null;
  sourceCollectionId?: string | null;
  rate?: number | null;
  rateMax?: number | null;
  unit?: string | null;
  dispatchUnit?: string | null;
  catalogRateUnit?: string | null;
};

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
    }
  | {
      kind: 'products';
      productIds: string[];
      name: string;
      coverImage?: string | null;
      members?: RepostSheetProductMember[];
    };

const MEMBERSHIP_UNAVAILABLE =
  "These designs can't go in a collection now.";

function alreadyRepostedCollectionId(err: unknown): string | null {
  // Duck-type — avoid `instanceof ApiError` (Vite can duplicate the class).
  if (!err || typeof err !== 'object') return null;
  const record = err as { code?: unknown; details?: unknown };
  if (record.code !== 'ALREADY_REPOSTED') return null;
  const details = record.details;
  if (!details || typeof details !== 'object') return null;
  const id = (details as { collectionId?: unknown }).collectionId;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

async function fetchRepostOfCollectionId(target: RepostSheetTarget): Promise<string | null> {
  const found = await api.get<{ collectionId?: string }>(
    '/collections/repost-of',
    target.kind === 'collection'
      ? { sourceCollectionId: target.collectionId }
      : { sourceProductId: target.productId },
  );
  return typeof found?.collectionId === 'string' && found.collectionId.length > 0
    ? found.collectionId
    : null;
}

/**
 * Per-post Repost: publish under my name with Publish Who / rules + quiet 48h link.
 * Edit mode updates the existing child pack — never creates a second one.
 */
export function RepostSheet({
  open,
  onClose,
  onReposted,
  target,
  editCollectionId,
  editTitle,
  pendingProductIds,
  pendingMembers,
}: {
  open: boolean;
  onClose: () => void;
  /** Fired after publish/update succeeds so the feed can stamp the done icon. */
  onReposted?: (childCollectionId?: string) => void;
  target: RepostSheetTarget | null;
  /**
   * Edit mode when provided (string id, or null to resolve via ALREADY_REPOSTED).
   * Omit for create.
   */
  editCollectionId?: string | null;
  /** Own original → Edit post; own child / peer child → Edit repost. */
  editTitle?: 'Edit post' | 'Edit repost';
  /**
   * Cart Existing: design ids staged to merge into the pack on Save.
   * Unioned with current members for curate-check + membership PUT.
   */
  pendingProductIds?: string[];
  /** Display / ceiling stubs for staged ids not yet on the pack. */
  pendingMembers?: RepostSheetProductMember[];
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
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [removing, setRemoving] = useState(false);
  /** Batch 3 calc — Ask stays Show rates (rateVisibility), not a mode. */
  const [pricingForm, setPricingForm] = useState<RepostPricingFormState>(() =>
    defaultPackRepostPricingForm(),
  );
  const wantEdit = editCollectionId !== undefined;
  /** Child pack id for edit (prop or ALREADY_REPOSTED details). */
  const [resolvedEditId, setResolvedEditId] = useState<string | null>(
    typeof editCollectionId === 'string' ? editCollectionId : null,
  );
  const [baselineProductIds, setBaselineProductIds] = useState<string[]>([]);
  const [resolvingEdit, setResolvingEdit] = useState(false);
  const seededSource = useRef<string>('');
  const editHydrated = useRef(false);
  /** Gate form until edit detail restores Show rates + calc (avoid On-request flash). */
  const [editFormReady, setEditFormReady] = useState(false);
  /** Ignore stale resolve results after Strict Mode remount / close. */
  const resolveGen = useRef(0);

  // Prefer prop; keep local resolve when create hits ALREADY_REPOSTED.
  useEffect(() => {
    if (typeof editCollectionId === 'string') setResolvedEditId(editCollectionId);
  }, [editCollectionId]);

  const editing = Boolean(resolvedEditId);

  const packPreview = useQuery({
    queryKey: ['explore', 'collections', target?.kind === 'collection' ? target.collectionId : ''],
    queryFn: () =>
      api.get<CollectionPreviewView>(
        `/explore/collections/${(target as { collectionId: string }).collectionId}`,
      ),
    enabled: open && target?.kind === 'collection' && !editing,
  });

  const productPreview = useQuery({
    queryKey: ['explore', 'products', target?.kind === 'product' ? target.productId : ''],
    queryFn: () =>
      api.get<ExploreProductPreviewView>(
        `/explore/products/${(target as { productId: string }).productId}`,
      ),
    enabled: open && target?.kind === 'product' && !editing,
  });

  const editDetail = useQuery({
    queryKey: ['collections', 'detail', resolvedEditId ?? ''],
    queryFn: () => api.get<CollectionDetailView>(`/collections/${resolvedEditId}`),
    enabled: open && Boolean(resolvedEditId),
  });

  const pendingIds = useMemo(
    () =>
      (pendingProductIds ?? [])
        .map((id) => id.trim())
        .filter((id) => id.length > 0),
    [pendingProductIds],
  );

  const productIds = useMemo(() => {
    if (editing && editDetail.data) {
      const onPack = editDetail.data.products
        .filter((product) => !product.excluded)
        .map((product) => product.id);
      const seen = new Set(onPack);
      const merged = [...onPack];
      for (const id of pendingIds) {
        if (!seen.has(id)) {
          seen.add(id);
          merged.push(id);
        }
      }
      return merged;
    }
    if (!target) return [] as string[];
    if (target.kind === 'product') return [target.productId];
    if (target.kind === 'products') return [...target.productIds];
    return (packPreview.data?.products ?? []).map((product) => product.id);
  }, [editing, editDetail.data, target, packPreview.data?.products, pendingIds]);

  const ceilingMembers = useMemo(() => {
    if (editing && editDetail.data) {
      const onPack = editDetail.data.products
        .filter((product) => !product.excluded)
        .map((product) => ({
          companyId: product.companyId,
          audience: 'followers' as const,
          allowDownload: product.allowDownload === true,
        }));
      const known = new Set(
        editDetail.data.products.filter((p) => !p.excluded).map((p) => p.id),
      );
      const staged = (pendingMembers ?? [])
        .filter((row) => pendingIds.includes(row.productId) && !known.has(row.productId))
        .map((row) => ({
          companyId: row.companyId,
          audience: 'followers' as const,
          allowDownload: false,
        }));
      return [...onPack, ...staged];
    }
    if (!target) return [];
    if (target.kind === 'product') {
      return [
        {
          companyId: target.companyId,
          audience: 'followers',
          allowDownload: productPreview.data?.allowDownload === true,
        },
      ];
    }
    if (target.kind === 'products') {
      const byId = new Map((target.members ?? []).map((row) => [row.productId, row]));
      return target.productIds.map((id) => {
        const row = byId.get(id);
        return {
          companyId: row?.companyId ?? '',
          audience: 'followers' as const,
          allowDownload: false,
        };
      });
    }
    return (packPreview.data?.products ?? []).map((product) => ({
      companyId: product.companyId,
      audience: product.audience || 'followers',
      allowDownload: product.allowDownload === true,
    }));
  }, [
    editing,
    editDetail.data,
    target,
    packPreview.data?.products,
    productPreview.data?.allowDownload,
    pendingIds,
    pendingMembers,
  ]);

  const maxAudience = useMemo(
    () => maxPublishAudienceForCuratedPack(myCompanyId, ceilingMembers),
    [myCompanyId, ceilingMembers],
  );

  const sourcePackAllowDownload = useMemo(() => {
    if (editing && editDetail.data) {
      // Edit child — ceiling already baked into members; source pack N/A.
      return null;
    }
    if (target?.kind === 'collection') {
      const flag = packPreview.data?.allowDownload;
      return typeof flag === 'boolean' ? flag : null;
    }
    return null;
  }, [editing, editDetail.data, target, packPreview.data?.allowDownload]);

  const sourcePackAllowForward = useMemo(() => {
    if (editing && editDetail.data) return null;
    if (target?.kind === 'collection') {
      const flag = packPreview.data?.allowForward;
      return typeof flag === 'boolean' ? flag : null;
    }
    return null;
  }, [editing, editDetail.data, target, packPreview.data?.allowForward]);

  const maxAllowDownload = useMemo(
    () =>
      maxAllowDownloadForCuratedPack(
        myCompanyId,
        ceilingMembers,
        sourcePackAllowDownload,
      ),
    [myCompanyId, ceilingMembers, sourcePackAllowDownload],
  );

  const maxAllowForward = useMemo(
    () => maxAllowForwardForCuratedPack(sourcePackAllowForward),
    [sourcePackAllowForward],
  );

  const sourceChainExcludeIds = useMemo(() => {
    if (editing) return [] as string[];
    if (target?.kind === 'collection') {
      return packPreview.data?.sourceChainCompanyIds ?? [];
    }
    if (target?.kind === 'product') {
      return target.companyId ? [target.companyId] : [];
    }
    if (target?.kind === 'products') {
      return [
        ...new Set(
          (target.members ?? [])
            .map((row) => row.companyId)
            .filter((id): id is string => Boolean(id)),
        ),
      ];
    }
    return [] as string[];
  }, [editing, target, packPreview.data?.sourceChainCompanyIds]);

  useEffect(() => {
    if (maxAllowDownload !== false) return;
    setPublishAudience((prev) =>
      prev.allowDownload ? { ...prev, allowDownload: false } : prev,
    );
  }, [maxAllowDownload]);

  useEffect(() => {
    if (maxAllowForward !== false) return;
    setPublishAudience((prev) =>
      prev.allowForward ? { ...prev, allowForward: false } : prev,
    );
  }, [maxAllowForward]);

  const hasForeign = useMemo(() => {
    if (!myCompanyId) return true;
    return ceilingMembers.some((row) => row.companyId !== myCompanyId);
  }, [myCompanyId, ceilingMembers]);

  const sourceCollectionId =
    target?.kind === 'collection'
      ? target.collectionId
      : target?.kind === 'products'
        ? (() => {
            const hops = (target.members ?? [])
              .map((row) => row.sourceCollectionId)
              .filter((id): id is string => typeof id === 'string' && id.length > 0);
            const unique = [...new Set(hops)];
            return unique.length === 1 ? unique[0] : undefined;
          })()
        : undefined;
  const curateCheck = useQuery({
    queryKey: [
      'collections',
      'curate-check',
      'repost',
      productIds.join('|'),
      sourceCollectionId ?? '',
      resolvedEditId ?? '',
    ],
    queryFn: () =>
      api.post<CurateCheckView>('/collections/curate-check', {
        productIds,
        ...(sourceCollectionId ? { sourceCollectionId } : {}),
      }),
    enabled: open && productIds.length > 0,
  });

  const allowedIds = curateCheck.data?.allowedProductIds ?? [];

  const owned = useQuery({
    queryKey: ['my-collections'],
    queryFn: () => api.get<CollectionView[]>('/collections'),
    enabled: open,
  });
  const nameTargets = useMemo(() => {
    const all = curateExistingTargets(Array.isArray(owned.data) ? owned.data : []);
    if (!resolvedEditId) return all;
    return all.filter((pack) => pack.id !== resolvedEditId);
  }, [owned.data, resolvedEditId]);
  const nameClash = findOwnedPackByName(nameTargets, name);

  const memberEntries = useMemo(() => {
    if (editing && editDetail.data) {
      const onPack = editDetail.data.products
        .filter((product) => !product.excluded)
        .map((product) => ({
          productId: product.id,
          name: product.name,
          thumbUrl: product.images?.[0] ?? null,
          companyId: product.companyId,
          companyName: product.companyName ?? '',
          rate: product.rate ?? null,
          rateMax: product.rateMax ?? null,
          unit: product.unit ?? null,
          dispatchUnit: product.dispatchUnit ?? null,
          catalogRateUnit: product.catalogRateUnit ?? null,
        }));
      const known = new Set(onPack.map((row) => row.productId));
      const staged = (pendingMembers ?? [])
        .filter((row) => pendingIds.includes(row.productId) && !known.has(row.productId))
        .map((row) => ({
          productId: row.productId,
          name: row.name,
          thumbUrl: row.thumbUrl ?? null,
          companyId: row.companyId,
          companyName: row.companyName ?? '',
          rate: row.rate ?? null,
          rateMax: row.rateMax ?? null,
          unit: row.unit ?? null,
          dispatchUnit: row.dispatchUnit ?? null,
          catalogRateUnit: row.catalogRateUnit ?? null,
        }));
      // Staged ids without member stubs still appear for curate-check.
      const stubbed = new Set([...known, ...staged.map((row) => row.productId)]);
      const bare = pendingIds
        .filter((id) => !stubbed.has(id))
        .map((id) => ({
          productId: id,
          name: 'Design',
          thumbUrl: null as string | null,
          companyId: '',
          companyName: '',
          rate: null as number | null,
          rateMax: null as number | null,
          unit: null as string | null,
          dispatchUnit: null as string | null,
          catalogRateUnit: null as string | null,
        }));
      return [...onPack, ...staged, ...bare];
    }
    if (!target) return [];
    if (target.kind === 'product') {
      return [
        {
          productId: target.productId,
          name: target.name,
          thumbUrl: target.thumbUrl ?? null,
          companyId: target.companyId,
          companyName: '',
          rate: null as number | null,
          rateMax: null as number | null,
          unit: null as string | null,
          dispatchUnit: null as string | null,
          catalogRateUnit: null as string | null,
        },
      ];
    }
    if (target.kind === 'products') {
      const byId = new Map((target.members ?? []).map((row) => [row.productId, row]));
      return target.productIds.map((id) => {
        const row = byId.get(id);
        return {
          productId: id,
          name: row?.name ?? 'Design',
          thumbUrl: row?.thumbUrl ?? null,
          companyId: row?.companyId ?? '',
          companyName: row?.companyName ?? '',
          rate: row?.rate ?? null,
          rateMax: row?.rateMax ?? null,
          unit: row?.unit ?? null,
          dispatchUnit: row?.dispatchUnit ?? null,
          catalogRateUnit: row?.catalogRateUnit ?? null,
        };
      });
    }
    return (packPreview.data?.products ?? []).map((product) => ({
      productId: product.id,
      name: product.name,
      thumbUrl: product.images?.[0] ?? null,
      companyId: product.companyId,
      companyName: product.companyName ?? '',
      rate: product.rate ?? null,
      rateMax: product.rateMax ?? null,
      unit: product.unit ?? null,
      dispatchUnit: product.dispatchUnit ?? null,
      catalogRateUnit: product.catalogRateUnit ?? null,
    }));
  }, [editing, editDetail.data, target, packPreview.data?.products, pendingIds, pendingMembers]);

  const { allowed: allowedRows, blocked: blockedRows } = partitionCurateByCheck(
    memberEntries,
    curateCheck.data,
  );

  const editDesignRows: RepostEditDesignRow[] = useMemo(() => {
    // Edit mode shows active members even when curate-check soft-fails (settings-only save).
    const allowed = new Set(editing ? productIds : allowedIds);
    return memberEntries
      .filter((row) => allowed.has(row.productId))
      .map((row) => {
        const disclosed =
          row.rate != null && Number.isFinite(row.rate) ? row.rate : null;
        const label =
          disclosed != null
            ? formatCatalogRate({
                rate: row.rate,
                rateMax: row.rateMax,
                unit: row.unit,
                dispatchUnit: row.dispatchUnit,
                catalogRateUnit: row.catalogRateUnit,
              })
            : null;
        return {
          productId: row.productId,
          name: row.name,
          thumbUrl: row.thumbUrl,
          supplierRate: disclosed,
          supplierRateLabel: label ? `Supplier ${label}` : null,
        };
      });
  }, [memberEntries, allowedIds, editing, productIds]);

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
        : target?.kind === 'products'
          ? `ps:${target.productIds.join(',')}`
          : '';
  const seedKey = editing
    ? `edit:${resolvedEditId}:${pendingIds.join(',')}`
    : sourceKey;

  useEffect(() => {
    if (!open || !target || !sourceKey || editing) return;
    if (seededSource.current === seedKey) return;
    seededSource.current = seedKey;
    setName(target.name.trim());
    setConsent(false);
    setSheetError(null);
    setReadyInvite(null);
    setPricingForm(defaultPackRepostPricingForm());
    setBaselineProductIds([]);
  }, [open, sourceKey, seedKey, target, editing]);

  useEffect(() => {
    if (!open || !editing || !editDetail.data || !resolvedEditId) return;
    if (editHydrated.current && seededSource.current === seedKey) return;
    editHydrated.current = true;
    seededSource.current = seedKey;
    const detail = editDetail.data;
    const activeIds = detail.products.filter((p) => !p.excluded).map((p) => p.id);
    setName(detail.name.trim());
    setConsent(false);
    setSheetError(null);
    setReadyInvite(null);
    setBaselineProductIds(activeIds);
    setPublishAudience(
      restorePublishAudienceState({
        audience: detail.audience || 'followers',
        audienceCompanyIds: detail.audienceCompanyIds ?? [],
        audienceGroupIds: detail.audienceGroupIds ?? [],
        rateVisibility: detail.rateVisibility,
        allowForward: detail.allowForward !== false,
        allowDownload: detail.allowDownload === true,
        showSourceShops: detail.showSourceShops === true,
        maxAudience,
      }),
    );
    setPricingForm(
      exclusiveRepostPricingFormFromPack({
        repostPricingMode: detail.repostPricingMode,
        repostMarginValue: detail.repostMarginValue,
        repostEditedRate: detail.repostEditedRate,
      }),
    );
    setEditFormReady(true);
  }, [open, editing, editDetail.data, resolvedEditId, seedKey, maxAudience]);

  useEffect(() => {
    if (!open) {
      seededSource.current = '';
      editHydrated.current = false;
      setEditFormReady(false);
      resolveGen.current += 1;
      setResolvingEdit(false);
      setResolvedEditId(typeof editCollectionId === 'string' ? editCollectionId : null);
    }
  }, [open, editCollectionId]);

  // Create inherit from source pack — never grant more than received.
  const createAudienceSeeded = useRef('');
  useEffect(() => {
    if (!open || !settings.data || editing || wantEdit) return;
    if (target?.kind === 'collection' && packPreview.isLoading) return;
    if (createAudienceSeeded.current === seedKey) return;
    createAudienceSeeded.current = seedKey;
    const usual = readCompanyPublishDefaults(settings.data.tradeDefaults);
    if (target?.kind === 'collection' && packPreview.data) {
      const source = packPreview.data;
      const effectiveMax = narrowestAudienceCeiling(maxAudience, source.audience ?? null);
      const seededAudience = clampAudienceToCeiling(
        source.audience || 'followers',
        effectiveMax,
      );
      setPublishAudience(
        restorePublishAudienceState({
          audience: seededAudience,
          audienceCompanyIds: [],
          audienceGroupIds: [],
          rateVisibility:
            source.rateVisibility ||
            (hasForeign ? RateVisibility.OnRequest : usual.rateVisibility),
          allowForward:
            source.allowForward !== false && maxAllowForward !== false,
          allowDownload:
            source.allowDownload === true && maxAllowDownload !== false,
          showSourceShops: source.showSourceShops === true,
          maxAudience: effectiveMax,
        }),
      );
      return;
    }
    setPublishAudience({
      ...emptyPublishAudienceState(usual),
      rateVisibility: hasForeign ? RateVisibility.OnRequest : usual.rateVisibility,
      allowForward: usual.allowForward !== false && maxAllowForward !== false,
      allowDownload: usual.allowDownload === true && maxAllowDownload !== false,
      showSourceShops: false,
      policyHint: null,
    });
  }, [
    open,
    settings.data,
    hasForeign,
    editing,
    wantEdit,
    target,
    packPreview.isLoading,
    packPreview.data,
    seedKey,
    maxAudience,
    maxAllowDownload,
    maxAllowForward,
  ]);

  useEffect(() => {
    if (!open) createAudienceSeeded.current = '';
  }, [open]);

  // Resolve my existing child for this source (edit without stamp, or create when stamp lagged).
  useEffect(() => {
    if (!open || !target || resolvedEditId) return;
    // Stamp id already known — no lookup.
    if (typeof editCollectionId === 'string') return;
    const gen = ++resolveGen.current;
    let cancelled = false;
    if (wantEdit) {
      setResolvingEdit(true);
      setSheetError(null);
    }
    void (async () => {
      const adopt = (id: string) => {
        setResolvedEditId(id);
        onReposted?.(id);
        setSheetError(null);
      };
      try {
        const found = await fetchRepostOfCollectionId(target);
        if (cancelled || gen !== resolveGen.current) return;
        if (found) {
          adopt(found);
          return;
        }
        if (wantEdit) setSheetError("Couldn't open this repost.");
      } catch (lookupErr) {
        if (cancelled || gen !== resolveGen.current) return;
        // Create path: lookup miss is fine — stay on create. Never probe-create here.
        if (!wantEdit) return;
        // Edit path: probe create only for ALREADY_REPOSTED.details (legacy).
        try {
          await api.post<CollectionDetailView>('/collections', {
            name: target.name.trim() || 'Repost',
            categories: [],
            ...(target.kind === 'collection'
              ? { repostSourceCollectionId: target.collectionId }
              : { repostSourceProductId: target.productId }),
          } satisfies CreateCollectionDto);
          if (cancelled || gen !== resolveGen.current) return;
          setSheetError("Couldn't open this repost.");
        } catch (err) {
          if (cancelled || gen !== resolveGen.current) return;
          const id = alreadyRepostedCollectionId(err);
          if (id) {
            adopt(id);
            return;
          }
          try {
            const retry = await fetchRepostOfCollectionId(target);
            if (cancelled || gen !== resolveGen.current) return;
            if (retry) {
              adopt(retry);
              return;
            }
          } catch {
            // fall through
          }
          setSheetError(
            err instanceof ApiError
              ? err.message
              : lookupErr instanceof ApiError
                ? lookupErr.message
                : "Couldn't open this repost.",
          );
        }
      } finally {
        if (!cancelled && gen === resolveGen.current && wantEdit) setResolvingEdit(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // onReposted omitted — parent often passes a new inline fn each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stamp parent once per open/target
  }, [open, target, wantEdit, resolvedEditId, editCollectionId]);

  const packLocked =
    !editing &&
    target?.kind === 'collection' &&
    !packPreview.isLoading &&
    packPreview.data != null &&
    packPreview.data.products == null;

  const previewPending = wantEdit
    ? resolvingEdit ||
      (Boolean(resolvedEditId) && (editDetail.isLoading || !editFormReady))
    : target?.kind === 'collection' && packPreview.isLoading;
  const previewFailed = wantEdit
    ? (!resolvingEdit && !resolvedEditId) || editDetail.isError
    : target?.kind === 'collection' && packPreview.isError;
  const noMembers = editing
    ? !editDetail.isLoading &&
      !editDetail.isError &&
      editDetail.data != null &&
      productIds.length === 0
    : target?.kind === 'collection' &&
      !packPreview.isLoading &&
      !packPreview.isError &&
      packPreview.data != null &&
      Array.isArray(packPreview.data.products) &&
      packPreview.data.products.length === 0;
  const showPublishForm =
    Boolean(target) &&
    !previewPending &&
    !previewFailed &&
    !packLocked &&
    !noMembers &&
    (!editing || editFormReady);
  const previewErrorMessage =
    wantEdit && !resolvedEditId && sheetError
      ? sheetError
      : editing && editDetail.error instanceof ApiError
        ? editDetail.error.message
        : packPreview.error instanceof ApiError
          ? packPreview.error.message
          : "Couldn't load these designs.";

  const showRates = exploreShowRatesOn(publishAudience.rateVisibility);
  const pricingReady = repostSheetPricingReady({
    showRates,
    form: pricingForm,
  });

  const supplierCue = useMemo(() => {
    // Prefer disclosed member source rates — never buyer-facing as “Supplier”.
    const fromMembers = (editDetail.data?.memberPricing ?? []).filter(
      (row) =>
        row.sourceDisclosed === true &&
        row.sourceRate != null &&
        Number.isFinite(row.sourceRate),
    );
    if (fromMembers.length > 0) {
      const first = fromMembers[0]!.sourceRate!;
      if (fromMembers.every((row) => row.sourceRate === first)) {
        const label = formatCatalogRate({
          rate: first,
          catalogRateUnit:
            editDetail.data?.catalogRateUnit ?? packPreview.data?.rateUnit ?? null,
        });
        return label && label !== 'On request' ? `Supplier ${label}` : null;
      }
      return null;
    }
    const disclosed = editDesignRows.filter((row) => row.supplierRate != null);
    if (disclosed.length === 0) return null;
    if (disclosed.length === 1 && disclosed[0]?.supplierRateLabel) {
      return disclosed[0].supplierRateLabel;
    }
    const rates = disclosed.map((row) => row.supplierRate!);
    const first = rates[0]!;
    if (!rates.every((rate) => rate === first)) return null;
    const band = formatCatalogRate({
      rate: first,
      unit: packPreview.data?.rateUnit ?? null,
    });
    return band && band !== 'On request' ? `Supplier ${band}` : null;
  }, [
    editDetail.data?.memberPricing,
    editDetail.data?.catalogRateUnit,
    editDesignRows,
    packPreview.data?.rateUnit,
  ]);

  const membershipUnchanged =
    editing &&
    productIds.length === baselineProductIds.length &&
    productIds.every((id) => baselineProductIds.includes(id));

  const editMembershipOk =
    Boolean(membershipUnchanged) ||
    (productIds.length >= 1 &&
      pendingIds.every((id) => allowedIds.includes(id)) &&
      productIds.some((id) => allowedIds.includes(id) || baselineProductIds.includes(id)));

  const canSubmit = editing
    ? Boolean(name.trim()) &&
      editMembershipOk &&
      !nameClash &&
      (canPublishAlready || consent) &&
      publishAudienceCanSubmit(publishAudience) &&
      pricingReady &&
      !curateCheck.isLoading
    : Boolean(name.trim()) &&
      allowedIds.length >= 1 &&
      !nameClash &&
      (canPublishAlready || consent) &&
      publishAudienceCanSubmit(publishAudience) &&
      pricingReady &&
      !packLocked &&
      !curateCheck.isLoading;

  const setShowRates = (on: boolean) => {
    setPublishAudience((prev) => ({
      ...prev,
      rateVisibility: on ? RateVisibility.Visible : RateVisibility.OnRequest,
      // Soft hint for foreign packs — trader can still turn Show rates on.
      policyHint: !on && hasForeign
        ? 'Rates stay on request when this collection includes others’ designs.'
        : null,
    }));
  };

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
        ...(sourceCollectionId ? { sourceCollectionId } : {}),
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

  const buildPublishDto = (): PublishCollectionDto => {
    const ratesOn = exploreShowRatesOn(publishAudience.rateVisibility);
    // Rates off: omit calc fields so publish does not wipe Edit/Margin → Same
    // (match CollectionEditor). Visibility still updates.
    // Edit is pack/catalog only — one editedRate on the collection.
    const pricingFields = ratesOn
      ? publishPricingFieldsFromForm(pricingForm, {
          rateMin: packPreview.data?.rateMin ?? editDetail.data?.rate ?? null,
          rateMax: packPreview.data?.rateMax ?? editDetail.data?.rateMax ?? null,
        })
      : {};
    return {
      audience: publishAudience.audience as PublishCollectionDto['audience'],
      rateVisibility: publishAudience.rateVisibility as PublishCollectionDto['rateVisibility'],
      allowForward: publishAudience.allowForward,
      allowDownload: publishAudience.allowDownload,
      showSourceShops: hasForeign ? publishAudience.showSourceShops : false,
      ...publishAudienceDtoFields(publishAudience),
      ...(canPublishAlready ? {} : { consentToSell: true }),
      ...pricingFields,
    };
  };

  const runEditSave = async () => {
    if (!resolvedEditId) throw new Error('Nothing to update');
    const packName = name.trim();
    if (!packName) throw new Error('Enter a collection name.');

    const membershipChanged = !membershipUnchanged;
    if (membershipChanged) {
      const check = await api.post<CurateCheckView>('/collections/curate-check', {
        productIds,
        ...(sourceCollectionId ? { sourceCollectionId } : {}),
      });
      const allowed = new Set(check.allowedProductIds ?? []);
      const baseline = new Set(baselineProductIds);
      // Keep members already on the pack; only staged adds must pass curate-check.
      const nextIds = productIds.filter((id) => baseline.has(id) || allowed.has(id));
      const stagedFail = pendingIds.some((id) => !allowed.has(id) && !baseline.has(id));
      if (nextIds.length < 1 || stagedFail) {
        setSheetError(MEMBERSHIP_UNAVAILABLE);
        void queryClient.invalidateQueries({ queryKey: ['collections', 'curate-check'] });
        return;
      }
      await api.put<CollectionDetailView>(`/collections/${resolvedEditId}/products`, {
        productIds: nextIds,
        ...(sourceCollectionId ? { sourceCollectionId } : {}),
      } satisfies SetCollectionProductsDto);
    }

    if (editDetail.data && editDetail.data.name.trim() !== packName) {
      await api.patch(`/collections/${resolvedEditId}`, { name: packName });
    }

    await api.post(`/collections/${resolvedEditId}/publish`, buildPublishDto());

    void queryClient.invalidateQueries({ queryKey: ['my-collections'] });
    void queryClient.invalidateQueries({ queryKey: ['explore'] });
    void queryClient.invalidateQueries({ queryKey: ['collections', 'detail', resolvedEditId] });
    void queryClient.invalidateQueries({ queryKey: ['company-settings'] });
    onReposted?.(resolvedEditId);
    showToast(pendingIds.length > 0 ? 'Updated · designs added' : 'Updated');
    onClose();
  };

  const runRepost = async (withLink: boolean) => {
    if (!target) throw new Error('Nothing to repost');
    const packName = name.trim();
    if (!packName) throw new Error('Enter a collection name.');
    if (allowedIds.length < 1) throw new Error('Nothing you can put in a collection yet.');

    const cover = repostCoverUrl(
      target.kind === 'collection'
        ? target.coverImage
        : target.kind === 'product'
          ? target.thumbUrl
          : target.coverImage ??
            target.members?.find((row) => row.thumbUrl)?.thumbUrl ??
            null,
    );
    const hop =
      target.kind === 'collection'
        ? { repostSourceCollectionId: target.collectionId }
        : target.kind === 'product'
          ? { repostSourceProductId: target.productId }
          : uniqueSharedRepostHop(
              (target.members?.length
                ? target.members
                : target.productIds.map((productId) => ({ productId }))
              ).map((row) => ({
                productId: row.productId,
                collectionId:
                  'sourceCollectionId' in row
                    ? (row.sourceCollectionId ?? undefined)
                    : undefined,
              })),
            );

    let createdId: string | undefined;
    try {
      const created = await api.post<CollectionDetailView>('/collections', {
        name: packName,
        categories: [],
        ...(cover ? { coverImage: cover } : {}),
        ...hop,
      } satisfies CreateCollectionDto);
      createdId = created.id;
      await api.put<CollectionDetailView>(`/collections/${created.id}/products`, {
        productIds: allowedIds,
        ...(sourceCollectionId ? { sourceCollectionId } : {}),
      } satisfies SetCollectionProductsDto);

      await api.post(`/collections/${created.id}/publish`, buildPublishDto());

      void queryClient.invalidateQueries({ queryKey: ['my-collections'] });
      void queryClient.invalidateQueries({ queryKey: ['explore'] });
      void queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      void queryClient.invalidateQueries({ queryKey: ['company', 'me'] });
      onReposted?.(created.id);
      showToast('Reposted');

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
      const conflictId = alreadyRepostedCollectionId(err);
      if (conflictId) {
        setResolvedEditId(conflictId);
        editHydrated.current = false;
        setEditFormReady(false);
        throw err;
      }
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
      if (editing) {
        await runEditSave();
        return;
      }
      await runRepost(withLink);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'ALREADY_REPOSTED') {
        let conflictId = alreadyRepostedCollectionId(err);
        if (!conflictId && target) {
          try {
            conflictId = await fetchRepostOfCollectionId(target);
          } catch {
            conflictId = null;
          }
        }
        if (conflictId) {
          setResolvedEditId(conflictId);
          editHydrated.current = false;
          setEditFormReady(false);
          setSheetError(null);
          onReposted?.(conflictId);
          void queryClient.invalidateQueries({ queryKey: ['explore'] });
          // Stay open in edit mode — do not toast-close.
        } else {
          onReposted?.();
          void queryClient.invalidateQueries({ queryKey: ['explore'] });
          showToast('You already reposted this.');
          onClose();
        }
      } else if (err instanceof ApiError && err.code === 'COLLECTION_NAME_TAKEN') {
        setSheetError(CURATE_NAME_TAKEN);
      } else if (err instanceof ApiError && isCurateCeilingError(err)) {
        setSheetError(MEMBERSHIP_UNAVAILABLE);
        void queryClient.invalidateQueries({ queryKey: ['collections', 'curate-check'] });
      } else {
        const clash = err instanceof ApiError ? collectionNameClash(err) : null;
        setSheetError(
          clash
            ? CURATE_NAME_TAKEN
            : err instanceof ApiError
              ? err.message
              : (err as Error).message || (editing ? 'Could not update.' : 'Could not repost.'),
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const busy = saving || removing;
  const showRemoveRepost = Boolean(editing && editTitle === 'Edit repost' && resolvedEditId);
  const removeCopy = removeRepostCopy();

  const onRemoveRepost = async () => {
    if (!resolvedEditId || removing) return;
    setRemoving(true);
    setSheetError(null);
    try {
      await api.post(`/collections/${resolvedEditId}/remove-repost`);
      void queryClient.invalidateQueries({ queryKey: ['explore'] });
      void queryClient.invalidateQueries({ queryKey: ['collections'] });
      setRemoveConfirmOpen(false);
      onClose();
      showToast('Repost removed');
    } catch (err) {
      setSheetError(
        err instanceof ApiError ? err.message : "Couldn't remove this repost.",
      );
    } finally {
      setRemoving(false);
    }
  };

  return (
    <>
      <Sheet
        open={open}
        onClose={() => {
          if (!busy) onClose();
        }}
        title={
          wantEdit || editing ? (editTitle ?? 'Edit repost') : 'Repost'
        }
        footer={
          !showPublishForm ||
          (!editing && allowedIds.length < 1 && !curateCheck.isLoading) ||
          (editing && productIds.length < 1 && !curateCheck.isLoading && !showRemoveRepost)
            ? null
            : (
          <div className="flex flex-col gap-2">
            {nameClash && !editing ? (
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
            {!(editing && productIds.length < 1) ? (
            <Button
              fullWidth
              disabled={!canSubmit || busy}
              data-testid="repost-publish"
              onClick={() => void onRepostClick(false)}
            >
              {busy && !readyInvite && !removing
                ? editing
                  ? 'Saving…'
                  : 'Reposting…'
                : editing
                  ? 'Save'
                  : 'Repost'}
            </Button>
            ) : null}
            {editing ? (
              <p
                data-testid="repost-edit-rates-cue"
                className="text-center text-[12px] text-ink-3"
              >
                New rates apply to new orders.
              </p>
            ) : (
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
            )}
            {showRemoveRepost ? (
              <button
                type="button"
                disabled={busy}
                data-testid="repost-remove"
                onClick={() => setRemoveConfirmOpen(true)}
                className="text-center text-sm text-danger disabled:opacity-50"
              >
                Remove repost
              </button>
            ) : null}
              </>
            )}
          </div>
          )
        }
      >
        <div className="flex flex-col gap-4">
          {packLocked ? (
            <div className="flex flex-col gap-2" data-testid="repost-pack-locked">
              <InlineNotice message="Open this collection first — designs aren’t visible to put in a collection yet." />
              {target?.kind === 'collection' ? (
                <Link
                  to={`/collections/${target.collectionId}`}
                  className="text-sm font-emphasis text-accent"
                  onClick={() => onClose()}
                >
                  Open collection · Ask to see
                </Link>
              ) : null}
            </div>
          ) : null}

          {previewPending ? (
            <p className="text-sm text-muted">Loading designs…</p>
          ) : null}

          {previewFailed ? (
            <div className="flex flex-col gap-2" data-testid="repost-preview-failed">
              <InlineNotice message={previewErrorMessage} />
              {target?.kind === 'collection' ? (
                <Link
                  to={`/collections/${target.collectionId}`}
                  className="text-sm font-emphasis text-accent"
                  onClick={() => onClose()}
                >
                  Open collection
                </Link>
              ) : null}
            </div>
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

              <div className="flex flex-col gap-2" data-testid="repost-show-rates">
                <p className="text-sm font-emphasis text-ink">Show rates</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    data-testid="repost-rates-off"
                    onClick={() => setShowRates(false)}
                    className={cx(
                      'rounded-xl border px-3 py-2.5 text-left text-sm',
                      !showRates
                        ? 'border-accent bg-accent/5 font-emphasis text-ink'
                        : 'border-line text-muted',
                    )}
                  >
                    On request
                  </button>
                  <button
                    type="button"
                    data-testid="repost-rates-on"
                    onClick={() => setShowRates(true)}
                    className={cx(
                      'rounded-xl border px-3 py-2.5 text-left text-sm',
                      showRates
                        ? 'border-accent bg-accent/5 font-emphasis text-ink'
                        : 'border-line text-muted',
                    )}
                  >
                    Show rates
                  </button>
                </div>
                {!showRates && hasForeign ? (
                  <p className="text-xs text-muted" data-testid="repost-rates-foreign-hint">
                    Rates stay on request when this collection includes others’ designs.
                  </p>
                ) : null}
              </div>

              {showRates ? (
                <RepostPricingFields
                  variant="prototype"
                  value={pricingForm}
                  onChange={(next) => {
                    setPricingForm(withExclusiveRepostPricingMode(next, next.mode));
                    setSheetError(null);
                  }}
                  supplierCue={supplierCue}
                />
              ) : null}

              <PublishAudienceFields
                state={publishAudience}
                onChange={(next) => {
                  setSheetError(null);
                  // Show rates gate owns rateVisibility — keep Who from overwriting it.
                  setPublishAudience((prev) => ({
                    ...next,
                    rateVisibility: prev.rateVisibility,
                  }));
                }}
                lists={broadcastLists.data ?? []}
                connections={activeConnections}
                connectionsLoading={connections.isLoading}
                tradeDefaults={settings.data?.tradeDefaults}
                maxAudience={maxAudience}
                maxAllowDownload={hasForeign ? maxAllowDownload : null}
                maxAllowForward={maxAllowForward}
                excludeCompanyIds={sourceChainExcludeIds}
                showSourceShopsOption={hasForeign}
                hideShowRates
                isVisibilityUpdate={editing}
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

      <OwnerPackLifecycleSheet
        open={removeConfirmOpen}
        onClose={() => {
          if (!removing) setRemoveConfirmOpen(false);
        }}
        busy={removing}
        title={removeCopy.title}
        body={removeCopy.body}
        confirmLabel={removeCopy.confirmLabel}
        onConfirm={() => void onRemoveRepost()}
      />
    </>
  );
}
