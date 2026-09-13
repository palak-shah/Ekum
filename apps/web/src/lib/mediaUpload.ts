import type { CreateUploadUrlDto, UploadTicket } from '@ekum/domain-types';
import { MediaKind } from '@ekum/domain-types';
import { api, ApiError } from './apiClient';
import { toAbsoluteMediaUrl } from './mediaUrl';
import { VOICE_MAX_BYTES, withSniffedAudioType } from '@/features/voice/voiceCaps';

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

  // Local driver often mints http://LAN:8081/media/… — PUT that from https://beta
  // is blocked as mixed content. Rewrite same-path media onto the page origin.
  const uploadUrl = toAbsoluteMediaUrl(ticket.uploadUrl);
  const put = await fetch(uploadUrl, {
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
  return toAbsoluteMediaUrl(ticket.blobUrl);
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
  // Sniff container bytes — empty blob.type + "default webm" used to store
  // Safari AAC/MP4 as .webm, which plays as unrecognizable noise.
  const { blob: typedBlob, contentType } = await withSniffedAudioType(blob);
  const ticket = await api.post<UploadTicket>('/media/upload-url', {
    kind: MediaKind.Audio,
    contentType,
    sizeBytes: typedBlob.size,
  } satisfies CreateUploadUrlDto);

  const uploadUrl = toAbsoluteMediaUrl(ticket.uploadUrl);
  const put = await fetch(uploadUrl, {
    method: ticket.method,
    headers: ticket.headers,
    body: typedBlob,
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
  return { mediaId: ticket.mediaId, url: toAbsoluteMediaUrl(ticket.blobUrl) };
}

const DOCUMENT_MAX_BYTES = 15 * 1024 * 1024;

const DOCUMENT_MIME_BY_EXT: Record<string, CreateUploadUrlDto['contentType']> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  txt: 'text/plain',
};

const DOCUMENT_MIME = new Set(Object.values(DOCUMENT_MIME_BY_EXT));

export type ClassifiedChatDocument =
  | { kind: 'image'; contentType: 'image/jpeg' | 'image/png' | 'image/webp' }
  | { kind: 'document'; contentType: CreateUploadUrlDto['contentType'] };

/** Classify a Document-row pick (office or original photo). Rejects video and unknowns. */
export function classifyChatDocumentFile(file: File): ClassifiedChatDocument | null {
  const mime = (file.type || '').toLowerCase();
  const ext = file.name.includes('.')
    ? file.name.slice(file.name.lastIndexOf('.') + 1).toLowerCase()
    : '';

  if (
    mime === 'image/jpeg' ||
    mime === 'image/jpg' ||
    mime === 'image/png' ||
    mime === 'image/webp' ||
    ['jpg', 'jpeg', 'png', 'webp'].includes(ext)
  ) {
    const contentType =
      mime === 'image/png' || ext === 'png'
        ? 'image/png'
        : mime === 'image/webp' || ext === 'webp'
          ? 'image/webp'
          : 'image/jpeg';
    return { kind: 'image', contentType };
  }

  if (DOCUMENT_MIME.has(mime as CreateUploadUrlDto['contentType'])) {
    return { kind: 'document', contentType: mime as CreateUploadUrlDto['contentType'] };
  }
  const fromExt = DOCUMENT_MIME_BY_EXT[ext];
  if (fromExt) {
    return { kind: 'document', contentType: fromExt };
  }
  return null;
}

export type UploadedDocument = {
  url: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
};

/** Office/text document upload for chat Document messages. */
export async function uploadDocument(file: File): Promise<UploadedDocument> {
  if (file.size > DOCUMENT_MAX_BYTES) {
    throw new ApiError({
      statusCode: 400,
      code: 'FILE_TOO_LARGE',
      message: 'Keep each file under 15 MB.',
      details: null,
    });
  }
  const classified = classifyChatDocumentFile(file);
  if (!classified || classified.kind !== 'document') {
    throw new ApiError({
      statusCode: 400,
      code: 'UNSUPPORTED_TYPE',
      message: 'Use a PDF, Word, Excel, text, or photo file.',
      details: null,
    });
  }

  const ticket = await api.post<UploadTicket>('/media/upload-url', {
    kind: MediaKind.Document,
    contentType: classified.contentType,
    sizeBytes: file.size,
  } satisfies CreateUploadUrlDto);

  const uploadUrl = toAbsoluteMediaUrl(ticket.uploadUrl);
  const put = await fetch(uploadUrl, {
    method: ticket.method,
    headers: ticket.headers,
    body: file,
  });
  if (!put.ok) {
    throw new ApiError({
      statusCode: put.status,
      code: 'UPLOAD_FAILED',
      message: 'Could not upload the file. Try again.',
      details: null,
    });
  }

  await api.post(`/media/${ticket.mediaId}/complete`, {});
  return {
    url: toAbsoluteMediaUrl(ticket.blobUrl),
    fileName: file.name.trim() || 'Document',
    contentType: classified.contentType,
    sizeBytes: file.size,
  };
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
