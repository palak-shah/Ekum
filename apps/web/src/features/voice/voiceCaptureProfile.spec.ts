import { describe, expect, it, vi, afterEach } from 'vitest';
import { voiceCaptureProfile } from './voiceCaptureProfile';

describe('voiceCaptureProfile', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses timeslice and skips requestData on Apple (Safari empty blob)', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    });
    expect(voiceCaptureProfile('audio/mp4')).toEqual({
      timesliceMs: 1000,
      bitsPerSecond: undefined,
      requestDataBeforeStop: false,
    });
  });

  it('keeps no-timeslice webm on Chromium for clean playback', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/120.0.0.0 Mobile',
    });
    expect(voiceCaptureProfile('audio/webm;codecs=opus')).toEqual({
      timesliceMs: undefined,
      bitsPerSecond: 128_000,
      requestDataBeforeStop: true,
    });
  });
});
