import { Unit } from '@ekum/domain-types';
import type { SameForAllDetails } from './rateInput';
import {
  formatRateInput,
  parseRateInput,
  sameForAllIsEmpty,
  sameForAllSummary,
} from './rateInput';
import { DEFAULT_DISPATCH_UNIT, DEFAULT_SELL_AS_UNIT } from './publishDefaults';
import { parsePiecesPerPack } from './orderDispatchPreview';

/** Packed order units show “1 set contains”. */
export function unitAsksPiecesPerSet(unit: string): boolean {
  return unit === Unit.Set || unit === Unit.Dozen || unit === Unit.Box || unit === Unit.Bundle;
}

export type { SameForAllDetails };
export { sameForAllIsEmpty, sameForAllSummary, parseRateInput };

/**
 * Platform usual shell: order + dispatch journey in **sets** (or the passed pack unit).
 * Rate stays **pc** via catalogRateUnit when order === dispatch set — not stored here.
 * Pass `unit: ''` only for Diff “nothing shared” fixtures.
 */
export const emptySameForAll = (unit = DEFAULT_SELL_AS_UNIT): SameForAllDetails => ({
  categories: [],
  rate: '',
  unit,
  dispatchUnit: unit.trim() ? unit.trim() : DEFAULT_DISPATCH_UNIT,
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
  piecesPerPack: '',
  moq: '',
  notes: '',
});

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
 * Rate never overwrites — pack rate and design rate stay separate; only empty design rates fill.
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
 * New create-mode photos: pack Rate fills empty only (design’s own rate wins).
 * Apply-to-all forces units / MOQ / notes — never a filled design rate.
 */
export function stampCreatePhotoMemberForm(
  form: MemberDesignForm,
  shared: SameForAllDetails,
  applyToAll: boolean,
): MemberDesignForm {
  return applyToAll
    ? forceSameForAllToForm(form, shared)
    : applySameForAllToForm(form, shared);
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
): boolean {
  if (design.rate == null) return true;
  const prev = previousPackRate.trim();
  if (!prev) return false;
  return formatRateInput(design.rate, design.rateMax ?? null) === prev;
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
    piecesPerPack: parsePiecesPerPack(form.piecesPerPack),
    moq: form.moq.trim() ? Number(form.moq) : undefined,
    categories:
      opts?.includeEmptyCategories || form.categories.length > 0
        ? form.categories
        : undefined,
  };
}

export type PackMemberFields = ReturnType<typeof productFieldsFromMember>;

/**
 * Own-design PATCH from pack Rate per + Apply to all.
 * Followers of the pack rate get the rupee **and** unit/dispatch (Explore Rate per).
 * Pack size / MOQ still need Apply to all. Empty or 0 pack → null (clear).
 */
export function packMemberProductPatch(opts: {
  parsed: PackMemberFields;
  followsPackRate: boolean;
  packRate: string;
  applyToAll: boolean;
}): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  const { parsed, followsPackRate, packRate, applyToAll } = opts;
  if (packRate.trim() && followsPackRate) {
    patch.rate = parsed.rate;
    patch.rateMax = parsed.rateMax;
    if (parsed.unit) patch.unit = parsed.unit;
    if (parsed.dispatchUnit) patch.dispatchUnit = parsed.dispatchUnit;
  }
  if (applyToAll) {
    if (parsed.unit) patch.unit = parsed.unit;
    if (parsed.dispatchUnit) patch.dispatchUnit = parsed.dispatchUnit;
    if (parsed.piecesPerPack !== undefined) {
      patch.piecesPerPack = parsed.piecesPerPack;
    }
    if (parsed.moq != null) patch.moq = parsed.moq;
  }
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
