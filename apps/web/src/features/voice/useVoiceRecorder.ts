import { useCallback, useEffect, useRef, useState } from 'react';
import { acquireMediaStream, releaseMediaStream } from '@/lib/mediaSession';
import { VOICE_MAX_DURATION_MS, pickAudioMimeType, withSniffedAudioType } from './voiceCaps';
import { voiceCaptureProfile } from './voiceCaptureProfile';
import { shouldSettleVoiceStop, VOICE_STOP_EARLY_MS, VOICE_STOP_FLUSH_MS } from './voiceStopFlush';
import { stopAllVoicePlayback } from './voicePlayback';

export type VoiceRecording = {
  blob: Blob;
  durationMs: number;
};

type Options = {
  maxDurationMs?: number;
  onMaxDuration?: (recording: VoiceRecording) => void;
};

export function useVoiceRecorder(options: Options = {}) {
  const maxDurationMs = options.maxDurationMs ?? VOICE_MAX_DURATION_MS;
  const [recording, setRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const tickRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cancelRef = useRef(false);
  const pickedMimeRef = useRef<string | undefined>(undefined);
  const captureProfileRef = useRef(voiceCaptureProfile());
  /** Coalesce pointerup+pointercancel; ignore cancel while a keep/stop is in flight. */
  const finishFlightRef = useRef<Promise<VoiceRecording | null> | null>(null);
  const finishModeRef = useRef<'send' | 'cancel' | null>(null);
  const stopFlushRef = useRef<{
    stopFired: boolean;
    stoppedAt: number;
    earlyTimer: number | null;
    flushTimer: number | null;
    trySettle: () => void;
  } | null>(null);

  const clearTick = () => {
    if (tickRef.current != null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const stopTracks = () => {
    // Soft-release so the next hold reuses the session mic (no re-prompt).
    streamRef.current = null;
    releaseMediaStream('microphone');
  };

  useEffect(
    () => () => {
      clearTick();
      stopTracks();
      if (mediaRef.current?.state === 'recording') {
        mediaRef.current.stop();
      }
    },
    [],
  );

  const finish = useCallback((mode: 'send' | 'cancel'): Promise<VoiceRecording | null> => {
    const inFlight = finishFlightRef.current;
    if (inFlight) {
      // iOS often fires pointercancel after pointerup — never let cancel wipe a keep.
      if (mode === 'cancel' && finishModeRef.current === 'send') {
        return inFlight;
      }
      return inFlight;
    }
    finishModeRef.current = mode;
    const flight = new Promise<VoiceRecording | null>((resolve) => {
      const recorder = mediaRef.current;
      if (!recorder || recorder.state === 'inactive') {
        setRecording(false);
        clearTick();
        stopTracks();
        resolve(null);
        return;
      }
      cancelRef.current = mode === 'cancel';
      let settled = false;
      const chunkBytes = () => chunksRef.current.reduce((n, c) => n + c.size, 0);
      const settle = () => {
        if (settled) return;
        settled = true;
        const flush = stopFlushRef.current;
        if (flush?.earlyTimer != null) window.clearTimeout(flush.earlyTimer);
        if (flush?.flushTimer != null) window.clearTimeout(flush.flushTimer);
        stopFlushRef.current = null;
        clearTick();
        stopTracks();
        setRecording(false);
        mediaRef.current = null;
        if (cancelRef.current) {
          chunksRef.current = [];
          resolve(null);
          return;
        }
        const declared =
          recorder.mimeType ||
          pickedMimeRef.current ||
          chunksRef.current.find((c) => c.type)?.type ||
          '';
        const raw = new Blob(chunksRef.current, { type: declared || undefined });
        chunksRef.current = [];
        const durationMs = Math.min(
          maxDurationMs,
          Math.max(0, Date.now() - startedAtRef.current),
        );
        if (raw.size < 1) {
          resolve(null);
          return;
        }
        void withSniffedAudioType(raw).then(({ blob }) => {
          resolve({ blob, durationMs });
        });
      };
      const trySettle = () => {
        const flush = stopFlushRef.current;
        if (!flush) return;
        if (
          shouldSettleVoiceStop({
            stopFired: flush.stopFired,
            sizeBytes: chunkBytes(),
            elapsedSinceStopMs: Date.now() - flush.stoppedAt,
          })
        ) {
          settle();
        }
      };
      stopFlushRef.current = {
        stopFired: false,
        stoppedAt: Date.now(),
        earlyTimer: null,
        flushTimer: null,
        trySettle,
      };
      recorder.onstop = () => {
        const flush = stopFlushRef.current;
        if (!flush) return;
        flush.stopFired = true;
        flush.stoppedAt = Date.now();
        flush.earlyTimer = window.setTimeout(trySettle, VOICE_STOP_EARLY_MS);
        flush.flushTimer = window.setTimeout(trySettle, VOICE_STOP_FLUSH_MS);
        trySettle();
      };
      const profile = captureProfileRef.current;
      if (profile.requestDataBeforeStop) {
        try {
          if (recorder.state === 'recording' && typeof recorder.requestData === 'function') {
            recorder.requestData();
          }
        } catch {
          /* ignore */
        }
      }
      recorder.stop();
    }).finally(() => {
      finishFlightRef.current = null;
      finishModeRef.current = null;
    });
    finishFlightRef.current = flight;
    return flight;
  }, [maxDurationMs]);

  const finishRef = useRef(finish);
  finishRef.current = finish;
  const onMaxDurationRef = useRef(options.onMaxDuration);
  onMaxDurationRef.current = options.onMaxDuration;

  const start = useCallback(async (): Promise<string | null> => {
    setError(null);
    cancelRef.current = false;
    chunksRef.current = [];
    // Speakers → mic echo is the usual “double sound” in a new clip.
    stopAllVoicePlayback();
    const acquired = await acquireMediaStream('microphone', {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    if (!acquired.ok) {
      setError(acquired.message);
      stopTracks();
      setRecording(false);
      return acquired.message;
    }
    try {
      const stream = acquired.stream;
      for (const track of stream.getAudioTracks()) {
        track.enabled = true;
      }
      streamRef.current = stream;
      const mime = pickAudioMimeType();
      pickedMimeRef.current = mime;
      const profile = voiceCaptureProfile(mime);
      captureProfileRef.current = profile;
      const recorder = new MediaRecorder(
        stream,
        mime
          ? profile.bitsPerSecond != null
            ? { mimeType: mime, audioBitsPerSecond: profile.bitsPerSecond }
            : { mimeType: mime }
          : profile.bitsPerSecond != null
            ? { audioBitsPerSecond: profile.bitsPerSecond }
            : undefined,
      );
      mediaRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
        stopFlushRef.current?.trySettle();
      };
      startedAtRef.current = Date.now();
      setElapsedMs(0);
      setRecording(true);
      tickRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startedAtRef.current;
        setElapsedMs(elapsed);
        if (elapsed >= maxDurationMs && mediaRef.current?.state === 'recording') {
          void finishRef.current('send').then((result) => {
            if (result) onMaxDurationRef.current?.(result);
          });
        }
      }, 200);
      if (profile.timesliceMs != null) {
        recorder.start(profile.timesliceMs);
      } else {
        recorder.start();
      }
      return null;
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'name' in err && err.name === 'NotSupportedError'
          ? 'Voice recording is not supported here.'
          : 'Could not start voice recording.';
      setError(message);
      stopTracks();
      setRecording(false);
      return message;
    }
  }, [maxDurationMs]);

  return {
    recording,
    elapsedMs,
    error,
    start,
    stopAndGet: () => finish('send'),
    cancel: () => finish('cancel'),
    clearError: () => setError(null),
  };
}
