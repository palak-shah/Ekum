import { CollectionStatus, PublishAudience } from '@ekum/domain-types';

/** Audiences that surface on Explore for followers / the market. */
const BROAD_AUDIENCES = new Set<string>([
  PublishAudience.Everyone,
  PublishAudience.Followers,
  PublishAudience.Connections,
]);

/**
 * Whether publishing should bump exploreActivityAt.
 * First publish / republish after hide always bumps. Audience-only tweaks of an
 * already-live Selected pack do not. Widening to Followers/Everyone/Connections
 * (or first activity stamp) does resurface.
 */
export function shouldBumpExploreOnPublish(input: {
  priorStatus: string;
  priorAudience: string;
  nextAudience: string;
  exploreActivityAt: Date | string | null;
}): boolean {
  if (input.priorStatus !== CollectionStatus.Published) {
    return true;
  }
  if (!input.exploreActivityAt) {
    return true;
  }
  const wasBroad = BROAD_AUDIENCES.has(input.priorAudience);
  const nextBroad = BROAD_AUDIENCES.has(input.nextAudience);
  // Newly discoverable on a follow/market shelf.
  if (!wasBroad && nextBroad) {
    return true;
  }
  return false;
}
