import { describe, expect, it, vi } from 'vitest';
import { MediaThumbnailHandler, deriveThumbnailUrl } from './media-thumbnail.handler';
import type { PrismaService } from '../../core/prisma/prisma.service';

describe('deriveThumbnailUrl', () => {
  it('inserts _thumb before the extension', () => {
    expect(deriveThumbnailUrl('https://host/c1/abc.jpg')).toBe('https://host/c1/abc_thumb.jpg');
  });

  it('preserves a query string', () => {
    expect(deriveThumbnailUrl('https://host/c1/abc.png?x=1')).toBe(
      'https://host/c1/abc_thumb.png?x=1',
    );
  });

  it('appends _thumb when there is no extension', () => {
    expect(deriveThumbnailUrl('https://host/c1/abc')).toBe('https://host/c1/abc_thumb');
  });
});

describe('MediaThumbnailHandler', () => {
  it('marks the media ready with a derived thumbnail', async () => {
    const update = vi.fn(async () => undefined);
    const prisma = {
      media: {
        findUnique: async () => ({ id: 'm1', status: 'uploaded', url: 'https://host/c1/x.jpg' }),
        update,
      },
    } as unknown as PrismaService;
    await new MediaThumbnailHandler(prisma).run({ mediaId: 'm1' });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { status: 'ready', thumbnailUrl: 'https://host/c1/x_thumb.jpg' },
    });
  });

  it('is idempotent when the media is already ready', async () => {
    const update = vi.fn(async () => undefined);
    const prisma = {
      media: { findUnique: async () => ({ id: 'm1', status: 'ready', url: 'x' }), update },
    } as unknown as PrismaService;
    await new MediaThumbnailHandler(prisma).run({ mediaId: 'm1' });
    expect(update).not.toHaveBeenCalled();
  });

  it('throws when the payload has no mediaId', async () => {
    const prisma = { media: {} } as unknown as PrismaService;
    await expect(new MediaThumbnailHandler(prisma).run({})).rejects.toThrow();
  });
});
