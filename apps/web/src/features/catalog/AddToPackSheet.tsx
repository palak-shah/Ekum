import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CollectionStatus,
  MEDIA_VARIANT,
  type CollectionDetailView,
  type CollectionView,
  type ProductView,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { displayCollectionName } from '@/features/catalog/collectionCreateHelpers';
import { isCatalogCollection, isGeneralCollection } from '@/features/catalog/youLibraryKind';
import { BrowseLotChrome } from '@/features/browse/BrowseLotChrome';
import {
  addToPackActionLabel,
  type AddToPackLabelSurface,
  addToPackAddedToast,
  addToPackAllCollectionsSelected,
  addToPackAlreadyInIds,
  addToPackCanConfirm,
  addToPackConfirmLabel,
  addToPackEligibleTargets,
  addToPackEmptyCopy,
  addToPackGrouped,
  addToPackIsDraft,
  addToPackIsMove,
  addToPackMatchesQuery,
  addToPackMergeMembership,
  addToPackSelectAll,
  addToPackSelectedIds,
  addToPackToggle,
  emptyAddToPackPick,
} from '@/features/catalog/libraryPickerSource';
import { CoverImage } from '@/ui/cards';
import { DraftChip } from '@/ui/DraftChip';
import { CollectionIcon } from '@/ui/icons';
import { Button, LoadingBlock, Sheet, cx } from '@/ui/kit';
import { useToast } from '@/ui/Toast';
import { invalidateAfterPackMembership } from '@/features/catalog/packMembershipInvalidate';

export function AddToPackSheet({
  open,
  onClose,
  productIds,
  knownDesigns = [],
  surface = 'album',
}: {
  open: boolean;
  onClose: () => void;
  productIds: string[];
  knownDesigns?: ProductView[];
  surface?: AddToPackLabelSurface;
}) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [findOpen, setFindOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [pick, setPick] = useState(emptyAddToPackPick);
  const collections = useQuery({
    queryKey: ['my-collections'],
    queryFn: () => api.get<CollectionView[]>('/collections'),
    enabled: open,
  });
  const products = useQuery({
    queryKey: ['my-products'],
    queryFn: () => api.get<ProductView[]>('/products'),
    enabled: open && productIds.length > 0,
  });

  useEffect(() => {
    if (open) return;
    setFindOpen(false);
    setQuery('');
    setPick(emptyAddToPackPick);
  }, [open]);

  const pickedDesigns = useMemo(() => {
    const byId = new Map((products.data ?? []).map((row) => [row.id, row]));
    for (const row of knownDesigns) {
      const existing = byId.get(row.id);
      byId.set(row.id, existing ? addToPackMergeMembership(existing, row) : row);
    }
    return productIds.map((id) => byId.get(id)).filter((row): row is ProductView => Boolean(row));
  }, [products.data, productIds, knownDesigns]);
  const designsReady = productIds.length === 0 || products.isFetched;
  const libraryPacks = useMemo(
    () =>
      (collections.data ?? []).filter(
        (row) => !isGeneralCollection(row.kind) && row.status !== CollectionStatus.Archived,
      ),
    [collections.data],
  );
  const alreadyIn = useMemo(
    () => addToPackAlreadyInIds(pickedDesigns, libraryPacks),
    [pickedDesigns, libraryPacks],
  );
  const destinations = useMemo(() => {
    if (!designsReady) return [];
    return addToPackEligibleTargets(libraryPacks, pickedDesigns).filter(
      (row) => !alreadyIn.has(row.id),
    );
  }, [libraryPacks, pickedDesigns, designsReady, alreadyIn]);
  const memberPacks = useMemo(
    () => libraryPacks.filter((row) => alreadyIn.has(row.id)),
    [libraryPacks, alreadyIn],
  );
  const visibleMembers = useMemo(
    () => memberPacks.filter((row) => addToPackMatchesQuery(row, query)),
    [memberPacks, query],
  );
  const visibleDestinations = useMemo(
    () => destinations.filter((row) => addToPackMatchesQuery(row, query)),
    [destinations, query],
  );
  const grouped = useMemo(() => addToPackGrouped(visibleDestinations), [visibleDestinations]);
  const pickable = visibleDestinations;
  const selectedIds = useMemo(() => new Set(addToPackSelectedIds(pick)), [pick]);

  const moving = addToPackIsMove(pickedDesigns);

  const add = useMutation({
    mutationFn: async () => {
      const ids = addToPackSelectedIds(pick);
      for (const collectionId of ids) {
        const detail = await api.get<CollectionDetailView>(`/collections/${collectionId}`);
        const next = [...new Set([...detail.products.map((row) => row.id), ...productIds])];
        await api.put(`/collections/${collectionId}/products`, {
          productIds: next,
          ...(moving ? { relocateExclusive: true } : {}),
        });
      }
    },
    onSuccess: () => {
      invalidateAfterPackMembership(queryClient);
      showToast(addToPackAddedToast(pick, moving));
      onClose();
    },
    onError: (error) => {
      const code = error instanceof ApiError ? error.code : '';
      showToast(
        error instanceof ApiError
          ? error.message
          : code === 'CATALOG_EXCLUSIVE'
            ? 'That design is already in a catalog.'
            : moving
              ? 'Could not move.'
              : 'Could not add to collection.',
        'danger',
      );
    },
  });

  const loading =
    collections.isLoading || (open && productIds.length > 0 && products.isLoading);
  const hasRows = memberPacks.length > 0 || destinations.length > 0;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={addToPackActionLabel(
        pickedDesigns.length > 0 ? pickedDesigns : knownDesigns,
        surface,
      )}
      footer={
        <Button
          fullWidth
          disabled={!addToPackCanConfirm(pick) || add.isPending || loading}
          loading={add.isPending}
          data-testid="add-to-pack-confirm"
          onClick={() => add.mutate()}
        >
          {addToPackConfirmLabel(pickedDesigns)}
        </Button>
      }
    >
      {loading ? (
        <LoadingBlock label="Loading collections…" />
      ) : !hasRows ? (
        <p className="text-sm text-muted">{addToPackEmptyCopy(pickedDesigns)}</p>
      ) : (
        <BrowseLotChrome
          findOpen={findOpen}
          findLabel="Find"
          findTestId="add-to-pack-find-toggle"
          findInputTestId="add-to-pack-search"
          findPlaceholder="Find"
          findValue={query}
          onFindToggle={() => {
            if (findOpen) {
              setFindOpen(false);
              setQuery('');
              return;
            }
            setFindOpen(true);
          }}
          onFindChange={setQuery}
          selecting
          selectedCount={selectedIds.size}
          allSelected={addToPackAllCollectionsSelected(pick, visibleDestinations, alreadyIn)}
          onEnterSelect={() => undefined}
          onSelectAll={() => setPick(addToPackSelectAll(visibleDestinations, alreadyIn))}
          onClear={() => setPick(emptyAddToPackPick)}
          showSelectAll={pickable.some((row) => !isCatalogCollection(row.kind))}
          selectTestId="add-to-pack-select"
        >
          {visibleMembers.length === 0 && visibleDestinations.length === 0 ? (
            <p className="text-sm text-muted">No collections match.</p>
          ) : (
            <div className="flex flex-col gap-4" data-testid="add-to-pack-list">
              {visibleMembers.length > 0 ? (
                <PackGroup
                  title="Already in"
                  rows={visibleMembers}
                  selectedIds={selectedIds}
                  alreadyIn={alreadyIn}
                  markMembers={false}
                  onToggle={(row) => setPick((prev) => addToPackToggle(prev, row, alreadyIn))}
                />
              ) : null}
              {grouped.collections.length > 0 ? (
                <PackGroup
                  title="Collections"
                  rows={grouped.collections}
                  selectedIds={selectedIds}
                  alreadyIn={alreadyIn}
                  onToggle={(row) => setPick((prev) => addToPackToggle(prev, row, alreadyIn))}
                />
              ) : null}
              {grouped.catalogs.length > 0 ? (
                <PackGroup
                  title="Catalogs"
                  rows={grouped.catalogs}
                  selectedIds={selectedIds}
                  alreadyIn={alreadyIn}
                  onToggle={(row) => setPick((prev) => addToPackToggle(prev, row, alreadyIn))}
                />
              ) : null}
              {destinations.length === 0 &&
              pickedDesigns.some((design) => design.catalogCollectionId) ? (
                <p className="text-sm text-muted">{addToPackEmptyCopy(pickedDesigns)}</p>
              ) : null}
            </div>
          )}
        </BrowseLotChrome>
      )}
    </Sheet>
  );
}

