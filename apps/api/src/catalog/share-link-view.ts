/**
 * Guest 48h page shows designs only for truly open catalog.
 * Everyone is no longer offered on Publish and legacy rows behave as Followers —
 * guests always get the closed teaser + Request access.
 */
export function shareLinkOpenForCollection(_collection: {
  audience: string;
  status: string;
  startsAt?: Date | string | null;
  endsAt?: Date | string | null;
}): boolean {
  return false;
}

export function shareLinkOpenForProduct(_product: {
  audience: string;
  status: string;
  postedToMarketAt?: Date | string | null;
}): boolean {
  return false;
}
