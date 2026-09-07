import { describe, expect, it } from 'vitest';
import {
  formatVoiceDuration,
  isUsableVoiceClip,
  MIN_VOICE_BYTES,
  MIN_VOICE_DURATION_MS,
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
    expect(
      isUsableVoiceClip({ durationMs: 2000, sizeBytes: MIN_VOICE_BYTES - 1 }),
    ).toBe(false);
  });

  it('accepts a real short clip', () => {
    expect(
      isUsableVoiceClip({ durationMs: MIN_VOICE_DURATION_MS, sizeBytes: MIN_VOICE_BYTES }),
    ).toBe(true);
  });
});
