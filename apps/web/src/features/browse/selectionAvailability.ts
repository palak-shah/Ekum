import {
  CollectionStatus,
  ProductStatus,
  type CollectionDetailView,
  type CollectionPreviewView,
  type ExploreProductPreviewView,
  type ProductView,
} from '@ekum/domain-types';
import { api, ApiError } from '@/lib/apiClient';
import type { BrowseAlbumEntry } from './browseAlbumPick';
import type { BrowseShortlistEntry } from './browseShortlist';

export type SelectionAvailability = {
  available: boolean;
  /** Plain trader reason when unavailable. */
  reason?: string;
};

/** Map catalog lifecycle / access to short copy (unit-tested). */
export function reasonFromProductStatus(status: string | undefined): string | undefined {
  if (status === ProductStatus.Archived) return 'Archived';
  if (status === ProductStatus.Draft) return 'Not published';
  return undefined;
}

export function reasonFromCollectionStatus(status: string | undefined): string | undefined {
  if (status === CollectionStatus.Archived) return 'Archived';
  if (status === CollectionStatus.Draft || status === CollectionStatus.Ready) return 'Not published';
  return undefined;
}

export function reasonFromApiError(err: unknown): string {
  if (err instanceof ApiError) {
    const msg = err.message.trim();
    if (/archiv/i.test(msg)) return 'Archived';
    if (/publish|draft|live/i.test(msg)) return 'Not published';
    if (/access|forbidden|permission|connect/i.test(msg)) return 'No longer available';
  }
  return 'No longer available';
}

export async function resolveDesignAvailability(
  entry: BrowseShortlistEntry,
): Promise<SelectionAvailability> {
  try {
    await api.get<ExploreProductPreviewView>(`/explore/products/${entry.productId}`);
    return { available: true };
  } catch (exploreErr) {
    try {
      const own = await api.get<ProductView>(`/products/${entry.productId}`);
      const reason = reasonFromProductStatus(own.status);
      if (reason) return { available: false, reason };
      // Own published (or other non-draft/archived) stays available for Selection verbs.
      return { available: true };
    } catch {
      return { available: false, reason: reasonFromApiError(exploreErr) };
    }
  }
}

export async function resolveCollectionAvailability(
  entry: BrowseAlbumEntry,
): Promise<SelectionAvailability> {
  try {
    await api.get<CollectionPreviewView>(`/explore/collections/${entry.collectionId}`);
    return { available: true };
  } catch (exploreErr) {
    try {
      const own = await api.get<CollectionDetailView>(`/collections/${entry.collectionId}`);
      const reason = reasonFromCollectionStatus(own.status);
      if (reason) return { available: false, reason };
      return { available: true };
    } catch {
      return { available: false, reason: reasonFromApiError(exploreErr) };
    }
  }
}

export async function resolveSelectionAvailability(input: {
  designs: BrowseShortlistEntry[];
  albums: BrowseAlbumEntry[];
}): Promise<{
  designs: Map<string, SelectionAvailability>;
  albums: Map<string, SelectionAvailability>;
}> {
  const designs = new Map<string, SelectionAvailability>();
  const albums = new Map<string, SelectionAvailability>();
  await Promise.all([
    ...input.designs.map(async (entry) => {
      designs.set(entry.productId, await resolveDesignAvailability(entry));
    }),
    ...input.albums.map(async (entry) => {
      albums.set(entry.collectionId, await resolveCollectionAvailability(entry));
    }),
  ]);
  return { designs, albums };
}