function PackGroup({
  title,
  rows,
  selectedIds,
  alreadyIn,
  markMembers = true,
  onToggle,
}: {
  title: string;
  rows: CollectionView[];
  selectedIds: Set<string>;
  alreadyIn: ReadonlySet<string>;
  markMembers?: boolean;
  onToggle: (row: CollectionView) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-1.5 text-xs font-emphasis uppercase tracking-wide text-muted">
        <CollectionIcon width={14} height={14} className="shrink-0" aria-hidden />
        {title}
      </p>
      <ul className="flex flex-col gap-1.5">
        {rows.map((row) => {
          const member = alreadyIn.has(row.id);
          const selected = !member && selectedIds.has(row.id);
          const draft = addToPackIsDraft(row.status);
          const name = displayCollectionName(row.name);
          const thumb = row.libraryThumb ?? row.coverImage ?? null;
          return (
            <li key={row.id}>
              <button
                type="button"
                data-testid={`add-to-pack-row-${row.id}`}
                aria-pressed={selected}
                aria-disabled={member || undefined}
                onClick={() => {
                  if (member) return;
                  onToggle(row);
                }}
                className={cx(
                  'flex w-full items-center gap-3 rounded-xl border px-2 py-2 text-left',
                  selected
                    ? 'border-accent bg-accent/5 font-emphasis text-ink'
                    : 'border-line bg-surface text-ink',
                )}
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                  <CoverImage
                    src={thumb}
                    alt={name}
                    className="h-16 w-16"
                    variant={MEDIA_VARIANT.Thumbnail1}
                  />
                </div>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] tracking-tight">{name}</span>
                  {draft ? (
                    <span className="mt-0.5 inline-block">
                      <DraftChip testId="add-to-pack-draft-chip" />
                    </span>
                  ) : null}
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {member && markMembers ? 'Already in' : selected ? 'Selected' : ''}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
