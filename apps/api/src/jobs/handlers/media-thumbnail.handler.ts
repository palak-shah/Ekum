import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  MEDIA_VARIANT,
  MediaKind,
  MediaStatus,
  mediaVariantBlobPath,
  originalBlobCandidates,
} from '@ekum/domain-types';
import { JobType } from '@ekum/domain-types';
import type { JobHandler } from '../job.types';
import { PrismaService } from '../../core/prisma/prisma.service';
import { deriveImageVariants } from '../../media/derive-image-variants';
import { STORAGE_DRIVER, type StorageDriver } from '../../media/storage/storage.types';

const VARIANT_CACHE_CONTROL = 'public, max-age=86400';

/**
 * Reads the original image, writes WebP siblings (thumbnail1 ≤480, thumbnail2 ≤1080),
 * and marks Media ready. Idempotent when both variant blobs already exist.
 */
@Injectable()
export class MediaThumbnailHandler implements JobHandler {
  readonly type = JobType.MediaThumbnail;
  private readonly logger = new Logger(MediaThumbnailHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_DRIVER) private readonly storage: StorageDriver,
  ) {}

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
    if (media.kind !== MediaKind.Image) {
      return;
    }

    const thumb1Path = mediaVariantBlobPath(media.blobPath, MEDIA_VARIANT.Thumbnail1);
    const thumb2Path = mediaVariantBlobPath(media.blobPath, MEDIA_VARIANT.Thumbnail2);
    if (!thumb1Path || !thumb2Path) {
      throw new Error(`Cannot derive thumbnail paths for ${media.blobPath}.`);
    }

    const [has1, has2] = await Promise.all([
      this.storage.exists(thumb1Path),
      this.storage.exists(thumb2Path),
    ]);
    if (has1 && has2) {
      await this.prisma.media.update({
        where: { id: mediaId },
        data: { status: MediaStatus.Ready, thumbnailUrl: this.storage.publicUrl(thumb1Path) },
      });
      return;
    }

    let original: Buffer | null = null;
    for (const candidate of originalBlobCandidates(media.blobPath)) {
      original = await this.storage.getObject(candidate);
      if (original) break;
    }
    if (!original) {
      throw new Error(`Original image missing for media ${mediaId}.`);
    }

    const variants = await deriveImageVariants(original);
    await this.storage.putObject({
      blobPath: thumb1Path,
      body: variants.thumbnail1,
      contentType: 'image/webp',
      cacheControl: VARIANT_CACHE_CONTROL,
    });
    await this.storage.putObject({
      blobPath: thumb2Path,
      body: variants.thumbnail2,
      contentType: 'image/webp',
      cacheControl: VARIANT_CACHE_CONTROL,
    });

    await this.prisma.media.update({
      where: { id: mediaId },
      data: { status: MediaStatus.Ready, thumbnailUrl: this.storage.publicUrl(thumb1Path) },
    });
  }
}

export { deriveImageVariants } from '../../media/derive-image-variants';
