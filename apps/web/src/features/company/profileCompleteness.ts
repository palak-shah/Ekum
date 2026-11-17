export type ProfileCompletenessGap =
  | 'logo'
  | 'cover'
  | 'about'
  | 'sellCategories';

export type ProfileCompletenessChip = {
  id: ProfileCompletenessGap;
  label: string;
};

const GAP_LABEL: Record<ProfileCompletenessGap, string> = {
  logo: 'Add profile photo',
  cover: 'Add cover',
  about: 'Add about',
  sellCategories: 'Add sell categories',
};

/** Fields used for Home completeness — no second source of truth. */
export type ProfileCompletenessInput = {
  logoUrl?: string | null;
  coverUrl?: string | null;
  about?: string | null;
  sellCategories?: string[] | null;
};

function isBlank(value: string | null | undefined): boolean {
  return !value || !value.trim();
}

/** Incomplete optional face fields in priority order (max applied by caller). */
export function profileCompletenessGaps(
  input: ProfileCompletenessInput,
): ProfileCompletenessGap[] {
  const gaps: ProfileCompletenessGap[] = [];
  if (isBlank(input.logoUrl ?? null)) gaps.push('logo');
  if (isBlank(input.coverUrl ?? null)) gaps.push('cover');
  if (isBlank(input.about ?? null)) gaps.push('about');
  // undefined = own DTO not loaded yet — skip that chip until we know.
  if (input.sellCategories !== undefined) {
    if (!input.sellCategories || input.sellCategories.length < 1) {
      gaps.push('sellCategories');
    }
  }
  return gaps;
}

export function profileCompletenessChips(
  input: ProfileCompletenessInput,
  max = 3,
): ProfileCompletenessChip[] {
  return profileCompletenessGaps(input)
    .slice(0, max)
    .map((id) => ({ id, label: GAP_LABEL[id] }));
}

/** Stable fingerprint for dismiss until the incomplete set changes. */
export function profileCompletenessFingerprint(gaps: ProfileCompletenessGap[]): string {
  return [...gaps].sort().join('|');
}
