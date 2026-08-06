import { matchesCompanyInterest, type InterestCompany, type ResolvedInterest } from './interest-match';

export type RankablePost = {
  postedAt: Date;
  feedId: string;
  company: InterestCompany & { city?: string | null };
};

/**
 * Freshness decays over ~3 days so new posts win, but a slightly older
 * interest match can still beat a brand-new unrelated post.
 */
export function freshnessScore(postedAt: Date, now = Date.now()): number {
  const ageHours = Math.max(0, (now - postedAt.getTime()) / (60 * 60 * 1000));
  return Math.exp(-ageHours / 72);
}

/** 1 = fine tag hit, 0.65 = coarse/super match, 0 = none. */
export function interestStrength(company: InterestCompany, interest: ResolvedInterest): number {
  if (!matchesCompanyInterest(company, interest)) return 0;
  const sell = company.sellCategories ?? [];
  if (interest.tags.some((tag) => sell.includes(tag))) return 1;
  return 0.65;
}

/**
 * Relevance for market posts: interest + freshness + same-city.
 * Freshness is intentional — not the only signal.
 */
export function marketRelevanceScore(
  row: RankablePost,
  interest: ResolvedInterest,
  viewerCity: string | null,
  now = Date.now(),
): number {
  const interestPart = interestStrength(row.company, interest);
  const freshPart = freshnessScore(row.postedAt, now);
  const cityPart =
    viewerCity && row.company.city?.trim().toLowerCase() === viewerCity.trim().toLowerCase()
      ? 1
      : 0;
  return interestPart * 0.45 + freshPart * 0.4 + cityPart * 0.15;
}

export function compareByMarketRelevance(
  a: RankablePost,
  b: RankablePost,
  interest: ResolvedInterest,
  viewerCity: string | null,
  now = Date.now(),
): number {
  const delta =
    marketRelevanceScore(b, interest, viewerCity, now) -
    marketRelevanceScore(a, interest, viewerCity, now);
  if (Math.abs(delta) > 1e-9) return delta;
  const time = b.postedAt.getTime() - a.postedAt.getTime();
  if (time !== 0) return time;
  return b.feedId.localeCompare(a.feedId);
}
