import { ConnectionStatus, PublishAudience } from '@ekum/domain-types';

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
  if (collection.audience === PublishAudience.Everyone) {
    return true;
  }
  if (collection.audience === PublishAudience.Connections) {
    return ctx.connected;
  }
  if (collection.audience === PublishAudience.Followers) {
    return ctx.following;
  }
  if (collection.audience === PublishAudience.Selected) {
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
 * Do not use `audience: { not: selected }` — that would leak followers posts.
 */
export function audienceVisibilityOr(viewerCompanyId: string): object[] {
  return [
    { audience: PublishAudience.Everyone },
    {
      audience: PublishAudience.Connections,
      company: {
        connectionsAsOwner: {
          some: { viewerCompanyId, status: ConnectionStatus.Active },
        },
      },
    },
    {
      audience: PublishAudience.Followers,
      company: {
        followers: { some: { followerCompanyId: viewerCompanyId } },
      },
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
