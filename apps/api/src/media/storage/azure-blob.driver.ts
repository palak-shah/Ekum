import { createHmac } from 'node:crypto';
import type { StorageDriver, UploadTarget } from './storage.types';

const SAS_VERSION = '2020-12-06';
const WORKER_SAS_TTL_MS = 15 * 60_000;

export interface AzureBlobConfig {
  account: string;
  accountKey: string;
  container: string;
}

/**
 * Azure Blob driver. It mints a Service SAS (create + write) for a single blob,
 * signed locally with the account key — no SDK dependency and no network call, so
 * upload-ticket minting stays synchronous and cheap. The client PUTs bytes
 * straight to Azure; a thumbnail job reads/writes variants afterwards.
 */
export class AzureBlobDriver implements StorageDriver {
  constructor(private readonly config: AzureBlobConfig) {}

  createUploadTarget(input: { blobPath: string; contentType: string; ttlMs: number }): UploadTarget {
    const now = Date.now();
    const start = new Date(now - 5 * 60_000); // small clock-skew allowance
    const expiry = new Date(now + input.ttlMs);
    const sas = this.signBlobSas(input.blobPath, start, expiry, 'cw');
    return {
      uploadUrl: `${this.publicUrl(input.blobPath)}?${sas}`,
      method: 'PUT',
      headers: { 'x-ms-blob-type': 'BlockBlob', 'content-type': input.contentType },
    };
  }

  publicUrl(blobPath: string): string {
    return `https://${this.config.account}.blob.core.windows.net/${this.config.container}/${blobPath}`;
  }

  async getObject(blobPath: string): Promise<Buffer | null> {
    const res = await fetch(this.signedUrl(blobPath, 'r'), { method: 'GET' });
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`Azure GET ${blobPath} failed (${res.status}).`);
    }
    return Buffer.from(await res.arrayBuffer());
  }

  async putObject(input: {
    blobPath: string;
    body: Buffer;
    contentType: string;
    cacheControl?: string;
  }): Promise<void> {
    const headers: Record<string, string> = {
      'x-ms-blob-type': 'BlockBlob',
      'content-type': input.contentType,
    };
    if (input.cacheControl) {
      headers['x-ms-blob-cache-control'] = input.cacheControl;
    }
    const res = await fetch(this.signedUrl(input.blobPath, 'cw'), {
      method: 'PUT',
      headers,
      body: new Uint8Array(input.body),
    });
    if (!res.ok) {
      throw new Error(`Azure PUT ${input.blobPath} failed (${res.status}).`);
    }
  }

  async exists(blobPath: string): Promise<boolean> {
    const res = await fetch(this.signedUrl(blobPath, 'r'), { method: 'HEAD' });
    if (res.status === 404) return false;
    if (!res.ok) {
      throw new Error(`Azure HEAD ${blobPath} failed (${res.status}).`);
    }
    return true;
  }

  private signedUrl(blobPath: string, permissions: string): string {
    const now = Date.now();
    const sas = this.signBlobSas(
      blobPath,
      new Date(now - 5 * 60_000),
      new Date(now + WORKER_SAS_TTL_MS),
      permissions,
    );
    return `${this.publicUrl(blobPath)}?${sas}`;
  }

  /** Builds a signed Service SAS query string for one blob. */
  private signBlobSas(
    blobPath: string,
    start: Date,
    expiry: Date,
    permissions: string,
  ): string {
    const signedStart = toSasTime(start);
    const signedExpiry = toSasTime(expiry);
    const protocol = 'https';
    const resource = 'b'; // blob
    const canonicalizedResource = `/blob/${this.config.account}/${this.config.container}/${blobPath}`;

    // Service SAS string-to-sign for signedVersion 2020-12-06. Empty lines are
    // required placeholders for optional fields we do not set.
    const stringToSign = [
      permissions,
      signedStart,
      signedExpiry,
      canonicalizedResource,
      '', // signedIdentifier
      '', // signedIP
      protocol,
      SAS_VERSION,
      resource,
      '', // signedSnapshotTime
      '', // signedEncryptionScope
      '', // rscc (Cache-Control)
      '', // rscd (Content-Disposition)
      '', // rsce (Content-Encoding)
      '', // rscl (Content-Language)
      '', // rsct (Content-Type)
    ].join('\n');

    const signature = createHmac('sha256', Buffer.from(this.config.accountKey, 'base64'))
      .update(stringToSign, 'utf8')
      .digest('base64');

    const query = new URLSearchParams({
      sv: SAS_VERSION,
      spr: protocol,
      st: signedStart,
      se: signedExpiry,
      sr: resource,
      sp: permissions,
      sig: signature,
    });
    return query.toString();
  }
}

/** Azure expects ISO-8601 with second precision and a trailing Z. */
function toSasTime(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}
