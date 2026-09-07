import { VOICE_MAX_DURATION_MS } from '@ekum/domain-types';

export { VOICE_MAX_DURATION_MS };

/** Soft size ceiling for a ~2 min clip (bytes). */
export const VOICE_MAX_BYTES = 5 * 1024 * 1024;

/** Ignore accidental taps — must hold at least this long. */
export const MIN_VOICE_DURATION_MS = 700;

/** Tiny blobs are empty/corrupt — do not upload. */
export const MIN_VOICE_BYTES = 256;

export function isUsableVoiceClip(input: { durationMs: number; sizeBytes: number }): boolean {
  return input.durationMs >= MIN_VOICE_DURATION_MS && input.sizeBytes >= MIN_VOICE_BYTES;
}

export function formatVoiceDuration(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function pickAudioMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm';
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
    return 'audio/webm;codecs=opus';
  }
  if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
  if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4';
  return 'audio/webm';
}

export function normalizeAudioContentType(mime: string): 'audio/webm' | 'audio/mp4' | 'audio/mpeg' {
  if (mime.includes('mp4') || mime.includes('m4a')) return 'audio/mp4';
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'audio/mpeg';
  return 'audio/webm';
}
