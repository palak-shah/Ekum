import { toAbsoluteMediaUrl } from '@/lib/mediaUrl';

/** Create-collection `coverImage` must be absolute http(s). Otherwise omit. */
export function repostCoverUrl(raw: string | null | undefined): string | undefined {
  const absolute = toAbsoluteMediaUrl(raw);
  if (!absolute) return undefined;
  if (!/^https?:\/\//i.test(absolute)) return undefined;
  if (absolute.startsWith('blob:') || absolute.startsWith('data:')) return undefined;
  return absolute;
}
