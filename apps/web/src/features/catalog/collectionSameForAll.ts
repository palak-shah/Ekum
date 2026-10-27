import {
  Unit,
  catalogRateUnit as inferCatalogRateUnit,
  isPackOrderUnit,
} from '@ekum/domain-types';
import type { SameForAllDetails } from './rateInput';
import {
  formatRateInput,
  parseRateInput,
  sameForAllIsEmpty,
  sameForAllSummary,
} from './rateInput';
import {
  DEFAULT_DISPATCH_UNIT,
  DEFAULT_RATE_UNIT,
  DEFAULT_SELL_AS_UNIT,
} from './publishDefaults';
import { parsePiecesPerPack } from './orderDispatchPreview';

/** Packed order units show “1 set contains”. */
export function unitAsksPiecesPerSet(unit: string): boolean {
  return unit === Unit.Set || unit === Unit.Dozen || unit === Unit.Box || unit === Unit.Bundle;
}

export type { SameForAllDetails };
export { sameForAllIsEmpty, sameForAllSummary, parseRateInput };

/**
 * Platform usual shell: order + dispatch journey in **sets** (or the passed pack unit).
 * Rate per starts **pc** until create snaps to the Category primary.
 * Pass `unit: ''` only for Diff “nothing shared” fixtures.
 */
export const emptySameForAll = (unit = DEFAULT_SELL_AS_UNIT): SameForAllDetails => ({
  categories: [],
  rate: '',
  unit,
  dispatchUnit: unit.trim() ? unit.trim() : DEFAULT_DISPATCH_UNIT,
  catalogRateUnit: DEFAULT_RATE_UNIT,
  piecesPerPack: '',
  moq: '',
  notes: '',
});

/** Truly blank same-for-all (no platform units) — Diff / “nothing shared” only. */
export const blankSameForAll = (): SameForAllDetails => ({
  categories: [],
  rate: '',
  unit: '',
  dispatchUnit: '',
  catalogRateUnit: '',
  piecesPerPack: '',
  moq: '',
  notes: '',
});

/** Rate per change: pack path keeps order unit; native path Rate per is the order unit. */
export function applyCollectionRateUnit(
  details: SameForAllDetails,
  nextRateUnit: string,
): SameForAllDetails {
  const orderUnit = details.unit.trim() || Unit.Set;
  if (isPackOrderUnit(orderUnit)) {
    return { ...details, catalogRateUnit: nextRateUnit };
  }
  return { ...details, unit: nextRateUnit, catalogRateUnit: nextRateUnit };
}

/** Prefer set for empty order/dispatch when the category offers it. */
export function preferredPackUnit(permitted: readonly string[]): string {
  if (permitted.includes(Unit.Set)) return Unit.Set;
  if (permitted.includes(DEFAULT_DISPATCH_UNIT)) return DEFAULT_DISPATCH_UNIT;
  return permitted[0] || DEFAULT_SELL_AS_UNIT;
}

/** Drop order/dispatch units the new category does not permit. */
export function clampSameForAllUnits(
  details: SameForAllDetails,
  permitted: readonly string[],
): { next: SameForAllDetails; changed: boolean } {
  if (permitted.length === 0) return { next: details, changed: false };
  const fallback = preferredPackUnit(permitted);
  const unit =
    !details.unit.trim() || permitted.includes(details.unit) ? details.unit : fallback;
  const orderForDispatch = unit.trim() || fallback;
  let dispatchUnit = details.dispatchUnit.trim();
  if (!dispatchUnit) {
    dispatchUnit = orderForDispatch === Unit.Set || isPackish(orderForDispatch)
      ? orderForDispatch
      : fallback;
  } else if (!permitted.includes(dispatchUnit)) {
    dispatchUnit =
      orderForDispatch && permitted.includes(orderForDispatch) ? orderForDispatch : fallback;
  }
  const next = { ...details, unit, dispatchUnit };
  const changed = next.unit !== details.unit || next.dispatchUnit !== details.dispatchUnit;
  return { next, changed };
}

