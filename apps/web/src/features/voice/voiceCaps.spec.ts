import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  formatVoiceDuration,
  isUsableVoiceClip,
  MIN_VOICE_BYTES,
  MIN_VOICE_DURATION_MS,
  normalizeAudioContentType,
  pickAudioMimeType,
  sniffAudioContentType,
  withSniffedAudioType,
} from './voiceCaps';

describe('formatVoiceDuration', () => {
  it('formats mm:ss', () => {
    expect(formatVoiceDuration(0)).toBe('0:00');
    expect(formatVoiceDuration(1500)).toBe('0:02');
    expect(formatVoiceDuration(65_000)).toBe('1:05');
  });
});

describe('isUsableVoiceClip', () => {
  it('rejects taps that are too short or empty', () => {
    expect(
      isUsableVoiceClip({ durationMs: MIN_VOICE_DURATION_MS - 1, sizeBytes: 2000 }),
    ).toBe(false);
    expect(isUsableVoiceClip({ durationMs: 900, sizeBytes: 0 })).toBe(false);
    expect(
      isUsableVoiceClip({
        durationMs: MIN_VOICE_DURATION_MS,
        sizeBytes: MIN_VOICE_BYTES - 1,
      }),
    ).toBe(false);
  });

  it('accepts a real short clip (incl. tiny AAC after a solid hold)', () => {
    expect(
      isUsableVoiceClip({ durationMs: MIN_VOICE_DURATION_MS, sizeBytes: MIN_VOICE_BYTES }),
    ).toBe(true);
    expect(
      isUsableVoiceClip({ durationMs: MIN_VOICE_DURATION_MS * 2, sizeBytes: 32 }),
    ).toBe(true);
  });
});

describe('normalizeAudioContentType', () => {
  it('maps mp4 / m4a / aac to audio/mp4', () => {
    expect(normalizeAudioContentType('audio/mp4;codecs=mp4a.40.2')).toBe('audio/mp4');
    expect(normalizeAudioContentType('audio/m4a')).toBe('audio/mp4');
    expect(normalizeAudioContentType('audio/aac')).toBe('audio/mp4');
  });

  it('maps webm to audio/webm', () => {
    expect(normalizeAudioContentType('audio/webm;codecs=opus')).toBe('audio/webm');
  });
});

describe('sniffAudioContentType', () => {
  it('detects WebM EBML header even when blob.type is wrong', async () => {
    const bytes = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const blob = new Blob([bytes], { type: 'audio/mp4' });
    expect(await sniffAudioContentType(blob)).toBe('audio/webm');
  });

  it('detects MP4 ftyp even when blob.type claims webm (Safari mislabel)', async () => {
    const bytes = new Uint8Array([
      0, 0, 0, 0x20, 0x66, 0x74, 0x79, 0x70, 0x4d, 0x34, 0x41, 0x20, 0, 0, 0, 0,
    ]);
    const blob = new Blob([bytes], { type: 'audio/webm' });
    expect(await sniffAudioContentType(blob)).toBe('audio/mp4');
  });

  it('withSniffedAudioType rewrites Blob.type to the sniffed container', async () => {
    const bytes = new Uint8Array([
      0, 0, 0, 0x20, 0x66, 0x74, 0x79, 0x70, 0x4d, 0x34, 0x41, 0x20, 0, 0, 0, 0,
    ]);
    const blob = new Blob([bytes], { type: 'audio/webm' });
    const typed = await withSniffedAudioType(blob);
    expect(typed.contentType).toBe('audio/mp4');
    expect(typed.blob.type).toBe('audio/mp4');
  });
});

describe('pickAudioMimeType', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('prefers mp4 on Apple when supported and never returns unsupported webm', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    });
    vi.stubGlobal('MediaRecorder', {
      isTypeSupported: (type: string) => type === 'audio/mp4',
    });
    expect(pickAudioMimeType()).toBe('audio/mp4');
  });

  it('prefers opus webm on Chromium when supported', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/120.0.0.0 Mobile',
    });
    vi.stubGlobal('MediaRecorder', {
      isTypeSupported: (type: string) =>
        type === 'audio/webm;codecs=opus' || type === 'audio/webm',
    });
    expect(pickAudioMimeType()).toBe('audio/webm;codecs=opus');
  });

  it('returns undefined when nothing is supported (browser default)', () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0' });
    vi.stubGlobal('MediaRecorder', {
      isTypeSupported: () => false,
    });
    expect(pickAudioMimeType()).toBeUndefined();
  });
});
