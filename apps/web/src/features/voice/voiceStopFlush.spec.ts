import { describe, expect, it } from 'vitest';
import {
  shouldSettleVoiceStop,
  VOICE_STOP_EARLY_MS,
  VOICE_STOP_FLUSH_MS,
} from './voiceStopFlush';

describe('shouldSettleVoiceStop', () => {
  it('waits until onstop', () => {
    expect(
      shouldSettleVoiceStop({ stopFired: false, sizeBytes: 900, elapsedSinceStopMs: 0 }),
    ).toBe(false);
  });

  it('debounces briefly after onstop even when bytes already exist', () => {
    expect(
      shouldSettleVoiceStop({
        stopFired: true,
        sizeBytes: 1200,
        elapsedSinceStopMs: VOICE_STOP_EARLY_MS - 1,
      }),
    ).toBe(false);
    expect(
      shouldSettleVoiceStop({
        stopFired: true,
        sizeBytes: 1200,
        elapsedSinceStopMs: VOICE_STOP_EARLY_MS,
      }),
    ).toBe(true);
  });

  it('waits the flush window when still empty (Safari late dataavailable)', () => {
    expect(
      shouldSettleVoiceStop({
        stopFired: true,
        sizeBytes: 0,
        elapsedSinceStopMs: VOICE_STOP_FLUSH_MS - 1,
      }),
    ).toBe(false);
    expect(
      shouldSettleVoiceStop({
        stopFired: true,
        sizeBytes: 0,
        elapsedSinceStopMs: VOICE_STOP_FLUSH_MS,
      }),
    ).toBe(true);
  });
});
