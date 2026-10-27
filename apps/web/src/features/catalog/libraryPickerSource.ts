import { CollectionStatus } from '@ekum/domain-types';
import { isCatalogCollection } from '@/features/catalog/youLibraryKind';
import { displayCollectionName } from '@/features/catalog/collectionCreateHelpers';
import { libraryReplaceKeepsPack } from '@/features/catalog/packKindCopy';

/**
 * Library picker source for Add designs.
 * Catalog: General Collection leftovers (no other own pack) + new photos.
 * Regular: own non-catalog designs, including those already in other regular packs.
 */
export function libraryDesignsEligibleForPack<
  T extends {
    id: string;
    catalogCollectionId?: string | null;
    collectionNames?: string[];
  },
>(designs: readonly T[], packKind: 'regular' | 'catalog'): T[] {
  return designs.filter((design) => {
    if (design.catalogCollectionId) return false;
    if (packKind === 'catalog') {
      return !design.collectionNames || design.collectionNames.length === 0;
    }
    return true;
  });
}

export type AddToPackPick = {
  collectionIds: string[];
  catalogId: string | null;
};

const emptyPick: AddToPackPick = { collectionIds: [], catalogId: null };

/** Add to pack: published + draft. Exclusive Move can join any live pack; leftover Add can join catalogs; pack members cannot join a catalog. */
export function addToPackEligibleTargets<
  P extends { kind?: string | null; status?: string | null },
>(
  packs: readonly P[],
  designs: readonly {
    catalogCollectionId?: string | null;
    collectionNames?: string[];
  }[],
): P[] {
  const live = packs.filter(
    (pack) => pack.status !== CollectionStatus.Archived && Boolean(pack.status),
  );
  if (addToPackIsMixedExclusive(designs)) return [];
  if (addToPackIsMove(designs)) return [...live];
  if (designs.some((design) => (design.collectionNames?.length ?? 0) > 0)) {
    return live.filter((pack) => !isCatalogCollection(pack.kind));
  }
  return [...live];
}

export function addToPackIsDraft(status?: string | null): boolean {
  return status === CollectionStatus.Draft || status === CollectionStatus.Ready;
}

type AddToPackMembership = {
  collectionIds?: string[] | null;
  collectionNames?: string[] | null;
  catalogCollectionId?: string | null;
};

export function addToPackMergeMembership<T extends AddToPackMembership>(base: T, extra: T): T {
  return {
    ...base,
    ...extra,
    collectionIds: [
      ...new Set([...(base.collectionIds ?? []), ...(extra.collectionIds ?? [])]),
    ],
    collectionNames: [
      ...new Set([...(base.collectionNames ?? []), ...(extra.collectionNames ?? [])]),
    ],
    catalogCollectionId: extra.catalogCollectionId ?? base.catalogCollectionId ?? null,
  };
}

function addToPackMembershipForDesign(
  design: AddToPackMembership,
  packs: readonly { id: string; name?: string | null }[],
): Set<string> {
  const ids = new Set(design.collectionIds ?? []);
  if (design.catalogCollectionId) ids.add(design.catalogCollectionId);
  const names = new Set(
    (design.collectionNames ?? []).map((name) => name.trim().toLowerCase()).filter(Boolean),
  );
  if (names.size === 0) return ids;
  for (const pack of packs) {
    if (names.has(displayCollectionName(pack.name ?? '').toLowerCase())) ids.add(pack.id);
  }
  return ids;
}

/** Packs every picked design already belongs to (ids, names, and exclusive catalog). */
export function addToPackAlreadyInIds(
  designs: readonly AddToPackMembership[],
  packs: readonly { id: string; name?: string | null }[] = [],
): Set<string> {
  if (designs.length === 0) return new Set();
  let acc = addToPackMembershipForDesign(designs[0]!, packs);
  for (const design of designs.slice(1)) {
    const next = addToPackMembershipForDesign(design, packs);
    acc = new Set([...acc].filter((id) => next.has(id)));
  }
  return acc;
}

export function addToPackGrouped<P extends { kind?: string | null }>(
  packs: readonly P[],
): { collections: P[]; catalogs: P[] } {
  const collections: P[] = [];
  const catalogs: P[] = [];
  for (const pack of packs) {
    if (isCatalogCollection(pack.kind)) catalogs.push(pack);
    else collections.push(pack);
  }
  return { collections, catalogs };
}

export function addToPackMatchesQuery<P extends { name?: string | null }>(
  pack: P,
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return displayCollectionName(pack.name ?? '').toLowerCase().includes(needle);
}

export function addToPackToggle(
  prev: AddToPackPick,
  pack: { id: string; kind?: string | null },
  alreadyIn: ReadonlySet<string> = new Set(),
): AddToPackPick {
  if (alreadyIn.has(pack.id)) return prev;
  if (isCatalogCollection(pack.kind)) {
    return {
      collectionIds: [],
      catalogId: prev.catalogId === pack.id ? null : pack.id,
    };
  }
  const has = prev.collectionIds.includes(pack.id);
  return {
    catalogId: null,
    collectionIds: has
      ? prev.collectionIds.filter((id) => id !== pack.id)
      : [...prev.collectionIds, pack.id],
  };
}

