/** Only one voice clip plays at a time across the app. */
type StopFn = () => void;

let activeStop: StopFn | null = null;

export function claimVoicePlayback(stop: StopFn): void {
  if (activeStop && activeStop !== stop) {
    activeStop();
  }
  activeStop = stop;
}

export function releaseVoicePlayback(stop: StopFn): void {
  if (activeStop === stop) {
    activeStop = null;
  }
}

/** Pause any playing clip (e.g. before recording so the mic does not echo it). */
export function stopAllVoicePlayback(): void {
  if (!activeStop) return;
  const stop = activeStop;
  activeStop = null;
  stop();
}