function isPackish(unit: string): boolean {
  return unitAsksPiecesPerSet(unit);
}

export type MemberDesignForm = {
  name: string;
  rate: string;
  unit: string;
  dispatchUnit: string;
  catalogRateUnit: string;
  piecesPerPack: string;
  moq: string;
  notes: string;
  categories: string[];
};

/** Flattened tag cap — same as TagSuggestInput. */
export const PACK_TAG_CAP = 20;

/** Union tags — amend only missing; never drop existing. */
export function unionTags(existing: string[], incoming: string[]): string[] {
  const seen = new Set(existing.map((t) => t.trim().toLowerCase()).filter(Boolean));
  const out = [...existing.map((t) => t.trim()).filter(Boolean)];
  for (const tag of incoming) {
    const trimmed = tag.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

/** Own tags first, then pack tags, capped. */
export function packTagsForMember(
  existing: string[] | null | undefined,
  pack: string[] | null | undefined,
): string[] {
  return unionTags(existing ?? [], pack ?? []).slice(0, PACK_TAG_CAP);
}

/** Categories to PATCH, or null when the union adds nothing. */
export function packTagsPatch(
  existing: string[] | null | undefined,
  pack: string[] | null | undefined,
): string[] | null {
  const prev = (existing ?? []).map((tag) => tag.trim()).filter(Boolean);
  const next = packTagsForMember(prev, pack);
  if (next.length === prev.length) return null;
  return next;
}

export type PackTaggableProduct = {
  id: string;
  companyId?: string | null;
  categories?: string[] | null;
};

/** Own-company members that still need pack tags appended. */
export function packTagPatchesForOwnDesigns(
  products: PackTaggableProduct[],
  packTags: string[],
  ownCompanyId: string | null | undefined,
): Array<{ id: string; categories: string[] }> {
  if (!ownCompanyId || packTags.length === 0) return [];
  const seen = new Set<string>();
  const out: Array<{ id: string; categories: string[] }> = [];
  for (const product of products) {
    if (!product.id || seen.has(product.id)) continue;
    seen.add(product.id);
    if (product.companyId !== ownCompanyId) continue;
    const next = packTagsPatch(product.categories, packTags);
    if (next) out.push({ id: product.id, categories: next });
  }
  return out;
}

/** Compare member fields to same-for-all (ignores name). */
export function memberDiffersFromSameForAll(
  form: MemberDesignForm,
  shared: SameForAllDetails,
): boolean {
  if (sameForAllIsEmpty(shared)) return false;
  if (shared.rate.trim() && form.rate.trim() !== shared.rate.trim()) return true;
  if (shared.unit.trim() && form.unit !== shared.unit) return true;
  // Blank member dispatch = unset / follows pack — not a Diff vs seeded pc.
  if (
    shared.dispatchUnit.trim() &&
    form.dispatchUnit.trim() &&
    form.dispatchUnit !== shared.dispatchUnit
  ) {
    return true;
  }
  if (
    shared.catalogRateUnit.trim() &&
    form.catalogRateUnit.trim() &&
    form.catalogRateUnit !== shared.catalogRateUnit
  ) {
    return true;
  }
  if (
    shared.piecesPerPack.trim() &&
    form.piecesPerPack.trim() !== shared.piecesPerPack.trim()
  ) {
    return true;
  }
  if (shared.moq.trim() && form.moq.trim() !== shared.moq.trim()) return true;
  if (shared.notes.trim() && form.notes.trim() !== shared.notes.trim()) return true;
  if (shared.categories.length > 0) {
    const member = new Set(form.categories.map((t) => t.trim().toLowerCase()));
    for (const tag of shared.categories) {
      if (!member.has(tag.trim().toLowerCase())) return true;
    }
  }
  return false;
}

/** Ids of members whose details differ from filled same-for-all. Diff first. */
export function collectSameForAllDiffIds(
  shared: SameForAllDetails,
  members: Array<{ id: string; form: MemberDesignForm }>,
): Set<string> {
  const ids = new Set<string>();
  if (sameForAllIsEmpty(shared)) return ids;
  for (const member of members) {
    if (memberDiffersFromSameForAll(member.form, shared)) ids.add(member.id);
  }
  return ids;
}

/** Sort Diff ids first; keep relative order within each group. */
export function sortDiffFirst<T extends { id: string }>(
  items: T[],
  diffIds: Set<string>,
): T[] {
  const diff: T[] = [];
  const rest: T[] = [];
  for (const item of items) {
    (diffIds.has(item.id) ? diff : rest).push(item);
  }
  return [...diff, ...rest];
}

/**
 * Apply filled same-for-all onto a member form.
 * Rates/unit/MOQ/notes/piecesPerPack: fill only when member field is empty.
 * Tags: union (amend missing only).
 */
export function applySameForAllToForm(
  form: MemberDesignForm,
  shared: SameForAllDetails,
): MemberDesignForm {
  return {
    ...form,
    rate: form.rate.trim() ? form.rate : shared.rate.trim() ? shared.rate : form.rate,
    unit: form.unit.trim() ? form.unit : shared.unit.trim() ? shared.unit : form.unit,
    dispatchUnit: form.dispatchUnit.trim()
      ? form.dispatchUnit
      : shared.dispatchUnit.trim()
        ? shared.dispatchUnit
        : form.dispatchUnit,
    catalogRateUnit: form.catalogRateUnit.trim()
      ? form.catalogRateUnit
      : shared.catalogRateUnit.trim()
        ? shared.catalogRateUnit
        : form.catalogRateUnit,
    piecesPerPack: form.piecesPerPack.trim()
      ? form.piecesPerPack
      : shared.piecesPerPack.trim()
        ? shared.piecesPerPack
        : form.piecesPerPack,
    moq: form.moq.trim() ? form.moq : shared.moq.trim() ? shared.moq : form.moq,
    notes: form.notes.trim() ? form.notes : shared.notes.trim() ? shared.notes : form.notes,
    categories:
      shared.categories.length > 0
        ? unionTags(form.categories, shared.categories)
        : form.categories,
  };
}

/**
 * Force shared units / MOQ / notes onto member (pack Apply).
 * Empty design rates fill from the pack; a filled rate stays unless Apply-to-all
 * overwrites via stampCreatePhotoMemberForm / packMemberProductPatch.
 */
export function forceSameForAllToForm(
  form: MemberDesignForm,
  shared: SameForAllDetails,
): MemberDesignForm {
  return {
    ...form,
    rate: form.rate.trim() ? form.rate : shared.rate.trim() ? shared.rate : form.rate,
    unit: shared.unit.trim() ? shared.unit : form.unit,
    dispatchUnit: shared.dispatchUnit.trim() ? shared.dispatchUnit : form.dispatchUnit,
    catalogRateUnit: shared.catalogRateUnit.trim()
      ? shared.catalogRateUnit
      : form.catalogRateUnit,
    piecesPerPack: shared.piecesPerPack.trim()
      ? shared.piecesPerPack
      : form.piecesPerPack,
    moq: shared.moq.trim() ? shared.moq : form.moq,
    notes: shared.notes.trim() ? shared.notes : form.notes,
    categories:
      shared.categories.length > 0
        ? unionTags(form.categories, shared.categories)
        : form.categories,
  };
}

/**
 * New create-mode photos: pack Rate fills empty rates.
 * Apply-to-all overwrites a filled photo rate too (same as library members).
 */
export function stampCreatePhotoMemberForm(
  form: MemberDesignForm,
  shared: SameForAllDetails,
  applyToAll: boolean,
): MemberDesignForm {
  const next = applyToAll
    ? forceSameForAllToForm(form, shared)
    : applySameForAllToForm(form, shared);
  if (applyToAll && shared.rate.trim()) {
    return { ...next, rate: shared.rate };
  }
  return next;
}

/** True when the design already has a priced rate. */
export function designHasOwnRate(rate: number | null | undefined): boolean {
  return rate != null;
}

/**
 * Design should take the pack rate when it has no rate, or still matches the
 * previous pack rate (inherited — not a design-specific price).
 */
export function designFollowsPackRate(
  design: { rate: number | null | undefined; rateMax?: number | null },
  previousPackRate: string,
  incomingPackRate?: string,
): boolean {
  if (design.rate == null) return true;
  const own = formatRateInput(design.rate, design.rateMax ?? null);
  const prev = previousPackRate.trim();
  if (prev && own === prev) return true;
  const incoming = incomingPackRate?.trim() ?? '';
  // Create: no stored pack rate yet — same rupee as this pack follows Rate per.
  if (!prev && incoming && own === incoming) return true;
  return false;
}

/** Shared pack rate string when every priced member matches; else ''. */
export function unanimousMemberRate(
  members: ReadonlyArray<{ rate: number | null; rateMax?: number | null }>,
): string {
  const priced = members
    .map((row) => formatRateInput(row.rate, row.rateMax ?? null))
    .filter((raw) => raw.trim());
  if (priced.length === 0) return '';
  const first = priced[0]!;
  return priced.every((raw) => raw === first) ? first : '';
}

/** Product create/patch payload from rate text + member fields. */
export function productFieldsFromMember(
  form: MemberDesignForm,
  opts?: { includeEmptyCategories?: boolean },
): {
  description?: string;
  rate?: number | null;
  rateMax?: number | null;
  unit?: string;
  dispatchUnit?: string | null;
  catalogRateUnit?: string | null;
  piecesPerPack?: number | null;
  moq?: number;
  categories?: string[];
} {
  const parsed = parseRateInput(form.rate);
  return {
    description: form.notes.trim() || undefined,
    rate: parsed.rate,
    rateMax: parsed.rateMax,
    unit: form.unit || undefined,
    dispatchUnit: form.dispatchUnit.trim() ? form.dispatchUnit : undefined,
    catalogRateUnit: form.catalogRateUnit?.trim() ? form.catalogRateUnit : undefined,
    piecesPerPack: parsePiecesPerPack(form.piecesPerPack),
    moq: form.moq.trim() ? Number(form.moq) : undefined,
    categories:
      opts?.includeEmptyCategories || form.categories.length > 0
        ? form.categories
        : undefined,
  };
}

export type PackMemberFields = ReturnType<typeof productFieldsFromMember>;

type PackSellAsSource = {
  unit?: string | null;
  dispatchUnit?: string | null;
  catalogRateUnit?: string | null;
  piecesPerPack?: number | string | null;
};

/** Stored Rate per, else legacy inference from dispatch≠order. */
export function storedCatalogRateUnit(source: PackSellAsSource): string {
  const stored = source.catalogRateUnit?.trim();
  if (stored) return stored;
  return (
    inferCatalogRateUnit({
      unit: source.unit,
      dispatchUnit: source.dispatchUnit,
    }) ?? DEFAULT_RATE_UNIT
  );
}

/**
 * Collection details first; first member only fills gaps on older packs.
 */
export function packSellAsFromCollection(
  collection: PackSellAsSource,
  firstMember?: PackSellAsSource | null,
): Pick<SameForAllDetails, 'unit' | 'dispatchUnit' | 'catalogRateUnit' | 'piecesPerPack'> {
  const unit = collection.unit?.trim() || firstMember?.unit?.trim() || Unit.Set;
  const dispatchUnit =
    collection.dispatchUnit?.trim() || firstMember?.dispatchUnit?.trim() || unit;
  const catalogRateUnit =
    collection.catalogRateUnit?.trim() ||
    firstMember?.catalogRateUnit?.trim() ||
    storedCatalogRateUnit({ unit, dispatchUnit, catalogRateUnit: collection.catalogRateUnit });
  const pieces =
    collection.piecesPerPack != null && String(collection.piecesPerPack).trim() !== ''
      ? collection.piecesPerPack
      : firstMember?.piecesPerPack;
  const n = parsePiecesPerPack(pieces);
  return {
    unit,
    dispatchUnit,
    catalogRateUnit,
    piecesPerPack: n == null ? '' : String(n),
  };
}

/**
 * First-load merge for the collection editor. Pure so React Strict Mode’s
 * double updater call cannot drop Rate per / 1 set contains back to set.
 */
export function hydratePackSellAsState(
  prev: SameForAllDetails,
  sellAs: Pick<SameForAllDetails, 'unit' | 'dispatchUnit' | 'catalogRateUnit' | 'piecesPerPack'>,
  opts: { rate: string; moq: string },
): SameForAllDetails {
  return {
    ...prev,
    rate: opts.rate || prev.rate,
    unit: sellAs.unit,
    dispatchUnit: sellAs.dispatchUnit,
    catalogRateUnit: sellAs.catalogRateUnit || prev.catalogRateUnit,
    piecesPerPack: sellAs.piecesPerPack,
    moq: opts.moq || prev.moq,
  };
}

/** Own-company members the collection editor may PATCH (skip curated peers). */
export function ownMembersForPackStamp<T extends { companyId?: string | null }>(
  products: T[],
  ownerCompanyId: string | null | undefined,
): T[] {
  const owner = ownerCompanyId?.trim();
  if (!owner) return [];
  return products.filter((product) => product.companyId === owner);
}

/**
 * Collection details as stored on members. Uses the editor’s order / Rate per
 * / 1 set contains — not a derived display unit that can lag one render.
 */
export function packStampShared(
  details: SameForAllDetails,
  packRate: string,
): SameForAllDetails {
  const unit = details.unit.trim() || Unit.Set;
  return {
    ...details,
    rate: packRate,
    unit,
    dispatchUnit: details.dispatchUnit.trim() || unit,
    catalogRateUnit: details.catalogRateUnit.trim() || DEFAULT_RATE_UNIT,
  };
}

/**
 * Own-design PATCH from collection details.
 * Rate per + 1 set contains persist on every own member (the editor hydrates
 * from members — skipping this made Update look like a no-op).
 * Pack rupee overwrites designs that follow the pack rate.
 * Apply to all overwrites every own member’s rate (even if it already had one).
 * After stamp, orders use the design rate. Empty or 0 pack → piecesPerPack null.
 */
export function packMemberProductPatch(opts: {
  parsed: PackMemberFields;
  followsPackRate: boolean;
  packRate: string;
  applyToAll: boolean;
}): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  const { parsed, followsPackRate, packRate, applyToAll } = opts;
  if (parsed.unit) patch.unit = parsed.unit;
  if (parsed.dispatchUnit) patch.dispatchUnit = parsed.dispatchUnit;
  if (parsed.catalogRateUnit) patch.catalogRateUnit = parsed.catalogRateUnit;
  if (parsed.piecesPerPack !== undefined) {
    patch.piecesPerPack = parsed.piecesPerPack;
  }
  if (packRate.trim() && (followsPackRate || applyToAll)) {
    patch.rate = parsed.rate;
    patch.rateMax = parsed.rateMax;
  }
  if (applyToAll && parsed.moq != null) patch.moq = parsed.moq;
  return patch;
}

export type RateConflict = {
  id: string;
  name: string;
  existing: string;
  incoming: string;
  otherPacks: string[];
};

function rateKey(raw: string): string {
  return raw.trim().replace(/\s+/g, '');
}

/** Library designs whose filled rate differs from the pack rate. */
export function collectRateConflicts(
  packRate: string,
  members: Array<{
    id: string;
    name: string;
    rate: string;
    otherPacks?: string[];
  }>,
): RateConflict[] {
  const incoming = rateKey(packRate);
  if (!incoming) return [];
  const out: RateConflict[] = [];
  for (const member of members) {
    const existing = rateKey(member.rate);
    if (!existing || existing === incoming) continue;
    out.push({
      id: member.id,
      name: member.name,
      existing: member.rate.trim(),
      incoming: packRate.trim(),
      otherPacks: member.otherPacks ?? [],
    });
  }
  return out;
}
