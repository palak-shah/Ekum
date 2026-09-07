import { z } from 'zod';
import { MediaKind, mediaKindValues } from './enums';

/**
 * Media contracts. Uploads are direct-to-blob: the client asks the API for a
 * short-lived, scoped upload ticket, PUTs the bytes straight to storage, then
 * confirms. Images get a thumbnail worker; audio is marked ready on complete.
 */

export const imageContentTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const audioContentTypes = ['audio/webm', 'audio/mp4', 'audio/mpeg'] as const;

const uploadContentTypes = [...imageContentTypes, ...audioContentTypes] as const;

export const createUploadUrlSchema = z
  .object({
    kind: z.enum(mediaKindValues).default(MediaKind.Image),
    contentType: z.enum(uploadContentTypes),
    // Bytes; enforced again by storage. 15MB ceiling keeps "old Android on 3G" sane.
    sizeBytes: z.number().int().positive().max(15 * 1024 * 1024).optional(),
  })
  .superRefine((value, ctx) => {
    const isImage = (imageContentTypes as readonly string[]).includes(value.contentType);
    const isAudio = (audioContentTypes as readonly string[]).includes(value.contentType);
    if (value.kind === MediaKind.Image && !isImage) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Image uploads need JPEG, PNG, or WebP.',
        path: ['contentType'],
      });
    }
    if (value.kind === MediaKind.Audio && !isAudio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Voice uploads need WebM, MP4, or MPEG audio.',
        path: ['contentType'],
      });
    }
  });
export type CreateUploadUrlDto = z.infer<typeof createUploadUrlSchema>;

/**
 * A one-time upload ticket. The client PUTs the raw bytes to `uploadUrl` with the
 * given `method` and `headers`, then calls the complete endpoint with `mediaId`.
 */
export interface UploadTicket {
  mediaId: string;
  uploadUrl: string;
  method: 'PUT';
  headers: Record<string, string>;
  /** The stable URL the bytes will be readable at once uploaded. */
  blobUrl: string;
  expiresAt: string;
}

export interface MediaView {
  id: string;
  kind: string;
  status: string;
  contentType: string;
  url: string;
  thumbnailUrl: string | null;
  createdAt: string;
}
