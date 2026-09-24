import { Unit } from '@ekum/domain-types';
import type { SameForAllDetails } from './rateInput';
import { parseRateInput, sameForAllIsEmpty, sameForAllSummary } from './rateInput';

/** Pieces-per-set only matters when they sell as a set. */
export function unitAsksPiecesPerSet(unit: string): boolean {
  return unit === Unit.Set;
}

export type { SameForAllDetails };
export { sameForAllIsEmpty, sameForAllSummary, parseRateInput };

export const emptySameForAll = (unit = ''): SameForAllDetails => ({
  categories: [],
  rate: '',
  unit,
  piecesPerPack: '',
  moq: '',
  notes: '',
});

export type MemberDesignForm = {
  name: string;
  rate: string;
  unit: string;
  piecesPerPack: string;
  moq: string;
  notes: string;
  categories: string[];
};

/** Union tags — amend only missing; never drop existing. */
export function unionTags(existing: string[], incoming: string[]): string[] {
  const seen = new Set(existing.map((t) => t.trim().toLowerCase()).filter(Boolean));
  const out = [...existing];
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

/** Compare member fields to same-for-all (ignores name). */
export function memberDiffersFromSameForAll(
  form: MemberDesignForm,
  shared: SameForAllDetails,
): boolean {
  if (sameForAllIsEmpty(shared)) return false;
  if (shared.rate.trim() && form.rate.trim() !== shared.rate.trim()) return true;
  if (shared.unit.trim() && form.unit !== shared.unit) return true;
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

/** Force shared values onto member (Use same as all — explicit override). */
export function forceSameForAllToForm(
  form: MemberDesignForm,
  shared: SameForAllDetails,
): MemberDesignForm {
  return {
    ...form,
    rate: shared.rate.trim() ? shared.rate : form.rate,
    unit: shared.unit.trim() ? shared.unit : form.unit,
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

/** Product create/patch payload from rate text + member fields. */
export function productFieldsFromMember(
  form: MemberDesignForm,
  opts?: { includeEmptyCategories?: boolean },
): {
  description?: string;
  rate?: number | null;
  rateMax?: number | null;
  unit?: string;
  piecesPerPack?: number | null;
  moq?: number;
  categories?: string[];
} {
  const parsed = parseRateInput(form.rate);
  const pcs = form.piecesPerPack.trim() ? Number(form.piecesPerPack) : undefined;
  return {
    description: form.notes.trim() || undefined,
    rate: parsed.rate,
    rateMax: parsed.rateMax,
    unit: form.unit || undefined,
    piecesPerPack:
      pcs != null && Number.isFinite(pcs) && pcs > 0 ? Math.floor(pcs) : undefined,
    moq: form.moq.trim() ? Number(form.moq) : undefined,
    categories:
      opts?.includeEmptyCategories || form.categories.length > 0
        ? form.categories
        : undefined,
  };
}