export function addToPackSelectedIds(pick: AddToPackPick): string[] {
  return pick.catalogId ? [pick.catalogId] : [...pick.collectionIds];
}

export function addToPackCanConfirm(pick: AddToPackPick): boolean {
  return addToPackSelectedIds(pick).length > 0;
}

export type AddToPackLabelSurface = 'library' | 'album';

export function addToPackIsMove(
  designs: readonly { catalogCollectionId?: string | null }[],
): boolean {
  return (
    designs.length > 0 && designs.every((design) => Boolean(design.catalogCollectionId))
  );
}

export function addToPackIsMixedExclusive(
  designs: readonly { catalogCollectionId?: string | null }[],
): boolean {
  if (designs.length === 0) return false;
  const exclusive = designs.filter((design) => Boolean(design.catalogCollectionId)).length;
  return exclusive > 0 && exclusive < designs.length;
}

/** Leftover or pack Add, or exclusive Move. Mixed leftover + exclusive omits the door. */
export function addToPackCanOffer(
  designs: readonly { catalogCollectionId?: string | null }[],
): boolean {
  return designs.length > 0 && !addToPackIsMixedExclusive(designs);
}

/**
 * Exclusive: Move to catalog / collection.
 * Library (You Designs / General Collection): Add to collection / catalog.
 * Regular album: Add to other collections.
 */
export function addToPackActionLabel(
  designs: readonly {
    catalogCollectionId?: string | null;
    collectionNames?: string[] | null;
    collectionIds?: string[] | null;
  }[],
  surface: AddToPackLabelSurface = 'album',
): string {
  if (addToPackIsMove(designs)) return 'Move to catalog / collection';
  if (surface === 'library') return 'Add to collection / catalog';
  return 'Add to other collections';
}

export function addToPackConfirmLabel(
  designs: readonly { catalogCollectionId?: string | null }[],
): string {
  return addToPackIsMove(designs) ? 'Move' : 'Add';
}

/** You Designs listing — quiet pack names under the design name. Leftover = none. */
export function libraryDesignMembershipLine(
  names?: readonly string[] | null,
): string | null {
  const parts = (names ?? []).map((name) => name.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  return parts.join(' · ');
}

/** Select all this filter: collections only — never bulk-picks a catalog or already-in. */
export function addToPackSelectAll(
  packs: readonly { id: string; kind?: string | null }[],
  alreadyIn: ReadonlySet<string> = new Set(),
): AddToPackPick {
  return {
    catalogId: null,
    collectionIds: packs
      .filter((pack) => !isCatalogCollection(pack.kind) && !alreadyIn.has(pack.id))
      .map((pack) => pack.id),
  };
}

export function addToPackAllCollectionsSelected(
  pick: AddToPackPick,
  packs: readonly { id: string; kind?: string | null }[],
  alreadyIn: ReadonlySet<string> = new Set(),
): boolean {
  const ids = packs
    .filter((pack) => !isCatalogCollection(pack.kind) && !alreadyIn.has(pack.id))
    .map((pack) => pack.id);
  if (ids.length === 0 || pick.catalogId) return false;
  return ids.every((id) => pick.collectionIds.includes(id));
}

export function addToPackEmptyCopy(designs: readonly {
  catalogCollectionId?: string | null;
  collectionNames?: string[];
}[]): string {
  if (addToPackIsMixedExclusive(designs)) {
    return 'Pick leftover designs, or only catalog designs, not both.';
  }
  return 'Create a collection or catalog first.';
}

export function addToPackAddedToast(pick: AddToPackPick, move = false): string {
  if (move) {
    if (pick.catalogId) return 'Moved to catalog';
    const n = pick.collectionIds.length;
    return n === 1 ? 'Moved to collection' : `Moved to ${n} collections`;
  }
  if (pick.catalogId) return 'Added to catalog';
  const n = pick.collectionIds.length;
  return n === 1 ? 'Added to collection' : `Added to ${n} collections`;
}

export { emptyPick as emptyAddToPackPick };

export function libraryPickerHint(
  packKind: 'regular' | 'catalog',
  replacing: boolean,
): string {
  if (replacing) {
    return libraryReplaceKeepsPack(packKind === 'catalog' ? 'catalog' : 'regular');
  }
  if (packKind === 'catalog') {
    return 'Choose leftover designs from General Collection.';
  }
  return 'Tap to add. Added designs show in your album — Done when finished.';
}

export function libraryPickerEmptyCopy(packKind: 'regular' | 'catalog'): string {
  return packKind === 'catalog'
    ? 'Only leftover designs from General Collection can join a catalog.'
    : 'All your designs are already in this collection.';
}
