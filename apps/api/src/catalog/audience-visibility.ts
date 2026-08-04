import { PublishAudience } from '@ekum/domain-types';

type AudienceRow = {
  companyId: string;
  audience: string;
  audienceCompanyIds: string[];
};

/**
 * Whether a viewer may discover a published collection (explore, shop, search).
 * `selected` is private to the listed companies; everyone/connections stay market-visible.
 */
export function canDiscoverCollection(viewerCompanyId: string, collection: AudienceRow): boolean {
  if (collection.companyId === viewerCompanyId) {
    return true;
  }
  if (collection.audience === PublishAudience.Selected) {
    return collection.audienceCompanyIds.includes(viewerCompanyId);
  }
  return true;
}

/** Whether the viewer may see product rows inside a collection. */
export function canViewCollectionProducts(
  viewerCompanyId: string,
  collection: AudienceRow,
  connected: boolean,
): boolean {
  if (collection.companyId === viewerCompanyId) {
    return true;
  }
  if (collection.audience === PublishAudience.Everyone) {
    return true;
  }
  if (collection.audience === PublishAudience.Selected) {
    return collection.audienceCompanyIds.includes(viewerCompanyId);
  }
  // connections (default): need an active connection
  return connected;
}
