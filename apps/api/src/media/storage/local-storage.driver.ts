import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { resolveMediaDiskFile } from '../media-disk-path';
import type { StorageDriver, UploadTarget } from './storage.types';

/**
 * The dev/test storage driver used when Azure credentials are unset. It mints
 * stub upload URLs under PUBLIC_MEDIA_BASE_URL so the whole media flow (ticket ->
 * confirm -> thumbnail job) runs end-to-end without cloud credentials.
 */
export class LocalStorageDriver implements StorageDriver {
  constructor(
    private readonly baseUrl: string,
    private readonly mediaRoot?: string,
  ) {}

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

  async getObject(blobPath: string): Promise<Buffer | null> {
    const target = this.resolve(blobPath);
    if (!target) return null;
    try {
      return await readFile(target);
    } catch {
      return null;
    }
  }

  async putObject(input: {
    blobPath: string;
    body: Buffer;
    contentType: string;
    cacheControl?: string;
  }): Promise<void> {
    const target = this.resolve(input.blobPath);
    if (!target) {
      throw new Error(`Invalid media path: ${input.blobPath}`);
    }
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, input.body);
  }

  async exists(blobPath: string): Promise<boolean> {
    const target = this.resolve(blobPath);
    if (!target) return false;
    try {
      const info = await stat(target);
      return info.isFile();
    } catch {
      return false;
    }
  }

  private resolve(blobPath: string): string | null {
    if (!this.mediaRoot) return null;
    return resolveMediaDiskFile(this.mediaRoot, blobPath);
  }
}
