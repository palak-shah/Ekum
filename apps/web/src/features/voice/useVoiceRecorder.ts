import { useCallback, useEffect, useRef, useState } from 'react';
import { acquireMediaStream, releaseMediaStream } from '@/lib/mediaSession';
import { VOICE_MAX_DURATION_MS, pickAudioMimeType, withSniffedAudioType } from './voiceCaps';
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

  const finish = useCallback(
    (mode: 'send' | 'cancel'): Promise<VoiceRecording | null> =>
      new Promise((resolve) => {
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
        const settle = () => {
          if (settled) return;
          settled = true;
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
        recorder.onstop = () => {
          // Safari often delivers the last dataavailable after onstop.
          window.setTimeout(settle, 80);
        };
        // Flush the final container before stop (Safari often needs this).
        try {
          if (recorder.state === 'recording' && typeof recorder.requestData === 'function') {
            recorder.requestData();
          }
        } catch {
          /* ignore */
        }
        recorder.stop();
      }),
    [maxDurationMs],
  );

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
      streamRef.current = stream;
      const mime = pickAudioMimeType();
      pickedMimeRef.current = mime;
      const recorder = new MediaRecorder(
        stream,
        mime
          ? { mimeType: mime, audioBitsPerSecond: 128_000 }
          : { audioBitsPerSecond: 128_000 },
      );
      mediaRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
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
      // No timeslice — chunked webm often plays choppy / “broken” in browsers.
      recorder.start();
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
