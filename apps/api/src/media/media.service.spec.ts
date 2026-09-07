import { describe, expect, it, vi } from 'vitest';
import { JobType, MediaKind, MediaStatus } from '@ekum/domain-types';
import { MediaService } from './media.service';
import type { PrismaService } from '../core/prisma/prisma.service';
import type { ConfigService } from '@nestjs/config';
import type { Env } from '../core/config/config.schema';
import type { JobQueue } from '../jobs/job-queue.service';
import type { StorageDriver } from './storage/storage.types';

function makeService() {
  const created: { data?: Record<string, unknown> } = {};
  const prisma = {
    media: {
      create: async (args: { data: Record<string, unknown> }) => {
        created.data = args.data;
        return { id: 'm1' };
      },
      findUnique: async () => ({
        id: 'm1',
        companyId: 'c1',
        status: MediaStatus.Pending,
        kind: MediaKind.Image,
        contentType: 'image/jpeg',
        url: 'https://host/c1/x.jpg',
        thumbnailUrl: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
      update: async () => undefined,
    },
  } as unknown as PrismaService;
  const config = { get: () => '10m' } as unknown as ConfigService<Env, true>;
  const enqueue = vi.fn(async () => 'job-1');
  const jobs = { enqueue } as unknown as JobQueue;
  const storage = {
    createUploadTarget: () => ({
      uploadUrl: 'https://host/c1/x.jpg?sig=abc',
      method: 'PUT' as const,
      headers: { 'content-type': 'image/jpeg' },
    }),
    publicUrl: () => 'https://host/c1/x.jpg',
  } as unknown as StorageDriver;
  return { service: new MediaService(prisma, config, jobs, storage), created, enqueue };
}

describe('MediaService.createUploadUrl', () => {
  it('records a pending media row and returns an upload ticket', async () => {
    const { service, created } = makeService();
    const ticket = await service.createUploadUrl('c1', 'u1', {
      kind: MediaKind.Image,
      contentType: 'image/jpeg',
    });
    expect(ticket.mediaId).toBe('m1');
    expect(ticket.method).toBe('PUT');
    expect(ticket.uploadUrl).toContain('sig=');
    expect(ticket.blobUrl).toBe('https://host/c1/x.jpg');
    expect(created.data).toMatchObject({ companyId: 'c1', status: MediaStatus.Pending });
    // The blob path must be namespaced under the company id.
    expect(String(created.data?.blobPath)).toMatch(/^c1\//);
  });
});

describe('MediaService.complete', () => {
  it('enqueues thumbnail derivation for the uploaded media', async () => {
    const { service, enqueue } = makeService();
    const view = await service.complete('c1', 'm1');
    expect(enqueue).toHaveBeenCalledWith(JobType.MediaThumbnail, { mediaId: 'm1' });
    expect(view.id).toBe('m1');
  });

  it('marks audio ready without thumbnail job', async () => {
    const created: { data?: Record<string, unknown> } = {};
    const update = vi.fn(async () => undefined);
    const prisma = {
      media: {
        create: async (args: { data: Record<string, unknown> }) => {
          created.data = args.data;
          return { id: 'a1' };
        },
        findUnique: async () => ({
          id: 'a1',
          companyId: 'c1',
          status: MediaStatus.Pending,
          kind: MediaKind.Audio,
          contentType: 'audio/webm',
          url: 'https://host/c1/a.webm',
          thumbnailUrl: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        }),
        update,
      },
    } as unknown as PrismaService;
    const config = { get: () => '10m' } as unknown as ConfigService<Env, true>;
    const enqueue = vi.fn(async () => 'job-1');
    const jobs = { enqueue } as unknown as JobQueue;
    const storage = {
      createUploadTarget: () => ({
        uploadUrl: 'https://host/c1/a.webm?sig=abc',
        method: 'PUT' as const,
        headers: { 'content-type': 'audio/webm' },
      }),
      publicUrl: () => 'https://host/c1/a.webm',
    } as unknown as StorageDriver;
    const service = new MediaService(prisma, config, jobs, storage);
    await service.complete('c1', 'a1');
    expect(enqueue).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: MediaStatus.Ready }),
      }),
    );
    void created;
  });
});
