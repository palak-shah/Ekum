/** Safari often delivers the last MediaRecorder chunk after `onstop`. */
export const VOICE_STOP_FLUSH_MS = 300;
/** After onstop, wait briefly even if bytes already exist (late final chunk). */
export const VOICE_STOP_EARLY_MS = 50;

/**
 * After `stop()`, settle once we have bytes and a short post-onstop debounce,
 * else when the flush window ends (empty → failed clip, not a false “too short”).
 */
export function shouldSettleVoiceStop(input: {
  stopFired: boolean;
  sizeBytes: number;
  elapsedSinceStopMs: number;
  flushMs?: number;
  earlyMs?: number;
}): boolean {
  if (!input.stopFired) return false;
  const flushMs = input.flushMs ?? VOICE_STOP_FLUSH_MS;
  const earlyMs = input.earlyMs ?? VOICE_STOP_EARLY_MS;
  if (input.sizeBytes > 0 && input.elapsedSinceStopMs >= earlyMs) return true;
  return input.elapsedSinceStopMs >= flushMs;
}
