const NOTE_IMAGE_CAP = 9;

/** Cap and sanitize uploaded note image URLs (already uploaded via /media). */
export function normalizeNoteImageUrls(urls: string[] | undefined): string[] {
  if (!urls?.length) return [];
  return [...new Set(urls.map((url) => url.trim()).filter(Boolean))].slice(0, NOTE_IMAGE_CAP);
}
