/** Pure hold-to-record state for chat mic (WhatsApp-style). */

export type VoiceHoldPhase = 'idle' | 'arming' | 'recording' | 'stopping';

/** After getUserMedia resolves — finger may already be up or cancelled. */
export function voiceHoldAfterStart(input: {
  stillHolding: boolean;
  startError: string | null;
  cancelRequested?: boolean;
}): 'error' | 'cancel' | 'stop_now' | 'keep_recording' {
  if (input.startError) return 'error';
  if (input.cancelRequested) return 'cancel';
  if (!input.stillHolding) return 'stop_now';
  return 'keep_recording';
}

/**
 * Finger up / pointer lost.
 * `pointercancel` on iOS often follows a real release — treat like stop, not discard,
 * unless the user slid left to cancel.
 */
export function voiceHoldAfterRelease(input: {
  phase: VoiceHoldPhase;
  slideCancel: boolean;
}): 'noop' | 'cancel' | 'defer_to_start' | 'stop' {
  if (input.phase === 'idle' || input.phase === 'stopping') return 'noop';
  if (input.slideCancel) return 'cancel';
  if (input.phase === 'arming') return 'defer_to_start';
  return 'stop';
}

export type VoiceStageResult =
  | { kind: 'stage' }
  | { kind: 'too_short' }
  | { kind: 'failed' }
  | { kind: 'silent' };

/** Map stopAndGet result → preview vs toast (null = never started / cancelled). */
export function voiceStageFromClip(input: {
  clip: { durationMs: number; sizeBytes: number } | null;
  /** True when we know MediaRecorder ran (user saw Recording…). */
  didRecord: boolean;
  isUsable: (clip: { durationMs: number; sizeBytes: number }) => boolean;
}): VoiceStageResult {
  if (!input.clip) {
    return input.didRecord ? { kind: 'failed' } : { kind: 'silent' };
  }
  if (!input.isUsable(input.clip)) return { kind: 'too_short' };
  return { kind: 'stage' };
}
