import type { SameForAllDetails } from './rateInput';
import { parseRateInput, sameForAllIsEmpty, sameForAllSummary } from './rateInput';

export type { SameForAllDetails };
export { sameForAllIsEmpty, sameForAllSummary, parseRateInput };

export const emptySameForAll = (unit = ''): SameForAllDetails => ({
  categories: [],
  rate: '',
  unit,
  moq: '',
  notes: '',
});

export type MemberDesignForm = {
  name: string;
  rate: string;
  unit: string;
  moq: string;
  notes: string;
  categories: string[];
};

/** Compare member fields to same-for-all (ignores name). */
export function memberDiffersFromSameForAll(
  form: MemberDesignForm,
  shared: SameForAllDetails,
): boolean {
  if (sameForAllIsEmpty(shared)) return false;
  if (shared.rate.trim() && form.rate.trim() !== shared.rate.trim()) return true;
  if (shared.unit.trim() && form.unit !== shared.unit) return true;
  if (shared.moq.trim() && form.moq.trim() !== shared.moq.trim()) return true;
  if (shared.notes.trim() && form.notes.trim() !== shared.notes.trim()) return true;
  if (
    shared.categories.length > 0 &&
    shared.categories.join('\0') !== form.categories.join('\0')
  ) {
    return true;
  }
  return false;
}

/** Apply filled same-for-all fields onto a member form (keeps name). */
export function applySameForAllToForm(
  form: MemberDesignForm,
  shared: SameForAllDetails,
): MemberDesignForm {
  return {
    ...form,
    rate: shared.rate.trim() ? shared.rate : form.rate,
    unit: shared.unit.trim() ? shared.unit : form.unit,
    moq: shared.moq.trim() ? shared.moq : form.moq,
    notes: shared.notes.trim() ? shared.notes : form.notes,
    categories:
      shared.categories.length > 0 ? [...shared.categories] : form.categories,
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
  moq?: number;
  categories?: string[];
} {
  const parsed = parseRateInput(form.rate);
  return {
    description: form.notes.trim() || undefined,
    rate: parsed.rate,
    rateMax: parsed.rateMax,
    unit: form.unit || undefined,
    moq: form.moq.trim() ? Number(form.moq) : undefined,
    categories:
      opts?.includeEmptyCategories || form.categories.length > 0
        ? form.categories
        : undefined,
  };
}
