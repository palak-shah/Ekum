/**
 * The storage abstraction behind direct-to-blob uploads. The API never proxies
 * bytes: it mints a scoped, short-lived upload target the client PUTs to, and can
 * compute the stable public URL for a stored object.
 */
export interface UploadTarget {
  uploadUrl: string;
  method: 'PUT';
  headers: Record<string, string>;
}

export interface StorageDriver {
  /** A scoped, expiring target the client uploads the raw bytes to. */
  createUploadTarget(input: { blobPath: string; contentType: string; ttlMs: number }): UploadTarget;
  /** The stable, readable URL for a stored object. */
  publicUrl(blobPath: string): string;
}

/** DI token for the selected storage driver (Azure in prod, local in dev/test). */
export const STORAGE_DRIVER = Symbol('STORAGE_DRIVER');
