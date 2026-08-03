import type { StorageDriver, UploadTarget } from './storage.types';

/**
 * The dev/test storage driver used when Azure credentials are unset. It mints
 * stub upload URLs under PUBLIC_MEDIA_BASE_URL so the whole media flow (ticket ->
 * confirm -> thumbnail job) runs end-to-end without cloud credentials.
 */
export class LocalStorageDriver implements StorageDriver {
  constructor(private readonly baseUrl: string) {}

  createUploadTarget(input: { blobPath: string; contentType: string }): UploadTarget {
    return {
      uploadUrl: `${this.baseUrl}/${input.blobPath}`,
      method: 'PUT',
      headers: { 'content-type': input.contentType, 'x-ekum-dev-upload': 'true' },
    };
  }

  publicUrl(blobPath: string): string {
    return `${this.baseUrl}/${blobPath}`;
  }
}
