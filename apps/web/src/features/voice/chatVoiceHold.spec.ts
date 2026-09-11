import { describe, expect, it } from 'vitest';
import {
  voiceHoldAfterRelease,
  voiceHoldAfterStart,
  voiceStageFromClip,
} from './chatVoiceHold';

describe('voiceHoldAfterStart', () => {
  it('stops immediately when finger already released during mic prompt', () => {
    expect(voiceHoldAfterStart({ stillHolding: false, startError: null })).toBe('stop_now');
  });

  it('cancels when slide/cancel happened while arming', () => {
    expect(
      voiceHoldAfterStart({
        stillHolding: false,
        startError: null,
        cancelRequested: true,
      }),
    ).toBe('cancel');
  });

  it('keeps recording while finger is down', () => {
    expect(voiceHoldAfterStart({ stillHolding: true, startError: null })).toBe('keep_recording');
  });
});

describe('voiceHoldAfterRelease', () => {
  it('defers while arming so start() can finish', () => {
    expect(voiceHoldAfterRelease({ phase: 'arming', slideCancel: false })).toBe('defer_to_start');
  });

  it('stops when already recording', () => {
    expect(voiceHoldAfterRelease({ phase: 'recording', slideCancel: false })).toBe('stop');
  });
});

describe('voiceStageFromClip', () => {
  const usable = (c: { durationMs: number; sizeBytes: number }) =>
    c.durationMs >= 500 && c.sizeBytes >= 1;

  it('stages a usable clip', () => {
    expect(
      voiceStageFromClip({
        clip: { durationMs: 900, sizeBytes: 2000 },
        didRecord: true,
        isUsable: usable,
      }),
    ).toEqual({ kind: 'stage' });
  });

  it('does not toast when nothing ever started', () => {
    expect(
      voiceStageFromClip({ clip: null, didRecord: false, isUsable: usable }),
    ).toEqual({ kind: 'silent' });
  });

  it('reports failed when recording ran but blob is empty', () => {
    expect(
      voiceStageFromClip({ clip: null, didRecord: true, isUsable: usable }),
    ).toEqual({ kind: 'failed' });
  });
});
