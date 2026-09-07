import type { CreateUploadUrlDto, UploadTicket } from '@ekum/domain-types';
import { MediaKind } from '@ekum/domain-types';
import { api, ApiError } from './apiClient';
import { normalizeAudioContentType, VOICE_MAX_BYTES } from '@/features/voice/voiceCaps';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp']);

function normalizeContentType(file: File): CreateUploadUrlDto['contentType'] {
  if (file.type === 'image/jpg' || file.type === 'image/jpeg') {
    return 'image/jpeg';
  }
  if (file.type === 'image/png') {
    return 'image/png';
  }
  if (file.type === 'image/webp') {
    return 'image/webp';
  }
  // Some browsers leave type empty for camera captures — assume jpeg.
  if (!file.type || file.type === 'image/*') {
    return 'image/jpeg';
  }
  throw new ApiError({
    statusCode: 400,
    code: 'UNSUPPORTED_TYPE',
    message: 'Use a JPEG, PNG, or WebP photo.',
    details: null,
  });
}

/**
 * Direct-to-blob upload: mint ticket → PUT bytes → complete → stable URL.
 */
export async function uploadImage(file: File): Promise<string> {
  if (!ALLOWED.has(file.type) && file.type && file.type !== 'image/*') {
    throw new ApiError({
      statusCode: 400,
      code: 'UNSUPPORTED_TYPE',
      message: 'Use a JPEG, PNG, or WebP photo.',
      details: null,
    });
  }

  const contentType = normalizeContentType(file);
  const ticket = await api.post<UploadTicket>('/media/upload-url', {
    kind: MediaKind.Image,
    contentType,
    sizeBytes: file.size,
  } satisfies CreateUploadUrlDto);

  const put = await fetch(ticket.uploadUrl, {
    method: ticket.method,
    headers: ticket.headers,
    body: file,
  });
  if (!put.ok) {
    throw new ApiError({
      statusCode: put.status,
      code: 'UPLOAD_FAILED',
      message: 'Could not upload the photo. Try again.',
      details: null,
    });
  }

  await api.post(`/media/${ticket.mediaId}/complete`, {});
  return ticket.blobUrl;
}

export type UploadedAudio = {
  mediaId: string;
  url: string;
};

/** Direct-to-blob audio upload for voice messages / order notes. */
export async function uploadAudio(blob: Blob): Promise<UploadedAudio> {
  if (blob.size > VOICE_MAX_BYTES) {
    throw new ApiError({
      statusCode: 400,
      code: 'VOICE_TOO_LARGE',
      message: 'Voice is too long. Keep it under 2 minutes.',
      details: null,
    });
  }
  const contentType = normalizeAudioContentType(blob.type || 'audio/webm');
  const ticket = await api.post<UploadTicket>('/media/upload-url', {
    kind: MediaKind.Audio,
    contentType,
    sizeBytes: blob.size,
  } satisfies CreateUploadUrlDto);

  const put = await fetch(ticket.uploadUrl, {
    method: ticket.method,
    headers: ticket.headers,
    body: blob,
  });
  if (!put.ok) {
    throw new ApiError({
      statusCode: put.status,
      code: 'UPLOAD_FAILED',
      message: 'Could not upload the voice. Try again.',
      details: null,
    });
  }

  await api.post(`/media/${ticket.mediaId}/complete`, {});
  return { mediaId: ticket.mediaId, url: ticket.blobUrl };
}

/** Phone / coarse-pointer device — prefer camera capture. */
export function isPhoneLike(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const narrow = window.matchMedia('(max-width: 768px)').matches;
  const mobileUa = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  return (coarse && narrow) || mobileUa;
}
