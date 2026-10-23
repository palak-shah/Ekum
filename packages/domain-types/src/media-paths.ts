/**
 * Storage layout for managed photos (not a trader-facing concept).
 *
 *   {companyId}/original/{file}         unchanged upload bytes
 *   {companyId}/thumbnail1/{stem}.webp  longest edge ≤ 480
 *   {companyId}/thumbnail2/{stem}.webp  longest edge ≤ 1080
 *
 * Legacy uploads were {companyId}/{file}. Relocate copies into original/.
 * Seed catalog originals stay at seed/{name}.jpg with the same thumbnail folders.
 */

export const MEDIA_VARIANT = {
  Original: 'original',
  Thumbnail1: 'thumbnail1',
  Thumbnail2: 'thumbnail2',
} as const;
export type MediaVariant = (typeof MEDIA_VARIANT)[keyof typeof MEDIA_VARIANT];

export const MEDIA_VARIANT_MAX_EDGE: Record<Exclude<MediaVariant, 'original'>, number> = {
  thumbnail1: 480,
  thumbnail2: 1080,
};

const VARIANT_FOLDERS = new Set<string>(Object.values(MEDIA_VARIANT));
const IMAGE_EXT = /^(jpe?g|png|webp)$/i;
const AUDIO_OR_DOC_EXT = /^(webm|m4a|mp3|mp4|pdf|doc|docx|xls|xlsx|csv|txt)$/i;

export function blobFileStem(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  if (dot <= 0) return fileName;
  return fileName.slice(0, dot);
}

export function blobFileExt(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  if (dot <= 0) return '';
  return fileName.slice(dot + 1);
}

export function isImageFileName(fileName: string): boolean {
  return IMAGE_EXT.test(blobFileExt(fileName));
}

export function isNonImageMediaFileName(fileName: string): boolean {
  return AUDIO_OR_DOC_EXT.test(blobFileExt(fileName));
}

export type ParsedMediaBlobPath =
  | {
      kind: 'seed';
      folder: MediaVariant | 'legacy';
      fileName: string;
      blobPath: string;
    }
  | { kind: 'unknown'; blobPath: string }
  | {
      kind: 'managed';
      companyId: string;
      folder: MediaVariant | 'legacy';
      fileName: string;
      blobPath: string;
    };

/** Split a storage key. Does not throw. */
export function parseMediaBlobPath(blobPath: string): ParsedMediaBlobPath {
  const trimmed = blobPath.replace(/^\/+/, '').replace(/\\/g, '/');
  if (!trimmed || trimmed.includes('..')) {
    return { kind: 'unknown', blobPath: trimmed };
  }
  const parts = trimmed.split('/').filter(Boolean);
  if (parts[0] === 'seed') {
    if (parts.length === 2 && parts[1]) {
      return {
        kind: 'seed',
        folder: 'legacy',
        fileName: parts[1],
        blobPath: trimmed,
      };
    }
    if (parts.length === 3 && parts[1] && parts[2] && VARIANT_FOLDERS.has(parts[1])) {
      return {
        kind: 'seed',
        folder: parts[1] as MediaVariant,
        fileName: parts[2],
        blobPath: trimmed,
      };
    }
    return { kind: 'unknown', blobPath: trimmed };
  }
  if (parts.length === 2 && parts[0] && parts[1]) {
    return {
      kind: 'managed',
      companyId: parts[0],
      folder: 'legacy',
      fileName: parts[1],
      blobPath: trimmed,
    };
  }
  if (parts.length === 3 && parts[0] && parts[1] && parts[2] && VARIANT_FOLDERS.has(parts[1])) {
    return {
      kind: 'managed',
      companyId: parts[0],
      folder: parts[1] as MediaVariant,
      fileName: parts[2],
      blobPath: trimmed,
    };
  }
  return { kind: 'unknown', blobPath: trimmed };
}

/** Keys to try when the recorded blobPath might be pre- or post-relocate. */
export function originalBlobCandidates(blobPath: string): string[] {
  const parsed = parseMediaBlobPath(blobPath);
  if (parsed.kind !== 'managed' || !isImageFileName(parsed.fileName)) {
    return [blobPath];
  }
  const canonical = `${parsed.companyId}/original/${parsed.fileName}`;
  const legacy = `${parsed.companyId}/${parsed.fileName}`;
  if (parsed.folder === 'original') {
    return [canonical, legacy];
  }
  if (parsed.folder === 'legacy') {
    return [legacy, canonical];
  }
  return [canonical, legacy];
}

