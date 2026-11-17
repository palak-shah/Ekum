/**
 * Cover is always gallery image 1. Showcase follows API order; URLs that equal
 * the cover are skipped so the viewer does not see a duplicate.
 */
export function profileGalleryUrls(
  coverUrl: string | null | undefined,
  showcaseUrls: string[] | null | undefined,
): string[] {
  const showcase = showcaseUrls ?? [];
  const urls: string[] = [];
  if (coverUrl) urls.push(coverUrl);
  for (const url of showcase) {
    if (!url) continue;
    if (coverUrl && url === coverUrl) continue;
    urls.push(url);
  }
  return urls;
}
