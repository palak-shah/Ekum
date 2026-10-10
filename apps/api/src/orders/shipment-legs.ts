import type { ShipmentLegDto } from '@ekum/domain-types';

export type ResolvedShipmentLeg = {
  lrNumber: string | null;
  billNumber: string | null;
  imageUrls: string[];
  sortOrder: number;
};

const LEG_IMAGE_CAP = 3;

function normalizeLegImageUrls(urls: string[] | undefined): string[] {
  if (!urls?.length) return [];
  const next: string[] = [];
  for (const raw of urls) {
    const url = raw.trim();
    if (!url || next.includes(url)) continue;
    next.push(url);
    if (next.length >= LEG_IMAGE_CAP) break;
  }
  return next;
}

/** Normalize DTO legs (or legacy lrNumber) into persisted rows. */
export function resolveShipmentLegs(input: {
  legs?: ShipmentLegDto[] | null;
  lrNumber?: string | null;
}): ResolvedShipmentLeg[] {
  if (input.legs != null) {
    return input.legs.map((leg, index) => ({
      lrNumber: leg.lrNumber?.trim() || null,
      billNumber: leg.billNumber?.trim() || null,
      imageUrls: normalizeLegImageUrls(leg.imageUrls),
      sortOrder: index,
    }));
  }
  const lr = input.lrNumber?.trim() || null;
  if (lr) {
    return [{ lrNumber: lr, billNumber: null, imageUrls: [], sortOrder: 0 }];
  }
  return [];
}

export function primaryLrFromLegs(legs: ResolvedShipmentLeg[]): string | null {
  for (const leg of legs) {
    if (leg.lrNumber) return leg.lrNumber;
  }
  return null;
}

/** Prefer explicit parcelCount; else legs.length when legs present. */
export function resolveParcelCount(
  parcelCount: number | null | undefined,
  legs: ResolvedShipmentLeg[],
): number | null {
  if (parcelCount != null) return parcelCount;
  if (legs.length > 0) return legs.length;
  return null;
}
