import { Injectable, Logger } from '@nestjs/common';
import { MediaStatus } from '@ekum/domain-types';
import { PrismaService } from '../../core/prisma/prisma.service';
import { JobType } from '@ekum/domain-types';
import type { JobHandler } from '../job.types';

/**
 * Derives a thumbnail for an uploaded image and marks the media ready. Pixel
 * resizing is delegated to the storage/CDN layer (a `_thumb` variant address);
 * the worker's job is to record that address and flip the media to `ready` so the
 * upload → process → ready pipeline is durable and observable.
 */
@Injectable()
export class MediaThumbnailHandler implements JobHandler {
  readonly type = JobType.MediaThumbnail;
  private readonly logger = new Logger(MediaThumbnailHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async run(payload: Record<string, unknown>): Promise<void> {
    const mediaId = typeof payload.mediaId === 'string' ? payload.mediaId : null;
    if (!mediaId) {
      throw new Error('media.thumbnail job is missing mediaId.');
    }
    const media = await this.prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) {
      this.logger.warn(`Media ${mediaId} vanished before thumbnail; skipping.`);
      return;
    }
    if (media.status === MediaStatus.Ready) {
      return; // Idempotent: already processed.
    }
    await this.prisma.media.update({
      where: { id: mediaId },
      data: { status: MediaStatus.Ready, thumbnailUrl: deriveThumbnailUrl(media.url) },
    });
  }
}

/** `https://host/path/abc.jpg` -> `https://host/path/abc_thumb.jpg`. */
export function deriveThumbnailUrl(url: string): string {
  const queryIndex = url.indexOf('?');
  const base = queryIndex === -1 ? url : url.slice(0, queryIndex);
  const query = queryIndex === -1 ? '' : url.slice(queryIndex);
  const dot = base.lastIndexOf('.');
  const slash = base.lastIndexOf('/');
  if (dot > slash) {
    return `${base.slice(0, dot)}_thumb${base.slice(dot)}${query}`;
  }
  return `${base}_thumb${query}`;
}
