import { categoriesToTagSlots, ProductStatus } from '@ekum/domain-types';

/** Album viewer never lists draft / archived members. */
export function collectionViewerListedProducts<T extends { status: string }>(
  products: T[],
): T[] {
  return products.filter((product) => product.status === ProductStatus.Published);
}

/**
 * Album viewer header: ⋯ only.
 * Owner ⋯ → bottom sheet (Share · Who · Add photos · Edit).
 * Find · Select · Feed/Grid sit under pack details (tools above the lot).
 */
export function collectionViewerPrimaryAction(_isOwner: boolean): null {
  return null;
}

/** How many sheet for any visitor pack with designs — not only curated (I-handle) packs. */
export function collectionPackQtySheet(input: {
  visitor: boolean;
  hasProducts: boolean;
}): boolean {
  return input.visitor && input.hasProducts;
}

/**
 * Visitor Order dock — only when this pack has selected designs.
 * No Ask for rates on the album.
 */
export function collectionPackTradeDock(input: {
  visitor: boolean;
  live: boolean;
  hasProducts: boolean;
  selecting: boolean;
  resumeContinue: boolean;
  thisPackSelectedCount: number;
}): boolean {
  return (
    input.visitor &&
    input.live &&
    input.hasProducts &&
    !input.selecting &&
    !input.resumeContinue &&
    input.thisPackSelectedCount > 0
  );
}

/**
 * Owner manage dock (Designs · Photos · Replace) — only when opened to manage
 * (You / ＋ / own shop via `location.state.packManage`). Explore own pack: no dock.
 */
export function collectionOwnerManageDock(input: {
  isOwner: boolean;
  packManage: boolean;
}): boolean {
  return input.isOwner && input.packManage;
}

/** Shop card removed from album — visitors use subtitle from {shop}. */
export function collectionShowOwnerCompanyRow(_isOwner: boolean): boolean {
  return false;
}

/** Pack Description as collapsed About when non-empty. */
export function collectionShowPackNote(description?: string | null): boolean {
  return Boolean(description?.trim());
}

export function noteBlockOverflows(scrollHeight: number, clientHeight: number): boolean {
  return scrollHeight > clientHeight + 1;
}

/**
 * Collapsed pack-details max-height — 3 × `leading-5` (1.25rem).
 * Literal Tailwind class (JIT). Never 4.5rem — that sliced mid-line (BM-07).
 */
export const PACK_DETAILS_COLLAPSED_MAX_H_CLASS = 'max-h-[3.75rem]';

/** Muted categories under the header (legacy facts helpers — album uses pack details sections). */
export function collectionFactsCategoryLine(categories?: string[] | null): string | null {
  const tags = (categories ?? []).map((tag) => tag.trim()).filter(Boolean);
  if (tags.length === 0) return null;
  return tags.join(' · ');
}

/** One quiet facts line: categories · rate band (skip empty parts). */
export function collectionFactsLine(
  categories?: string[] | null,
  rateBand?: string | null,
): string | null {
  const parts = [collectionFactsCategoryLine(categories), rateBand?.trim() || null].filter(
    Boolean,
  ) as string[];
  return parts.length > 0 ? parts.join(' · ') : null;
}

export type CollectionPackDetailKey =
  | 'rate'
  | 'size'
  | 'description'
  | 'item-tags'
  | 'quality-tags';

export type CollectionPackDetailSection = {
  key: CollectionPackDetailKey;
  label: string;
  body: string;
};

function joinTagLine(labels: string[]): string | null {
  const tags = labels.map((tag) => tag.trim()).filter(Boolean);
  if (tags.length === 0) return null;
  return tags.join(' · ');
}

/**
 * Album pack identity sections — Rate · Size · Description · Item tags · Quality tags.
 * Empty sections omitted; Size only when a size tag is set.
 */
export function collectionPackDetailSections(input: {
  categories?: string[] | null;
  description?: string | null;
  rateBand?: string | null;
}): CollectionPackDetailSection[] {
  const slots = categoriesToTagSlots(input.categories ?? []);
  const sections: CollectionPackDetailSection[] = [];
  const rate = input.rateBand?.trim() || null;
  if (rate) sections.push({ key: 'rate', label: 'Rate', body: rate });
  const size = slots.size.trim();
  if (size) sections.push({ key: 'size', label: 'Size', body: size });
  const description = input.description?.trim() || null;
  if (description) {
    sections.push({ key: 'description', label: 'Description', body: description });
  }
  const items = joinTagLine(slots.items);
  if (items) sections.push({ key: 'item-tags', label: 'Item tags', body: items });
  const qualities = joinTagLine(slots.qualities);
  if (qualities) sections.push({ key: 'quality-tags', label: 'Quality tags', body: qualities });
  return sections;
}

/** Design ids in this pack that are on the traveling shortlist. */
export function collectionThisPackSelectedIds(
  packProductIds: readonly string[],
  shortlistProductIds: ReadonlySet<string>,
): string[] {
  return packProductIds.filter((id) => shortlistProductIds.has(id));
}

/** Album tiles omit SKU under the name. Rate lives in pack details / design sheet. */
export function designTileMetaLine(_input: {
  sku?: string | null;
  rateLabel: string | null;
  variant: 'feed' | 'grid';
}): string {
  return '';
}

/**
 * Album feed/grid thumbs: no rate / On request chip on the image.
 * Rate is in pack details and the design photos sheet.
 */
export function designTileRateOverlay(_rateLabel: string | null | undefined): string | null {
  return null;
}

/**
 * Own pack + own design → show Edit on the design sheet.
 * Tap still opens the view sheet; Edit navigates to Edit design.
 */
export function collectionOwnerCanEditDesign(input: {
  isOwner: boolean;
  myCompanyId?: string | null;
  productCompanyId?: string | null;
}): boolean {
  if (!input.isOwner) return false;
  const mine = input.myCompanyId?.trim();
  const product = input.productCompanyId?.trim();
  return Boolean(mine && product && mine === product);
}

/** Honest design-sheet rate — omit empty / On request (same as Explore feed). */
export function designSheetRateBand(rateLabel: string | null | undefined): string | null {
  const label = rateLabel?.trim();
  if (!label || label === 'On request') return null;
  return label;
}

/**
 * Quiet ⋯ footer — only when real Ekum rules need it.
 * Forward/Share stay free; Curate lock uses allowForward.
 */
export function collectionMoreMenuNote(input: {
  visitor: boolean;
  lookOnly?: boolean;
  allowForward: boolean;
}): string | null {
  if (!input.visitor) return null;
  if (input.lookOnly) return 'You can view this collection.';
  if (!input.allowForward) return 'You can look through — Curate into your collection is off.';
  return null;
}

/** “Order goes to trader · they send mill lots” — Your paths ticket me only (sr 16). */
export function collectionShowHandleCopy(input: {
  curatedVisitor: boolean;
  viewerTicket?: 'me' | 'mill' | null;
}): boolean {
  if (!input.curatedVisitor) return false;
  return (input.viewerTicket ?? 'me') === 'me';
}
