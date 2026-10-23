import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LocalStorageDriver } from './local-storage.driver';

describe('LocalStorageDriver object IO', () => {
  it('puts, gets, and reports exists for nested original keys', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ekum-store-'));
    try {
      const driver = new LocalStorageDriver('http://127.0.0.1:3000/media', dir);
      const body = Buffer.from('hello-photo');
      await driver.putObject({
        blobPath: 'c1/original/a.jpg',
        body,
        contentType: 'image/jpeg',
      });
      expect(await driver.exists('c1/original/a.jpg')).toBe(true);
      expect(await driver.getObject('c1/original/a.jpg')).toEqual(body);
      expect(await driver.getObject('c1/missing.jpg')).toBeNull();
      expect(driver.publicUrl('c1/original/a.jpg')).toBe(
        'http://127.0.0.1:3000/media/c1/original/a.jpg',
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('refuses paths that escape the media root', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ekum-store-'));
    try {
      const driver = new LocalStorageDriver('http://127.0.0.1:3000/media', dir);
      await expect(
        driver.putObject({
          blobPath: '../secret.jpg',
          body: Buffer.from('x'),
          contentType: 'image/jpeg',
        }),
      ).rejects.toThrow(/Invalid media path/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
