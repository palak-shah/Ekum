import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Media } from '@prisma/client';
import {
  JobType,
  MediaStatus,
  type CreateUploadUrlDto,
  type MediaView,
  type UploadTicket,
} from '@ekum/domain-types';
import type { Env } from '../core/config/config.schema';
import { PrismaService } from '../core/prisma/prisma.service';
import { JobQueue } from '../jobs/job-queue.service';
import { parseDurationMs, randomToken } from '../common/crypto.util';
import { STORAGE_DRIVER, type StorageDriver } from './storage/storage.types';

const EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
    private readonly jobs: JobQueue,
    @Inject(STORAGE_DRIVER) private readonly storage: StorageDriver,
  ) {}

  /**
   * Mints a scoped, expiring upload ticket and records a `pending` media row. The
   * blob path is namespaced by company so one tenant can never address another's
   * objects.
   */
  async createUploadUrl(
    companyId: string,
    userId: string,
    dto: CreateUploadUrlDto,
  ): Promise<UploadTicket> {
    const ttlMs = parseDurationMs(this.config.get('MEDIA_UPLOAD_TTL', { infer: true }));
    const extension = EXTENSION[dto.contentType] ?? 'bin';
    const blobPath = `${companyId}/${randomToken(12)}.${extension}`;
    const target = this.storage.createUploadTarget({
      blobPath,
      contentType: dto.contentType,
      ttlMs,
    });
    const url = this.storage.publicUrl(blobPath);

    const media = await this.prisma.media.create({
      data: {
        companyId,
        uploaderId: userId,
        kind: dto.kind,
        status: MediaStatus.Pending,
        contentType: dto.contentType,
        blobPath,
        url,
        sizeBytes: dto.sizeBytes ?? null,
      },
      select: { id: true },
    });

    return {
      mediaId: media.id,
      uploadUrl: target.uploadUrl,
      method: target.method,
      headers: target.headers,
      blobUrl: url,
      expiresAt: new Date(Date.now() + ttlMs).toISOString(),
    };
  }

  /** Confirms the client finished uploading and enqueues thumbnail derivation. */
  async complete(companyId: string, mediaId: string): Promise<MediaView> {
    const media = await this.owned(companyId, mediaId);
    if (media.status === MediaStatus.Pending) {
      await this.prisma.media.update({
        where: { id: mediaId },
        data: { status: MediaStatus.Uploaded },
      });
    }
    await this.jobs.enqueue(JobType.MediaThumbnail, { mediaId });
    return this.get(companyId, mediaId);
  }

  async get(companyId: string, mediaId: string): Promise<MediaView> {
    const media = await this.owned(companyId, mediaId);
    return this.toView(media);
  }

  private async owned(companyId: string, mediaId: string): Promise<Media> {
    const media = await this.prisma.media.findUnique({ where: { id: mediaId } });
    if (!media || media.companyId !== companyId) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Media not found.' });
    }
    return media;
  }

  private toView(media: Media): MediaView {
    return {
      id: media.id,
      kind: media.kind,
      status: media.status,
      contentType: media.contentType,
      url: media.url,
      thumbnailUrl: media.thumbnailUrl,
      createdAt: media.createdAt.toISOString(),
    };
  }
}
