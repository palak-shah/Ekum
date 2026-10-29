import {
  CatalogOrderMode,
  CollectionKind,
  ProductStatus,
  type CollectionPreviewView,
  type ProductView,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import { overlayShortlistEntries, type OrderAlbumChoice } from './albumSelectModel';
import type { BrowseAlbumEntry } from './browseAlbumPick';
import type { BrowseShortlistEntry } from './browseShortlist';
import { stampPackMillRoute } from './packPlacePhases';

export type CatalogWholeOrderPreview = {
  id: string;
  name: string;
  kind?: string | null;
  orderMode?: string | null;
  allowForward?: boolean;
  company?: { id: string; name: string } | null;
  products: ProductView[] | null;
  directMillCompanyIds?: string[];
};

/** Catalog Order as whole — missing mode never forces whole. */
export function isWholeCatalogOrder(input: {
  kind?: string | null;
  orderMode?: string | null;
}): boolean {
  return input.kind === CollectionKind.Catalog && input.orderMode === CatalogOrderMode.Whole;
}

export const CATALOG_WHOLE_SELECT_TOAST = 'This catalog is ordered as a whole.';

export function isExclusiveWholeCatalogMember(input: {
  catalogCollectionId?: string | null;
  catalogOrderMode?: string | null;
}): boolean {
  return Boolean(
    input.catalogCollectionId?.trim() && input.catalogOrderMode === CatalogOrderMode.Whole,
  );
}

/** True when any album still needs All / Choose (regular, pick, or unknown mode). */
export function needsOrderResolveChoice(
  albums: Array<{ kind?: string | null; orderMode?: string | null }>,
): boolean {
  if (albums.length === 0) return false;
  return albums.some((album) => !isWholeCatalogOrder(album));
}

export function publishedOrderMembers(
  products: ProductView[] | null | undefined,
): ProductView[] | null {
  if (products == null) return null;
  return products.filter(
    (product) => !product.status || product.status === ProductStatus.Published,
  );
}

export function productToOrderShortlistEntry(
  product: ProductView,
  fallbackCompany: { id: string; name: string },
  pack?: {
    collectionId: string;
    path: string | null;
    allowForward?: boolean;
    catalogWhole?: boolean;
    catalogName?: string | null;
    sourceDirect?: boolean;
  },
): BrowseShortlistEntry {
  const path = pack?.path === 'handle' || pack?.path === 'direct' ? pack.path : undefined;
  return {
    productId: product.id,
    name: product.name?.trim() || 'Design',
    thumbUrl: product.images?.[0] ?? null,
    companyId: product.companyId || fallbackCompany.id,
    companyName: product.companyName?.trim() || fallbackCompany.name,
    allowForward: product.allowForward,
    categories: product.categories ?? [],
    unit: product.unit ?? null,
    dispatchUnit: product.dispatchUnit ?? null,
    catalogRateUnit: product.catalogRateUnit ?? null,
    piecesPerPack: product.piecesPerPack ?? null,
    moq: product.moq ?? null,
    rate: product.rate ?? null,
    rateMax: product.rateMax ?? null,
    status: product.status,
    ...(product.catalogCollectionId
      ? { catalogCollectionId: product.catalogCollectionId }
      : {}),
    ...(product.catalogOrderMode
      ? { catalogOrderMode: product.catalogOrderMode }
      : {}),
    ...(pack
      ? {
          sourceCollectionId: pack.collectionId,
          sourceHandlerName: fallbackCompany.name,
          sourceHandlerCompanyId: fallbackCompany.id,
          sourcePath: path,
          ...(pack.sourceDirect ? { sourceDirect: true } : {}),
          sourcePackAllowForward: pack.allowForward !== false,
          ...(pack.catalogWhole
            ? { catalogWhole: true, catalogName: pack.catalogName ?? albumName(pack) }
            : {}),
        }
      : {}),
  };
}

function albumName(pack: { catalogName?: string | null }): string | null {
  return pack.catalogName?.trim() || null;
}

export function expandPreviewMembers(
  preview: CatalogWholeOrderPreview,
  album: Pick<BrowseAlbumEntry, 'collectionId' | 'companyId' | 'companyName' | 'allowForward' | 'name'>,
): BrowseShortlistEntry[] {
  const members = publishedOrderMembers(preview.products);
  if (members == null || members.length === 0) return [];
  const whole = isWholeCatalogOrder(preview);
  const packOwnerId = album.companyId || preview.company?.id || '';
  return members.map((product) => {
    const route = stampPackMillRoute({
      millCompanyId: product.companyId,
      packOwnerCompanyId: packOwnerId,
      directMillCompanyIds: preview.directMillCompanyIds,
    });
    return productToOrderShortlistEntry(
      product,
      {
        id: packOwnerId || product.companyId,
        name: album.companyName || preview.company?.name || product.companyName || 'Shop',
      },
      {
        collectionId: album.collectionId,
        path: route.sourcePath,
        sourceDirect: route.sourceDirect,
        allowForward: album.allowForward ?? preview.allowForward,
        ...(whole ? { catalogWhole: true, catalogName: preview.name } : {}),
      },
    );
  });
}

export type CatalogOrderResolveResult = {
  shortlist: BrowseShortlistEntry[];
  remainingAlbums: BrowseAlbumEntry[];
  navigateToCollectionId: string | null;
  expandedAlbumNames: string[];
  lockedProductIds: string[];
};

function emptyCatalogError(name: string): ApiError {
  return new ApiError({
    statusCode: 400,
    code: 'COLLECTION_EMPTY',
    message: `${name} has no designs.`,
    details: null,
  });
}

function noDesignsError(message: string): ApiError {
  return new ApiError({
    statusCode: 400,
    code: 'NO_DESIGNS',
    message,
    details: null,
  });
}

/** Collection ids on the shortlist that may be exclusive / from-pack whole catalogs. */
export function shortlistCatalogIdsToExpand(shortlist: BrowseShortlistEntry[]): string[] {
  const ids = new Set<string>();
  for (const entry of shortlist) {
    const exclusive = entry.catalogCollectionId?.trim();
    if (exclusive) ids.add(exclusive);
    const source = entry.sourceCollectionId?.trim();
    if (source) ids.add(source);
  }
  return [...ids];
}

export function fetchCollectionOrderPreview(collectionId: string) {
  return api.get<CollectionPreviewView>(`/explore/collections/${collectionId}`);
}

export async function expandWholeCatalogsInShortlist(
  shortlist: BrowseShortlistEntry[],
  fetchPreview: (collectionId: string) => Promise<CatalogWholeOrderPreview>,
): Promise<{ shortlist: BrowseShortlistEntry[]; lockedProductIds: string[] }> {
  let next = shortlist;
  const locked = new Set<string>();
  for (const collectionId of shortlistCatalogIdsToExpand(shortlist)) {
    const preview = await fetchPreview(collectionId);
    if (!isWholeCatalogOrder(preview)) continue;
    const members = publishedOrderMembers(preview.products);
    if (members == null) continue;
    if (members.length === 0) {
      throw emptyCatalogError(preview.name?.trim() || 'This catalog');
    }
    const incoming = expandPreviewMembers(preview, {
      collectionId,
      companyId: preview.company?.id ?? '',
      companyName: preview.company?.name ?? 'Shop',
      allowForward: preview.allowForward,
      name: preview.name,
    });
    next = overlayShortlistEntries(next, incoming);
    for (const member of members) locked.add(member.id);
  }
  return { shortlist: next, lockedProductIds: [...locked] };
}

export async function resolveCatalogOrderAlbums(input: {
  albums: BrowseAlbumEntry[];
  existingShortlist: BrowseShortlistEntry[];
  choices?: Record<string, OrderAlbumChoice>;
  emptyMessage: string;
  fetchPreview: (collectionId: string) => Promise<CatalogWholeOrderPreview>;
}): Promise<CatalogOrderResolveResult> {
  let shortlist = input.existingShortlist;
  const remainingAlbums: BrowseAlbumEntry[] = [];
  let navigateToCollectionId: string | null = null;
  const expandedAlbumNames: string[] = [];
  const lockedProductIds = new Set<string>();

  for (const album of input.albums) {
    const preview = await input.fetchPreview(album.collectionId);
    const whole = isWholeCatalogOrder({
      kind: preview.kind ?? album.kind,
      orderMode: preview.orderMode ?? album.orderMode,
    });
    const choice = whole ? 'all' : (input.choices?.[album.collectionId] ?? 'all');
    if (choice === 'choose') {
      if (!navigateToCollectionId) navigateToCollectionId = album.collectionId;
      else remainingAlbums.push(album);
      continue;
    }

    const members = publishedOrderMembers(preview.products);
    if (members == null) {
      if (!navigateToCollectionId) navigateToCollectionId = album.collectionId;
      else remainingAlbums.push(album);
      continue;
    }
    if (members.length === 0) {
      throw emptyCatalogError(album.name);
    }
    const incoming = expandPreviewMembers(preview, album);
    shortlist = overlayShortlistEntries(shortlist, incoming);
    expandedAlbumNames.push(album.name);
    if (whole) {
      for (const member of members) lockedProductIds.add(member.id);
    }
  }

  if (shortlist.length === 0 && !navigateToCollectionId) {
    throw noDesignsError(input.emptyMessage);
  }

  return {
    shortlist,
    remainingAlbums,
    navigateToCollectionId,
    expandedAlbumNames,
    lockedProductIds: [...lockedProductIds],
  };
}
