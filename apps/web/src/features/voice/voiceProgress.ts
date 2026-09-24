/** Fill for the compact voice track. Never NaN / over 100%. */
export function voiceProgressRatio(
  elapsedMs: number,
  durationMs: number | null | undefined,
): number {
  if (!durationMs || durationMs <= 0 || elapsedMs <= 0) return 0;
  return Math.min(1, elapsedMs / durationMs);
}
