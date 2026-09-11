import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { acquireMediaStream, releaseMediaStream } from '@/lib/mediaSession';
import { Button, cx } from '@/ui/kit';
import {
  continuousCameraCanShoot,
  continuousCameraDoneEnabled,
} from './continuousCameraModel';

export interface ContinuousCameraProps {
  open: boolean;
  /** How many more shots allowed in this session (remaining slots). */
  maxShots: number;
  /**
   * When opening from Update-design Add: freeze this id for the session so Done
   * appends photos to that design (not new designs). Null/omit = new-design batch.
   */
  appendToDraftId?: string | null;
  onDone: (files: File[], appendToDraftId: string | null) => void;
  onCancel: () => void;
  /** Permission / device failure — parent should fall back to gallery. */
  onUnavailable: () => void;
  /** Pick from gallery instead — discards in-progress shots and closes camera. */
  onGallery?: () => void;
}

interface Shot {
  id: string;
  file: File;
  previewUrl: string;
}

/** Extended capabilities — torch/zoom are not always in lib.dom typings. */
type VideoCaps = MediaTrackCapabilities & {
  torch?: boolean;
  zoom?: { min: number; max: number; step?: number };
};

function shotId(): string {
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function videoTrack(stream: MediaStream | null): MediaStreamTrack | null {
  return stream?.getVideoTracks()[0] ?? null;
}

function readCaps(track: MediaStreamTrack | null): VideoCaps {
  if (!track || typeof track.getCapabilities !== 'function') {
    return {};
  }
  return track.getCapabilities() as VideoCaps;
}

async function applyTrackConstraint(
  track: MediaStreamTrack,
  constraint: Record<string, boolean | number>,
): Promise<boolean> {
  try {
    await track.applyConstraints({ advanced: [constraint] });
    return true;
  } catch {
    try {
      await track.applyConstraints(constraint as MediaTrackConstraints);
      return true;
    } catch {
      return false;
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function waitForVideoEl(
  getEl: () => HTMLVideoElement | null,
  frames = 12,
): Promise<HTMLVideoElement | null> {
  for (let i = 0; i < frames; i++) {
    const el = getEl();
    if (el) return el;
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }
  return getEl();
}

/**
 * Full-screen continuous capture for Photo order / Add designs (phone).
 * Portaled to document.body so AppShell `max-w-md` + `.ekum-rise` transform
 * cannot shrink the viewfinder. One viewport layer: video fills the screen;
 * Cancel / Done / shutter overlay it (no scrollable chrome column).
 */
export function ContinuousCamera({
  open,
  maxShots,
  appendToDraftId = null,
  onDone,
  onCancel,
  onUnavailable,
  onGallery,
}: ContinuousCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  /** Locked when the session opens — parent re-renders must not lose append target. */
  const sessionAppendRef = useRef<string | null>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [zoomRange, setZoomRange] = useState<{ min: number; max: number; step: number } | null>(
    null,
  );

  const stopStream = useCallback(() => {
    // Soft-release: keep session tracks so reopen does not re-prompt.
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    releaseMediaStream('camera');
    setReady(false);
    setTorchOn(false);
    setTorchSupported(false);
    setZoomRange(null);
    setZoom(1);
  }, []);

  const revokeShots = useCallback((list: Shot[]) => {
    for (const shot of list) {
      URL.revokeObjectURL(shot.previewUrl);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      sessionAppendRef.current = appendToDraftId ?? null;
    } else {
      sessionAppendRef.current = null;
    }
  }, [open, appendToDraftId]);

  useEffect(() => {
    if (!open) {
      stopStream();
      setShots((prev) => {
        revokeShots(prev);
        return [];
      });
      setBusy(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setShots((prev) => {
      revokeShots(prev);
      return [];
    });
    setError(null);
    setBusy(false);
    setReady(false);
    setTorchOn(false);
    setTorchSupported(false);
    setZoomRange(null);
    setZoom(1);

    const start = async (attempt: number) => {
      try {
        // Brief pause only when retrying a failed attach (not a hard track stop).
        if (attempt > 0) {
          await delay(350);
          if (cancelled) return;
        }
        const acquired = await acquireMediaStream('camera', {
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        if (!acquired.ok) {
          if (cancelled) return;
          if (attempt < 1) {
            void start(attempt + 1);
            return;
          }
          onUnavailable();
          return;
        }
        const stream = acquired.stream;
        if (cancelled) {
          releaseMediaStream('camera');
          return;
        }
        streamRef.current = stream;
        const video = await waitForVideoEl(() => videoRef.current);
        if (!video) {
          streamRef.current = null;
          releaseMediaStream('camera');
          if (!cancelled && attempt < 1) {
            void start(attempt + 1);
            return;
          }
          if (!cancelled) onUnavailable();
          return;
        }
        video.srcObject = stream;
        await video.play();
        if (cancelled) {
          streamRef.current = null;
          releaseMediaStream('camera');
          return;
        }

        const track = videoTrack(stream);
        const caps = readCaps(track);
        setTorchSupported(Boolean(caps.torch));
        if (caps.zoom && typeof caps.zoom.min === 'number' && typeof caps.zoom.max === 'number') {
          const min = caps.zoom.min;
          const max = caps.zoom.max;
          const step = caps.zoom.step && caps.zoom.step > 0 ? caps.zoom.step : 0.1;
          setZoomRange({ min, max, step });
          setZoom(min);
        }

        setReady(true);
      } catch {
        if (cancelled) return;
        if (attempt < 1) {
          void start(attempt + 1);
          return;
        }
        onUnavailable();
      }
    };

    void start(0);

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open, onUnavailable, stopStream, revokeShots]);

  if (!open) {
    return null;
  }

  if (typeof document === 'undefined') {
    return null;
  }

  const canShoot = continuousCameraCanShoot({
    ready,
    busy,
    maxShots,
    shotsTaken: shots.length,
  });
  const doneEnabled = continuousCameraDoneEnabled(shots.length);

  const toggleTorch = async () => {
    const track = videoTrack(streamRef.current);
    if (!track || !torchSupported) return;
    const next = !torchOn;
    const ok = await applyTrackConstraint(track, { torch: next });
    if (ok) {
      setTorchOn(next);
    }
  };

  const changeZoom = async (value: number) => {
    const track = videoTrack(streamRef.current);
    if (!track || !zoomRange) return;
    const clamped = Math.min(zoomRange.max, Math.max(zoomRange.min, value));
    setZoom(clamped);
    await applyTrackConstraint(track, { zoom: clamped });
  };

  const capture = async () => {
    if (!canShoot) return;
    const video = videoRef.current;
    if (!video || video.videoWidth < 1) return;

    setBusy(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setError('Could not capture.');
        return;
      }
      ctx.drawImage(video, 0, 0);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92),
      );
      if (!blob) {
        setError('Could not capture.');
        return;
      }
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(blob);
      setShots((prev) => [...prev, { id: shotId(), file, previewUrl }]);
      setError(null);
      if (typeof navigator.vibrate === 'function') {
        navigator.vibrate(12);
      }
    } finally {
      setBusy(false);
    }
  };

  const removeShot = (id: string) => {
    setShots((prev) => {
      const target = prev.find((s) => s.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((s) => s.id !== id);
    });
  };

  const handleCancel = () => {
    revokeShots(shots);
    setShots([]);
    stopStream();
    onCancel();
  };

  const handleDone = () => {
    if (!doneEnabled) return;
    const files = shots.map((s) => s.file);
    const appendId = sessionAppendRef.current;
    revokeShots(shots);
    setShots([]);
    stopStream();
    onDone(files, appendId);
  };

  const handleGallery = () => {
    if (!onGallery) return;
    revokeShots(shots);
    setShots([]);
    stopStream();
    onGallery();
  };

  // Portal out of AppShell — `.ekum-rise` keeps a transform, so in-tree
  // `fixed inset-0` only fills the max-w-md column (tiny camera). Same as Sheet.
  return createPortal(
    <div
      className="fixed inset-0 z-[100] h-[100dvh] max-h-[100dvh] w-screen max-w-none overflow-hidden overscroll-none bg-black text-white"
      role="dialog"
      aria-modal="true"
      aria-label="Camera"
      data-testid="continuous-camera"
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
        muted
        autoPlay
      />
      {!ready ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black text-sm text-white/80">
          Starting camera…
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 bg-gradient-to-b from-black/70 to-transparent px-4 pb-10 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto flex min-w-0 items-center gap-1">
          <button
            type="button"
            onClick={handleCancel}
            className="min-h-11 shrink-0 rounded-xl px-3 text-sm font-semibold text-white"
          >
            Cancel
          </button>
          {onGallery ? (
            <button
              type="button"
              onClick={handleGallery}
              className="min-h-11 shrink-0 rounded-xl px-2 text-sm font-medium text-white/85"
            >
              Gallery
            </button>
          ) : null}
        </div>
        <p className="shrink-0 text-sm font-semibold tabular-nums">{shots.length}/{maxShots}</p>
        <Button
          type="button"
          className="pointer-events-auto min-h-11 min-w-[4.5rem] px-3"
          disabled={!doneEnabled}
          onClick={handleDone}
        >
          Done
        </Button>
      </div>

      {torchSupported ? (
        <button
          type="button"
          aria-label={torchOn ? 'Turn torch off' : 'Turn torch on'}
          aria-pressed={torchOn}
          onClick={() => void toggleTorch()}
          className={cx(
            'absolute right-4 top-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] z-10 min-h-11 min-w-11 rounded-full px-3 text-xs font-bold',
            torchOn ? 'bg-accent text-white' : 'bg-black/55 text-white',
          )}
        >
          Torch
        </button>
      ) : null}

      {/* All capture chrome overlays the preview — never a second scroll column. */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-2 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-8">
        {shots.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {shots.map((shot) => (
              <button
                key={shot.id}
                type="button"
                aria-label="Remove photo"
                onClick={() => removeShot(shot.id)}
                className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/30"
              >
                <img src={shot.previewUrl} alt="" className="h-full w-full object-cover" />
                <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-[10px]">
                  ×
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {zoomRange ? (
          <label className="flex items-center gap-3">
            <span className="shrink-0 text-xs font-semibold text-white/80">Zoom</span>
            <input
              type="range"
              min={zoomRange.min}
              max={zoomRange.max}
              step={zoomRange.step}
              value={zoom}
              aria-label="Zoom"
              className="h-2 w-full accent-white"
              onChange={(event) => void changeZoom(Number(event.target.value))}
            />
            <span className="w-10 shrink-0 text-right text-xs tabular-nums text-white/80">
              {zoom.toFixed(1)}×
            </span>
          </label>
        ) : null}

        {error ? <p className="text-center text-xs text-red-300">{error}</p> : null}
        {ready && maxShots < 1 ? (
          <p className="text-center text-xs text-white/70">No more slots in this batch.</p>
        ) : null}

        <div className="flex items-center justify-center py-1">
          <button
            type="button"
            aria-label="Take photo"
            data-testid="continuous-camera-shutter"
            disabled={!canShoot}
            onClick={() => void capture()}
            className={cx(
              'flex h-16 w-16 items-center justify-center rounded-full border-4 border-white/90',
              canShoot ? 'bg-white' : 'bg-white/30',
            )}
          >
            <span className="h-12 w-12 rounded-full border-2 border-black/20 bg-white" />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
