/**
 * Session-scoped camera/mic streams.
 * Stopping tracks and calling getUserMedia again re-opens the OS permission
 * prompt when the browser/site is set to “Ask”. Reuse live tracks instead.
 */

export type MediaKind = 'camera' | 'microphone';

type Slot = {
  stream: MediaStream;
  /** Soft-release timer — hard-stops tracks after idle. */
  idleTimer: ReturnType<typeof setTimeout> | null;
};

const IDLE_STOP_MS = 5 * 60_000;

const slots: Record<MediaKind, Slot | null> = {
  camera: null,
  microphone: null,
};

let pageHideBound = false;

function bindPageHideOnce() {
  if (pageHideBound || typeof window === 'undefined') return;
  pageHideBound = true;
  window.addEventListener('pagehide', () => {
    disposeMediaSession();
  });
}

export function streamHasLiveTrack(stream: MediaStream, kind: MediaKind): boolean {
  const tracks = kind === 'camera' ? stream.getVideoTracks() : stream.getAudioTracks();
  return tracks.some((t) => t.readyState === 'live');
}

function clearIdle(kind: MediaKind) {
  const slot = slots[kind];
  if (!slot?.idleTimer) return;
  clearTimeout(slot.idleTimer);
  slot.idleTimer = null;
}

function hardStop(kind: MediaKind) {
  const slot = slots[kind];
  if (!slot) return;
  clearIdle(kind);
  for (const track of slot.stream.getTracks()) {
    track.stop();
  }
  slots[kind] = null;
}

function setTracksEnabled(stream: MediaStream, kind: MediaKind, enabled: boolean) {
  const tracks = kind === 'camera' ? stream.getVideoTracks() : stream.getAudioTracks();
  for (const track of tracks) {
    track.enabled = enabled;
  }
}

export function mediaAccessErrorMessage(err: unknown, kind: MediaKind): string {
  const name = err && typeof err === 'object' && 'name' in err ? String(err.name) : '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return kind === 'camera'
      ? 'Allow camera to take photos.'
      : 'Allow microphone to send voice.';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return kind === 'camera' ? 'No camera found.' : 'No microphone found.';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return kind === 'camera'
      ? 'Camera is busy. Close other apps and try again.'
      : 'Microphone is busy. Close other apps and try again.';
  }
  return kind === 'camera'
    ? 'Could not open camera.'
    : 'Could not open microphone.';
}

export type AcquireMediaResult =
  | { ok: true; stream: MediaStream; reused: boolean }
  | { ok: false; message: string };

/**
 * Get a live stream for camera or mic. Reuses the session stream when tracks
 * are still live (no second permission prompt).
 */
export async function acquireMediaStream(
  kind: MediaKind,
  constraints: MediaStreamConstraints,
): Promise<AcquireMediaResult> {
  bindPageHideOnce();
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    return {
      ok: false,
      message:
        kind === 'camera'
          ? 'Camera needs a secure (https) connection.'
          : 'Microphone needs a secure (https) connection.',
    };
  }

  clearIdle(kind);
  const existing = slots[kind];
  if (existing && streamHasLiveTrack(existing.stream, kind)) {
    setTracksEnabled(existing.stream, kind, true);
    return { ok: true, stream: existing.stream, reused: true };
  }

  if (existing) {
    hardStop(kind);
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    slots[kind] = { stream, idleTimer: null };
    return { ok: true, stream, reused: false };
  } catch (err) {
    return { ok: false, message: mediaAccessErrorMessage(err, kind) };
  }
}

/**
 * Soft-release: mute device for privacy/LED, keep tracks so the next open
 * in this tab does not re-prompt. Hard-stops after idle.
 */
export function releaseMediaStream(kind: MediaKind) {
  const slot = slots[kind];
  if (!slot) return;
  setTracksEnabled(slot.stream, kind, false);
  clearIdle(kind);
  slot.idleTimer = setTimeout(() => {
    hardStop(kind);
  }, IDLE_STOP_MS);
}

/** Stop and forget (tests / explicit teardown). */
export function disposeMediaSession(kind?: MediaKind) {
  if (kind) {
    hardStop(kind);
    return;
  }
  hardStop('camera');
  hardStop('microphone');
}

/** Test helper — reset module state between specs. */
export function resetMediaSessionForTests() {
  disposeMediaSession();
  pageHideBound = false;
}
