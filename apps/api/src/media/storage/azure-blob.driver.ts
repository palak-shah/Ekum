import { createHmac } from 'node:crypto';
import type { StorageDriver, UploadTarget } from './storage.types';

const SAS_VERSION = '2020-12-06';

export interface AzureBlobConfig {
  account: string;
  accountKey: string;
  container: string;
}

/**
 * Azure Blob driver. It mints a Service SAS (create + write) for a single blob,
 * signed locally with the account key — no SDK dependency and no network call, so
 * upload-ticket minting stays synchronous and cheap. The client PUTs bytes
 * straight to Azure; a thumbnail job runs afterwards.
 */
export class AzureBlobDriver implements StorageDriver {
  constructor(private readonly config: AzureBlobConfig) {}

  createUploadTarget(input: { blobPath: string; contentType: string; ttlMs: number }): UploadTarget {
    const now = Date.now();
    const start = new Date(now - 5 * 60_000); // small clock-skew allowance
    const expiry = new Date(now + input.ttlMs);
    const sas = this.signBlobSas(input.blobPath, start, expiry);
    return {
      uploadUrl: `${this.publicUrl(input.blobPath)}?${sas}`,
      method: 'PUT',
      headers: { 'x-ms-blob-type': 'BlockBlob', 'content-type': input.contentType },
    };
  }

  publicUrl(blobPath: string): string {
    return `https://${this.config.account}.blob.core.windows.net/${this.config.container}/${blobPath}`;
  }

  /** Builds a signed Service SAS query string for write+create on one blob. */
  private signBlobSas(blobPath: string, start: Date, expiry: Date): string {
    const permissions = 'cw'; // create, write
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
