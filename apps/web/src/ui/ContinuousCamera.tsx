import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, cx } from '@/ui/kit';

export interface ContinuousCameraProps {
  open: boolean;
  /** How many more shots allowed in this session (remaining slots). */
  maxShots: number;
  onDone: (files: File[]) => void;
  onCancel: () => void;
  /** Permission / device failure — parent should fall back to gallery. */
  onUnavailable: () => void;
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

/**
 * Full-screen continuous capture for Photo order (phone).
 * Rear camera, shutter stack, Done / Cancel; torch + zoom when the device supports them.
 */
export function ContinuousCamera({
  open,
  maxShots,
  onDone,
  onCancel,
  onUnavailable,
}: ContinuousCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
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
    const stream = streamRef.current;
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
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
    if (!open) {
      return;
    }

    let cancelled = false;
    setShots((prev) => {
      for (const shot of prev) URL.revokeObjectURL(shot.previewUrl);
      return [];
    });
    setError(null);
    setBusy(false);
    setReady(false);
    setTorchOn(false);
    setTorchSupported(false);
    setZoomRange(null);
    setZoom(1);

    const start = async () => {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        onUnavailable();
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        if (cancelled) {
          for (const track of stream.getTracks()) track.stop();
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
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
        if (!cancelled) {
          onUnavailable();
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open, onUnavailable, stopStream]);

  if (!open) {
    return null;
  }

  const remaining = Math.max(0, maxShots - shots.length);
  const canShoot = ready && !busy && remaining > 0;

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
    const files = shots.map((s) => s.file);
    revokeShots(shots);
    setShots([]);
    stopStream();
    onDone(files);
  };

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-black text-white">
      <div className="relative min-h-0 flex-1">
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

        <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 bg-gradient-to-b from-black/60 to-transparent px-4 pb-8 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={handleCancel}
            className="min-h-11 rounded-xl px-3 text-sm font-semibold text-white"
          >
            Cancel
          </button>
          <p className="text-sm font-semibold tabular-nums">
            {shots.length}/{maxShots}
          </p>
          <Button
            type="button"
            className="min-h-11 min-w-[4.5rem] px-3"
            disabled={shots.length === 0}
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
              'absolute right-4 top-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] min-h-11 min-w-11 rounded-full px-3 text-xs font-bold',
              torchOn ? 'bg-accent text-white' : 'bg-black/55 text-white',
            )}
          >
            Torch
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 bg-black px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        {shots.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {shots.map((shot) => (
              <button
                key={shot.id}
                type="button"
                aria-label="Remove photo"
                onClick={() => removeShot(shot.id)}
                className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-white/30"
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

        <div className="flex items-center justify-center py-1">
          <button
            type="button"
            aria-label="Take photo"
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
    </div>
  );
}