export function mediaVariantBlobPath(blobPath: string, variant: MediaVariant): string | null {
  const parsed = parseMediaBlobPath(blobPath);
  if (parsed.kind === 'seed' && isImageFileName(parsed.fileName)) {
    const stem = blobFileStem(parsed.fileName);
    if (variant === MEDIA_VARIANT.Original) {
      return parsed.folder === 'legacy' || parsed.folder === MEDIA_VARIANT.Original
        ? `seed/${parsed.fileName}`
        : `seed/${stem}.jpg`;
    }
    return `seed/${variant}/${stem}.webp`;
  }
  if (parsed.kind !== 'managed' || !isImageFileName(parsed.fileName)) {
    return null;
  }
  if (variant === MEDIA_VARIANT.Original) {
    return `${parsed.companyId}/original/${parsed.fileName}`;
  }
  return `${parsed.companyId}/${variant}/${blobFileStem(parsed.fileName)}.webp`;
}

/** Insert /original/ before the file on a legacy image key. No-op otherwise. */
export function relocateOriginalBlobPath(blobPath: string): string | null {
  const parsed = parseMediaBlobPath(blobPath);
  if (parsed.kind !== 'managed') return null;
  if (!isImageFileName(parsed.fileName)) return null;
  if (parsed.folder === 'legacy') {
    return `${parsed.companyId}/original/${parsed.fileName}`;
  }
  if (parsed.folder === MEDIA_VARIANT.Original) {
    return parsed.blobPath;
  }
  return null;
}

export type ManagedMediaUrlParts = {
  origin: string;
  /** Path before the blob key, e.g. `/media` or `/{container}`. */
  prefix: string;
  blobPath: string;
};

/**
 * Local `/media/{blobPath}` and Azure `{account}.blob.core.windows.net/{container}/{blobPath}`.
 * blob:, data:, and unrelated hosts return null. Seed catalog paths are included
 * so Explore / Orders can request `seed/thumbnail1|2/{name}.webp`.
 */
export function parseManagedMediaUrl(url: string): ManagedMediaUrlParts | null {
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return null;
  }
  const parsed = splitHttpUrl(trimmed);
  if (!parsed) return null;
  if (parsed.host.endsWith('.blob.core.windows.net')) {
    const parts = parsed.pathname.replace(/^\/+/, '').split('/').filter(Boolean);
    if (parts.length < 3) return null;
    const container = parts[0]!;
    const blobPath = parts.slice(1).join('/');
    return {
      origin: parsed.origin,
      prefix: `/${container}`,
      blobPath,
    };
  }
  const path = parsed.pathname;
  if (path === '/media' || path.startsWith('/media/')) {
    const blobPath = path.replace(/^\/media\/?/, '');
    if (!blobPath) return null;
    return { origin: parsed.origin, prefix: '/media', blobPath };
  }
  return null;
}

/** Avoid `URL` so domain-types stays without DOM lib. */
function splitHttpUrl(raw: string): { origin: string; host: string; pathname: string } | null {
  const noHash = raw.split('#')[0] ?? raw;
  const noQuery = noHash.split('?')[0] ?? noHash;
  if (noQuery.startsWith('/')) {
    return { origin: '', host: '', pathname: noQuery };
  }
  const match = /^(https?):\/\/([^/?#]+)(\/[^?#]*)?$/i.exec(noQuery);
  if (!match) return null;
  const protocol = match[1]!.toLowerCase();
  const host = match[2]!.toLowerCase();
  const pathname = match[3] && match[3].length > 0 ? match[3] : '/';
  return { origin: `${protocol}://${host}`, host, pathname };
}

export function mediaVariantUrl(url: string, variant: MediaVariant): string {
  const managed = parseManagedMediaUrl(url);
  if (!managed) return url;
  const nextPath =
    variant === MEDIA_VARIANT.Original
      ? (relocateOriginalBlobPath(managed.blobPath) ??
        mediaVariantBlobPath(managed.blobPath, variant))
      : mediaVariantBlobPath(managed.blobPath, variant);
  if (!nextPath) return url;
  return joinManagedUrl(managed, nextPath);
}

export function relocateOriginalUrl(url: string): string {
  const managed = parseManagedMediaUrl(url);
  if (!managed) return url;
  const next = relocateOriginalBlobPath(managed.blobPath);
  if (!next || next === managed.blobPath) return url;
  return joinManagedUrl(managed, next);
}

function joinManagedUrl(parts: ManagedMediaUrlParts, blobPath: string): string {
  const path = `${parts.prefix}/${blobPath}`.replace(/\/{2,}/g, '/');
  if (!parts.origin) return path;
  return `${parts.origin}${path}`;
}
