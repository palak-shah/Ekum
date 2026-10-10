import { designCountLabel } from '@/ui/albumMosaic';
import { catalogRateDisplayUnit } from '@/lib/catalogRate';
import { formatRate } from '@/lib/format';

export type PackRateMember = {
  rate: number | null;
  rateMax?: number | null;
  unit: string | null;
  dispatchUnit?: string | null;
};

function formatPackRateLine(
  rate: number,
  rateMax: number | null | undefined,
  unit: string | null,
): string {
  const high = rateMax != null && rateMax > rate ? rateMax : null;
  const formatted = formatRate(rate, unit, high);
  if (!unit) return formatted;
  return formatted.replace(/\/(?=[^/]+$)/, ' /');
}

/** Display unit when members agree; else first member’s unit (pack rate still shows). */
function packMembersDisplayUnit(products: PackRateMember[]): string | null {
  const units = products
    .map((row) => catalogRateDisplayUnit(row))
    .filter((u): u is string => Boolean(u));
  if (units.length === 0) return null;
  const unique = new Set(units);
  if (unique.size === 1) return units[0]!;
  return units[0]!;
}

/** ₹ band with a space before the unit (`₹280–₹445 /mtr`). Pack path uses dispatch unit. */
export function packRateBand(products: PackRateMember[]): string | null {
  const priced = products.filter((row) => row.rate != null);
  if (priced.length === 0) return null;
  const units = new Set(priced.map((row) => catalogRateDisplayUnit(row) ?? ''));
  if (units.size > 1) return null;
  const lows = priced.map((row) => row.rate as number);
  const highs = priced.map((row) =>
    row.rateMax != null && row.rateMax > (row.rate as number) ? row.rateMax : (row.rate as number),
  );
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  return formatPackRateLine(min, max > min ? max : null, catalogRateDisplayUnit(priced[0]!));
}

/**
 * Album facts rate from Explore preview `rateMin`/`rateMax` (API: pack first,
 * else design min–max; null when on request for non-owners).
 */
export function albumFactsRateBand(input: {
  rateMin: number | null | undefined;
  rateMax?: number | null;
  rateUnit?: string | null;
}): string | null {
  if (input.rateMin == null) return null;
  return formatPackRateLine(input.rateMin, input.rateMax ?? null, input.rateUnit?.trim() || null);
}

/** Format a pack rate with member unit when known. */
export function collectionRateBand(
  collection: { rate: number | null | undefined; rateMax?: number | null },
  products: PackRateMember[],
): string | null {
  if (collection.rate == null) return null;
  return formatPackRateLine(
    collection.rate,
    collection.rateMax ?? null,
    packMembersDisplayUnit(products),
  );
}

/** Album header subtitle — design count only (rate band sits under categories). */
export function packHeaderSubtitle(productCount: number, _products: PackRateMember[] = []): string {
  return designCountLabel(productCount);
}

/** Visitor album subtitle: count · from {shop}. */
export function packHeaderSubtitleWithShop(
  productCount: number,
  products: PackRateMember[],
  shopName: string | null | undefined,
): string {
  const base = packHeaderSubtitle(productCount, products);
  const shop = shopName?.trim();
  return shop ? `${base} · from ${shop}` : base;
}

/** Shop line on a design tile / popup. Curated foreign on own pack keeps From. */
export function designCardShopLine(shopName: string | null | undefined, curatedFrom = false): string | null {
  const name = shopName?.trim();
  if (!name) return null;
  return curatedFrom ? `From ${name}` : name;
}

/**
 * Album design tiles: never show mill / From under the name (rate + name only).
 * Pack-level source line credits mills when curated.
 */
export function albumTileShopLine(_input: {
  mixedSources: boolean;
  creditMills: boolean;
  shopName: string | null | undefined;
  curatedFrom?: boolean;
}): string | null {
  return null;
}
