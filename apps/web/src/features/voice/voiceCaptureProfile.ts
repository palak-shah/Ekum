/** How to start / stop MediaRecorder so Safari does not return an empty clip. */

function isAppleMediaRecorderHost(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent);
}

export type VoiceCaptureProfile = {
  /** When set, passed to `MediaRecorder.start(timeslice)`. */
  timesliceMs: number | undefined;
  bitsPerSecond: number | undefined;
  /** `requestData()` before `stop()` — helps Chrome webm; can empty Safari mp4. */
  requestDataBeforeStop: boolean;
};

/**
 * Apple / mp4: timeslice forces periodic chunks (Safari often emits nothing without it).
 * Chromium webm: no timeslice — chunked webm plays choppy.
 */
export function voiceCaptureProfile(mime?: string): VoiceCaptureProfile {
  const apple = isAppleMediaRecorderHost();
  const mp4ish = Boolean(mime && /mp4|aac|m4a/i.test(mime));
  if (apple || mp4ish) {
    return {
      timesliceMs: 1000,
      bitsPerSecond: undefined,
      requestDataBeforeStop: false,
    };
  }
  return {
    timesliceMs: undefined,
    bitsPerSecond: 128_000,
    requestDataBeforeStop: true,
  };
}
