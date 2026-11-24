/**
 * Allow download cannot exceed foreign members (and optional source pack).
 * Mirrors API `curatedPublishAllowDownload`.
 */
export function maxAllowDownloadForCuratedPack(
  curatorCompanyId: string | undefined | null,
  members: Array<{ companyId: string; allowDownload?: boolean | null }>,
  sourcePackAllowDownload?: boolean | null,
): boolean {
  if (!curatorCompanyId) return true;
  if (sourcePackAllowDownload === false) return false;
  const foreign = members.filter((row) => row.companyId !== curatorCompanyId);
  if (foreign.length === 0) return true;
  return foreign.every((row) => row.allowDownload === true);
}

/** Allow Repost cannot exceed immediate source pack. Mirrors API `curatedPublishAllowForward`. */
export function maxAllowForwardForCuratedPack(
  sourcePackAllowForward?: boolean | null,
): boolean {
  return sourcePackAllowForward !== false;
}
