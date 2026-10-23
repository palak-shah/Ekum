import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { MediaKind, MediaStatus } from '@ekum/domain-types';
import type { PrismaService } from '../../core/prisma/prisma.service';
import { LocalStorageDriver } from '../../media/storage/local-storage.driver';
import {
  deriveImageVariants,
  MediaThumbnailHandler,
} from './media-thumbnail.handler';

async function jpeg(width: number, height: number): Promise<Buffer> {
  const sharp = (await import('sharp')).default;
  return sharp({
    create: { width, height, channels: 3, background: { r: 180, g: 40, b: 40 } },
  })
    .jpeg()
    .toBuffer();
}

describe('deriveImageVariants', () => {
  it('fits a landscape original inside 480 and 1080 without cropping', async () => {
    const variants = await deriveImageVariants(await jpeg(800, 600));
    const sharp = (await import('sharp')).default;
    const t1 = await sharp(variants.thumbnail1).metadata();
    const t2 = await sharp(variants.thumbnail2).metadata();
    expect(t1.format).toBe('webp');
    expect(t1.width).toBe(480);
    expect(t1.height).toBe(360);
    expect(t2.format).toBe('webp');
    expect(t2.width).toBe(800);
    expect(t2.height).toBe(600);
  });

  it('fits a portrait original and does not enlarge small images', async () => {
    const sharp = (await import('sharp')).default;
    const tall = await deriveImageVariants(await jpeg(400, 800));
    const t1 = await sharp(tall.thumbnail1).metadata();
    expect(t1.width).toBe(240);
    expect(t1.height).toBe(480);

    const tiny = await deriveImageVariants(await jpeg(120, 80));
    const small = await sharp(tiny.thumbnail1).metadata();
    expect(small.width).toBe(120);
    expect(small.height).toBe(80);
  });

  it('rejects garbage bytes', async () => {
    await expect(deriveImageVariants(Buffer.from('not-an-image'))).rejects.toThrow();
  });
});

describe('MediaThumbnailHandler', () => {
  it('writes both WebP variants and marks media ready', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ekum-thumb-'));
    try {
      const storage = new LocalStorageDriver('http://127.0.0.1:3000/media', dir);
      await storage.putObject({
        blobPath: 'c1/original/x.jpg',
        body: await jpeg(640, 480),
        contentType: 'image/jpeg',
      });
      const update = vi.fn(async () => undefined);
      const prisma = {
        media: {
          findUnique: async () => ({
            id: 'm1',
            status: MediaStatus.Uploaded,
            kind: MediaKind.Image,
            blobPath: 'c1/original/x.jpg',
            url: 'http://127.0.0.1:3000/media/c1/original/x.jpg',
          }),
          update,
        },
      } as unknown as PrismaService;
      await new MediaThumbnailHandler(prisma, storage).run({ mediaId: 'm1' });
      expect(await storage.exists('c1/thumbnail1/x.webp')).toBe(true);
      expect(await storage.exists('c1/thumbnail2/x.webp')).toBe(true);
      expect(update).toHaveBeenCalledWith({
        where: { id: 'm1' },
        data: {
          status: MediaStatus.Ready,
          thumbnailUrl: 'http://127.0.0.1:3000/media/c1/thumbnail1/x.webp',
        },
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('is idempotent when both variants already exist, including ready+_thumb rows', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ekum-thumb-'));
    try {
      const storage = new LocalStorageDriver('http://127.0.0.1:3000/media', dir);
      const body = Buffer.from('webp-stub');
      await storage.putObject({
        blobPath: 'c1/thumbnail1/x.webp',
        body,
        contentType: 'image/webp',
      });
      await storage.putObject({
        blobPath: 'c1/thumbnail2/x.webp',
        body,
        contentType: 'image/webp',
      });
      const update = vi.fn(async () => undefined);
      const prisma = {
        media: {
          findUnique: async () => ({
            id: 'm1',
            status: MediaStatus.Ready,
            kind: MediaKind.Image,
            blobPath: 'c1/x.jpg',
            url: 'http://host/c1/x.jpg',
            thumbnailUrl: 'http://host/c1/x_thumb.jpg',
          }),
          update,
        },
      } as unknown as PrismaService;
      await new MediaThumbnailHandler(prisma, storage).run({ mediaId: 'm1' });
      expect(update).toHaveBeenCalledWith({
        where: { id: 'm1' },
        data: {
          status: MediaStatus.Ready,
          thumbnailUrl: 'http://127.0.0.1:3000/media/c1/thumbnail1/x.webp',
        },
      });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('reads a legacy flat original when blobPath is still pre-relocate', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ekum-thumb-'));
    try {
      const storage = new LocalStorageDriver('http://127.0.0.1:3000/media', dir);
      await storage.putObject({
        blobPath: 'c1/x.jpg',
        body: await jpeg(200, 200),
        contentType: 'image/jpeg',
      });
      const update = vi.fn(async () => undefined);
      const prisma = {
        media: {
          findUnique: async () => ({
            id: 'm1',
            status: MediaStatus.Uploaded,
            kind: MediaKind.Image,
            blobPath: 'c1/x.jpg',
            url: 'http://127.0.0.1:3000/media/c1/x.jpg',
          }),
          update,
        },
      } as unknown as PrismaService;
      await new MediaThumbnailHandler(prisma, storage).run({ mediaId: 'm1' });
      expect(await storage.exists('c1/thumbnail1/x.webp')).toBe(true);
      expect(update).toHaveBeenCalled();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('throws when the payload has no mediaId', async () => {
    const storage = new LocalStorageDriver('http://x/media');
    const prisma = { media: {} } as unknown as PrismaService;
    await expect(new MediaThumbnailHandler(prisma, storage).run({})).rejects.toThrow();
  });
});
