import { PublishAudience } from '@ekum/domain-types';
import {
  clampAudienceToCeiling,
  isAudienceWithinCeiling,
} from './curationAudienceCeiling';

/** New publish sheets default here — Connections mixes suppliers. */
export const DEFAULT_PUBLISH_AUDIENCE = PublishAudience.Followers;

/** Who chips on Publish / Visibility (Connections kept in API for legacy rows only). */
export const PUBLISH_WHO_OPTIONS = [
  [PublishAudience.Everyone, 'Everyone'],
  [PublishAudience.Followers, 'My followers'],
  [PublishAudience.Selected, 'Selected'],
] as const;

const PUBLISH_WHO_VALUES = new Set<string>(PUBLISH_WHO_OPTIONS.map(([value]) => value));

/**
 * Map stored audience onto a chip the sheet can show.
 * Legacy `connections` → Followers; if that exceeds a curation ceiling, → Selected.
 */
export function audienceForPublishSheet(
  audience: string | undefined,
  maxAudience: string | null = null,
): string {
  const preferred =
    !audience || audience === PublishAudience.Connections
      ? DEFAULT_PUBLISH_AUDIENCE
      : audience;
  const clamped = clampAudienceToCeiling(preferred, maxAudience);
  if (PUBLISH_WHO_VALUES.has(clamped)) return clamped;
  // Ceiling landed on Connections (not offered) — Selected is always within that ceiling.
  if (clamped === PublishAudience.Connections) {
    return PublishAudience.Selected;
  }
  if (isAudienceWithinCeiling(DEFAULT_PUBLISH_AUDIENCE, maxAudience)) {
    return DEFAULT_PUBLISH_AUDIENCE;
  }
  return PublishAudience.Selected;
}
