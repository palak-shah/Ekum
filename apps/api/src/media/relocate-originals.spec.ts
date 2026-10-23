import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { relocateOriginalUrl } from '@ekum/domain-types';
import {
  copyOriginalVerified,
  listLegacyCompanyImageBlobPaths,
  relocateOriginals,
  sha256Hex,
} from './relocate-originals';
import { LocalStorageDriver } from './storage/local-storage.driver';

function emptyPrisma() {
  const findMany = async () => [];
  return {
    media: { findMany },
    product: { findMany },
    collection: { findMany },
    company: { findMany },
    thread: { findMany },
    orderItem: { findMany },
    order: { findMany },
    orderCompanyNote: { findMany },
    orderTrailEvent: { findMany },
    orderShipmentLeg: { findMany },
    complaint: { findMany },
    message: { findMany },
  } as never;
}

describe('copyOriginalVerified', () => {
  it('copies then verifies destination bytes match the source', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ekum-reloc-'));
    try {
      const storage = new LocalStorageDriver('http://127.0.0.1:3000/media', dir);
      const body = Buffer.from('original-bytes');
      await storage.putObject({
        blobPath: 'c1/a.jpg',
        body,
        contentType: 'image/jpeg',
      });
      expect(await copyOriginalVerified(storage, 'c1/a.jpg', 'c1/original/a.jpg', true)).toBe(
        'would-copy',
      );
      expect(await copyOriginalVerified(storage, 'c1/a.jpg', 'c1/original/a.jpg', false)).toBe(
        'copied',
      );
      const dest = await storage.getObject('c1/original/a.jpg');
      expect(dest && sha256Hex(dest)).toBe(sha256Hex(body));
      expect(await storage.getObject('c1/a.jpg')).toEqual(body);
      expect(await copyOriginalVerified(storage, 'c1/a.jpg', 'c1/original/a.jpg', false)).toBe(
        'already',
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('reports missing source without writing', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ekum-reloc-'));
    try {
      const storage = new LocalStorageDriver('http://127.0.0.1:3000/media', dir);
      expect(await copyOriginalVerified(storage, 'c1/gone.jpg', 'c1/original/gone.jpg', false)).toBe(
        'missing-source',
      );
      expect(await storage.exists('c1/original/gone.jpg')).toBe(false);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('relocateOriginalUrl samples', () => {
  it('shows the before/after operators will see in dry-run', () => {
    expect(relocateOriginalUrl('http://localhost:8080/media/c1/photo.jpg')).toBe(
      'http://localhost:8080/media/c1/original/photo.jpg',
    );
  });
});

describe('listLegacyCompanyImageBlobPaths', () => {
  it('lists leftover company images and skips seed, thumbs, and audio', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ekum-legacy-scan-'));
    try {
      await mkdir(join(dir, 'c1', 'thumbnail1'), { recursive: true });
      await mkdir(join(dir, 'c1', 'original'), { recursive: true });
      await mkdir(join(dir, 'seed'), { recursive: true });
      await writeFile(join(dir, 'c1', 'orphan.jpg'), 'orphan');
      await writeFile(join(dir, 'c1', 'clip.webm'), 'audio');
      await writeFile(join(dir, 'c1', 'thumbnail1', 'a.webp'), 'thumb');
      await writeFile(join(dir, 'c1', 'original', 'already.jpg'), 'in-place');
      await writeFile(join(dir, 'seed', 'kanjee.jpg'), 'seed');
      expect(await listLegacyCompanyImageBlobPaths(dir)).toEqual(['c1/orphan.jpg']);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('relocateOriginals leftover disk', () => {
  it('copies an orphan jpg into original/ with no Media row', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ekum-reloc-orphan-'));
    try {
      const storage = new LocalStorageDriver('http://127.0.0.1:3000/media', dir);
      await storage.putObject({
        blobPath: 'c1/orphan.jpg',
        body: Buffer.from('orphan-bytes'),
        contentType: 'image/jpeg',
      });
      const dry = await relocateOriginals({
        prisma: emptyPrisma(),
        storage,
        apply: false,
        mediaRoot: dir,
      });
      expect(dry.copied).toBe(1);
      expect(await storage.exists('c1/original/orphan.jpg')).toBe(false);

      const applied = await relocateOriginals({
        prisma: emptyPrisma(),
        storage,
        apply: true,
        mediaRoot: dir,
      });
      expect(applied.copied).toBe(1);
      expect(await storage.getObject('c1/original/orphan.jpg')).toEqual(Buffer.from('orphan-bytes'));
      expect(await storage.getObject('c1/orphan.jpg')).toEqual(Buffer.from('orphan-bytes'));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
