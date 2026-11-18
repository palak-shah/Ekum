import type { CompanyContactPoint, TeamMemberView } from '@ekum/domain-types';
import { categoryDisplayLabel } from '@ekum/domain-types';
import { isGstVerified } from '@/ui/GstTick';

export function normalizePersonName(name: string | null | undefined): string {
  return (name ?? '').trim().toLowerCase();
}

/** Order-insensitive label set equality (case-fold). */
export function sameLabelSet(
  left: readonly string[],
  right: readonly string[],
): boolean {
  if (left.length !== right.length) return false;
  const a = left.map((label) => label.trim().toLowerCase()).filter(Boolean).sort();
  const b = right.map((label) => label.trim().toLowerCase()).filter(Boolean).sort();
  if (a.length !== b.length) return false;
  return a.every((label, index) => label === b[index]);
}

export function labelsFromSlugs(slugs: readonly string[] | null | undefined): string[] {
  return (slugs ?? [])
    .map((slug) => categoryDisplayLabel(slug))
    .map((label) => label.trim())
    .filter(Boolean);
}

/** City InfoRow — hide when hero already shows the same city. */
export function showBusinessInfoCity(
  city: string | null | undefined,
  heroCity: string | null | undefined,
): boolean {
  const value = city?.trim() ?? '';
  if (!value) return false;
  const hero = heroCity?.trim() ?? '';
  if (!hero) return true;
  return value.toLowerCase() !== hero.toLowerCase();
}

/** Categories InfoRow — hide when labels match hero sell line. */
export function showBusinessInfoCategories(
  categorySlugs: readonly string[],
  heroSellSlugs: readonly string[],
): boolean {
  const cats = labelsFromSlugs(categorySlugs);
  if (cats.length < 1) return false;
  return !sameLabelSet(cats, labelsFromSlugs(heroSellSlugs));
}

/** Sells line — hide when same as hero sell labels. Buys always keep the trade row when set. */
export function showBusinessInfoSells(
  sellSlugs: readonly string[] | null | undefined,
  heroSellSlugs: readonly string[],
): boolean {
  const sells = labelsFromSlugs(sellSlugs);
  if (sells.length < 1) return false;
  return !sameLabelSet(sells, labelsFromSlugs(heroSellSlugs));
}

/**
 * Shareable GST only: owner GSTIN, or visitor “GST verified”.
 * Never “GST not shared”; never visitor GSTIN.
 */
export function shareableGstLabel(input: {
  isOwn: boolean;
  gstNumber?: string | null;
  verification: string;
}): string | null {
  if (input.isOwn) {
    const number = input.gstNumber?.trim() ?? '';
    return number || null;
  }
  return isGstVerified(input.verification) ? 'GST verified' : null;
}

/** Contacts card when opted-in phones exist. */
export function showContactsCard(
  showContacts: boolean,
  contacts: readonly CompanyContactPoint[],
): boolean {
  return showContacts && contacts.length > 0;
}

/**
 * Team card on Home when roster non-empty, unless same single person as Contacts
 * (normalized name) — then Contacts only.
 */
export function showTeamCard(input: {
  showTeamLink: boolean;
  teamMembers: readonly TeamMemberView[] | null | undefined;
  showContacts: boolean;
  contacts: readonly CompanyContactPoint[];
}): boolean {
  if (!input.showTeamLink) return false;
  const team = input.teamMembers ?? [];
  if (team.length < 1) return false;
  if (
    input.showContacts &&
    input.contacts.length === 1 &&
    team.length === 1 &&
    normalizePersonName(input.contacts[0]?.name) ===
      normalizePersonName(team[0]?.name) &&
    normalizePersonName(input.contacts[0]?.name) !== ''
  ) {
    return false;
  }
  return true;
}
