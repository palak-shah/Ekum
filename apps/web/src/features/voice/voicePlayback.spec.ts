import { describe, expect, it, vi } from 'vitest';
import {
  claimVoicePlayback,
  releaseVoicePlayback,
  stopAllVoicePlayback,
} from './voicePlayback';

describe('voicePlayback', () => {
  it('stops the previous clip when another claims playback', () => {
    const first = vi.fn();
    const second = vi.fn();
    claimVoicePlayback(first);
    claimVoicePlayback(second);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });

  it('stopAllVoicePlayback clears the active clip', () => {
    const stop = vi.fn();
    claimVoicePlayback(stop);
    stopAllVoicePlayback();
    expect(stop).toHaveBeenCalledTimes(1);
    // Second call is a no-op.
    stopAllVoicePlayback();
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('release only clears when it still owns playback', () => {
    const first = vi.fn();
    const second = vi.fn();
    claimVoicePlayback(first);
    claimVoicePlayback(second);
    releaseVoicePlayback(first);
    stopAllVoicePlayback();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
