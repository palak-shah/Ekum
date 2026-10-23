import { isAbsolute, relative as pathRelative, resolve } from 'node:path';

/**
 * Express 5 `*path` used to land as a string[] that Node joined with commas
 * (`companyId,file.jpg` at the media root). Current GET uses slash segments
 * (`companyId/file.jpg`). Serve both so older uploads still resolve.
 */
export function mediaDiskCandidates(relative: string): string[] {
  const trimmed = relative.replace(/^[/\\]+/, '').replace(/\\/g, '/');
  if (!trimmed || trimmed.includes('..')) {
    return [];
  }
  const comma = trimmed.replace(/\//g, ',');
  return comma === trimmed ? [trimmed] : [trimmed, comma];
}

/** Absolute file under `root`, or null if the key escapes the media root. */
export function resolveMediaDiskFile(root: string, blobPath: string): string | null {
  const relative = blobPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const segments = relative.split('/').filter(Boolean);
  if (segments.length === 0 || segments.some((seg) => seg === '.' || seg === '..')) {
    return null;
  }
  const base = resolve(root);
  const target = resolve(base, ...segments);
  const fromBase = pathRelative(base, target);
  if (!fromBase || fromBase.startsWith('..') || isAbsolute(fromBase)) {
    return null;
  }
  return target;
}
