import { PublishAudience } from '@ekum/domain-types';
import { allowedFollowSome } from '../discovery/follow-access';

type AudienceRow = {
  companyId: string;
  audience: string;
  audienceCompanyIds: string[];
};

export type AudienceViewerContext = {
  connected: boolean;
  /** Viewer follows the owner company. */
  following: boolean;
};

/**
 * Publish UI only offers Followers / Selected. Legacy `everyone` / `connections`
 * rows (and sheet remap) must behave as Followers so app, DB, and access match.
 */
export function effectivePublishAudience(audience: string): string {
  if (
    audience === PublishAudience.Everyone ||
    audience === PublishAudience.Connections
  ) {
    return PublishAudience.Followers;
  }
  return audience;
}

/** Followers (and legacy everyone/connections) — not Selected. */
export function isBroadPublishAudience(audience: string): boolean {
  return effectivePublishAudience(audience) === PublishAudience.Followers;
}

/**
 * Whether a viewer may discover a published collection/design (explore, shop, search).
 * Audience is who can see it — publish means live for that audience.
 */
export function canDiscoverCollection(
  viewerCompanyId: string,
  collection: AudienceRow,
  ctx: AudienceViewerContext = { connected: false, following: false },
  sourceCompanyIds: string[] = [],
  hasViewGrant = false,
): boolean {
  if (collection.companyId === viewerCompanyId) {
    return true;
  }
  if (hasViewGrant) {
    return true;
  }
  // Curated pack: hide redistribution surface from upstream source companies.
  if (sourceCompanyIds.includes(viewerCompanyId)) {
    return false;
  }
  const audience = effectivePublishAudience(collection.audience);
  if (audience === PublishAudience.Followers) {
    // Non-empty ids = Direct Link buyers already auto-delivered — skip on Explore.
    if (collection.audienceCompanyIds.includes(viewerCompanyId)) {
      return false;
    }
    return ctx.following;
  }
  if (audience === PublishAudience.Selected) {
    return collection.audienceCompanyIds.includes(viewerCompanyId);
  }
  return false;
}

/** Whether the viewer may see product rows / rates inside a collection. */
export function canViewCollectionProducts(
  viewerCompanyId: string,
  collection: AudienceRow,
  ctx: AudienceViewerContext | boolean,
  hasViewGrant = false,
): boolean {
  if (hasViewGrant) return true;
  const normalized: AudienceViewerContext =
    typeof ctx === 'boolean' ? { connected: ctx, following: false } : ctx;
  return canDiscoverCollection(viewerCompanyId, collection, normalized);
}

/**
 * Prisma `OR` for Explore/shop: posts visible to this viewer by audience.
 * Always includes the viewer’s own published posts (Followers/Selected packs
 * would otherwise vanish for the owner — they are not a follower of themselves).
 * Legacy everyone/connections are listed with Followers (allowed follow required).
 */
export function audienceVisibilityOr(viewerCompanyId: string): object[] {
  return [
    { companyId: viewerCompanyId },
    {
      audience: {
        in: [
          PublishAudience.Followers,
          PublishAudience.Connections,
          PublishAudience.Everyone,
        ],
      },
      company: {
        followers: allowedFollowSome(viewerCompanyId),
      },
      NOT: { audienceCompanyIds: { has: viewerCompanyId } },
    },
    {
      audience: PublishAudience.Selected,
      audienceCompanyIds: { has: viewerCompanyId },
    },
  ];
}

/**
 * Hide curated packs from companies that own member products (unless they own the pack).
 * AND with audience visibility on Collection queries.
 */
export function curatedSourceExcludeAnd(viewerCompanyId: string): object {
  return {
    OR: [
      { companyId: viewerCompanyId },
      { NOT: { products: { some: { product: { companyId: viewerCompanyId } } } } },
    ],
  };
}
