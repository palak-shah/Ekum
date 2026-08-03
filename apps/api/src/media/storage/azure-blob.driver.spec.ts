import { describe, expect, it } from 'vitest';
import { AzureBlobDriver } from './azure-blob.driver';

const driver = new AzureBlobDriver({
  account: 'ekumdev',
  // A throwaway base64 key; only used to exercise the signing path.
  accountKey: Buffer.from('test-signing-key').toString('base64'),
  container: 'media',
});

describe('AzureBlobDriver', () => {
  it('builds the canonical public blob URL', () => {
    expect(driver.publicUrl('c1/abc.jpg')).toBe(
      'https://ekumdev.blob.core.windows.net/media/c1/abc.jpg',
    );
  });

  it('mints a write SAS upload target with the required query params', () => {
    const target = driver.createUploadTarget({
      blobPath: 'c1/abc.jpg',
      contentType: 'image/jpeg',
      ttlMs: 600_000,
    });
    expect(target.method).toBe('PUT');
    expect(target.headers['x-ms-blob-type']).toBe('BlockBlob');

    const url = new URL(target.uploadUrl);
    expect(url.origin).toBe('https://ekumdev.blob.core.windows.net');
    // Service SAS essentials: signed permissions, expiry, resource, version, signature.
    expect(url.searchParams.get('sp')).toBe('cw');
    expect(url.searchParams.get('sr')).toBe('b');
    expect(url.searchParams.get('sv')).toBeTruthy();
    expect(url.searchParams.get('se')).toBeTruthy();
    expect(url.searchParams.get('sig')).toBeTruthy();
  });
});
