import { VOICE_MAX_DURATION_MS } from '@ekum/domain-types';

export { VOICE_MAX_DURATION_MS };

/** Soft size ceiling for a ~2 min clip (bytes). */
export const VOICE_MAX_BYTES = 5 * 1024 * 1024;

/** Ignore accidental taps — must hold at least this long. */
export const MIN_VOICE_DURATION_MS = 500;

/** Reject empty/corrupt blobs; real AAC/webm frames are larger once duration passes. */
export const MIN_VOICE_BYTES = 64;

export type AudioContentType = 'audio/webm' | 'audio/mp4' | 'audio/mpeg';

export function isUsableVoiceClip(input: { durationMs: number; sizeBytes: number }): boolean {
  if (input.durationMs < MIN_VOICE_DURATION_MS) return false;
  if (input.sizeBytes < 1) return false;
  // Very short clock + tiny blob = tap / failed flush (Safari).
  if (input.sizeBytes < MIN_VOICE_BYTES && input.durationMs < MIN_VOICE_DURATION_MS * 2) {
    return false;
  }
  return true;
}

export function formatVoiceDuration(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function isAppleMediaRecorderHost(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);
}

/**
 * Pick a MediaRecorder MIME the browser actually supports.
 * Apple hosts prefer mp4/AAC so stored clips play back on Safari;
 * never return webm when it is unsupported (that forced wrong Content-Type).
 */
export function pickAudioMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return undefined;
  }
  const appleFirst = ['audio/mp4', 'audio/aac', 'audio/webm;codecs=opus', 'audio/webm'];
  const othersFirst = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac'];
  for (const type of isAppleMediaRecorderHost() ? appleFirst : othersFirst) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return undefined;
}

export function normalizeAudioContentType(mime: string): AudioContentType {
  const lower = mime.toLowerCase();
  if (lower.includes('mp4') || lower.includes('m4a') || lower.includes('aac')) return 'audio/mp4';
  if (lower.includes('mpeg') || lower.includes('mp3')) return 'audio/mpeg';
  if (lower.includes('webm')) return 'audio/webm';
  return isAppleMediaRecorderHost() ? 'audio/mp4' : 'audio/webm';
}

/**
 * Read container magic bytes so we never store AAC-in-MP4 as `.webm`
 * (plays as noise / “unrecognizable” speech).
 */
export async function sniffAudioContentType(blob: Blob): Promise<AudioContentType> {
  const head = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
  // EBML / WebM
  if (head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3) {
    return 'audio/webm';
  }
  // ISO BMFF (mp4 / m4a): ....ftyp
  if (head[4] === 0x66 && head[5] === 0x74 && head[6] === 0x79 && head[7] === 0x70) {
    return 'audio/mp4';
  }
  // ID3 tag or MPEG frame sync
  if (head[0] === 0x49 && head[1] === 0x44 && head[2] === 0x33) return 'audio/mpeg';
  if (head[0] === 0xff && head.length > 1 && (head[1] & 0xe0) === 0xe0) return 'audio/mpeg';
  return normalizeAudioContentType(blob.type || '');
}

/** Ensure the Blob carries the sniffed Content-Type for upload + <audio>. */
export async function withSniffedAudioType(blob: Blob): Promise<{ blob: Blob; contentType: AudioContentType }> {
  const contentType = await sniffAudioContentType(blob);
  if (blob.type === contentType) return { blob, contentType };
  return { blob: new Blob([blob], { type: contentType }), contentType };
}
